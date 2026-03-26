import User from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req,res) => {
    try {
        const { name, email, password, role, phone} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "User already exists"});
        }

        const newUser = new User({ name, email, password: hashedPassword, role, phone});
        await newUser.save();
        res.status(201).json({message: "User registered successfully"});
    } catch (error) {
        console.log("Registering Error:", error);
        res.status(500).json({message: "Error registering user", error: error.message});
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({message: "Invalid Password"});
        }

        const token = jwt.sign({userId: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "5hr"});
        res.status(200).json({message: "User Logged In Successfully!", 
            token,
           user:{
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            roomNumber: user.roomNumber || "N/A",
            roomType: user.roomType || "N/A"
}
    });
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error Logging In User"});
    }
};

export const getAllResidents = async (req, res) => {
    try {
        const residents = await User.find({ role: "resident" })
            .select('-password')
            .populate('roomId')
            .sort({ createdAt: -1 });

        // Enrich with room information if available
        const residentsWithRooms = residents.map(resident => {
            const roomInfo = resident.roomId ? {
                roomNumber: resident.roomId.roomNumber,
                capacity: resident.roomId.capacity,
                roomType: resident.roomId.roomType || `${resident.roomId.capacity} person`,
                status: resident.roomId.status
            } : {
                roomNumber: resident.roomNumber || 'N/A',
                capacity: 'N/A',
                roomType: 'N/A',
                status: 'N/A'
            };

            return {
                ...resident.toObject(),
                roomNumber: roomInfo.roomNumber,
                roomType: roomInfo.capacity !== 'N/A' ? `${roomInfo.capacity} - ${roomInfo.capacity} sharing` : 'N/A',
                roomCapacity: roomInfo.capacity,
                emergencyContact: resident.emergencyContact || 'N/A',
                aadhaar: resident.aadhaar || 'N/A',
                dateOfBirth: resident.dateOfBirth || null,
                gender: resident.gender || null,
                occupation: resident.occupation || 'N/A',
                institution: resident.institution || 'N/A',
                idProofType: resident.idProofType || 'N/A',
                idProofNumber: resident.idProofNumber || 'N/A',
                status: resident.status || 'active'
            };
        });

        res.status(200).json(residentsWithRooms);
    } catch (error) {
        console.error("Error fetching residents:", error);
        res.status(500).json({message: "Error fetching residents", error: error.message});
    }
};

export const getResidentById = async (req, res) => {
    try {
        const { id } = req.params;
        const resident = await User.findOne({ _id: id, role: "resident" })
            .select('-password')
            .populate('roomId');

        if (!resident) {
            return res.status(404).json({message: "Resident not found"});
        }

        // Get room information
        const roomInfo = resident.roomId ? {
            roomNumber: resident.roomId.roomNumber,
            capacity: resident.roomId.capacity,
            roomType: resident.roomId.roomType || `${resident.roomId.capacity} person`,
            status: resident.roomId.status
        } : {
            roomNumber: resident.roomNumber || 'N/A',
            capacity: 'N/A',
            roomType: 'N/A',
            status: 'N/A'
        };

        // Return complete resident details
        const residentDetails = {
            ...resident.toObject(),
            roomNumber: roomInfo.roomNumber,
            roomType: roomInfo.capacity !== 'N/A' ? `${roomInfo.capacity} - ${roomInfo.capacity} sharing` : 'N/A',
            roomCapacity: roomInfo.capacity,
            status: resident.status || 'active',
            checkInDate: resident.checkInDate || null,
            checkOutDate: resident.checkOutDate || null,
            emergencyContact: resident.emergencyContact || 'N/A',
            aadhaar: resident.aadhaar || 'N/A',
            dateOfBirth: resident.dateOfBirth || null,
            gender: resident.gender || null,
            occupation: resident.occupation || 'N/A',
            institution: resident.institution || 'N/A',
            idProofType: resident.idProofType || 'N/A',
            idProofNumber: resident.idProofNumber || 'N/A'
        };

        res.status(200).json(residentDetails);
    } catch (error) {
        console.error("Error fetching resident details:", error);
        res.status(500).json({message: "Error fetching resident details", error: error.message});
    }
};
