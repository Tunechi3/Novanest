const { ProductModel } = require("../models/product.model");
const { CategoryModel } = require("../models/category.model");

const addProduct = async (req, res) => {
  try {
    const { name, price, description, image, categoryId } = req.body;

    //Check category exists
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const product = new ProductModel({
      name,
      price,
      description,
      image,
      category: categoryId,
    });

    await product.save();

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add product" });
  }
};
//Get all products
const getProducts = async (req, res) => {
  try {
    const products = await ProductModel
      .find()
      .populate("category", "name");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

//Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await ProductModel
      .find({ category: categoryId })
      .populate("category", "name");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category products" });
  }
};

module.exports = { addProduct, getProducts, getProductsByCategory };
