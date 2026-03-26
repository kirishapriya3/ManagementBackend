import mongoose from "mongoose";

const ResidentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: String,
    emergencyContact: String, 
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },
    checkInDate: Date,
    checkOutDate: Date,
    status: {
        type: String,
        enum: ["checked-in","checked-out"],
        default: "checked-in"
    }
});

const Resident = mongoose.model("Resident", ResidentSchema);

export default Resident;