
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const customer_controller = require('./customer_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get all customer api
router.get("/v1/customers", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.getAll);

// get a customer by id api
router.get("/v1/customer/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.getById);

// insert a customer into the database
router.post("/v1/customer", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.createOne);

// update a customer based on it's id 
router.put("/v1/customer/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.updateByID);

//delete a customer based on it's id
router.delete("/v1/customer/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.deleteByID); 

//patch a customer based on it's id to deposit or withdraw balance to that customer
router.patch("/v1/customer/add_balance/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), customer_controller.patchByID); 

// exporting the router
module.exports = router;
