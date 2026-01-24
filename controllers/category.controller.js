const { CategoryModel } = require("../models/category.model");

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.json(categories);
  } catch (err) {
    console.error("Error in getCategories:", err); // <--- log error
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await CategoryModel.create({ name });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Failed to add category" });
  }
};

module.exports = { getCategories, addCategory };
