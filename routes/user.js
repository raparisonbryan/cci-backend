/**
 * imports
 */

const express = require("express");
const router = express.Router();
const userControl = require("../controllers/users");
const verifyEmail = require("../middleware/email-validator");
const verifyPassword = require("../middleware/password-validator");

/**
 * * Routes
 */
router.post("/signup", verifyEmail, verifyPassword, userControl.signup);
router.post("/login", userControl.login);
router.get("/", userControl.getAllUsers);
router.get("/:id", userControl.getOneUser);
router.put("/:id", userControl.modifyUser);
router.delete("/:id", userControl.deleteUser);

/**
 * * Export
 */
module.exports = router;
