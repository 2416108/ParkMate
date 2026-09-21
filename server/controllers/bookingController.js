const db = require('../config/db');

// Helper to calculate expected exit time string
function calculateExitTime(entryTimeStr, durationHours) {
  // Try parsing time like "09:00 AM" or "14:00"
  try {
    const today = new Date();
    let [time, modifier] = entryTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes || 0);
    date.setHours(date.getHours() + parseInt(durationHours, 10));

    let outHours = date.getHours();
    const outMinutes = date.getMinutes().toString().padStart(2, '0');
    const outModifier = outHours >= 12 ? 'PM' : 'AM';
    outHours = outHours % 12 || 12;

    return `${outHours.toString().padStart(2, '0')}:${outMinutes} ${outModifier}`;
  } catch {
    return `+${durationHours} hrs`;
  }
}

// Helper to generate next Booking ID: PKG-YYYY-XXXX
function generateBookingId() {
  const year = new Date().getFullYear();
  const lastBooking = db.prepare(`
    SELECT booking_id FROM bookings
    WHERE booking_id LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`PKG-${year}-%`);

  let nextNum = 1;
  if (lastBooking && lastBooking.booking_id) {
    const parts = lastBooking.booking_id.split('-');
    if (parts.length === 3) {
      nextNum = parseInt(parts[2], 10) + 1;
    }
  }
  return `PKG-${year}-${String(nextNum).padStart(4, '0')}`;
}

exports.createBooking = (req, res, next) => {
  try {
    const { vehicle_id, slot_id, booking_date, entry_time, duration } = req.body;

    if (!vehicle_id || !slot_id || !booking_date || !entry_time || !duration) {
      return res.status(400).json({ success: false, message: 'All booking fields are required.' });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 24) {
      return res.status(400).json({ success: false, message: 'Please select a valid parking duration (1 to 24 hours).' });
    }

    // 1. Verify vehicle ownership & check for active bookings
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (vehicle.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized vehicle selection.' });
    }

    const activeVehicleBooking = db.prepare(`
      SELECT id, booking_id FROM bookings
      WHERE vehicle_id = ? AND status IN ('Confirmed', 'Active')
    `).get(vehicle_id);

    if (activeVehicleBooking) {
      return res.status(400).json({
        success: false,
        message: `This vehicle already has an active booking (${activeVehicleBooking.booking_id}). A vehicle cannot have multiple active bookings.`
      });
    }

    // 2. Verify slot availability
    const slot = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(slot_id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    if (slot.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Parking slot ${slot.slot_number} is no longer available (${slot.status}). Please select another slot.`
      });
    }

    // 3. Compute amount and exit time
    const estimatedAmount = durationNum * slot.hourly_rate;
    const expectedExitTime = calculateExitTime(entry_time, durationNum);
    const bookingId = generateBookingId();

    // 4. Atomic transaction: create booking and set slot to Reserved
    const insertBookingStmt = db.prepare(`
      INSERT INTO bookings (
        booking_id, user_id, vehicle_id, slot_id, booking_date,
        entry_time, expected_exit_time, duration, estimated_amount, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `);

    const result = insertBookingStmt.run(
      bookingId,
      req.user.id,
      vehicle_id,
      slot_id,
      booking_date,
      entry_time,
      expectedExitTime,
      durationNum,
      estimatedAmount
    );

    // Update slot status to Reserved
    db.prepare("UPDATE parking_slots SET status = 'Reserved' WHERE id = ?").run(slot_id);

    // Fetch full created booking details
    const createdBooking = db.prepare(`
      SELECT b.*,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model, v.color as vehicle_color,
             s.slot_number, s.floor, s.section, s.hourly_rate
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Parking slot booked successfully! Ticket generated.',
      booking: createdBooking
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = (req, res, next) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor, s.section, s.hourly_rate,
             p.payment_id, p.status as payment_status, p.payment_method
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
    `).all(req.user.id);

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = db.prepare(`
      SELECT b.*,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model, v.color as vehicle_color,
             s.slot_number, s.floor, s.section, s.hourly_rate,
             p.payment_id, p.status as payment_status, p.payment_method, p.amount as payment_amount, p.payment_date,
             pr.entry_time as actual_entry_time, pr.exit_time as actual_exit_time, pr.duration as actual_duration, pr.final_amount
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN parking_records pr ON pr.booking_id = b.id
      WHERE b.id = ? OR b.booking_id = ?
    `).get(id, id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_id = ?').get(id, id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed booking.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    // Cancel booking and release slot
    db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(booking.id);
    db.prepare("UPDATE parking_slots SET status = 'Available' WHERE id = ?").run(booking.slot_id);

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Parking slot has been released.'
    });
  } catch (err) {
    next(err);
  }
};
