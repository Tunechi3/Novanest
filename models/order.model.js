const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },

  // Order Items
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      image: {
        type: String,
      },
    },
  ],

  // Shipping Information
  shippingAddress: {
    fullname: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },

  shippingMethod: {
    type: String,
    required: true,
    enum: ["standard", "express", "overnight"],
    default: "standard",
  },

  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ["card", "paypal", "cod"],
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },

  // Order Amounts
  subtotal: {
    type: Number,
    required: true,
  },

  shippingCost: {
    type: Number,
    required: true,
  },

  tax: {
    type: Number,
    required: true,
  },

  total: {
    type: Number,
    required: true,
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },

  // Tracking
  trackingNumber: {
    type: String,
    default: "",
  },

  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now,
  },

  deliveredDate: {
    type: Date,
  },

  // Notes
  notes: {
    type: String,
    default: "",
  },
});

// Generate unique order number before saving
OrderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  // No next() needed with async
});

const OrderModel = mongoose.model("Order", OrderSchema);

module.exports = { OrderModel };