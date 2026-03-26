import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Billing from './Models/Billing.js';
import User from './Models/User.js';
import Room from './Models/Room.js';

dotenv.config();

const testBillingData = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management');
        console.log('✅ Connected to database');

        // Check billing data
        console.log('\n=== Checking Billing Data ===');
        
        // Get all bills
        const allBills = await Billing.find({});
        console.log('Total bills in database:', allBills.length);
        
        // Get bills with populated residentId
        const populatedBills = await Billing.find({})
            .populate('residentId', 'name email phone')
            .populate('roomId', 'roomNumber');
        
        console.log('Bills with populated residentId:', populatedBills.length);
        
        // Filter valid bills (with residentId)
        const validBills = populatedBills.filter(bill => bill.residentId && bill.residentId._id);
        console.log('Valid bills (with residentId):', validBills.length);
        
        // Show sample data
        if (validBills.length > 0) {
            console.log('\n=== Sample Bill Data ===');
            const sampleBill = validBills[0];
            console.log('Bill ID:', sampleBill._id);
            console.log('Resident:', sampleBill.residentId.name);
            console.log('Room:', sampleBill.roomId?.roomNumber || 'N/A');
            console.log('Total Amount:', sampleBill.totalAmount);
            console.log('Paid Amount:', sampleBill.paidAmount);
            console.log('Status:', sampleBill.status);
        }
        
        // Check residents
        const residents = await User.find({ role: 'resident' });
        console.log('\n=== Residents Data ===');
        console.log('Total residents:', residents.length);
        
        if (residents.length > 0) {
            console.log('Sample resident:');
            console.log('Name:', residents[0].name);
            console.log('Email:', residents[0].email);
            console.log('Room ID:', residents[0].roomId);
        }
        
        // Summary
        console.log('\n=== Summary ===');
        console.log('✅ Database connection: Working');
        console.log('✅ Bills data:', allBills.length, 'total');
        console.log('✅ Valid bills:', validBills.length, 'with residents');
        console.log('✅ Residents:', residents.length, 'total');
        
        if (validBills.length > 0) {
            console.log('\n🎯 Billing overview should work now!');
            console.log('Test the endpoint with admin authentication');
        } else {
            console.log('\n⚠️  No valid bills found - create some bills first');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

testBillingData();
