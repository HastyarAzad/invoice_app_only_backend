
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const tax_controller = require('./tax_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get a tax by id api
router.get("/v1/tax/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), tax_controller.getById);

//patch a tax based on it's id
router.patch("/v1/tax/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), tax_controller.patchByID); 

// exporting the router
module.exports = router;
