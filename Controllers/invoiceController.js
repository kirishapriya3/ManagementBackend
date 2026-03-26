import Invoice from "../Models/Invoice.js";
import Billing from "../Models/Billing.js";
import Payment from "../Models/Payment.js";
import User from "../Models/User.js";
import Room from "../Models/Room.js";
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Create invoice after successful payment
export const createInvoice = async (paymentData) => {
    try {
        const { paymentIntentId, billId, amount } = paymentData;
        
        console.log('Creating invoice with data:', { paymentIntentId, billId, amount });

        // Get payment details
        const payment = await Payment.findOne({ stripePaymentId: paymentIntentId }).populate('billId');
        console.log('Payment found:', !!payment);
        if (!payment) {
            throw new Error('Payment not found');
        }

        // Get bill details
        const bill = await Billing.findById(billId).populate('residentId roomId');
        console.log('Bill found:', !!bill);
        if (!bill) {
            throw new Error('Bill not found');
        }

        console.log('Bill data:', {
            billId: bill._id,
            residentId: bill.residentId,
            billingPeriod: bill.billingPeriod,
            totalAmount: bill.totalAmount
        });

        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const invoiceNumber = `INV-${year}${month}-${random}`;

        // Create invoice
        const invoice = new Invoice({
            invoiceNumber: invoiceNumber,
            residentId: bill.residentId._id || bill.residentId,
            billId: bill._id,
            paymentId: payment._id,
            billingPeriod: bill.billingPeriod,
            charges: bill.charges,
            totalAmount: bill.totalAmount,
            paidAmount: amount,
            paymentDate: new Date(),
            paymentMethod: 'card',
            transactionId: paymentIntentId,
            status: 'paid',
            dueDate: bill.dueDate
        });

        await invoice.save();
        console.log('Invoice created successfully:', invoice.invoiceNumber);
        return invoice;

    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

// Generate PDF invoice
export const generateInvoicePDF = async (invoiceId) => {
    try {
        const invoice = await Invoice.findById(invoiceId)
            .populate('residentId')
            .populate('billId')
            .populate('paymentId')
            .populate({
                path: 'billId',
                populate: {
                    path: 'roomId'
                }
            });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Generate HTML content
        const htmlContent = generateInvoiceHTML(invoice);
        
        // Set content and generate PDF
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();

        // Update download count
        invoice.downloadCount += 1;
        await invoice.save();

        return pdfBuffer;

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

// Get resident invoices
export const getResidentInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ residentId: req.user.userId })
            .populate('billId')
            .populate('paymentId')
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            message: "Error fetching invoices",
            error: error.message
        });
    }
};

// Get single invoice
export const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('residentId')
            .populate('billId')
            .populate('paymentId')
            .populate({
                path: 'billId',
                populate: {
                    path: 'roomId'
                }
            });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Check if user owns this invoice
        if (invoice.residentId._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(invoice);

    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            message: "Error fetching invoice",
            error: error.message
        });
    }
};

// Download invoice PDF
export const downloadInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('residentId')
            .populate('billId')
            .populate('paymentId')
            .populate({
                path: 'billId',
                populate: {
                    path: 'roomId'
                }
            });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Check if user owns this invoice
        if (invoice.residentId._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(req.params.id);

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({
            message: "Error downloading invoice",
            error: error.message
        });
    }
};

// Generate HTML for invoice
function generateInvoiceHTML(invoice) {
    const resident = invoice.residentId;
    const bill = invoice.billId;
    const room = bill.roomId;
    const payment = invoice.paymentId;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .charges-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .charges-table th, .charges-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .charges-table th { background-color: #f8f9fa; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.1); z-index: -1; }
        </style>
    </head>
    <body>
        <div class="watermark">PAID</div>
        
        <div class="header">
            <div class="logo">Hostel Management System</div>
            <h2>TAX INVOICE</h2>
        </div>

        <div class="invoice-info">
            <div>
                <h3>Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Invoice Date:</strong> ${invoice.generatedDate.toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Payment Date:</strong> ${new Date(invoice.paymentDate).toLocaleDateString()}</p>
                <p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>
            </div>
            <div>
                <h3>Billing Period</h3>
                <p><strong>Month:</strong> ${invoice.billingPeriod.month}</p>
                <p><strong>Year:</strong> ${invoice.billingPeriod.year}</p>
            </div>
        </div>

        <div class="section">
            <h3>Billed To</h3>
            <p><strong>Name:</strong> ${resident.name}</p>
            <p><strong>Email:</strong> ${resident.email}</p>
            <p><strong>Room:</strong> ${room?.roomNumber || 'N/A'}</p>
        </div>

        <div class="section">
            <h3>Charges Breakdown</h3>
            <table class="charges-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Hostel Fees</td>
                        <td>${invoice.charges.hostelFees || 0}</td>
                    </tr>
                    <tr>
                        <td>Mess Fees</td>
                        <td>${invoice.charges.messFees || 0}</td>
                    </tr>
                    <tr>
                        <td>Utilities</td>
                        <td>${invoice.charges.utilities || 0}</td>
                    </tr>
                    <tr>
                        <td>Additional Fees</td>
                        <td>${invoice.charges.additionalFees || 0}</td>
                    </tr>
                    ${invoice.charges.extraServices > 0 ? `
                    <tr>
                        <td>Extra Services</td>
                        <td>${invoice.charges.extraServices}</td>
                    </tr>` : ''}
                    ${invoice.charges.discounts > 0 ? `
                    <tr>
                        <td>Discounts</td>
                        <td style="color: green;">-${invoice.charges.discounts}</td>
                    </tr>` : ''}
                    ${invoice.charges.lateFees > 0 ? `
                    <tr>
                        <td>Late Fees</td>
                        <td style="color: red;">${invoice.charges.lateFees}</td>
                    </tr>` : ''}
                    <tr class="total-row">
                        <td><strong>Total Amount</strong></td>
                        <td><strong>₹${invoice.totalAmount}</strong></td>
                    </tr>
                    <tr>
                        <td>Paid Amount</td>
                        <td style="color: green;"><strong>₹${invoice.paidAmount}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>Payment Information</h3>
            <p><strong>Payment Method:</strong> ${invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1)}</p>
            <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">PAID</span></p>
        </div>

        <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>For any queries, please contact: support@hostelmanagement.com</p>
        </div>
    </body>
    </html>
    `;
}
