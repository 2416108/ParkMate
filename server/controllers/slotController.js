const db = require('../config/db');

exports.getSlots = (req, res, next) => {
  try {
    const { floor, status, vehicle_type } = req.query;

    let query = 'SELECT * FROM parking_slots WHERE 1=1';
    const params = [];

    if (floor) {
      query += ' AND floor = ?';
      params.push(parseInt(floor, 10));
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (vehicle_type && vehicle_type !== 'All') {
      query += " AND (vehicle_type = ? OR vehicle_type = 'All')";
      params.push(vehicle_type);
    }

    query += ' ORDER BY floor ASC, slot_number ASC';

    const slots = db.prepare(query).all(...params);

    // Calculate quick counts
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM parking_slots
    `).get();

    res.json({
      success: true,
      summary,
      count: slots.length,
      slots
    });
  } catch (err) {
    next(err);
  }
};

exports.getSlotById = (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(id);

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    // Check if slot has active booking
    const activeBooking = db.prepare(`
      SELECT b.id, b.booking_id, b.user_id, b.entry_time, b.expected_exit_time, b.status,
             u.name as customer_name, v.vehicle_number, v.model as vehicle_model
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.slot_id = ? AND b.status IN ('Confirmed', 'Active')
      ORDER BY b.id DESC LIMIT 1
    `).get(id);

    res.json({ success: true, slot, activeBooking: activeBooking || null });
  } catch (err) {
    next(err);
  }
};

// Admin: Add new slot
exports.adminAddSlot = (req, res, next) => {
  try {
    const { slot_number, floor, section, vehicle_type, hourly_rate } = req.body;

    if (!slot_number || !floor || !section) {
      return res.status(400).json({ success: false, message: 'Slot number, floor, and section are required.' });
    }

    const cleanSlotNumber = slot_number.trim().toUpperCase();

    // Check duplicate slot number
    const existing = db.prepare('SELECT id FROM parking_slots WHERE slot_number = ?').get(cleanSlotNumber);
    if (existing) {
      return res.status(409).json({ success: false, message: `Slot ${cleanSlotNumber} already exists.` });
    }

    const rate = parseFloat(hourly_rate) || 30.0;
    const vType = vehicle_type || 'Car';

    const stmt = db.prepare(`
      INSERT INTO parking_slots (slot_number, floor, section, vehicle_type, hourly_rate, status)
      VALUES (?, ?, ?, ?, ?, 'Available')
    `);
    const result = stmt.run(cleanSlotNumber, parseInt(floor, 10), section.trim().toUpperCase(), vType, rate);

    const created = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: `Slot ${cleanSlotNumber} added successfully.`,
      slot: created
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update slot details or status
exports.adminUpdateSlot = (req, res, next) => {
  try {
    const { id } = req.params;
    const { slot_number, floor, section, vehicle_type, hourly_rate, status } = req.body;

    const slot = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    // Prevent modifying status if currently booked/occupied unless releasing
    const hasActiveBooking = db.prepare(`
      SELECT id, booking_id, status FROM bookings
      WHERE slot_id = ? AND status IN ('Confirmed', 'Active')
    `).get(id);

    if (hasActiveBooking && status && status !== slot.status) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status of slot ${slot.slot_number} because it has an active booking (${hasActiveBooking.booking_id}).`
      });
    }

    const cleanSlotNumber = (slot_number || slot.slot_number).trim().toUpperCase();
    const cleanFloor = floor !== undefined ? parseInt(floor, 10) : slot.floor;
    const cleanSection = (section || slot.section).trim().toUpperCase();
    const cleanType = vehicle_type || slot.vehicle_type;
    const cleanRate = hourly_rate !== undefined ? parseFloat(hourly_rate) : slot.hourly_rate;
    const cleanStatus = status || slot.status;

    // Check duplicate slot number if changed
    if (cleanSlotNumber !== slot.slot_number) {
      const existing = db.prepare('SELECT id FROM parking_slots WHERE slot_number = ? AND id != ?').get(cleanSlotNumber, id);
      if (existing) {
        return res.status(409).json({ success: false, message: `Slot ${cleanSlotNumber} already exists.` });
      }
    }

    db.prepare(`
      UPDATE parking_slots
      SET slot_number = ?, floor = ?, section = ?, vehicle_type = ?, hourly_rate = ?, status = ?
      WHERE id = ?
    `).run(cleanSlotNumber, cleanFloor, cleanSection, cleanType, cleanRate, cleanStatus, id);

    const updated = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Slot ${updated.slot_number} updated successfully.`,
      slot: updated
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Toggle maintenance status
exports.adminToggleMaintenance = (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    if (slot.status === 'Reserved' || slot.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Slot ${slot.slot_number} is currently ${slot.status.toLowerCase()} and cannot be put under maintenance.`
      });
    }

    const newStatus = slot.status === 'Maintenance' ? 'Available' : 'Maintenance';
    db.prepare('UPDATE parking_slots SET status = ? WHERE id = ?').run(newStatus, id);

    res.json({
      success: true,
      message: `Slot ${slot.slot_number} marked as ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
};
