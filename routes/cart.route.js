const express = require("express");
const { UserModel } = require("../models/user.model");
const { verifyuserAuth } = require("../controllers/user.controller");

const router = express.Router();

/* ============================
   GET USER CART
============================ */
router.get("/", verifyuserAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).populate("cart.product");
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const cartItems = user.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.json({
      status: true,
      message: "Cart retrieved successfully",
      data: cartItems
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ 
      status: false,
      message: "Failed to fetch cart", 
      error: err.message 
    });
  }
});

/* ============================
   ADD TO CART
============================ */
router.post("/add", verifyuserAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ status: false, message: "Product ID required" });

    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    const updatedUser = await UserModel.findById(req.userId).populate("cart.product");
    
    const cartItems = updatedUser.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.json({
      status: true,
      message: "Item added to cart",
      data: cartItems
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ status: false, message: "Failed to add to cart", error: err.message });
  }
});

/* ============================
   UPDATE CART ITEM QUANTITY
============================ */
router.put("/update", verifyuserAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({ status: false, message: "Product ID and quantity required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ status: false, message: "Quantity must be at least 1" });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const item = user.cart.find((i) => i.product.toString() === productId);
    
    if (!item) {
      return res.status(404).json({ status: false, message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await user.save();

    const updatedUser = await UserModel.findById(req.userId).populate("cart.product");
    
    const cartItems = updatedUser.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.json({
      status: true,
      message: "Cart updated",
      data: cartItems
    });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ status: false, message: "Failed to update cart", error: err.message });
  }
});

/* ============================
   REMOVE FROM CART
============================ */
router.delete("/remove/:productId", verifyuserAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await user.save();

    const updatedUser = await UserModel.findById(req.userId).populate("cart.product");
    
    const cartItems = updatedUser.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.json({
      status: true,
      message: "Item removed from cart",
      data: cartItems
    });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ status: false, message: "Failed to remove item", error: err.message });
  }
});

/* ============================
   CLEAR CART
============================ */
router.post("/clear", verifyuserAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    user.cart = [];
    await user.save();

    res.json({
      status: true,
      message: "Cart cleared",
      data: []
    });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ status: false, message: "Failed to clear cart", error: err.message });
  }
});

/* ============================
   SYNC GUEST CART ON LOGIN
============================ */
router.post("/sync", verifyuserAuth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ status: false, message: "Items must be an array" });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    items.forEach((guestItem) => {
      const { productId, quantity } = guestItem;
      
      if (!productId || !quantity) return;

      const existing = user.cart.find(
        (item) => item.product.toString() === productId
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        user.cart.push({ product: productId, quantity });
      }
    });

    await user.save();
    const updatedUser = await UserModel.findById(req.userId).populate("cart.product");
    
    const cartItems = updatedUser.cart.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      product: item.product._id,
    }));

    res.json({
      status: true,
      message: "Cart synced successfully",
      data: cartItems
    });
  } catch (err) {
    console.error("Sync cart error:", err);
    res.status(500).json({ status: false, message: "Failed to sync cart", error: err.message });
  }
});

module.exports = router;