-- ==========================================================
-- ParkMate Parking Management System - Database Schema (MySQL Compatible)
-- Course: Object-Oriented Software Engineering (OOSE)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS parking_management_db;
USE parking_management_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER', 'ADMIN') DEFAULT 'CUSTOMER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_number VARCHAR(30) UNIQUE NOT NULL,
  vehicle_type ENUM('Car', 'Bike', 'SUV', 'Van') NOT NULL,
  model VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Parking Slots Table
CREATE TABLE IF NOT EXISTS parking_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_number VARCHAR(10) UNIQUE NOT NULL,
  floor INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  vehicle_type VARCHAR(20) DEFAULT 'All',
  hourly_rate DECIMAL(10,2) DEFAULT 30.00,
  status ENUM('Available', 'Reserved', 'Occupied', 'Maintenance') DEFAULT 'Available'
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  slot_id INT NOT NULL,
  booking_date DATE NOT NULL,
  entry_time VARCHAR(20) NOT NULL,
  expected_exit_time VARCHAR(20) NOT NULL,
  duration INT NOT NULL,
  estimated_amount DECIMAL(10,2) NOT NULL,
  status ENUM('Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('UPI', 'Credit/Debit Card', 'Cash') NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Paid', 'Pending', 'Failed') DEFAULT 'Paid',
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Parking Records (Entry/Exit Tracking) Table
CREATE TABLE IF NOT EXISTS parking_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  entry_time VARCHAR(30) NOT NULL,
  exit_time VARCHAR(30),
  duration DECIMAL(5,2),
  final_amount DECIMAL(10,2),
  status ENUM('Active', 'Completed') DEFAULT 'Active',
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
