import Billing from "../Models/Billing.js";
import User from "../Models/User.js";
import Room from "../Models/Room.js";

export const createBill = async (req, res) => {
    try {
        const {
            residentId,
            charges,
            dueDate,
            paymentPlan,
            notes
        } = req.body;

        // Get resident and room details
        const resident = await User.findById(residentId);
        const room = await Room.findById(resident.roomId);
        
        if (!resident || !room) {
            return res.status(404).json({
                message: "Resident or room not found"
            });
        }

        const bill = new Billing({
            residentId,
            roomId: room._id,
            billingPeriod: {
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear()
            },
            charges: {
                hostelFees: charges?.hostelFees || 8000,
                messFees: charges?.messFees || 8000,
                utilities: charges?.utilities || 500,
                additionalFees: charges?.additionalFees || 1000,
                extraServices: charges?.extraServices || 0,
                discounts: charges?.discounts || 0,
                lateFees: charges?.lateFees || 0
            },
            dueDate,
            paymentPlan: paymentPlan || 'full',
            notes
        });

        await bill.save();

        res.status(201).json({
            message: "Bill generated successfully",
            bill
        });

    } catch (error) {
        res.status(500).json({
            message: "Error generating bill",
            error: error.message
        });
    }
};

export const getCurrentBill = async (req, res) => {
    try {
        const residentId = req.user.userId;

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        let bill = await Billing.findOne({
            residentId,
            'billingPeriod.month': currentMonth,
            'billingPeriod.year': currentYear
        }).populate('residentId', 'name email').populate('roomId', 'roomNumber');

        // If no current bill, create one with default charges
        if (!bill) {
            const resident = await User.findById(residentId);
            const room = await Room.findById(resident.roomId);

            if (room) {
                const charges = {
                    hostelFees: 5000,
                    messFees: 3000,
                    utilities: 500,
                    additionalFees: 1000,
                    extraServices: 0,
                    discounts: 0,
                    lateFees: 0
                };
                
                const totalAmount = charges.hostelFees + charges.messFees + charges.utilities + 
                                  charges.additionalFees + charges.extraServices + charges.lateFees - charges.discounts;
                
                bill = new Billing({
                    residentId,
                    roomId: room._id,
                    billingPeriod: { month: currentMonth, year: currentYear },
                    dueDate: new Date(currentYear, new Date(currentMonth + ' 1').getMonth() + 1, 5),
                    charges,
                    totalAmount
                });
                
                await bill.save();
                
                // Re-fetch the bill with populate
                bill = await Billing.findById(bill._id)
                    .populate('residentId', 'name email')
                    .populate('roomId', 'roomNumber');
            }
        }

        res.status(200).json(bill);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching current bill",
            error: error.message
        });
    }
};

export const getAllBills = async (req, res) => {
    try {
        const bills = await Billing.find()
            .populate("residentId", "name email phone")
            .populate("roomId", "roomNumber")
            .sort({ createdAt: -1 });

        res.status(200).json(bills);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching all bills",
            error: error.message
        });
    }
};

export const getResidentBills = async (req, res) => {
    try {
        const bills = await Billing.find({
            residentId: req.params.residentId
        }).populate('residentId', 'name email').populate('roomId', 'roomNumber');

        res.status(200).json(bills);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching resident bills",
            error: error.message
        });
    }
};

export const updateBill = async (req, res) => {
    try {
        const updatedBill = await Billing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json({
            message: "Bill updated successfully",
            updatedBill
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating bill",
            error: error.message
        });
    }
};

export const getMyBills = async (req, res) => {
    try {
        console.log("getMyBills");
        console.log("User:", req.user);

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const bills = await Billing.find({
            residentId: req.user.userId
        }).populate('residentId', 'name email').populate('roomId', 'roomNumber')
        .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });

        res.status(200).json(bills);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching my bills",
            error: error.message
        });
    }
};

export const getAllResidentsBillingStatus = async (req, res) => {
    try {
        console.log("getAllResidentsBillingStatus for admin");

        // Get all bills with resident and room information
        const allBills = await Billing.find({})
            .populate('residentId', 'name email phone')
            .populate('roomId', 'roomNumber')
            .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });

        // Filter out bills without residentId to avoid null reference errors
        const validBills = allBills.filter(bill => bill.residentId && bill.residentId._id);
        
        console.log(`Found ${allBills.length} total bills, ${validBills.length} valid bills with residents`);

        // Group bills by resident
        const residentsMap = new Map();

        validBills.forEach(bill => {
            const residentId = bill.residentId._id.toString();
            
            if (!residentsMap.has(residentId)) {
                residentsMap.set(residentId, {
                    residentId: bill.residentId._id,
                    name: bill.residentId.name,
                    email: bill.residentId.email,
                    phone: bill.residentId.phone,
                    roomNumber: bill.roomId?.roomNumber || 'N/A',
                    totalBills: 0,
                    paidBills: 0,
                    unpaidBills: 0,
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    bills: []
                });
            }

            const resident = residentsMap.get(residentId);
            resident.totalBills++;
            resident.totalAmount += bill.totalAmount;
            resident.totalPaid += bill.paidAmount;
            resident.totalDue += (bill.totalAmount - bill.paidAmount);

            if (bill.status === 'paid') {
                resident.paidBills++;
            } else {
                resident.unpaidBills++;
            }

            resident.bills.push({
                id: bill._id,
                billingPeriod: bill.billingPeriod,
                totalAmount: bill.totalAmount,
                paidAmount: bill.paidAmount,
                dueAmount: bill.totalAmount - bill.paidAmount,
                status: bill.status,
                dueDate: bill.dueDate,
                paymentHistory: bill.paymentHistory
            });
        });

        // Convert to array and calculate statistics
        const residents = Array.from(residentsMap.values());
        
        // Calculate overall statistics
        const stats = {
            totalResidents: residents.length,
            totalPaidResidents: residents.filter(r => r.totalDue === 0).length,
            totalUnpaidResidents: residents.filter(r => r.totalDue > 0).length,
            totalBills: allBills.length,
            totalPaidBills: allBills.filter(b => b.status === 'paid').length,
            totalUnpaidBills: allBills.filter(b => b.status !== 'paid').length,
            totalRevenue: residents.reduce((sum, r) => sum + r.totalPaid, 0),
            totalOutstanding: residents.reduce((sum, r) => sum + r.totalDue, 0)
        };

        res.status(200).json({
            stats,
            residents
        });

    } catch (error) {
        console.error("Error fetching all residents billing status:", error);
        res.status(500).json({
            message: "Error fetching billing overview",
            error: error.message
        });
    }
};

export const getFinancialOverview = async (req, res) => {
    try {
        console.log("getFinancialOverview for admin");
        
        const { period = 'month', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Get all bills with resident and room information
        const allBills = await Billing.find({})
            .populate('residentId', 'name email phone')
            .populate('roomId', 'roomNumber')
            .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });

        // Filter valid bills
        const validBills = allBills.filter(bill => bill.residentId && bill.residentId._id);
        
        // Get all rooms for occupancy calculation
        const allRooms = await Room.find({});
        const totalRooms = allRooms.length;
        
        // Calculate date range based on period
        let startDate, endDate, periodLabel;
        
        if (period === 'day') {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0); // Last day of month
            periodLabel = `${months[month - 1]} ${year}`;
        } else if (period === 'month') {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
            periodLabel = `${months[month - 1]} ${year}`;
        } else if (period === 'year') {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
            periodLabel = `${year}`;
        }

        // Filter bills by period
        const periodBills = validBills.filter(bill => {
            const billDate = new Date(bill.createdAt);
            return billDate >= startDate && billDate <= endDate;
        });

        // Calculate revenue
        const revenue = {
            total: 0,
            hostelFees: 0,
            messFees: 0,
            utilities: 0,
            additionalFees: 0,
            lateFees: 0,
            growth: 0
        };

        // Calculate expenses (mock data - in real app, this would come from expense records)
        const expenses = {
            total: 0,
            salaries: 0,
            maintenance: 0,
            utilities: 0,
            food: 0,
            other: 0,
            growth: 0
        };

        // Process bills for revenue
        periodBills.forEach(bill => {
            revenue.total += bill.paidAmount;
            revenue.hostelFees += bill.charges.hostelFees;
            revenue.messFees += bill.charges.messFees;
            revenue.utilities += bill.charges.utilities;
            revenue.additionalFees += bill.charges.additionalFees;
            revenue.lateFees += bill.charges.lateFees;
        });

        // Mock expense calculations (in real app, these would come from expense records)
        expenses.total = revenue.total * 0.6; // 60% of revenue as expenses
        expenses.salaries = revenue.total * 0.25;
        expenses.maintenance = revenue.total * 0.15;
        expenses.utilities = revenue.total * 0.1;
        expenses.food = revenue.total * 0.08;
        expenses.other = revenue.total * 0.02;

        // Calculate profit
        const profit = {
            net: revenue.total - expenses.total,
            growth: 0
        };

        // Calculate occupancy
        const occupiedRooms = new Set(periodBills.map(bill => bill.roomId?._id?.toString())).size;
        const occupancy = {
            totalRooms,
            occupiedRooms,
            vacantRooms: totalRooms - occupiedRooms,
            rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            potentialRevenue: totalRooms * 9500 // Mock potential revenue
        };

        // Calculate trends
        const trends = {
            revenueGrowth: 12.5, // Mock growth percentage
            profitMargin: revenue.total > 0 ? Math.round((profit.net / revenue.total) * 100) : 0,
            costPerRoom: occupiedRooms > 0 ? Math.round(expenses.total / occupiedRooms) : 0,
            avgRevenuePerRoom: occupiedRooms > 0 ? Math.round(revenue.total / occupiedRooms) : 0,
            collectionRate: periodBills.length > 0 ? Math.round((periodBills.filter(b => b.status === 'paid').length / periodBills.length) * 100) : 0
        };

        // Generate historical data (mock - in real app, this would come from database)
        const historical = [];
        for (let i = 5; i >= 0; i--) {
            const histDate = new Date();
            histDate.setMonth(histDate.getMonth() - i);
            const histRevenue = Math.floor(Math.random() * 50000) + 30000;
            const histExpenses = Math.floor(histRevenue * 0.6);
            const histProfit = histRevenue - histExpenses;
            const histOccupancy = Math.floor(Math.random() * 30) + 60;
            
            historical.push({
                period: histDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: histRevenue,
                expenses: histExpenses,
                profit: histProfit,
                occupancy: histOccupancy,
                profitMargin: Math.round((histProfit / histRevenue) * 100)
            });
        }

        res.status(200).json({
            revenue,
            expenses,
            profit,
            occupancy,
            trends,
            historical,
            period: periodLabel
        });

    } catch (error) {
        console.error("Error fetching financial overview:", error);
        res.status(500).json({
            message: "Error fetching financial overview",
            error: error.message
        });
    }
};

export const processPayment = async (req, res) => {
    try {
        const { billId, amount, paymentMethod } = req.body;
        const residentId = req.user.userId;

        const bill = await Billing.findById(billId);

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        if (bill.residentId.toString() !== residentId) {
            return res.status(403).json({
                message: "Unauthorized: This bill doesn't belong to you"
            });
        }

        // Add payment to history
        const payment = {
            paymentDate: new Date(),
            amount,
            paymentMethod,
            transactionId: `TXN${Date.now()}`,
            status: 'success'
        };

        bill.paymentHistory.push(payment);
        bill.paidAmount += amount;

        // Update status
        if (bill.paidAmount >= bill.totalAmount) {
            bill.status = 'paid';
        } else if (bill.paidAmount > 0) {
            bill.status = 'partial';
        }

        await bill.save();

        res.status(200).json({
            message: "Payment processed successfully",
            bill,
            payment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error processing payment",
            error: error.message
        });
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const residentId = req.user.userId;

        const bills = await Billing.find({ residentId })
            .select('paymentHistory billingPeriod totalAmount status')
            .sort({ 'billingPeriod.year': -1, 'billingPeriod.month': -1 });

        // Flatten payment history
        const paymentHistory = [];
        bills.forEach(bill => {
            bill.paymentHistory.forEach(payment => {
                paymentHistory.push({
                    ...payment.toObject(),
                    billingPeriod: bill.billingPeriod,
                    billStatus: bill.status,
                    totalAmount: bill.totalAmount
                });
            });
        });

        res.status(200).json(paymentHistory);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching payment history",
            error: error.message
        });
    }
};

export const applyDiscount = async (req, res) => {
    try {
        const { billId, discountAmount, reason } = req.body;

        const bill = await Billing.findById(billId);

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        bill.charges.discounts += discountAmount;
        bill.notes = bill.notes ? `${bill.notes}\nDiscount applied: ${reason}` : `Discount applied: ${reason}`;

        await bill.save();

        res.status(200).json({
            message: "Discount applied successfully",
            bill
        });

    } catch (error) {
        res.status(500).json({
            message: "Error applying discount",
            error: error.message
        });
    }
};

export const addLateFee = async (req, res) => {
    try {
        const { billId, lateFeeAmount, reason } = req.body;

        const bill = await Billing.findById(billId);

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        if (new Date() > bill.dueDate && bill.status === 'pending') {
            bill.charges.lateFees += lateFeeAmount;
            bill.status = 'overdue';
            bill.notes = bill.notes ? `${bill.notes}\nLate fee: ${reason}` : `Late fee: ${reason}`;

            await bill.save();

            res.status(200).json({
                message: "Late fee added successfully",
                bill
            });
        } else {
            res.status(400).json({
                message: "Cannot add late fee: Bill is not overdue"
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Error adding late fee",
            error: error.message
        });
    }
};