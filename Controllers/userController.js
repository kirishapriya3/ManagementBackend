import User from "../Models/User.js";

export const updateMyDetails = async (req, res) => {

  try {

    const userId = req.user.userId;
    const { name, email, phone, aadhaar, emergencyContact, dateOfBirth, gender } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
     {
        name,
        email,
        phone,
        aadhaar,
        emergencyContact,
        dateOfBirth,
        gender
      },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error updating profile",
      error
    });

  }

};

export const getMyDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};