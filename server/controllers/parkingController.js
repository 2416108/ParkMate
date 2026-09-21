const db = require('../config/db');

// Helper to format current time string
function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Get user's current active booking and parking record (for Dashboard active card)
exports.getActiveParking = (req, res, next) => {
  try {
    const active = db.prepare(`
      SELECT b.*,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model, v.color as vehicle_color,
             s.slot_number, s.floor, s.section, s.hourly_rate,
             p.payment_id, p.status as payment_status, p.payment_method,
             pr.id as record_id, pr.entry_time as parking_entry_time
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN parking_records pr ON pr.booking_id = b.id
      WHERE b.user_id = ? AND b.status IN ('Confirmed', 'Active')
      ORDER BY b.id DESC LIMIT 1
    `).get(req.user.id);

    res.json({ success: true, activeBooking: active || null });
  } catch (err) {
    next(err);
  }
};

// Customer: Exit vehicle and complete parking session
exports.recordExit = (req, res, next) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const booking = db.prepare(`
      SELECT b.*, s.slot_number, s.hourly_rate, v.vehicle_number, v.model as vehicle_model
      FROM bookings b
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = ? OR b.booking_id = ?
    `).get(booking_id, booking_id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This parking session has already been completed.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This booking was cancelled.' });
    }

    // Determine actual exit time and duration
    const today = new Date().toISOString().split('T')[0];
    const exitTimeString = `${today} ${getCurrentTimeString()}`;

    // Base duration from booking (or actual)
    const duration = booking.duration || 1;
    const hourlyRate = booking.hourly_rate || 30.0;
    const baseAmount = duration * hourlyRate;
    const lateCharge = 0.0; // Standard on-time checkout for demo flow
    const finalAmount = baseAmount + lateCharge;

    // Update or insert parking_record
    const record = db.prepare('SELECT id FROM parking_records WHERE booking_id = ?').get(booking.id);
    if (record) {
      db.prepare(`
        UPDATE parking_records
        SET exit_time = ?, duration = ?, final_amount = ?, status = 'Completed'
        WHERE id = ?
      `).run(exitTimeString, duration, finalAmount, record.id);
    } else {
      db.prepare(`
        INSERT INTO parking_records (booking_id, entry_time, exit_time, duration, final_amount, status)
        VALUES (?, ?, ?, ?, ?, 'Completed')
      `).run(booking.id, `${booking.booking_date} ${booking.entry_time}`, exitTimeString, duration, finalAmount);
    }

    // Update booking status to Completed
    db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(booking.id);

    // Release parking slot back to Available
    db.prepare("UPDATE parking_slots SET status = 'Available' WHERE id = ?").run(booking.slot_id);

    // If payment record didn't exist (e.g. pay at exit), ensure payment marked
    const payment = db.prepare('SELECT id FROM payments WHERE booking_id = ?').get(booking.id);
    if (!payment) {
      const paymentId = `PAY-${new Date().getFullYear()}-${String(booking.id).padStart(4, '0')}`;
      db.prepare(`
        INSERT INTO payments (payment_id, booking_id, amount, payment_method, status)
        VALUES (?, ?, ?, 'Cash', 'Paid')
      `).run(paymentId, booking.id, finalAmount);
    }

    res.json({
      success: true,
      message: 'Vehicle exit recorded successfully! Slot has been released.',
      exitSummary: {
        bookingId: booking.booking_id,
        vehicleNumber: booking.vehicle_number,
        vehicleModel: booking.vehicle_model,
        slotNumber: booking.slot_number,
        entryTime: `${booking.booking_date} ${booking.entry_time}`,
        exitTime: exitTimeString,
        duration: `${duration} hour${duration > 1 ? 's' : ''}`,
        hourlyRate,
        baseAmount,
        lateCharge,
        finalAmount,
        status: 'Completed'
      }
    });
  } catch (err) {
    next(err);
  }
};

// Customer: Get full parking history
exports.getParkingHistory = (req, res, next) => {
  try {
    const { status, vehicle, date } = req.query;

    let query = `
      SELECT b.id as booking_db_id, b.booking_id, b.booking_date, b.entry_time, b.expected_exit_time,
             b.duration as booked_duration, b.status as booking_status,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor, s.section, s.hourly_rate,
             pr.entry_time as actual_entry_time, pr.exit_time, pr.duration as actual_duration,
             COALESCE(pr.final_amount, b.estimated_amount) as amount,
             p.payment_id, p.payment_method, p.status as payment_status
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN parking_records pr ON pr.booking_id = b.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = ?
    `;

    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (vehicle) {
      query += ' AND v.vehicle_number LIKE ?';
      params.push(`%${vehicle}%`);
    }

    if (date) {
      query += ' AND b.booking_date = ?';
      params.push(date);
    }

    query += ' ORDER BY b.id DESC';

    const history = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    next(err);
  }
};
