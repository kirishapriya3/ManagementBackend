import mongoose from "mongoose";

const BillingSchema = new mongoose.Schema({
    residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    billingPeriod: {
        month: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        }
    },
    charges: {
        hostelFees: {
            type: Number,
            default: 8000
        },
        messFees: {
            type: Number,
            default: 8000
        },
        utilities: {
            type: Number,
            default: 500
        },
        additionalFees: {
            type: Number,
            default: 1000
        },
        extraServices: {
            type: Number,
            default: 0
        },
        discounts: {
            type: Number,
            default: 0
        },
        lateFees: {
            type: Number,
            default: 0
        }
    },
    totalAmount: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        enum: ["paid", "pending", "late", "overdue", "partial"],
        default: "pending"
    },
    dueDate: {
        type: Date,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paymentHistory: [{
        paymentDate: Date,
        amount: Number,
        paymentMethod: String,
        transactionId: String,
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'success'
        }
    }],
    paymentPlan: {
        type: String,
        enum: ['full', 'installment'],
        default: 'full'
    },
    notes: String
}, {
    timestamps: true
});

const Billing = mongoose.model("Billing", BillingSchema);

export default Billing;
