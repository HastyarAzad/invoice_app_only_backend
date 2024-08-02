
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const product_controller = require('./product_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get all product api
router.get("/v1/products", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.getAll);

// get a product by id api
router.get("/v1/product/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.getById);

// insert a product into the database
router.post("/v1/product", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.createOne);

// update a product based on it's id 
router.put("/v1/product/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.updateByID);

//delete a product based on it's id
router.delete("/v1/product/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.deleteByID); 

//patch a product based on it's id
router.patch("/v1/product/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), product_controller.patchByID); 

// exporting the router
module.exports = router;
