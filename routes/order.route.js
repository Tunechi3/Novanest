const express = require("express");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { verifyuserAuth } = require("../controllers/user.controller");
const router = express.Router();

// Order routes (paths are relative to /api/orders)
router.post("/", verifyuserAuth, createOrder);           // POST /api/orders
router.get("/", verifyuserAuth, getUserOrders);          // GET /api/orders
router.get("/:orderId", verifyuserAuth, getOrderById);   // GET /api/orders/:orderId
router.put("/:orderId/cancel", verifyuserAuth, cancelOrder);
router.put("/:orderId/status", verifyuserAuth, updateOrderStatus);

module.exports = router;