// Google Apps Script - Deploy as Web App
// This script handles all CRUD operations for the Carpooling app

// Sheet names
const USERS_SHEET = 'Users';
const VEHICLES_SHEET = 'Vehicles';
const REQUESTS_SHEET = 'Requests';

// Get or create spreadsheet
function getSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Initialize sheets if they don't exist
  initializeSheets(ss);

  return ss;
}

function initializeSheets(ss) {
  // Users sheet
  let usersSheet = ss.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET);
    usersSheet.appendRow(['email', 'name', 'phone', 'role', 'isAdmin', 'createdAt', 'updatedAt']);
  }

  // Vehicles sheet
  let vehiclesSheet = ss.getSheetByName(VEHICLES_SHEET);
  if (!vehiclesSheet) {
    vehiclesSheet = ss.insertSheet(VEHICLES_SHEET);
    vehiclesSheet.appendRow(['id', 'driverEmail', 'vehicleType', 'totalSeats', 'familyMembers', 'status', 'createdAt', 'updatedAt']);
  }

  // Requests sheet
  let requestsSheet = ss.getSheetByName(REQUESTS_SHEET);
  if (!requestsSheet) {
    requestsSheet = ss.insertSheet(REQUESTS_SHEET);
    requestsSheet.appendRow(['id', 'passengerEmail', 'driverEmail', 'seatsRequested', 'status', 'createdAt', 'updatedAt']);
  }
}

// Main entry point for web app
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;

  let result;

  try {
    switch (action) {
      // User operations
      case 'getUser':
        result = getUser(params.email);
        break;
      case 'createUser':
        result = createUser(JSON.parse(params.data));
        break;
      case 'updateUser':
        result = updateUser(params.email, JSON.parse(params.data));
        break;
      case 'deleteUser':
        result = deleteUser(params.email);
        break;
      case 'getAllUsers':
        result = getAllUsers();
        break;

      // Vehicle operations
      case 'getVehicle':
        result = getVehicle(params.email);
        break;
      case 'createVehicle':
        result = createVehicle(JSON.parse(params.data));
        break;
      case 'updateVehicle':
        result = updateVehicle(params.email, JSON.parse(params.data));
        break;
      case 'deleteVehicle':
        result = deleteVehicle(params.email);
        break;
      case 'getAllVehicles':
        result = getAllVehicles();
        break;

      // Request operations
      case 'createRequest':
        result = createRequest(JSON.parse(params.data));
        break;
      case 'updateRequest':
        result = updateRequest(params.id, JSON.parse(params.data));
        break;
      case 'deleteRequest':
        result = deleteRequest(params.id);
        break;
      case 'getRequestsByPassenger':
        result = getRequestsByPassenger(params.email);
        break;
      case 'getRequestsByDriver':
        result = getRequestsByDriver(params.email);
        break;
      case 'getAllRequests':
        result = getAllRequests();
        break;

      // Summary
      case 'getSummary':
        result = getSummary();
        break;

      default:
        result = { error: 'Unknown action' };
    }
  } catch (error) {
    result = { error: error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// USER OPERATIONS

function getUser(email) {
  const sheet = getSpreadsheet().getSheetByName(USERS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      return {
        email: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        role: data[i][3],
        isAdmin: data[i][4] === true || data[i][4] === 'TRUE',
        createdAt: data[i][5],
        updatedAt: data[i][6]
      };
    }
  }

  return null;
}

function createUser(userData) {
  const sheet = getSpreadsheet().getSheetByName(USERS_SHEET);
  const now = new Date().toISOString();

  // Check if user already exists
  if (getUser(userData.email)) {
    return { error: 'User already exists' };
  }

  sheet.appendRow([
    userData.email,
    userData.name || '',
    userData.phone || '',
    userData.role || '',
    userData.isAdmin || false,
    now,
    now
  ]);

  return { success: true, email: userData.email };
}

function updateUser(email, userData) {
  const sheet = getSpreadsheet().getSheetByName(USERS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      const row = i + 1;
      if (userData.name !== undefined) sheet.getRange(row, 2).setValue(userData.name);
      if (userData.phone !== undefined) sheet.getRange(row, 3).setValue(userData.phone);
      if (userData.role !== undefined) sheet.getRange(row, 4).setValue(userData.role);
      if (userData.isAdmin !== undefined) sheet.getRange(row, 5).setValue(userData.isAdmin);
      sheet.getRange(row, 7).setValue(new Date().toISOString());

      return { success: true };
    }
  }

  return { error: 'User not found' };
}

function deleteUser(email) {
  const sheet = getSpreadsheet().getSheetByName(USERS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      sheet.deleteRow(i + 1);

      // Also delete associated vehicle and requests
      deleteVehicle(email);
      deleteRequestsByEmail(email);

      return { success: true };
    }
  }

  return { error: 'User not found' };
}

function getAllUsers() {
  const sheet = getSpreadsheet().getSheetByName(USERS_SHEET);
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    users.push({
      email: data[i][0],
      name: data[i][1],
      phone: data[i][2],
      role: data[i][3],
      isAdmin: data[i][4] === true || data[i][4] === 'TRUE',
      createdAt: data[i][5],
      updatedAt: data[i][6]
    });
  }

  return users;
}

// VEHICLE OPERATIONS

function getVehicle(driverEmail) {
  const sheet = getSpreadsheet().getSheetByName(VEHICLES_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === driverEmail) {
      return {
        id: data[i][0],
        driverEmail: data[i][1],
        vehicleType: data[i][2],
        totalSeats: data[i][3],
        familyMembers: data[i][4],
        status: data[i][5],
        createdAt: data[i][6],
        updatedAt: data[i][7]
      };
    }
  }

  return null;
}

function createVehicle(vehicleData) {
  const sheet = getSpreadsheet().getSheetByName(VEHICLES_SHEET);
  const now = new Date().toISOString();
  const id = Utilities.getUuid();

  // Check if vehicle already exists for this driver
  if (getVehicle(vehicleData.driverEmail)) {
    return updateVehicle(vehicleData.driverEmail, vehicleData);
  }

  sheet.appendRow([
    id,
    vehicleData.driverEmail,
    vehicleData.vehicleType || '',
    vehicleData.totalSeats || 4,
    vehicleData.familyMembers || 0,
    vehicleData.status || 'open',
    now,
    now
  ]);

  return { success: true, id: id };
}

function updateVehicle(driverEmail, vehicleData) {
  const sheet = getSpreadsheet().getSheetByName(VEHICLES_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === driverEmail) {
      const row = i + 1;
      if (vehicleData.vehicleType !== undefined) sheet.getRange(row, 3).setValue(vehicleData.vehicleType);
      if (vehicleData.totalSeats !== undefined) sheet.getRange(row, 4).setValue(vehicleData.totalSeats);
      if (vehicleData.familyMembers !== undefined) sheet.getRange(row, 5).setValue(vehicleData.familyMembers);
      if (vehicleData.status !== undefined) sheet.getRange(row, 6).setValue(vehicleData.status);
      sheet.getRange(row, 8).setValue(new Date().toISOString());

      return { success: true };
    }
  }

  return { error: 'Vehicle not found' };
}

function deleteVehicle(driverEmail) {
  const sheet = getSpreadsheet().getSheetByName(VEHICLES_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === driverEmail) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Vehicle not found' };
}

function getAllVehicles() {
  const sheet = getSpreadsheet().getSheetByName(VEHICLES_SHEET);
  const data = sheet.getDataRange().getValues();
  const vehicles = [];

  for (let i = 1; i < data.length; i++) {
    vehicles.push({
      id: data[i][0],
      driverEmail: data[i][1],
      vehicleType: data[i][2],
      totalSeats: data[i][3],
      familyMembers: data[i][4],
      status: data[i][5],
      createdAt: data[i][6],
      updatedAt: data[i][7]
    });
  }

  return vehicles;
}

// REQUEST OPERATIONS

function createRequest(requestData) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const now = new Date().toISOString();
  const id = Utilities.getUuid();

  // Check if request already exists
  const existing = getRequestByPassengerAndDriver(requestData.passengerEmail, requestData.driverEmail);
  if (existing) {
    return { error: 'Request already exists' };
  }

  sheet.appendRow([
    id,
    requestData.passengerEmail,
    requestData.driverEmail,
    requestData.seatsRequested || 1,
    'pending',
    now,
    now
  ]);

  return { success: true, id: id };
}

function getRequestByPassengerAndDriver(passengerEmail, driverEmail) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === passengerEmail && data[i][2] === driverEmail) {
      return {
        id: data[i][0],
        passengerEmail: data[i][1],
        driverEmail: data[i][2],
        seatsRequested: data[i][3],
        status: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6]
      };
    }
  }

  return null;
}

function updateRequest(id, requestData) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const row = i + 1;
      if (requestData.seatsRequested !== undefined) sheet.getRange(row, 4).setValue(requestData.seatsRequested);
      if (requestData.status !== undefined) sheet.getRange(row, 5).setValue(requestData.status);
      sheet.getRange(row, 7).setValue(new Date().toISOString());

      return { success: true };
    }
  }

  return { error: 'Request not found' };
}

function deleteRequest(id) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Request not found' };
}

function deleteRequestsByEmail(email) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();

  // Delete from bottom to top to avoid index issues
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === email || data[i][2] === email) {
      sheet.deleteRow(i + 1);
    }
  }

  return { success: true };
}

function getRequestsByPassenger(email) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      requests.push({
        id: data[i][0],
        passengerEmail: data[i][1],
        driverEmail: data[i][2],
        seatsRequested: data[i][3],
        status: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6]
      });
    }
  }

  return requests;
}

function getRequestsByDriver(email) {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      requests.push({
        id: data[i][0],
        passengerEmail: data[i][1],
        driverEmail: data[i][2],
        seatsRequested: data[i][3],
        status: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6]
      });
    }
  }

  return requests;
}

function getAllRequests() {
  const sheet = getSpreadsheet().getSheetByName(REQUESTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < data.length; i++) {
    requests.push({
      id: data[i][0],
      passengerEmail: data[i][1],
      driverEmail: data[i][2],
      seatsRequested: data[i][3],
      status: data[i][4],
      createdAt: data[i][5],
      updatedAt: data[i][6]
    });
  }

  return requests;
}

// SUMMARY

function getSummary() {
  const users = getAllUsers();
  const vehicles = getAllVehicles();
  const requests = getAllRequests();

  // Count drivers and passengers
  const drivers = users.filter(u => u.role === 'driver');
  const passengers = users.filter(u => u.role === 'passenger');

  // Count active vehicles
  const activeVehicles = vehicles.filter(v => v.status !== 'not-bringing');

  // Calculate total seats
  let totalSeats = 0;
  activeVehicles.forEach(v => {
    totalSeats += (v.totalSeats - v.familyMembers);
  });

  // Calculate assigned seats
  let assignedSeats = 0;
  requests.filter(r => r.status === 'approved' || r.status === 'confirmed').forEach(r => {
    assignedSeats += r.seatsRequested;
  });

  // Calculate total people
  let totalPeople = drivers.length; // Drivers
  activeVehicles.forEach(v => {
    totalPeople += v.familyMembers; // Family members
  });
  totalPeople += assignedSeats; // Assigned passengers

  // Unassigned passengers
  let unassignedSeats = 0;
  passengers.forEach(p => {
    const userRequests = requests.filter(r => r.passengerEmail === p.email);
    const approvedRequest = userRequests.find(r => r.status === 'approved' || r.status === 'confirmed');
    if (!approvedRequest) {
      // Count seats needed (we'd need to store this, for now assume 1)
      unassignedSeats += 1;
    }
  });

  return {
    totalPeople: totalPeople,
    totalCars: activeVehicles.length,
    totalSeats: totalSeats,
    assignedSeats: assignedSeats,
    availableSeats: totalSeats - assignedSeats,
    unassignedPassengers: unassignedSeats,
    driversCount: drivers.length,
    passengersCount: passengers.length
  };
}
