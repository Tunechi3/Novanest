const { OrderModel } = require("../models/order.model");
const { UserModel } = require("../models/user.model");

// Create a new order
const createOrder = async (req, res) => {
  try {
    console.log("=== CREATE ORDER REQUEST ===");
    console.log("User ID:", req.userId);
    
    const {
      shippingInfo,
      paymentInfo,
      items,
      subtotal,
      shipping,
      tax,
      total,
    } = req.body;

    // Validate required fields
    if (!shippingInfo || !paymentInfo || !items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Missing required order information",
      });
    }

    // Generate order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Create order
    const order = new OrderModel({
      user: req.userId,
      orderNumber: orderNumber,  // ✅ Add this line
      items: items.map((item) => ({
        product: item.product || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      shippingAddress: {
        fullname: shippingInfo.fullname,
        phone: shippingInfo.phone,
        street: shippingInfo.street,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country,
      },
      shippingMethod: shippingInfo.shippingMethod,
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.method === "cod" ? "pending" : "paid",
      subtotal: subtotal,
      shippingCost: shipping,
      tax: tax,
      total: total,
      orderStatus: "pending",
    });

    console.log("Order object created, attempting to save...");
    const savedOrder = await order.save();
    console.log("Order saved successfully:", savedOrder._id);

    // Clear user's cart after successful order
    await UserModel.findByIdAndUpdate(req.userId, { cart: [] });
    console.log("Cart cleared");

    res.status(201).json({
      status: true,
      message: "Order created successfully",
      data: {
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        total: savedOrder.total,
      },
    });
  } catch (err) {
    console.error("=== ORDER CREATION ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({
      status: false,
      message: "Failed to create order",
      error: err.message,
    });
  }
};
// Get all orders for logged-in user
const getUserOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({ user: req.userId })
      .populate("items.product")
      .sort({ orderDate: -1 });

    res.status(200).json({
      status: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to retrieve orders",
      error: err.message,
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findOne({
      _id: orderId,
      user: req.userId,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to retrieve order",
      error: err.message,
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    // Only allow cancellation if order is pending or processing
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        status: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({
      status: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to cancel order",
      error: err.message,
    });
  }
};

// Update order status (Admin function - optional)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (orderStatus === "delivered") {
      order.deliveredDate = new Date();
    }

    await order.save();

    res.status(200).json({
      status: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Failed to update order",
      error: err.message,
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};