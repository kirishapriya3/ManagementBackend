import Room from "../Models/Room.js";
import User from "../Models/User.js";

export const createRoom = async(req,res) => {
    try {
        const room = new Room(req.body);
        await room.save();
        res.status(201).json({
            message:"Room created Successfully",
            room
        });
    } catch (error) {
        res.status(500).json({message: "Error creating room", error});
    }
};

export const getRooms = async(req,res) => {
    try {
        const rooms = await Room.find().populate("currentOccupants","name email");
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({message: "Error fetching rooms",error});
    }
};

export const updateRooms = async(reqq,res) => {
    try{
        const updatedRooms = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        );
        res.status(200).json({message: "Room updated Successfully",updatedRooms});
    }catch(error){
        res.status(500).json({message: "Error updating rooms", error});
    }
};

export const deleteRoom = async(req,res) => {
    try {
        await Room.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Room deleted Successfully"});
    } catch (error) {
        res.status(500).json({message: "Error deletign room", error});
    }
};

export const allocateRoom = async(req,res) => {
    try {
        const {roomId,userId} = req.body;
        const room = await Room.findById(roomId);
        if(!room){
            return res.status(404).json({message: "Room not found"});
        }
        if(room.currentOccupants.length >= room.capacity){
            return res.status(400).json({message: "Room is full"});
        }
        room.currentOccupants.push(userId);

        if(room.currentOccupants.length === room.capacity){
            room.status = "full";
        }
        await room.save();

        await User.findByIdAndUpdate(userId,{
            roomId:roomId
        });
        res.status(200).json({message: "Room allocated Successfully",room});
    } catch (error) {
        res.status(500).json({message: "Error allocating room", error});
    }
};

export const getRoomsByFloor = async(req,res) => {
    try {
        const { floor } = req.params;
        console.log('=== GET ROOMS BY FLOOR DEBUG ===');
        console.log('Floor parameter:', floor);
        
        // Find rooms by floor - handle different floor formats
        let roomQuery = {};
        if (floor === '1') {
            roomQuery = { roomNumber: { $regex: '^1' } }; // Rooms 101, 102, etc.
        } else if (floor === '2') {
            roomQuery = { roomNumber: { $regex: '^2' } }; // Rooms 201, 202, etc.
        } else if (floor === '3') {
            roomQuery = { roomNumber: { $regex: '^3' } }; // Rooms 301, 302, etc.
        } else {
            roomQuery = { roomNumber: { $regex: `^${floor}` } };
        }
        
        console.log('Room query:', roomQuery);
        
        const rooms = await Room.find(roomQuery).populate("currentOccupants","name email");
        console.log('Found rooms:', rooms.length);
        
        // Transform rooms to match frontend format
        const transformedRooms = rooms.map(room => {
            console.log('Processing room:', room.roomNumber, 'Status:', room.status, 'Occupants:', room.currentOccupants.length);
            
            // Get all occupant details
            const occupantNames = room.currentOccupants.length > 0 
                ? room.currentOccupants.map(occupant => occupant.name).join(', ')
                : null;
            
            // Determine status based on occupants and capacity
            let displayStatus;
            if (room.currentOccupants.length === 0) {
                displayStatus = 'Available';
            } else if (room.currentOccupants.length >= room.capacity) {
                displayStatus = 'Occupied';
            } else {
                displayStatus = 'Occupied'; // Partially occupied
            }
            
            const transformedRoom = {
                id: room.roomNumber,
                number: room.roomNumber,
                capacity: room.capacity,
                status: displayStatus,
                tenant: occupantNames,
                occupants: room.currentOccupants // Include full occupant data
            };
            
            console.log('Transformed room:', transformedRoom);
            return transformedRoom;
        });
        
        console.log('Final transformed rooms:', transformedRooms);
        console.log('=== END GET ROOMS BY FLOOR DEBUG ===');
        
        res.status(200).json(transformedRooms);
    } catch (error) {
        console.error('Error in getRoomsByFloor:', error);
        res.status(500).json({message: "Error fetching rooms by floor", error});
    }
};

export const deallocateRoom = async(req,res) => {
    try {
        const {roomId,userId} = req.body;
        const room = await Room.findById(roomId);
        if(!room){
            return res.status(404).json({message: "Room not found"});
        }
        room.currentOccupants = room.currentOccupants.filter(
            occupant => occupant.toString() !== userId
        );
        room.status = "available";
        await room.save();
        await User.findByIdAndUpdate(userId,{
            roomId:null
        });
        res.status(200).json({message: "Resident removed from room", room});
    } catch (error) {
        res.status(500).json({message: "Error removing resident", error});
    }
};

