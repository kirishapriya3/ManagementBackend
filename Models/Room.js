import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    roomNumber:{
        type:String,
        required:true,
        unique:true
    },
    capacity:{
        type:Number,
        required:true
    },
    currentOccupants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    status:{
        type:String,
        enum:["available","full"],
        default:"available"
    },
    roomType:{
        type:String,
        enum:["single","double","triple"],
        default:"single"
    },
    price:{
        type:Number,
        required:true
    }
});

const Room = mongoose.model("Room",RoomSchema);

export default Room;