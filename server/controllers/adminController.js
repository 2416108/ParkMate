const db = require('../config/db');

exports.getDashboardStats = (req, res, next) => {
  try {
    const slotStats = db.prepare(`
      SELECT 
        COUNT(*) as total_slots,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_slots,
        SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) as reserved_slots,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied_slots,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance_slots
      FROM parking_slots
    `).get();

    const userCount = db.prepare(`SELECT COUNT(*) as total_users FROM users WHERE role = 'CUSTOMER'`).get();
    const vehicleCount = db.prepare(`SELECT COUNT(*) as total_vehicles FROM vehicles`).get();
    const bookingCount = db.prepare(`SELECT COUNT(*) as total_bookings FROM bookings`).get();

    // Today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const revenueStats = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_date LIKE ? THEN amount ELSE 0 END), 0) as today_revenue
      FROM payments
      WHERE status = 'Paid'
    `).get(`${today}%`);

    // Current active / parked vehicles
    const currentParkings = db.prepare(`
      SELECT b.id, b.booking_id, b.booking_date, b.entry_time, b.expected_exit_time, b.status,
             u.name as customer_name, u.phone as customer_phone,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor, s.section
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      WHERE b.status IN ('Confirmed', 'Active')
      ORDER BY b.id DESC
    `).all();

    // Recent 10 bookings
    const recentBookings = db.prepare(`
      SELECT b.id, b.booking_id, b.booking_date, b.entry_time, b.duration, b.estimated_amount, b.status,
             u.name as customer_name,
             v.vehicle_number,
             s.slot_number,
             p.status as payment_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ORDER BY b.id DESC LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        totalSlots: slotStats.total_slots || 0,
        availableSlots: slotStats.available_slots || 0,
        reservedSlots: slotStats.reserved_slots || 0,
        occupiedSlots: slotStats.occupied_slots || 0,
        maintenanceSlots: slotStats.maintenance_slots || 0,
        totalUsers: userCount.total_users || 0,
        totalVehicles: vehicleCount.total_vehicles || 0,
        totalBookings: bookingCount.total_bookings || 0,
        totalRevenue: revenueStats.total_revenue || 0,
        todayRevenue: revenueStats.today_revenue || 0
      },
      currentParkings,
      recentBookings
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all users with stats
exports.getAllUsers = (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
        (SELECT COUNT(*) FROM vehicles v WHERE v.user_id = u.id) as vehicle_count,
        (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) as booking_count
      FROM users u
      ORDER BY u.id DESC
    `).all();

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all vehicles
exports.getAllVehicles = (req, res, next) => {
  try {
    const vehicles = db.prepare(`
      SELECT v.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM vehicles v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.id DESC
    `).all();

    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all bookings
exports.getAllBookings = (req, res, next) => {
  try {
    const { search, status, date } = req.query;

    let query = `
      SELECT b.*,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             v.vehicle_number, v.vehicle_type, v.model as vehicle_model,
             s.slot_number, s.floor,
             p.payment_id, p.status as payment_status, p.payment_method, p.amount as payment_amount
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.booking_id LIKE ? OR v.vehicle_number LIKE ? OR u.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND b.booking_date = ?';
      params.push(date);
    }

    query += ' ORDER BY b.id DESC';

    const bookings = db.prepare(query).all(...params);

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all payments
exports.getAllPayments = (req, res, next) => {
  try {
    const payments = db.prepare(`
      SELECT p.*,
             b.booking_id, b.booking_date,
             u.name as customer_name, u.email as customer_email,
             v.vehicle_number,
             s.slot_number
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      ORDER BY p.id DESC
    `).all();

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all parking history
exports.getAllHistory = (req, res, next) => {
  try {
    const history = db.prepare(`
      SELECT b.id as booking_db_id, b.booking_id, b.booking_date, b.entry_time, b.expected_exit_time,
             b.duration as booked_duration, b.status as booking_status,
             u.name as customer_name,
             v.vehicle_number, v.vehicle_type,
             s.slot_number, s.floor,
             pr.entry_time as actual_entry_time, pr.exit_time, pr.duration as actual_duration,
             COALESCE(pr.final_amount, b.estimated_amount) as amount,
             p.payment_id, p.payment_method
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN parking_slots s ON b.slot_id = s.id
      LEFT JOIN parking_records pr ON pr.booking_id = b.id
      LEFT JOIN payments p ON p.booking_id = b.id
      ORDER BY b.id DESC
    `).all();

    res.json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
};
