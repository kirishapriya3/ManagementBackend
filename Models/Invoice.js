import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing',
        required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    billingPeriod: {
        month: String,
        year: Number
    },
    charges: {
        hostelFees: Number,
        messFees: Number,
        utilities: Number,
        additionalFees: Number,
        extraServices: Number,
        discounts: Number,
        lateFees: Number
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'online'],
        default: 'card'
    },
    transactionId: String,
    status: {
        type: String,
        enum: ['paid', 'partial', 'pending'],
        default: 'paid'
    },
    dueDate: Date,
    generatedDate: {
        type: Date,
        default: Date.now
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
