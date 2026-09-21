const db = require('../config/db');

const ALLOWED_VEHICLE_TYPES = ['Car', 'Bike', 'SUV', 'Van'];

// Standard vehicle number format validation (e.g. TN01AB1234 or alphanumeric 6-12 chars)
function isValidVehicleNumber(num) {
  if (!num) return false;
  const clean = num.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(clean);
}

function formatVehicleNumber(num) {
  return num.replace(/[\s-]/g, '').toUpperCase();
}

exports.getMyVehicles = (req, res, next) => {
  try {
    const vehicles = db.prepare(`
      SELECT v.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.vehicle_id = v.id AND b.status IN ('Confirmed', 'Active')) AS active_bookings_count
      FROM vehicles v
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC
    `).all(req.user.id);

    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    next(err);
  }
};

exports.addVehicle = (req, res, next) => {
  try {
    const { vehicle_number, vehicle_type, model, color } = req.body;

    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required.' });
    }

    if (!vehicle_type || !ALLOWED_VEHICLE_TYPES.includes(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid vehicle type (${ALLOWED_VEHICLE_TYPES.join(', ')}).`
      });
    }

    if (!model || !model.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle model is required.' });
    }

    if (!color || !color.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle color is required.' });
    }

    const formattedNumber = formatVehicleNumber(vehicle_number);
    if (!isValidVehicleNumber(formattedNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid vehicle license plate number (e.g., TN01AB1234).'
      });
    }

    // Check duplicate vehicle number system-wide
    const existing = db.prepare('SELECT id, user_id FROM vehicles WHERE vehicle_number = ?').get(formattedNumber);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This vehicle is already registered.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, model, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, formattedNumber, vehicle_type, model.trim(), color.trim());

    const created = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully.',
      vehicle: created
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicle_number, vehicle_type, model, color } = req.body;

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized.' });
    }

    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required.' });
    }

    if (!vehicle_type || !ALLOWED_VEHICLE_TYPES.includes(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid vehicle type (${ALLOWED_VEHICLE_TYPES.join(', ')}).`
      });
    }

    if (!model || !model.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle model is required.' });
    }

    if (!color || !color.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle color is required.' });
    }

    const formattedNumber = formatVehicleNumber(vehicle_number);
    if (!isValidVehicleNumber(formattedNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid vehicle license plate number (e.g., TN01AB1234).'
      });
    }

    // Check duplicate if plate was modified
    const duplicate = db.prepare('SELECT id FROM vehicles WHERE vehicle_number = ? AND id != ?').get(formattedNumber, id);
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'This vehicle number is already registered to another vehicle.' });
    }

    db.prepare(`
      UPDATE vehicles
      SET vehicle_number = ?, vehicle_type = ?, model = ?, color = ?
      WHERE id = ? AND user_id = ?
    `).run(formattedNumber, vehicle_type, model.trim(), color.trim(), id, req.user.id);

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Vehicle updated successfully.',
      vehicle: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized.' });
    }

    // Prevent deletion if there is an active/confirmed booking
    const activeBooking = db.prepare(`
      SELECT id, booking_id FROM bookings
      WHERE vehicle_id = ? AND status IN ('Confirmed', 'Active')
    `).get(id);

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle with active booking (${activeBooking.booking_id}). Please complete or cancel the parking first.`
      });
    }

    db.prepare('DELETE FROM vehicles WHERE id = ? AND user_id = ?').run(id, req.user.id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
