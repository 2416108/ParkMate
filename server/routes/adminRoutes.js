const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/vehicles', adminController.getAllVehicles);
router.get('/bookings', adminController.getAllBookings);
router.get('/payments', adminController.getAllPayments);
router.get('/history', adminController.getAllHistory);

module.exports = router;
