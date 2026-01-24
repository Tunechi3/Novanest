const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  // Profile fields
  phone: {
    type: String,
    default: "",
  },

  avatar: {
    type: String,
    default: "",
  },

  bio: {
    type: String,
    default: "",
    maxlength: 500,
  },

  // Shipping address
  shippingAddress: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    country: { type: String, default: "" },
  },

  // Billing address (optional, can be same as shipping)
  billingAddress: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    country: { type: String, default: "" },
  },

  // Preferences
  preferences: {
    newsletter: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
  },

  date_created: {
    type: Date,
    default: Date.now,
  },

  //Persistent cart per user
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },
    },
  ],
});

const saltRounds = 10;

// Hash password before saving - ASYNC/AWAIT VERSION
UserSchema.pre("save", async function () {
  // Prevent re-hashing password on every save
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Password validation - ASYNC/AWAIT VERSION
UserSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const UserModel = mongoose.model("User", UserSchema);

module.exports = { UserModel };