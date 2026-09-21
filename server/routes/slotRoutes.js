const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public / Authenticated read
router.get('/', authenticateToken, slotController.getSlots);
router.get('/:id', authenticateToken, slotController.getSlotById);

// Admin-only management routes
router.post('/', authenticateToken, requireAdmin, slotController.adminAddSlot);
router.put('/:id', authenticateToken, requireAdmin, slotController.adminUpdateSlot);
router.patch('/:id/maintenance', authenticateToken, requireAdmin, slotController.adminToggleMaintenance);

module.exports = router;
