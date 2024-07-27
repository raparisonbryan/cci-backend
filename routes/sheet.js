/**
 * imports
 */

const express = require("express");
const router = express.Router();
const sheetControl = require("../controllers/sheets");

/**
 * * Routes
 */
router.get("/data", sheetControl.getSheetValues);

/**
 * * Export
 */
module.exports = router;
