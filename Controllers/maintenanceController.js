import Maintenance from "../Models/Maintenance.js";
import User from "../Models/User.js";
import { sendEmail } from "../utils/sendEmail.js";




export const createRequest = async(req,res) => {

    try {

        const {issueTitle,description,priority} = req.body;

        console.log("req.body",req.body)
        const request = new Maintenance({
            residentId:req.user.userId,
            issueTitle,
            description,
            priority
        });

        console.log("request", request)
        await request.save();

        res.status(201).json({
            message:"Maintenance request submitted",
            request
        });

    } catch (error) {

        res.status(500).json({
            message:"Error creating request",
            error
        });

    }

};

export const getMyRequests = async (req, res) => {

  try {

    const requests = await Maintenance.find({
      residentId: req.user.userId   // ✅ THIS LINE
    });

    res.status(200).json(requests);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching maintenance requests",
      error
    });

  }

};

export const getAllRequests = async(req,res) => {

    try {

        const requests = await Maintenance.find()
        .populate("residentId","name email")
        .populate("assignedStaff","name email");

        res.status(200).json(requests);

    } catch (error) {

        res.status(500).json({
            message:"Error fetching requests",
            error
        });

    }

};

export const updateRequest = async(req,res) => {

    try {

        const { status } = req.body;
        const requestId = req.params.id;

        // Get current request before updating
        const currentRequest = await Maintenance.findById(requestId)
            .populate('residentId', 'name email');

        if (!currentRequest) {
            return res.status(404).json({
                message: "Maintenance request not found"
            });
        }

        // Update the request
        const updatedRequest = await Maintenance.findByIdAndUpdate(
            requestId,
            req.body,
            {new:true}
        ).populate('residentId', 'name email');

        // Send email if status changed to "completed" and user is admin or staff
        if (status === 'completed' && currentRequest.status !== 'completed') {
            // Check if user is admin or staff
            if (req.user.role === 'admin' || req.user.role === 'staff') {
                try {
                    await sendEmail({
                        to: currentRequest.residentId.email,
                        subject: "Maintenance Request Completed ✅",
                        text: `Hello ${currentRequest.residentId.name},\n\nGreat news! Your maintenance request for "${currentRequest.issueTitle}" has been successfully completed.\n\nIf you have any questions or if the issue persists, please don't hesitate to contact us.\n\nBest regards,\nHostel Management Team`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="margin: 0; font-size: 24px;">Maintenance Request Completed! 🎉</h1>
                                </div>
                                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${currentRequest.residentId.name},</h2>
                                    <p style="color: #666; font-size: 16px; line-height: 1.6;">Great news! Your maintenance request has been successfully completed.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                                        <h3 style="color: #333; margin-top: 0;">Request Details:</h3>
                                        <p style="margin: 8px 0;"><strong>Issue:</strong> ${currentRequest.issueTitle}</p>
                                        <p style="margin: 8px 0;"><strong>Description:</strong> ${currentRequest.description || 'No description provided'}</p>
                                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">COMPLETED</span></p>
                                    </div>
                                    
                                    <p style="color: #666; font-size: 16px; line-height: 1.6;">If you have any questions or if the issue persists, please don't hesitate to contact us.</p>
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <p style="color: #999; font-size: 14px;">Best regards,<br>Hostel Management Team</p>
                                    </div>
                                </div>
                            </div>
                        `
                    });
                    console.log('Maintenance completion email sent to:', currentRequest.residentId.email);
                } catch (emailError) {
                    console.error('Failed to send maintenance completion email:', emailError);
                    // Don't fail the request update if email fails
                }
            } else {
                console.log('Email not sent - user is not admin or staff. User role:', req.user.role);
            }
        }

        res.status(200).json({
            message:"Maintenance request updated successfully",
            updatedRequest
        });

    } catch (error) {

        console.error('Error updating maintenance request:', error);
        res.status(500).json({
            message:"Error updating request",
            error
        });

    }

};

