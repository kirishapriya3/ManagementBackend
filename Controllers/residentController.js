import Resident from "../Models/Resident.js";
import Room from "../Models/Room.js";
import User from "../Models/User.js";

export const createResident = async (req,res) => {
    try {
        const resident = new Resident(req.body);
        await resident.save();
        res.status(201).json({
            message: "Resident added Successfully",
            resident
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating resident",
            error
        });
    }
};

export const getResidents = async (req,res) => {
    try {
        const residents = await User.find({ role: "resident" }).populate("roomId").select('-password');
        res.status(200).json(residents);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching residents",
            error
        });
    }
};

export const getResidentById = async (req,res) => {
    try {
        const resident = await User.findById(req.params.id).populate("roomId").select('-password');
        res.status(200).json(resident);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching resident",
            error
        });
    }
};

export const updateResident = async (req,res) => {
    try {
        const updatedResident = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        ).select('-password');
        res.status(200).json({
            message: "Resident updated successfully",
            updatedResident
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating resident",
            error
        });
    }
};

export const deleteResident = async (req,res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Resident deleted Successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting resident",
            error
        });
    }
};

export const getAvailableResidents = async (req, res) => {
    try {
        const availableResidents = await User.find({ 
            role: "resident",
            $and: [
                { $or: [
                    { roomId: { $exists: false } },
                    { roomId: null }
                ]},
                { $or: [
                    { roomNumber: { $exists: false } },
                    { roomNumber: null },
                    { roomNumber: "" }
                ]}
            ]
        }).select('-password'); // Exclude password from response
        
        console.log('Available residents found:', availableResidents.length);
        console.log('Available residents:', availableResidents.map(r => ({ name: r.name, roomId: r.roomId, roomNumber: r.roomNumber })));
        res.status(200).json(availableResidents);
    } catch (error) {
        console.error('Error fetching available residents:', error);
        res.status(500).json({
            message: "Error fetching available residents",
            error: error.message
        });
    }
};

export const assignResidentToRoom = async (req, res) => {
    try {
        const { residentId, roomId } = req.body;
        
        console.log('=== ASSIGN DEBUG ===');
        console.log('Resident ID:', residentId);
        console.log('Room ID (roomNumber):', roomId);
        
        // Find resident
        const resident = await User.findById(residentId).select('-password');
        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
                error: `Resident with ID ${residentId} not found`
            });
        }
        
        console.log('Resident found:', resident);
        
        // Check if resident is already assigned
        if (resident.roomId) {
            return res.status(400).json({
                message: "Resident is already assigned to a room",
                error: `Cannot assign resident to multiple rooms. Currently assigned to room ${resident.roomNumber || resident.roomId}`
            });
        }
        
        // Additional check: Make sure resident has no roomNumber either
        if (resident.roomNumber) {
            return res.status(400).json({
                message: "Resident has inconsistent room assignment",
                error: `Resident shows roomNumber ${resident.roomNumber} but no roomId. Please unassign first.`
            });
        }
        
        // Find room by roomNumber
        const room = await Room.findOne({ roomNumber: roomId });
        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: `Room with number ${roomId} not found`
            });
        }
        
        console.log('Room found:', room);
        console.log('Room current occupants:', room.currentOccupants);
        console.log('Room capacity:', room.capacity);
        
        // Check room capacity
        if (room.currentOccupants.length >= room.capacity) {
            return res.status(400).json({
                message: "Room is already full",
                error: "Cannot assign more residents to this room"
            });
        }
        
        // Check for duplicate in room
        const isDuplicate = room.currentOccupants.some(occupant => 
            occupant._id.toString() === residentId
        );
        
        if (isDuplicate) {
            return res.status(400).json({
                message: "Resident is already assigned to this room",
                error: "Cannot assign same resident twice to the same room"
            });
        }
        
        // Update resident with room assignment
        const updatedResident = await User.findByIdAndUpdate(
            residentId,
            { 
                roomId: room._id, 
                roomNumber: room.roomNumber, 
                checkInDate: new Date() 
            },
            { new: true }
        ).select('-password');
        
        // Update room with resident
        const updatedRoom = await Room.findByIdAndUpdate(
            room._id,
            { 
                $push: { 
                    currentOccupants: {
                        _id: residentId,
                        name: resident.name,
                        email: resident.email
                    }
                }
            },
            { new: true }
        );
        
        // Update room status based on new occupant count
        const newStatus = updatedRoom.currentOccupants.length >= room.capacity ? "full" : "available";
        await Room.findByIdAndUpdate(
            room._id,
            { status: newStatus },
            { new: true }
        );
        
        console.log('Assignment successful!');
        console.log('Updated resident:', updatedResident);
        console.log('Updated room occupants:', updatedRoom.currentOccupants.length);
        console.log('=== END ASSIGN DEBUG ===');
        
        res.status(200).json({
            message: "Resident assigned to room successfully",
            resident: updatedResident,
            roomInfo: {
                roomNumber: room.roomNumber,
                totalOccupants: updatedRoom.currentOccupants.length,
                capacity: room.capacity,
                status: newStatus
            }
        });
        
    } catch (error) {
        console.error('Assignment error:', error);
        res.status(500).json({
            message: "Error assigning resident to room",
            error: error.message
        });
    }
};

export const unassignResidentFromRoom = async (req, res) => {
    try {
        const { residentId } = req.body;
        
        // Find the resident
        const resident = await User.findById(residentId).select('-password');
        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
                error: `Resident with ID ${residentId} not found`
            });
        }
        
        console.log('=== UNASSIGN DEBUG ===');
        console.log('Resident:', resident);
        console.log('Resident roomId:', resident.roomId);
        console.log('Resident roomNumber:', resident.roomNumber);
        
        // Check if resident has any room assignment
        if (!resident.roomId && !resident.roomNumber) {
            return res.status(400).json({
                message: "Resident is not assigned to any room",
                error: "Cannot unassign resident who has no room"
            });
        }
        
        let room = null;
        
        // Try to find room by roomId first (preferred method)
        if (resident.roomId) {
            room = await Room.findById(resident.roomId);
        }
        
        // If not found by roomId, try by roomNumber
        if (!room && resident.roomNumber) {
            room = await Room.findOne({ roomNumber: resident.roomNumber });
        }
        
        if (!room) {
            console.log('Room not found, clearing resident assignment anyway');
        } else {
            console.log('Found room:', room);
            console.log('Current occupants before removal:', room.currentOccupants);
            
            // METHOD 1: Try $pull operation first
            let updatedRoom = await Room.findByIdAndUpdate(
                room._id,
                { 
                    $pull: { 
                        currentOccupants: { 
                            _id: residentId 
                        } 
                    }
                },
                { new: true }
            );
            
            // METHOD 2: If $pull doesn't work, use direct array manipulation
            if (updatedRoom.currentOccupants.some(occupant => occupant._id.toString() === residentId)) {
                console.log('❌ $pull failed, using direct array manipulation');
                
                // Get fresh room data and manually remove
                const freshRoom = await Room.findById(room._id);
                const filteredOccupants = freshRoom.currentOccupants.filter(occupant => 
                    occupant._id.toString() !== residentId
                );
                
                updatedRoom = await Room.findByIdAndUpdate(
                    room._id,
                    { 
                        currentOccupants: filteredOccupants
                    },
                    { new: true }
                );
                
                console.log('✅ Direct removal successful');
            }
            
            console.log('Room after removal:', updatedRoom);
            console.log('Final occupants:', updatedRoom.currentOccupants);
            
            // FINAL VERIFICATION: Ensure resident is completely removed
            const isResidentRemoved = !updatedRoom.currentOccupants.some(occupant => 
                occupant._id.toString() === residentId
            );
            
            if (isResidentRemoved) {
                console.log('✅ SUCCESS: Resident object completely removed from currentOccupants');
            } else {
                console.log('❌ CRITICAL ERROR: Resident object still exists in currentOccupants');
                console.log('Problematic occupant:', updatedRoom.currentOccupants.find(o => o._id.toString() === residentId));
            }
            
            // Update room status based on remaining occupants
            const newStatus = updatedRoom.currentOccupants.length === 0 ? "available" : 
                            updatedRoom.currentOccupants.length >= room.capacity ? "full" : "available";
            
            await Room.findByIdAndUpdate(
                room._id,
                { status: newStatus },
                { new: true }
            );
            
            console.log('Room status updated to:', newStatus);
            console.log('✅ HARD DELETE COMPLETED: Resident object permanently removed from currentOccupants array');
        }
        
        // Clear resident's room assignment completely
        const updatedResident = await User.findByIdAndUpdate(
            residentId,
            { 
                $unset: { roomId: 1, roomNumber: 1, checkInDate: 1 },
                $set: { checkOutDate: new Date() }
            },
            { new: true }
        ).select('-password');
        
        console.log('Resident after unassign:', updatedResident);
        console.log('=== END UNASSIGN DEBUG ===');
        
        res.status(200).json({
            message: "Resident unassigned from room successfully",
            updatedResident,
            roomInfo: room ? {
                roomNumber: room.roomNumber,
                remainingOccupants: room.currentOccupants.length,
                status: room.status
            } : null
        });
        
    } catch (error) {
        console.error('Unassign error:', error);
        res.status(500).json({
            message: "Error unassigning resident",
            error: error.message
        });
    }
};

export const getMyBills = async (req,res) => {

 try{
  const bills = await Billing.find({
    residentId: req.user.userId
  });

  res.status(200).json(bills);

 }catch(error){
  res.status(500).json({ message:"Error fetching bills" });
 }

};