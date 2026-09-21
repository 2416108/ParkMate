const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', paymentController.processPayment);
router.get('/', paymentController.getMyPayments);
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
