import mongoose from "mongoose";



const MaintenanceSchema = new mongoose.Schema({



    residentId:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },



    issueTitle:{

        type:String,

        required:true

    },



    description:{

        type:String

    },



    priority:{

        type:String,

        enum:["low","medium","high"],

        default:"low"

    },



    status:{

        type:String,

        enum:["pending","in-progress","completed"],

        default:"pending"

    },



    assignedStaff:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        default:null

    },



    createdAt:{

        type:Date,

        default:Date.now

    }



});



const Maintenance = mongoose.model("Maintenance",MaintenanceSchema);



export default Maintenance;