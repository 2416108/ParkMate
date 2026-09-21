const bcrypt = require('bcryptjs');
const db = require('../config/db');

function seedDatabase() {
  console.log('Seeding ParkMate Parking Management System database...');

  // Clean existing tables in reverse order of foreign keys
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM parking_records;');
  db.exec('DELETE FROM payments;');
  db.exec('DELETE FROM bookings;');
  db.exec('DELETE FROM parking_slots;');
  db.exec('DELETE FROM vehicles;');
  db.exec('DELETE FROM users;');
  db.exec('DELETE FROM sqlite_sequence;');
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Insert Users
  const salt = bcrypt.genSaltSync(10);
  const customerPasswordHash = bcrypt.hashSync('Demo@123', salt);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const customerRes = insertUser.run('Lakshmi Priya', 'demo@parkmate.com', '9876543210', customerPasswordHash, 'CUSTOMER');
  const adminRes = insertUser.run('System Administrator', 'admin@parkmate.com', '9876500000', adminPasswordHash, 'ADMIN');
  const secondCustomerRes = insertUser.run('Rahul Sharma', 'rahul@example.com', '9812345678', customerPasswordHash, 'CUSTOMER');

  const customerId = customerRes.lastInsertRowid;
  const adminId = adminRes.lastInsertRowid;
  const rahulId = secondCustomerRes.lastInsertRowid;

  console.log(`Created users: Demo Customer (ID: ${customerId}), Admin (ID: ${adminId}), Demo User 2 (ID: ${rahulId})`);

  // 2. Insert Vehicles
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, model, color)
    VALUES (?, ?, ?, ?, ?)
  `);

  const v1 = insertVehicle.run(customerId, 'TN01AB1234', 'Car', 'Hyundai i20', 'White');
  const v2 = insertVehicle.run(customerId, 'TN01CD5678', 'Bike', 'Honda Activa', 'Black');
  const v3 = insertVehicle.run(rahulId, 'KA05MN4321', 'SUV', 'Tata Harrier', 'Grey');
  const v4 = insertVehicle.run(rahulId, 'KA05KL9876', 'Car', 'Honda City', 'Silver');

  console.log('Inserted vehicles for demo accounts');

  // 3. Insert Parking Slots (20 slots: Floor 1: A01–A10, Floor 2: B01–B10)
  const insertSlot = db.prepare(`
    INSERT INTO parking_slots (slot_number, floor, section, vehicle_type, hourly_rate, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Floor 1 (Section A)
  // A01 to A10
  insertSlot.run('A01', 1, 'A', 'Car', 40.0, 'Occupied');
  insertSlot.run('A02', 1, 'A', 'Car', 40.0, 'Reserved');
  insertSlot.run('A03', 1, 'A', 'Car', 40.0, 'Available');
  insertSlot.run('A04', 1, 'A', 'Bike', 20.0, 'Available');
  insertSlot.run('A05', 1, 'A', 'Car', 30.0, 'Available'); // Ready for demo step 5
  insertSlot.run('A06', 1, 'A', 'SUV', 50.0, 'Available');
  insertSlot.run('A07', 1, 'A', 'Bike', 20.0, 'Occupied');
  insertSlot.run('A08', 1, 'A', 'Car', 30.0, 'Maintenance');
  insertSlot.run('A09', 1, 'A', 'Car', 30.0, 'Available');
  insertSlot.run('A10', 1, 'A', 'Van', 60.0, 'Available');

  // Floor 2 (Section B)
  // B01 to B10
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

  console.log('Inserted 20 parking slots across 2 floors with mixed statuses');

  // Fetch slot IDs for bookings
  const slots = db.prepare('SELECT id, slot_number FROM parking_slots').all();
  const slotMap = {};
  slots.forEach(s => { slotMap[s.slot_number] = s.id; });

  // 4. Insert Demo Bookings & Payments & Parking Records
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

  // Today's date string YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Booking 1: Rahul occupied in A01
  const b1 = insertBooking.run('PKG-2026-0001', rahulId, v3.lastInsertRowid, slotMap['A01'], today, '09:00 AM', '01:00 PM', 4, 200.0, 'Active', `${today} 09:00:00`);
  insertPayment.run('PAY-2026-0001', b1.lastInsertRowid, 200.0, 'UPI', `${today} 09:05:00`, 'Paid');
  insertRecord.run(b1.lastInsertRowid, `${today} 09:00 AM`, null, null, null, 'Active');

  // Booking 2: Rahul reserved in A02
  const b2 = insertBooking.run('PKG-2026-0002', rahulId, v4.lastInsertRowid, slotMap['A02'], today, '02:00 PM', '05:00 PM', 3, 120.0, 'Confirmed', `${today} 10:15:00`);
  insertPayment.run('PAY-2026-0002', b2.lastInsertRowid, 120.0, 'Credit/Debit Card', `${today} 10:18:00`, 'Paid');

  // Booking 3: Past completed booking for Lakshmi Priya (TN01AB1234 in A05)
  const b3 = insertBooking.run('PKG-2026-0003', customerId, v1.lastInsertRowid, slotMap['A05'], yesterday, '10:00 AM', '01:00 PM', 3, 90.0, 'Completed', `${yesterday} 09:45:00`);
  insertPayment.run('PAY-2026-0003', b3.lastInsertRowid, 90.0, 'UPI', `${yesterday} 09:50:00`, 'Paid');
  insertRecord.run(b3.lastInsertRowid, `${yesterday} 10:00 AM`, `${yesterday} 01:00 PM`, 3.0, 90.0, 'Completed');

  // Booking 4: Past completed booking for Lakshmi Priya (TN01CD5678 in B03)
  const b4 = insertBooking.run('PKG-2026-0004', customerId, v2.lastInsertRowid, slotMap['B03'], yesterday, '03:00 PM', '05:00 PM', 2, 40.0, 'Completed', `${yesterday} 14:30:00`);
  insertPayment.run('PAY-2026-0004', b4.lastInsertRowid, 40.0, 'Cash', `${yesterday} 14:35:00`, 'Paid');
  insertRecord.run(b4.lastInsertRowid, `${yesterday} 03:00 PM`, `${yesterday} 05:00 PM`, 2.0, 40.0, 'Completed');

  console.log('Inserted demo bookings, payments, and parking records.');
  console.log('Database seeding finished successfully!');
}

seedDatabase();
