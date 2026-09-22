const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/parking.db';
const resolvedDbPath = path.resolve(__dirname, '..', dbPath);

// Ensure the data directory exists
const dataDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(resolvedDbPath);

// Enable foreign keys and WAL mode for better concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables if they do not exist
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_number TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parking_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_number TEXT UNIQUE NOT NULL,
      floor INTEGER NOT NULL,
      section TEXT NOT NULL,
      vehicle_type TEXT NOT NULL DEFAULT 'All',
      hourly_rate REAL NOT NULL DEFAULT 30.0,
      status TEXT NOT NULL DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      expected_exit_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      estimated_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE NOT NULL,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'Paid',
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS parking_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      entry_time TEXT NOT NULL,
      exit_time TEXT,
      duration REAL,
      final_amount REAL,
      status TEXT NOT NULL DEFAULT 'Active',
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );
  `);
}

initSchema();

// Auto-seed default accounts and parking slots if the database is fresh/empty
function autoSeedIfEmpty() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
      const bcrypt = require('bcryptjs');
      console.log('📦 Fresh database detected. Automatically seeding demo accounts and parking slots...');

      const salt = bcrypt.genSaltSync(10);
      const customerPasswordHash = bcrypt.hashSync('Demo@123', salt);
      const adminPasswordHash = bcrypt.hashSync('Admin@123', salt);

      const insertUser = db.prepare(`
        INSERT INTO users (name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?)
      `);

      const customerRes = insertUser.run('Lakshmi Priya', 'demo@parkmate.com', '9876543210', customerPasswordHash, 'CUSTOMER');
      const adminRes = insertUser.run('System Administrator', 'admin@parkmate.com', '9876500000', adminPasswordHash, 'ADMIN');
      const rahulRes = insertUser.run('Rahul Sharma', 'rahul@example.com', '9812345678', customerPasswordHash, 'CUSTOMER');

      const customerId = customerRes.lastInsertRowid;
      const rahulId = rahulRes.lastInsertRowid;

      // Vehicles
      const insertVehicle = db.prepare(`
        INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, model, color)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertVehicle.run(customerId, 'TN01AB1234', 'Car', 'Hyundai i20', 'White');
      insertVehicle.run(customerId, 'TN01CD5678', 'Bike', 'Honda Activa', 'Black');
      insertVehicle.run(rahulId, 'KA05MN4321', 'SUV', 'Tata Harrier', 'Grey');

      // 20 Parking Slots
      const insertSlot = db.prepare(`
        INSERT INTO parking_slots (slot_number, floor, section, vehicle_type, hourly_rate, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Floor 1 (A01 - A10)
      insertSlot.run('A01', 1, 'A', 'Car', 40.0, 'Occupied');
      insertSlot.run('A02', 1, 'A', 'Car', 40.0, 'Reserved');
      insertSlot.run('A03', 1, 'A', 'Car', 40.0, 'Available');
      insertSlot.run('A04', 1, 'A', 'Bike', 20.0, 'Available');
      insertSlot.run('A05', 1, 'A', 'Car', 30.0, 'Available');
      insertSlot.run('A06', 1, 'A', 'SUV', 50.0, 'Available');
      insertSlot.run('A07', 1, 'A', 'Bike', 20.0, 'Occupied');
      insertSlot.run('A08', 1, 'A', 'Car', 30.0, 'Maintenance');
      insertSlot.run('A09', 1, 'A', 'Car', 30.0, 'Available');
      insertSlot.run('A10', 1, 'A', 'Van', 60.0, 'Available');

      // Floor 2 (B01 - B10)
      insertSlot.run('B01', 2, 'B', 'Car', 30.0, 'Available');
      insertSlot.run('B02', 2, 'B', 'Car', 30.0, 'Available');
      insertSlot.run('B03', 2, 'B', 'Bike', 20.0, 'Available');
      insertSlot.run('B04', 2, 'B', 'SUV', 50.0, 'Occupied');
      insertSlot.run('B05', 2, 'B', 'Car', 30.0, 'Reserved');
      insertSlot.run('B06', 2, 'B', 'Car', 30.0, 'Available');
      insertSlot.run('B07', 2, 'B', 'Bike', 20.0, 'Maintenance');
      insertSlot.run('B08', 2, 'B', 'Car', 30.0, 'Available');
      insertSlot.run('B09', 2, 'B', 'SUV', 50.0, 'Available');
      insertSlot.run('B10', 2, 'B', 'Van', 60.0, 'Available');

      // Sample bookings matching seed.js (Rahul has active bookings; Lakshmi Priya has completed history so demo vehicles are ready to book)
      const insertBooking = db.prepare(`
        INSERT INTO bookings (booking_id, user_id, vehicle_id, slot_id, booking_date, entry_time, expected_exit_time, duration, estimated_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertPayment = db.prepare(`
        INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertRecord = db.prepare(`
        INSERT INTO parking_records (booking_id, entry_time, exit_time, duration, final_amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Booking 1: Rahul occupied in A01
      const b1 = insertBooking.run('PKG-2026-0001', rahulId, 3, slotMap['A01'], today, '09:00 AM', '01:00 PM', 4, 200.0, 'Active', `${today} 09:00:00`);
      insertPayment.run('PAY-2026-0001', b1.lastInsertRowid, 200.0, 'UPI', `${today} 09:05:00`, 'Paid');
      insertRecord.run(b1.lastInsertRowid, `${today} 09:00 AM`, null, null, null, 'Active');

      // Booking 2: Rahul reserved in A02
      const b2 = insertBooking.run('PKG-2026-0002', rahulId, 4, slotMap['A02'], today, '02:00 PM', '05:00 PM', 3, 120.0, 'Confirmed', `${today} 10:15:00`);
      insertPayment.run('PAY-2026-0002', b2.lastInsertRowid, 120.0, 'Credit/Debit Card', `${today} 10:18:00`, 'Paid');

      // Booking 3: Past completed booking for Lakshmi Priya (TN01AB1234 in A05)
      const b3 = insertBooking.run('PKG-2026-0003', customerId, 1, slotMap['A05'], yesterday, '10:00 AM', '01:00 PM', 3, 90.0, 'Completed', `${yesterday} 09:45:00`);
      insertPayment.run('PAY-2026-0003', b3.lastInsertRowid, 90.0, 'UPI', `${yesterday} 09:50:00`, 'Paid');
      insertRecord.run(b3.lastInsertRowid, `${yesterday} 10:00 AM`, `${yesterday} 01:00 PM`, 3.0, 90.0, 'Completed');

      // Booking 4: Past completed booking for Lakshmi Priya (TN01CD5678 in B03)
      const b4 = insertBooking.run('PKG-2026-0004', customerId, 2, slotMap['B03'], yesterday, '03:00 PM', '05:00 PM', 2, 40.0, 'Completed', `${yesterday} 14:30:00`);
      insertPayment.run('PAY-2026-0004', b4.lastInsertRowid, 40.0, 'Cash', `${yesterday} 14:35:00`, 'Paid');
      insertRecord.run(b4.lastInsertRowid, `${yesterday} 03:00 PM`, `${yesterday} 05:00 PM`, 2.0, 40.0, 'Completed');

      console.log('✅ Auto-seed complete: Demo Customer (demo@parkmate.com / Demo@123), Admin (admin@parkmate.com / Admin@123), and 20 slots ready.');
    }
  } catch (err) {
    console.error('Auto-seed check notice:', err.message);
  }
}

autoSeedIfEmpty();

module.exports = db;

