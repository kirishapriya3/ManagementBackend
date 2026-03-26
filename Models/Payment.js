import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({

    residentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    billId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Billing",
        required:true
    },

    amount:{
        type:Number,
        required:true
    },

    stripePaymentId:{
        type:String
    },

    status:{
        type:String,
        enum:["pending","success","failed"],
        default:"pending"
    },

    paymentDate:{
        type:Date,
        default:Date.now
    }

},{timestamps:true});

const Payment = mongoose.model("Payment",PaymentSchema);

export default Payment;