
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const invoice_controller = require('./invoice_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get all invoice api
router.get("/v1/invoices", authenticateAndCheckRole(["SUPER_ADMIN"]), invoice_controller.getAll);

// get a invoice by id api
router.get("/v1/invoice/:id", authenticateAndCheckRole(["SUPER_ADMIN"]), invoice_controller.getById);

// insert a invoice into the database
router.post("/v1/invoice", authenticateAndCheckRole(["SUPER_ADMIN"]), invoice_controller.createOne);

// update a invoice based on it's id 
router.put("/v1/invoice/:id", authenticateAndCheckRole(["SUPER_ADMIN"]), invoice_controller.updateByID);

//delete a invoice based on it's id
router.delete("/v1/invoice/:id", authenticateAndCheckRole(["SUPER_ADMIN"]), invoice_controller.deleteByID); 

// exporting the router
module.exports = router;
