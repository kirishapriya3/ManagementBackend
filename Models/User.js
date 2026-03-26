import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String, unique: true, required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String, 
        enum: ["admin","resident","staff"], 
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    aadhaar: String,
    emergencyContact: String,
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: null
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },
    roomNumber: String,
    roomType: String,
    checkInDate: Date,
    checkOutDate: Date
});

const User = mongoose.model("User", UserSchema);

export default User;