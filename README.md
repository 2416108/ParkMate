# ParkMate — Professional Parking Management System
**Course Project: Object-Oriented Software Engineering (OOSE)**  
*Developed as a human-built, production-grade academic software engineering project.*

---

## 1. Project Overview

**ParkMate** is a full-stack, modular web application designed to automate and streamline vehicle parking operations. The system eliminates manual ticket logging, optimizes parking slot allocation across multiple floor sections, provides instant digital parking passes and itemized tax receipts, and calculates duration-based billing automatically upon checkout.

The project strictly implements **5 cohesive core functional modules**:
1. **User & Vehicle Management** (Authentication, profile management, multi-vehicle registry with duplicate license plate validation)
2. **Parking Slot Management** (Visual multi-floor slot map, occupancy color-coding, maintenance mode toggles, capacity indicators)
3. **Parking Entry & Booking** (Duration-based slot reservation, pricing engine, unique `PKG-2026-XXXX` pass generation, printable tickets)
4. **Payment & Billing** (Simulated checkout supporting UPI, Credit/Debit Card, and Cash, generating official printable receipts `PAY-2026-XXXX`)
5. **Exit & Parking History** (Automated checkout duration calculator, late fee detection, slot release to Available, searchable audit archive)

---

## 2. Visual Design & Theme

The user interface follows a professional **light green and clean white** design aesthetic:
- **Primary Green**: `#2E7D32` (Actions, primary buttons, active navigation indicators)
- **Light Green**: `#E8F5E9` (Subtle active states, soft highlights, badges)
- **Secondary Green**: `#43A047` (Interactive hover effects)
- **Background**: `#F7FAF7` (Crisp, clean page layout)
- **Cards & Surfaces**: `#FFFFFF` with `#DDE5DD` borders
- **Dark Text**: `#1F2937`
- **Muted Text**: `#6B7280`

### Slot Status Color System
| Status | Visual Indicator | Meaning |
| :--- | :--- | :--- |
| **Available** | Green (`#2E7D32` / `#E8F5E9`) | Slot is vacant and ready for reservation |
| **Reserved** | Amber / Orange (`#D97706` / `#FEF3C7`) | Customer has booked the slot; awaiting arrival |
| **Occupied** | Red (`#DC2626` / `#FEE2E2`) | Vehicle is currently parked in the bay |
| **Maintenance**| Slate Gray (`#64748B` / `#F1F5F9`) | Slot closed for servicing / cleaning |

---

## 3. Technology Stack

- **Frontend**:
  - **React 18** with Vite for lightning-fast HMR and bundle optimization
  - **Tailwind CSS** for responsive styling and customized theme variables
  - **Lucide React** for consistent, meaningful icons
  - **React Router DOM v6** for protected customer and administrator routing
  - **Axios** with request/response interceptors for automatic JWT header injection
- **Backend**:
  - **Node.js** & **Express.js** REST API
  - **JWT (JSON Web Tokens)** for stateless, secure session authorization
  - **bcryptjs** for one-way salted password hashing
  - **Morgan** for HTTP logging
- **Database Engine**:
  - **Primary (Default)**: High-performance relational database using Node's built-in `node:sqlite` engine (`./server/data/parking.db`). Runs immediately out-of-the-box with **zero external database server installation or configuration required**.
  - **MySQL Compatibility**: A standard SQL DDL file (`server/scripts/schema.sql`) is included for academic viva and MySQL Workbench / phpMyAdmin evaluation.

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Frontend                    │
│     (Vite + Tailwind CSS + Lucide Icons + Router)      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (REST APIs)
                           ▼
┌────────────────────────────────────────────────────────┐
│                Express.js Backend Server               │
│  ├── Auth Middleware (JWT & Role Verification)         │
│  ├── Controllers (Auth, Vehicle, Slot, Booking, Exit)  │
│  └── Centralized Error Handling                        │
└──────────────────────────┬─────────────────────────────┘
                           │ SQL Queries (PRAGMA foreign_keys = ON)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Relational Database Storage               │
│    (Users, Vehicles, Slots, Bookings, Payments, etc.)  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema & Tables

The schema uses foreign-key relationships and strict constraints:

1. **`users`**:
   - `id` (INTEGER PRIMARY KEY)
   - `name`, `email` (UNIQUE), `phone`, `password` (bcrypt hash), `role` (`CUSTOMER` | `ADMIN`), `created_at`
2. **`vehicles`**:
   - `id` (INTEGER PRIMARY KEY)
   - `user_id` (FK `users.id` ON DELETE CASCADE)
   - `vehicle_number` (UNIQUE, formatted license plate)
   - `vehicle_type` (`Car` | `Bike` | `SUV` | `Van`)
   - `model`, `color`, `created_at`
3. **`parking_slots`**:
   - `id` (INTEGER PRIMARY KEY)
   - `slot_number` (UNIQUE e.g., `A01`–`A10`, `B01`–`B10`)
   - `floor` (INTEGER), `section` (`A` | `B`)
   - `vehicle_type` (`Car` | `Bike` | `SUV` | `Van` | `All`)
   - `hourly_rate` (REAL), `status` (`Available` | `Reserved` | `Occupied` | `Maintenance`)
4. **`bookings`**:
   - `id` (INTEGER PRIMARY KEY)
   - `booking_id` (UNIQUE e.g., `PKG-2026-0001`)
   - `user_id` (FK `users.id`), `vehicle_id` (FK `vehicles.id`), `slot_id` (FK `parking_slots.id`)
   - `booking_date`, `entry_time`, `expected_exit_time`, `duration`, `estimated_amount`
   - `status` (`Confirmed` | `Active` | `Completed` | `Cancelled`), `created_at`
5. **`payments`**:
   - `id` (INTEGER PRIMARY KEY)
   - `payment_id` (UNIQUE e.g., `PAY-2026-0001`)
   - `booking_id` (FK `bookings.id`)
   - `amount`, `payment_method` (`UPI` | `Credit/Debit Card` | `Cash`), `payment_date`, `status` (`Paid`)
6. **`parking_records`**:
   - `id` (INTEGER PRIMARY KEY)
   - `booking_id` (FK `bookings.id`)
   - `entry_time`, `exit_time`, `duration`, `final_amount`, `status` (`Active` | `Completed`)

---

## 6. Pre-seeded Demo Credentials

The database is pre-populated with realistic demo accounts, vehicles, and floor slots:

### Demo Customer
- **Email**: `demo@parkmate.com`
- **Password**: `Demo@123`
- **Customer Name**: Lakshmi Priya
- **Registered Vehicles**:
  - `TN01AB1234` — Hyundai i20 (Car, White)
  - `TN01CD5678` — Honda Activa (Bike, Black)

### Demo Administrator
- **Email**: `admin@parkmate.com`
- **Password**: `Admin@123`
- **Admin Name**: System Administrator
- **Role**: `ADMIN`

*(Note: The login page includes convenient one-click "Demo Customer" and "Demo Admin" buttons to quickly fill credentials during an academic viva).*

---

## 7. Installation & Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher; works seamlessly on Node 20, 22, and 25)
- npm (v9.0.0 or higher)

### Step 1: Install Dependencies
Open a terminal in the project root directory and run:
```bash
# Install root, backend server, and frontend client dependencies
npm run install:all
```
*(Or manually run `npm install` in the root, `server/`, and `client/` directories).*

### Step 2: Seed the Database
Populate the database with demo users, vehicles, 20 slots across 2 floors, and demo records:
```bash
npm run seed
```
*(You can run `npm run seed` at any time to instantly reset the demo database).*

### Step 3: Run the Application
Start both the backend server (port 5000) and frontend client (port 5173) simultaneously:
```bash
npm run dev
```

The application will be live at:
- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. College Demonstration Workflow

### Customer Walkthrough Flow (12 Steps)
1. Navigate to [http://localhost:5173](http://localhost:5173).
2. Click **"Demo Customer"** to fill `demo@parkmate.com` / `Demo@123` and click **"Sign In"**.
3. **Customer Dashboard** opens, showing summary cards, available slots, and recent bookings.
4. Navigate to **"My Vehicles"** in the sidebar: verify `TN01AB1234` (Hyundai i20) and `TN01CD5678` (Honda Activa). Try adding a new vehicle or testing duplicate vehicle plate rejection.
5. Click **"Find Parking"** in the sidebar.
6. Select vehicle (`TN01AB1234`), date (today), entry time, and duration (e.g. 3 hours).
7. In the interactive floor map, choose available slot **`A05`**. Note the instant calculation: `3 hrs × ₹30/hr = ₹90`.
8. Click **"Review & Book"** and confirm in the summary modal.
9. An official **Parking Ticket** appears with unique Booking ID (e.g. `PKG-2026-0005`), customer name, vehicle plate, floor location, and barcode. Click **"Print / Save PDF"** to test native browser printing.
10. Click **"Proceed to Payment"** (or open **Payments** in sidebar).
11. In the payment checkout, select **UPI** (or Credit Card / Cash) and click **"Pay ₹90 Now"**.
12. An official **Payment Receipt** is generated with unique transaction ID (`PAY-2026-0005`).
13. Return to **Dashboard**: notice the active parking card shows slot `A05` is currently occupied!
14. Click **"Exit Vehicle"** on the dashboard card (or via My Bookings): confirm exit. The slot `A05` is immediately freed back to **Available**.
15. Navigate to **"Parking History"**: the completed parking session is archived with duration and final amount.

### Admin Walkthrough Flow
1. Log out or sign in as **"Demo Admin"** (`admin@parkmate.com` / `Admin@123`).
2. **Admin Overview Dashboard** opens with:
   - Total capacity, Available, Reserved, and Occupied slots
   - Multi-segment occupancy distribution progress meter
   - Today's revenue calculation
   - Real-time active parking sessions list
3. Navigate to **"Parking Slots"**:
   - Filter slots by Floor 1 vs Floor 2, or toggle between Table and Visual Grid view
   - Click **"Maintenance"** on an available slot to disable customer booking
   - Add a new parking slot using the **"+ Add Slot"** modal
4. Navigate to **"Users"**: view registered customers, contact numbers, and linked vehicle counts.
5. Navigate to **"Vehicles"**: audit all customer vehicles across the system.
6. Navigate to **"Bookings"** and **"Payments"**: review system-wide financial transactions with receipts.

---

## 9. REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register customer account | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| `PUT` | `/api/auth/profile` | Update profile name and phone | Authenticated |
| `GET` | `/api/vehicles` | List current user's vehicles | Customer |
| `POST` | `/api/vehicles` | Register new vehicle | Customer |
| `PUT` | `/api/vehicles/:id` | Update vehicle details | Customer |
| `DELETE` | `/api/vehicles/:id` | Delete vehicle (if no active bookings) | Customer |
| `GET` | `/api/parking-slots` | List parking slots with filters | Authenticated |
| `GET` | `/api/parking-slots/:id`| Get slot details and occupancy | Authenticated |
| `POST` | `/api/parking-slots` | Add new parking slot | Admin |
| `PUT` | `/api/parking-slots/:id`| Update slot details and rate | Admin |
| `PATCH` | `/api/parking-slots/:id/maintenance`| Toggle maintenance mode | Admin |
| `POST` | `/api/bookings` | Reserve a parking slot | Customer |
| `GET` | `/api/bookings` | List user bookings | Customer |
| `GET` | `/api/bookings/:id` | Get single booking pass / ticket | Authenticated |
| `PUT` | `/api/bookings/:id/cancel`| Cancel booking and release slot | Customer / Admin |
| `POST` | `/api/payments` | Process simulated payment | Customer |
| `GET` | `/api/payments` | List user payment receipts | Customer |
| `GET` | `/api/payments/:id` | Get specific payment receipt | Authenticated |
| `GET` | `/api/parking/active` | Get current active parked vehicle | Customer |
| `POST` | `/api/parking/exit` | Record vehicle exit and release slot | Customer / Admin |
| `GET` | `/api/parking/history`| View completed parking history | Customer |
| `GET` | `/api/admin/dashboard`| Aggregate occupancy and revenue stats| Admin |
| `GET` | `/api/admin/users` | List all users with vehicle counts | Admin |
| `GET` | `/api/admin/vehicles` | List all system vehicles | Admin |
| `GET` | `/api/admin/bookings` | Audit all system reservations | Admin |
| `GET` | `/api/admin/payments` | Audit all system payments | Admin |
| `GET` | `/api/admin/history` | Audit all system parking records | Admin |

---

## 10. Folder Structure

```
OOSE/
├── package.json               # Root scripts to orchestrate client & server
├── README.md                  # Comprehensive project documentation
├── server/
│   ├── package.json
│   ├── .env                   # Environment variables
│   ├── .env.example
│   ├── server.js              # Express application entry point
│   ├── config/
│   │   └── db.js              # Relational database setup (node:sqlite)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & role authorization
│   │   └── errorHandler.js    # Clean error handler
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── slotController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── parkingController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── slotRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── parkingRoutes.js
│   │   └── adminRoutes.js
│   └── scripts/
│       ├── seed.js            # Database reset & seed script
│       ├── schema.sql         # Standard SQL DDL for evaluation / MySQL
│       └── test_api.js        # Automated end-to-end API test suite
└── client/
    ├── package.json
    ├── vite.config.js         # Vite configuration with API reverse proxy
    ├── tailwind.config.js     # Light green & white theme definitions
    ├── index.html             # Application entry point
    └── src/
        ├── App.jsx            # React Router and protected routes
        ├── main.jsx           # React DOM root
        ├── index.css          # Global styling & @media print rules
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ToastContext.jsx
        ├── services/
        │   └── api.js         # Configured Axios instance with interceptors
        ├── components/
        │   ├── layout/        # Sidebar, Header, AppLayout
        │   ├── common/        # Button, Input, Select, Card, Badge, Modal, StatCard, ConfirmDialog
        │   ├── parking/       # SlotGrid, SlotCard, SlotLegend
        │   └── documents/     # ParkingTicket, PaymentReceipt (printable)
        └── pages/
            ├── auth/          # Login, Register
            ├── customer/      # Dashboard, MyVehicles, FindParking, MyBookings, Payments, ParkingHistory, Profile
            └── admin/         # AdminDashboard, AdminSlots, AdminUsers, AdminVehicles, AdminBookings, AdminPayments, AdminHistory
```

---

## 11. Future Enhancements
- Integration of License Plate Recognition (ANPR / OCR) camera hardware.
- Real-time automated slot vacancy sensors using ultrasonic IoT transceivers.
- Dynamic peak-hour surge pricing algorithm.
- EV charging bay tracking with kilowatt-hour energy billing.

---

## 12. Academic Declaration
This project is developed for the **Object-Oriented Software Engineering (OOSE)** laboratory and theory curriculum. It emphasizes software design principles (separation of concerns, component reusability, single responsibility, and database normalization).
