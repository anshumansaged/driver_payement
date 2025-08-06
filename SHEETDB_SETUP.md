# 🔧 SheetDB Setup Guide

## Single Google Sheet Setup

You only need **ONE SheetDB** for the entire Fleet Owner Trip Report Dashboard. Here's how to set it up:

### Step 1: Create Google Sheets Document

Create a new Google Sheets document with **3 worksheets (tabs)**:

#### **Worksheet 1: "trips"** (Main trip data)
Create columns with these exact headers:
```
date | driver_name | total_km | uber_earnings | indrive_earnings | yatri_earnings | rapido_earnings | offline_earnings | uber_commission | yatri_commission | fuel_expense | online_payments | cash_collected | other_expenses | driver_took_salary | cash_given_to_cashier | total_earnings | driver_salary | owner_share | cash_in_hand | created_at
```

#### **Worksheet 2: "driver_salaries"** (Monthly salary tracking)
Create columns with these exact headers:
```
driver_name | month | total_earned | total_paid | salary_remaining | last_updated
```

#### **Worksheet 3: "cashier_transactions"** (Cash flow tracking)
Create columns with these exact headers:
```
date | amount | type | description | timestamp | running_total
```

### Step 2: Connect to SheetDB

1. Go to [SheetDB.io](https://sheetdb.io)
2. Sign up for a free account
3. Click "Create API" and paste your Google Sheets URL
4. Copy your API URL (it will look like: `https://sheetdb.io/api/v1/abc123def456`)

### Step 3: Update Configuration

Replace the placeholder URL in `src/services/sheetdb.js`:

```javascript
// Replace this line:
const SHEET_DB_API_URL = 'https://sheetdb.io/api/v1/YOUR_SHEET_ID';

// With your actual URL:
const SHEET_DB_API_URL = 'https://sheetdb.io/api/v1/abc123def456';
```

### Step 4: Test the Connection

1. Start your development server: `npm run dev`
2. Add a test trip through the dashboard
3. Check your Google Sheets to see if data appears in the "trips" worksheet

## 📊 Data Flow

### Trip Data Flow:
```
Dashboard Form → SheetDB API → Google Sheets "trips" worksheet
```

### Driver Salary Flow:
```
Trip Form (salary checkbox) → SheetDB API → Google Sheets "driver_salaries" worksheet
```

### Cashier Cash Flow:
```
Cashier Panel → SheetDB API → Google Sheets "cashier_transactions" worksheet
```

## 🔐 Free Tier Limitations

SheetDB Free Plan includes:
- ✅ 1,000 API calls per month
- ✅ 1 spreadsheet
- ✅ Multiple worksheets
- ✅ Basic CRUD operations

For a small fleet (5-10 drivers), this should be sufficient for:
- ~25-30 trips per day
- Daily salary updates
- Cashier transactions

## 🚀 Alternative: Paid Plan Benefits

If you exceed the free tier:
- 🔸 **Hobby Plan ($7/month)**: 10,000 API calls
- 🔸 **Pro Plan ($19/month)**: 100,000 API calls + premium features

## 📱 Offline Support

The app automatically falls back to localStorage if SheetDB is unavailable, so your data won't be lost even without internet connection.

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to add trip"**: 
   - Check your API URL is correct
   - Verify worksheet names match exactly ("trips", "driver_salaries", "cashier_transactions")
   - Check if you've exceeded API limits

2. **Data not appearing**:
   - Ensure column headers match exactly (case-sensitive)
   - Check Google Sheets sharing permissions

3. **CORS errors**:
   - Make sure your domain is added to SheetDB whitelist (paid plans only)
   - For development, SheetDB should work with localhost

## 📞 Support

- SheetDB Documentation: https://docs.sheetdb.io
- Google Sheets API: https://developers.google.com/sheets/api
