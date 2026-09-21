const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/active', parkingController.getActiveParking);
router.post('/exit', parkingController.recordExit);
router.get('/history', parkingController.getParkingHistory);

module.exports = router;
