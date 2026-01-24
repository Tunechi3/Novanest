// const express = require("express");
// const { getCategories, addCategory } = require("../controllers/category.controller");

// const router = express.Router();

// router.get("/", getCategories);
// router.post("/categories", addCategory);

// module.exports = router;
const express = require("express");
const {
  getCategories,
  addCategory,
} = require("../controllers/category.controller");

const router = express.Router();

// ✅ clean routes
router.get("/", getCategories);
router.post("/", addCategory);

module.exports = router;
