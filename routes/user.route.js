const express = require('express')
const { registerUser, loginUser, verifyuserAuth, getUserProfile, updateUserProfile, changePassword, getCart, uploadAvatar } = require('../controllers/user.controller')
const route = express.Router()
route.post('/register-user', registerUser)
route.post('/login-user', loginUser)
route.get('/verifyuser-auth', verifyuserAuth)
route.get("/profile", verifyuserAuth, getUserProfile);
route.put("/profile", verifyuserAuth, updateUserProfile);
route.put("/change-password", verifyuserAuth, changePassword);
route.post("/upload-avatar", verifyuserAuth, uploadAvatar);
// route.get("/cart", verifyuserAuth, getCart);
route.get("/", verifyuserAuth, getCart)
module.exports = route