# 🚗 Office Trip Carpooling - User Guide

A simple, intuitive carpooling application to help coordinate office trips efficiently.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [For Drivers](#for-drivers)
- [For Passengers](#for-passengers)
- [For Admins](#for-admins)
- [Common Scenarios](#common-scenarios)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### First Time Login

1. **Open the Application**
   - Navigate to the carpooling application URL in your browser

2. **Enter Your Email**
   - Use your company email address (e.g., `your.name@company.com`)
   - Click "Get Started"

3. **Select Your Role**
   - Choose how you'll be traveling for this trip:
     - **🚙 I'm Driving** - You'll bring your vehicle and can offer seats
     - **🙋 I Need a Ride** - You're looking for available seats

---

## 👥 User Roles

### Driver
- Register your vehicle details
- Set how many seats are available
- Receive and manage seat requests from passengers
- Approve or decline requests
- View and manage your passengers

### Passenger
- Browse available vehicles
- Request seats from drivers
- Track your request status (pending/approved/rejected)
- Contact drivers directly

### Admin ⚙️
- View overall trip statistics
- Manage all users and their roles
- See all vehicle registrations
- View seat assignments
- Export data (CSV/PDF)
- **Note:** Admin access can be granted in addition to being a driver or passenger

---

## 🚙 For Drivers

### Setting Up Your Vehicle

1. **After selecting "I'm Driving"**, you'll need to provide:
   - Your name
   - Phone number (optional but recommended)
   - Vehicle type (Sedan, SUV, Hatchback, Van, Other)
   - Total passenger seats (excluding driver seat)
   - Number of family members coming with you
   - Availability status

2. **Understanding Seat Calculations:**
   ```
   Available Seats = Total Seats - Family Members - Assigned Passengers
   ```
   - Example: 7-seater SUV with 2 family members = 5 available seats for others

3. **Click "Save & Continue to Dashboard"**

### Managing Requests

#### From Dashboard - "My Requests" Tab:
- See all incoming seat requests from passengers
- View passenger details (name, email, phone)
- **Approve** ✅ requests to confirm passengers
- **Decline** ❌ requests if you can't accommodate them

#### From Dashboard - "My Passengers" Tab:
- See all confirmed passengers
- View total seats booked
- **Contact** passengers via phone/email
- **Remove** passengers if needed (please contact them first!)

### Managing Your Profile

1. Click the **👤 Profile** icon in the header
2. Update your vehicle details, seats, or availability
3. **Important Restrictions with Pending Requests or Assigned Passengers:**
   - ❌ Cannot **decrease total seats** if you have pending requests or assigned passengers
   - ❌ Cannot **increase family members** if you have pending requests or assigned passengers
   - ✅ Can **increase total seats** anytime
   - ✅ Can **decrease family members** anytime

   **You must first:**
   - Reject all **pending requests** (from "My Requests" tab)
   - Remove all **approved passengers** (from "My Passengers" tab)
   - Then you can make changes

   **Example:** 7-seat car with 2 family members, 3 approved passengers, and 2 pending requests:
   - ❌ Cannot reduce to 6 total seats (must reject pending requests first)
   - ❌ Cannot increase family to 3 members (must reject pending requests first)
   - ✅ Can increase to 8 total seats
   - ✅ Can decrease family to 1 member

### Changing Your Role

- Click the **🔀 Switch Role** icon
- ⚠️ **You CANNOT change from driver role if you have:**
  - Approved passengers in your vehicle
  - Pending seat requests
- **What happens:** Your vehicle will be hidden from the list (status: "not-bringing")

---

## 🙋 For Passengers

### Setting Up Your Profile

1. **After selecting "I Need a Ride"**, provide:
   - Your name
   - Phone number (optional but recommended)
   - Total seats needed (including yourself and family)

2. **Click "Save & Browse Vehicles"**

### Requesting Seats

#### From Dashboard - "All Vehicles" Tab:

1. **Browse Available Vehicles:**
   - See driver names, vehicle types
   - Check available seats
   - View vehicle status (Open/Full)

2. **Request Seats:**
   - Click **🎫 Request** on any vehicle
   - Select number of seats needed
   - Click "Send Request"
   - The system tracks your remaining seat needs

3. **Request Status:**
   - **⏳ Pending** - Driver hasn't responded yet
   - **✓ Approved** - You're confirmed for the ride!
   - **Rejected** - Driver declined (you can request from others)

#### From Dashboard - "My Requests" Tab:

- See all your outgoing requests
- Track status of each request
- **Cancel** pending requests
- **Contact Driver** for approved rides
- **Leave Ride** if plans change (contact driver first!)

### Important Notes for Passengers

- You can request from multiple drivers until all your seats are booked
- Once all seats are booked, you'll see "✓ All Booked" on vehicle cards
- ⚠️ **You cannot change "seats needed" if you have active requests**
- Always contact the driver before canceling an approved ride

### Changing Your Role

- Click the **🔀 Switch Role** icon
- ⚠️ **You CANNOT change from passenger role if you have:**
  - Approved/confirmed rides
  - Pending seat requests
- Cancel all rides first, then switch roles

---

## ⚙️ For Admins

### Accessing Admin Panel

**Two Ways to Access:**
1. **From Dashboard:** Click the **⚙️** (gear) icon in the header
   - Only visible if you have admin privileges
   - Available from driver or passenger dashboard
2. **From Role Selection:** Select "Admin Panel" (if visible)

### Admin Dashboard Features

#### Summary Tab
- **Total People** - All registered users
- **Vehicles** - Total cars registered
- **Total Seats** - Combined capacity across all vehicles
- **Unassigned** - Passengers without confirmed rides

**Export Options:**
- **📊 Export CSV** - Download user and vehicle data
- **📄 Print PDF** - Generate printable report

#### Users Tab
- View all registered users
- See user roles (driver/passenger/none)
- **✏️ Edit** any user:
  - Update name and role
  - Grant/revoke admin access
  - Delete users (also deletes their vehicle and requests)

#### Vehicles Tab
- View all registered vehicles
- See vehicle types, total seats, family members
- Check vehicle status

#### Assignments Tab
- View all confirmed seat assignments
- See which passengers are riding with which drivers
- Remove assignments if needed

### Admin Best Practices

- Regularly check "Unassigned" count to help coordinate rides
- Export reports before the trip for reference
- Use the Users tab to grant admin access to other coordinators
- Monitor assignments to ensure everyone has a ride

---

## 🎯 Common Scenarios

### Scenario 1: Driver with Changing Plans

**Problem:** You approved passengers but can't drive anymore

**Solution:**
1. Go to "My Passengers" tab
2. Click **📞 Contact** for each passenger to inform them
3. Click **Remove** for each passenger
4. Wait for pending requests to be canceled/rejected
5. Now you can switch to passenger role

---

### Scenario 2: Passenger Needs More Seats

**Problem:** Initially requested 1 seat, now need 3

**Solution:**
1. Go to "My Requests" tab
2. **Cancel/Leave** all active requests (contact drivers first!)
3. Click **👤 Profile** icon
4. Update "Total Seats Needed" to 3
5. Request again from available vehicles

---

### Scenario 3: Multiple Request Tracking

**Problem:** Need 3 seats, want to request from multiple drivers

**Solution:**
- Request 2 seats from Driver A
- Request 1 seat from Driver B
- Once both approve, you're fully booked!
- System automatically prevents over-booking

---

### Scenario 4: Driver Needs to Change Vehicle Capacity

**Problem:** Driver has 3 approved passengers and 2 pending requests, needs to change vehicle configuration

**What's Allowed:**
- ✅ **Can increase** total seats anytime (even with pending requests)
- ✅ **Can decrease** family members anytime (even with pending requests)

**What's NOT Allowed:**
- ❌ **Cannot decrease** total seats if you have pending requests or assigned passengers
- ❌ **Cannot increase** family members if you have pending requests or assigned passengers

**Example:** Driver has 7 seats, 2 family members, 3 approved passengers, 2 pending requests

**To add 1 more family member:**
1. First reject the 2 pending requests (from "My Requests" tab)
2. Contact and remove at least 1 approved passenger (from "My Passengers" tab)
3. Then increase family members from 2 to 3
4. Removed passenger can request again if space becomes available

**To reduce total seats from 7 to 6:**
1. First reject all 2 pending requests
2. This would still displace passengers (6 < 2 family + 3 passengers)
3. Contact and remove at least 1 approved passenger
4. Then reduce total seats to 6

---

## 💡 Tips & Best Practices

### For Everyone

✅ **Always provide phone numbers** - Makes coordination much easier

✅ **Contact before canceling** - Be courteous and inform others

✅ **Update status promptly** - Keep information current

✅ **Check dashboard regularly** - Stay updated on requests/approvals

### For Drivers

✅ **Respond to requests quickly** - Passengers are waiting

✅ **Set accurate seat counts** - Prevents confusion

✅ **Update status if full** - Happens automatically but verify

✅ **Confirm with passengers** - Call/email to verify before trip

### For Passengers

✅ **Request early** - Don't wait until last minute

✅ **Be flexible** - May need to split seats across vehicles

✅ **Confirm attendance** - Let driver know if plans change

✅ **Be ready on time** - Respect driver's schedule

### For Admins

✅ **Monitor unassigned daily** - Help people find rides

✅ **Export data before trip** - Have backup records

✅ **Grant admin to helpers** - Distribute coordination work

✅ **Check assignments** - Ensure balanced seat distribution

---

## 🔧 Troubleshooting

### "Cannot change role" Error

**Cause:** You have active requests or passengers

**Fix:** Clear all active requests/passengers first

### "Cannot change seats needed" Error

**Cause:** You have pending/approved requests

**Fix:** Cancel all active requests, then update

### "Cannot add family members" Error

**Cause:** Would displace already approved passengers

**Fix:** Remove passengers first (contact them!), then increase family members

### "Cannot reduce total seats" Error

**Cause:** Would displace already approved passengers and family members

**Fix:** Remove passengers first (contact them!), then reduce total seats

### Vehicle Not Showing in List

**Possible Causes:**
- Status set to "Full"
- Status set to "not-bringing" (changed from driver role)
- No available seats left

**Fix:** Click profile icon, check vehicle settings

### Request Button Disabled

**Possible Causes:**
- All your seats are already booked
- Vehicle is full
- You already have a pending/approved request with this driver

**Check:** "My Requests" tab for existing requests

### Admin Button Not Visible

**Cause:** You don't have admin privileges

**Fix:** Ask an existing admin to grant you admin access through the Users tab

---

## 📱 User Interface Guide

### Dashboard Header Icons

| Icon | Function | Description |
|------|----------|-------------|
| ⚙️ | Admin Panel | Access admin features (admins only) |
| 🔄 | Refresh | Reload current data |
| 👤 | My Profile | Edit your vehicle/passenger details |
| 🔀 | Switch Role | Change between driver/passenger |
| 🚪 | Logout | Sign out of application |

### Request Status Badges

| Status | Meaning | Action Available |
|--------|---------|------------------|
| ⏳ Pending | Awaiting driver response | Can cancel |
| ✓ Approved | Confirmed ride | Can leave ride, contact driver |
| Rejected | Driver declined | Can remove, request elsewhere |

### Vehicle Status Badges

| Status | Meaning |
|--------|---------|
| ✅ Open | Accepting passengers |
| 🚫 Full | No seats available |

---

## 🎓 Quick Start Checklist

### First Time Driver Setup
- [ ] Enter email and login
- [ ] Select "I'm Driving"
- [ ] Fill in name and phone
- [ ] Select vehicle type
- [ ] Set total seats and family members
- [ ] Save and go to dashboard
- [ ] Review incoming requests
- [ ] Approve/decline as needed

### First Time Passenger Setup
- [ ] Enter email and login
- [ ] Select "I Need a Ride"
- [ ] Fill in name and phone
- [ ] Set total seats needed
- [ ] Save and browse vehicles
- [ ] Request seats from drivers
- [ ] Monitor request status
- [ ] Contact driver when approved

### First Time Admin Access
- [ ] Login to application
- [ ] Select your role (driver/passenger)
- [ ] Ask existing admin to grant admin privileges
- [ ] Click ⚙️ icon in dashboard header
- [ ] Explore summary, users, vehicles, assignments
- [ ] Export data if needed

---

## 📞 Support & Contact

For technical issues or questions about the application, contact your IT administrator or the person who set up this carpooling system.

---

## 🔐 Privacy & Data

- Email addresses are used for identification only
- Phone numbers are optional but recommended for coordination
- Only users in the system can see contact information
- Admins can view all data for coordination purposes
- No data is shared outside the application

---

## 🔄 Workflow Diagram

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Select Role     │
│  • Driver        │
│  • Passenger     │
│  • Admin (if granted) │
└──────┬──────┘
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Driver    │          │  Passenger  │          │    Admin    │
│   Setup     │          │    Setup    │          │    Panel    │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                         │                         │
       ▼                         ▼                         │
┌─────────────┐          ┌─────────────┐                  │
│  Dashboard  │◄────────►│  Dashboard  │                  │
│             │          │             │                  │
│ • Requests  │          │ • Browse    │                  │
│ • Passengers│          │ • Request   │                  │
│ • Profile   │          │ • Profile   │                  │
│ • Admin ⚙️  │◄─────────┴─────────────┴──────────────────┘
└─────────────┘
```

---

**Happy Carpooling! 🚗✨**

*Last Updated: December 2025*
