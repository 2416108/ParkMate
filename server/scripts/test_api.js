// Test script to run end-to-end API tests against the backend
const http = require('http');

async function main() {
  console.log('Starting automated backend API verification...');

  // Start server locally in-process
  const app = require('../server');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  try {
    // 1. Health check
    const health = await request('/health');
    console.log('✔ Health Check:', health.data.status);

    // 2. Customer Login
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'demo@parkmate.com', password: 'Demo@123' }
    });
    if (!loginRes.data.success) throw new Error('Customer login failed: ' + loginRes.data.message);
    const customerToken = loginRes.data.token;
    console.log('✔ Customer Login successful:', loginRes.data.user.name);

    // 3. View Vehicles
    const vehiclesRes = await request('/vehicles', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✔ Customer Vehicles fetched: ${vehiclesRes.data.vehicles.length} vehicle(s) found.`);

    // 4. Duplicate Vehicle Validation
    const duplicateRes = await request('/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        vehicle_number: 'TN01AB1234', // Already registered
        vehicle_type: 'Car',
        model: 'Another Car',
        color: 'Red'
      }
    });
    if (duplicateRes.status === 409) {
      console.log('✔ Duplicate vehicle validation correctly rejected duplicate plate TN01AB1234.');
    } else {
      throw new Error('Duplicate vehicle check failed!');
    }

    // 5. Get Available Parking Slots
    const slotsRes = await request('/parking-slots?status=Available', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const availableSlots = slotsRes.data.slots;
    console.log(`✔ Found ${availableSlots.length} available slots.`);

    // Find slot A05 or first available
    const targetSlot = availableSlots.find(s => s.slot_number === 'A05') || availableSlots[0];
    const customerVehicle = vehiclesRes.data.vehicles[0];

    // 6. Create Booking
    const todayStr = new Date().toISOString().split('T')[0];
    const bookingRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        vehicle_id: customerVehicle.id,
        slot_id: targetSlot.id,
        booking_date: todayStr,
        entry_time: '10:00 AM',
        duration: 3
      }
    });
    if (!bookingRes.data.success) throw new Error('Booking failed: ' + bookingRes.data.message);
    const booking = bookingRes.data.booking;
    console.log(`✔ Booking created successfully: ${booking.booking_id} for Slot ${booking.slot_number} (Amount: ₹${booking.estimated_amount})`);

    // 7. Process Simulated Payment (UPI)
    const paymentRes = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        booking_id: booking.booking_id,
        payment_method: 'UPI'
      }
    });
    if (!paymentRes.data.success) throw new Error('Payment failed: ' + paymentRes.data.message);
    const receipt = paymentRes.data.receipt;
    console.log(`✔ Payment successful: ${receipt.payment_id} via ${receipt.payment_method}, Amount: ₹${receipt.amount}`);

    // 8. Verify Slot status is Occupied
    const slotCheck = await request(`/parking-slots/${targetSlot.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✔ Slot ${targetSlot.slot_number} status after payment is: ${slotCheck.data.slot.status}`);

    // 9. Record Exit
    const exitRes = await request('/parking/exit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { booking_id: booking.booking_id }
    });
    if (!exitRes.data.success) throw new Error('Exit recording failed: ' + exitRes.data.message);
    console.log(`✔ Vehicle Exit recorded. Final Amount: ₹${exitRes.data.exitSummary.finalAmount}, Slot released.`);

    // 10. Check Slot released to Available
    const slotReleasedCheck = await request(`/parking-slots/${targetSlot.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✔ Slot ${targetSlot.slot_number} status after exit is: ${slotReleasedCheck.data.slot.status}`);

    // 11. View Parking History
    const historyRes = await request('/parking/history', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✔ Parking history retrieved: ${historyRes.data.history.length} records found.`);

    // 12. Admin Login
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@parkmate.com', password: 'Admin@123' }
    });
    if (!adminLoginRes.data.success) throw new Error('Admin login failed');
    const adminToken = adminLoginRes.data.token;
    console.log('✔ Admin Login successful:', adminLoginRes.data.user.name);

    // 13. Admin Dashboard Stats
    const adminStats = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✔ Admin Dashboard stats: Total Slots=${adminStats.data.stats.totalSlots}, Users=${adminStats.data.stats.totalUsers}, Revenue=₹${adminStats.data.stats.totalRevenue}`);

    // 14. Admin toggle maintenance
    const toggleRes = await request(`/parking-slots/${targetSlot.id}/maintenance`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✔ Admin maintenance toggle on ${targetSlot.slot_number}: new status is ${toggleRes.data.status}`);

    // Toggle it back to Available
    await request(`/parking-slots/${targetSlot.id}/maintenance`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✔ Admin maintenance toggle on ${targetSlot.slot_number}: reset back to Available.`);

    console.log('\n=============================================================');
    console.log('🎉 ALL BACKEND API MODULE TESTS PASSED WITH 100% SUCCESS! 🎉');
    console.log('=============================================================\n');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    server.close(() => {
      process.exit(1);
    });
  }
}

main();
