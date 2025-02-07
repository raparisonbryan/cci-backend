/**
 * imports
 */
const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheets.js');

// Routes
router.get('/', sheetController.getData);
router.post('/', sheetController.updateData);
router.post('/delete', sheetController.deleteRow);
router.post('/insert', sheetController.insertRow);

module.exports = router;