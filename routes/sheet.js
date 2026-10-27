/**
 * imports
 */
const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheets.js');
const { requireAuth, requireRole, requireAllowedSpreadsheet } = require('../middlewares/auth.js');

router.use(requireAuth, requireAllowedSpreadsheet);

// Routes
router.get('/', sheetController.getData);
router.post('/', requireRole('admin', 'user'), sheetController.updateData);
router.post('/delete', requireRole('admin'), sheetController.deleteRow);
router.post('/insert', requireRole('admin', 'user'), sheetController.insertRow);

module.exports = router;
