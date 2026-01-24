    // const express = require('express')
    // const { addProduct } = require('../controllers/product.controller')

    // const route = express.Router();

    // route.post("/addProduct", addProduct);

    // module.exports =route

    // const express = require("express");
    // const { addProduct } = require("../controllers/product.controller");

    // const router = express.Router();

    // router.post("/add-product", addProduct);

    // module.exports = router;


const express = require("express");
const { addProduct, getProducts, getProductsByCategory } = require("../controllers/product.controller");

const router = express.Router();

router.post("/", addProduct);
router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);

module.exports = router;
