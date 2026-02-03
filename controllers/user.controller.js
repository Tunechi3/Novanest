const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/user.model");
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ← Add this line

// ✅ Auto-create uploads folder if it doesn't exist
const uploadsDir = 'uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads/avatars folder');
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('avatar');

//register user
const registerUser = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: false, message: "Email already registered" });
    }

    const user = new UserModel({ fullname, email, password });
    const savedUser = await user.save();

    res.status(201).json({
      status: true,
      message: "Registration successful",
      data: {
        id: savedUser._id,
        fullname: savedUser.fullname,
        email: savedUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Unable to register user",
      error: err.message,
    });
  }
};

//login logic - ✅ UPDATED WITH 7-DAY TOKEN
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ status: false, message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: false, message: "Email not found" });
    }

    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(400).json({ status: false, message: "Invalid credentials" });
    }

    // 🔥 CHANGE: Token now expires in 7 days instead of 1 hour
    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" } // ← Changed from "1h" to "7d"
    );

    res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      status: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

//verify user - ✅ ENHANCED WITH BETTER ERROR MESSAGES
const verifyuserAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "No token provided" });
    }

    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid token" });
    }
    req.userId = decoded.id;

    next();
  } catch (err) {
    // 🔥 ENHANCEMENT: Better error messages for token expiration
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        status: false, 
        message: "Token expired. Please login again.",
        expired: true // ← Frontend can use this flag
      });
    }
    
    return res
      .status(401)
      .json({ status: false, message: "Authentication failed" });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select("-password");
    
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found" });
    }

    res.status(200).json({
      status: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to retrieve profile",
      error: err.message,
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      avatar,
      bio,
      shippingAddress,
      billingAddress,
      preferences,
    } = req.body;

    const updateData = {};

    if (fullname) updateData.fullname = fullname;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (shippingAddress) updateData.shippingAddress = shippingAddress;
    if (billingAddress) updateData.billingAddress = billingAddress;
    if (preferences) updateData.preferences = preferences;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: false, message: "User not found" });
    }

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found" });
    }

    const isMatch = await user.validatePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to change password",
      error: err.message,
    });
  }
};

// Upload avatar function
const uploadAvatar = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: false,
        message: 'File upload error: ' + err.message,
      });
    } else if (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded',
      });
    }

    try {
      // Create the avatar URL (adjust based on your server setup)
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user's avatar in database
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.userId,
        { avatar: avatarUrl },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        status: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: avatarUrl,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Failed to update avatar',
        error: error.message,
      });
    }
  });
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId)
      .populate("cart.product")
      .select("cart");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const cartItems = user.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.status(200).json({
      status: true,
      message: "Cart retrieved successfully",
      data: cartItems,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to retrieve cart",
      error: err.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyuserAuth,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getCart,
  uploadAvatar,
};