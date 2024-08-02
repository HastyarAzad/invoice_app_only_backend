
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const supplier_controller = require('./supplier_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get all supplier api
router.get("/v1/suppliers", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), supplier_controller.getAll);

// get a supplier by id api
router.get("/v1/supplier/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), supplier_controller.getById);

// insert a supplier into the database
router.post("/v1/supplier", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), supplier_controller.createOne);

// update a supplier based on it's id 
router.put("/v1/supplier/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), supplier_controller.updateByID);

//delete a supplier based on it's id
router.delete("/v1/supplier/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), supplier_controller.deleteByID); 

// exporting the router
module.exports = router;
