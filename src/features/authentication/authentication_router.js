
// importing Express and attaching a router
const express = require("express");
const router = express.Router();
const authentication_controller = require('./authentication_controller');
const authenticateAndCheckRole = require("../../../middleware/authorize_role");

// get all user api
router.get("/v1/users", authenticateAndCheckRole(["SUPER_ADMIN"]), authentication_controller.getAll);

// get a user by id api
router.get("/v1/user/:id", authenticateAndCheckRole(["SUPER_ADMIN"]), authentication_controller.getById);

// insert a user into the database
router.post("/v1/register", authentication_controller.createOne);

// login a user api
router.post("/v1/login", authentication_controller.login);

// refreshToken
router.post("/v1/refresh_token", authentication_controller.refreshToken);

// change password
router.put("/v1/change_password/:id", authenticateAndCheckRole(["SUPER_ADMIN","USER"]), authentication_controller.changePassword);

// update a user based on it's id 
router.put("/v1/user/:id", authenticateAndCheckRole(["SUPER_ADMIN", "USER"]), authentication_controller.updateByID);

//delete a user based on it's id
router.delete("/v1/user/:id", authenticateAndCheckRole(["SUPER_ADMIN"]), authentication_controller.deleteByID);

// exporting the router
module.exports = router;
