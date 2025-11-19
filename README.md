# Office Trip Carpooling App

A mobile-first web application for coordinating rides for office trips using Google Sheets as a database.

## Setup Instructions

### 1. Create Google Sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Name it "Carpooling Database" (or any name you prefer)

### 2. Set up Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `google-apps-script/Code.gs` and paste it into the editor
4. Click **Save** (Ctrl+S or Cmd+S)

### 3. Deploy as Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - Description: "Carpooling API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Authorize the app when prompted
6. Copy the **Web app URL** provided

### 4. Configure the App

1. Open `js/config.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your deployed URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
   ```

### 5. Run the App

Open `index.html` in a web browser. For best results, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Features

### Authentication
- Simple email-based login (no password/OTP)
- Email stored in local storage for auto-login

### Roles
1. **Driver** - Bringing their own vehicle
2. **Passenger** - Needs a lift
3. **Admin** - Manage everything (manually set `isAdmin: true` in the Users sheet)

### Driver Features
- Add/edit vehicle details (type, seats, family members)
- Change status (Open/Full/Not bringing)
- View and manage seat requests

### Passenger Features
- Request seats from drivers
- View request status (Pending/Approved/Rejected)
- Cancel pending requests

### Admin Features
- View all users, vehicles, and assignments
- Edit user roles and details
- View trip summary
- Export data to CSV/PDF

## Making a User Admin

1. Open your Google Sheet
2. Go to the "Users" sheet
3. Find the user's row
4. Set the `isAdmin` column to `TRUE`

## Sheet Structure

The app automatically creates three sheets:

### Users
| email | name | phone | role | isAdmin | createdAt | updatedAt |

### Vehicles
| id | driverEmail | vehicleType | totalSeats | familyMembers | status | createdAt | updatedAt |

### Requests
| id | passengerEmail | driverEmail | seatsRequested | status | createdAt | updatedAt |

## Troubleshooting

### CORS Errors
If you get CORS errors, make sure:
- The web app is deployed with "Anyone" access
- You're using the correct deployed URL (not the development URL)

### API Errors
- Check the Apps Script execution logs: **Extensions > Apps Script > Executions**
- Ensure the script has proper permissions

### Data Not Updating
- Clear browser cache and local storage
- Redeploy the Apps Script after making changes
