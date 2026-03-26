import Billing from "../Models/Billing.js";
import Room from "../Models/Room.js";
import Maintenance from "../Models/Maintenance.js";

export const getRevenueReport = async (req,res) => {

    try {

        const paidBills = await Billing.find({status:"paid"});
        const pendingBills = await Billing.find({status:"pending"});

        const totalRevenue = paidBills.reduce(
            (sum,bill)=> sum + bill.totalAmount,0
        );

        res.status(200).json({
            totalRevenue,
            paidBills: paidBills.length,
            pendingBills: pendingBills.length
        });

    } catch (error) {

        res.status(500).json({
            message:"Error generating revenue report",
            error
        });

    }

};

export const getOccupancyReport = async (req,res) => {

    try {

        const totalRooms = await Room.countDocuments();

        const occupiedRooms = await Room.countDocuments({
            status:"occupied"
        });

        const availableRooms = await Room.countDocuments({
            status:"available"
        });

        res.status(200).json({
            totalRooms,
            occupiedRooms,
            availableRooms
        });

    } catch (error) {

        res.status(500).json({
            message:"Error generating occupancy report",
            error
        });

    }

};

export const getFinancialReport = async (req,res) => {

    try {

        const paidBills = await Billing.find({status:"paid"});

        const totalRevenue = paidBills.reduce(
            (sum,bill)=>sum + bill.totalAmount,0
        );

        const completedMaintenance = await Maintenance.find({
            status:"completed"
        });

        const maintenanceExpense = completedMaintenance.reduce(
            (sum,task)=>sum + (task.cost || 0),0
        );

        const netProfit = totalRevenue - maintenanceExpense;

        res.status(200).json({
            totalRevenue,
            maintenanceExpense,
            netProfit
        });

    } catch (error) {

        res.status(500).json({
            message:"Error generating financial report",
            error
        });

    }

};

