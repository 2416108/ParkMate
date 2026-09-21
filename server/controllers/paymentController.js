const db = require('../config/db');

// Helper to generate next Payment ID: PAY-YYYY-XXXX
function generatePaymentId() {
  const year = new Date().getFullYear();
  const lastPayment = db.prepare(`
    SELECT payment_id FROM payments
    WHERE payment_id LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`PAY-${year}-%`);

  let nextNum = 1;
  if (lastPayment && lastPayment.payment_id) {
    const parts = lastPayment.payment_id.split('-');
    if (parts.length === 3) {
      nextNum = parseInt(parts[2], 10) + 1;
    }
  }
  return `PAY-${year}-${String(nextNum).padStart(4, '0')}`;
}

exports.processPayment = (req, res, next) => {
  try {
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
      return res.status(400).json({ success: false, message: 'Booking ID and payment method are required.' });
    }

    const ALLOWED_METHODS = ['UPI', 'Credit/Debit Card', 'Cash'];
    if (!ALLOWED_METHODS.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Please choose a valid payment method (${ALLOWED_METHODS.join(', ')}).`
      });
    }

    // Find booking
    const booking = db.prepare(`
      SELECT b.*, s.slot_number, v.vehicle_number, u.name as customer_name
      FROM bookings b
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ? OR b.booking_id = ?
    `).get(booking_id, booking_id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Check if already paid
    const existingPayment = db.prepare("SELECT * FROM payments WHERE booking_id = ? AND status = 'Paid'").get(booking.id);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid for.',
        payment: existingPayment
      });
    }

    const paymentId = generatePaymentId();
    const amount = booking.estimated_amount;

    // Insert payment
    const insertPayment = db.prepare(`
      INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_date, status)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'Paid')
    `);
    const paymentResult = insertPayment.run(paymentId, booking.id, amount, payment_method);

    // Update booking status to Active
    db.prepare("UPDATE bookings SET status = 'Active' WHERE id = ?").run(booking.id);

    // Update slot status to Occupied
    db.prepare("UPDATE parking_slots SET status = 'Occupied' WHERE id = ?").run(booking.slot_id);

    // Check if parking record already exists, or create one
    const existingRecord = db.prepare('SELECT id FROM parking_records WHERE booking_id = ?').get(booking.id);
    if (!existingRecord) {
      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      db.prepare(`
        INSERT INTO parking_records (booking_id, entry_time, status)
        VALUES (?, ?, 'Active')
      `).run(booking.id, `${booking.booking_date} ${nowFormatted}`);
    }

    // Fetch full receipt details
    const receipt = db.prepare(`
      SELECT p.*,
             b.booking_id, b.booking_date, b.entry_time, b.expected_exit_time, b.duration,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor, s.hourly_rate
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      WHERE p.id = ?
    `).get(paymentResult.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Payment completed successfully! Receipt generated.',
      receipt
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyPayments = (req, res, next) => {
  try {
    const payments = db.prepare(`
      SELECT p.*,
             b.booking_id, b.booking_date,
             v.vehicle_number, v.model as vehicle_model,
             s.slot_number
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      WHERE b.user_id = ?
      ORDER BY p.id DESC
    `).all(req.user.id);

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentById = (req, res, next) => {
  try {
    const { id } = req.params;

    const receipt = db.prepare(`
      SELECT p.*,
             b.booking_id, b.booking_date, b.entry_time, b.expected_exit_time, b.duration,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor, s.hourly_rate
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      WHERE p.id = ? OR p.payment_id = ?
    `).get(id, id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (receipt.customer_email !== req.user.email && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, receipt });
  } catch (err) {
    next(err);
  }
};
