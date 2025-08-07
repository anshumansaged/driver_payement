import axios from 'axios';

// SheetDB API configuration
const SHEET_DB_API_URL = 'https://sheetdb.io/api/v1/caq0k5ybmi8sa';

// Different worksheet endpoints
const ENDPOINTS = {
  trips: `${SHEET_DB_API_URL}?sheet=trips`,
  salaries: `${SHEET_DB_API_URL}?sheet=driver_salaries`, 
  cashier: `${SHEET_DB_API_URL}?sheet=cashier_transactions`
};

// Trip data structure for SheetDB
export const createTripData = (tripData) => {
  return {
    date: tripData.date,
    driver_name: tripData.driverName,
    total_km: tripData.totalKm || 0,
    start_km: tripData.startKm || 0,
    end_km: tripData.endKm || 0,
    uber_earnings: tripData.platformEarnings.uber || 0,
    indrive_earnings: tripData.platformEarnings.indrive || 0,
    yatri_earnings: tripData.platformEarnings.yatri || 0,
    rapido_earnings: tripData.platformEarnings.rapido || 0,
    offline_earnings: tripData.platformEarnings.offline || 0,
    uber_commission: tripData.commissions.uber_commission || 0,
    yatri_commission: tripData.commissions.yatri_commission || 0,
    fuel_type_1: tripData.fuelEntries?.[0]?.type || '',
    fuel_amount_1: tripData.fuelEntries?.[0]?.amount || 0,
    fuel_type_2: tripData.fuelEntries?.[1]?.type || '',
    fuel_amount_2: tripData.fuelEntries?.[1]?.amount || 0,
    fuel_type_3: tripData.fuelEntries?.[2]?.type || '',
    fuel_amount_3: tripData.fuelEntries?.[2]?.amount || 0,
    online_payments: tripData.onlinePayments || 0,
    total_cash_collected: tripData.totalCashCollected || 0,
    other_expenses: tripData.otherExpenses || 0,
    driver_took_salary: tripData.driverTookSalary ? 'Yes' : 'No',
    cash_given_to_cashier: tripData.cashGivenToCashier ? 'Yes' : 'No',
    cash_to_cashier: tripData.cashToCashier || 0,
    total_earnings: tripData.calculations?.totalEarnings || 0,
    driver_salary: tripData.calculations?.driverSalary || 0,
    cash_in_hand: tripData.calculations?.cashInHand || 0,
    created_at: new Date().toISOString()
  };
};

// SheetDB API service
class SheetDBService {
  constructor() {
    this.baseUrl = SHEET_DB_API_URL;
  }

  // Test connection to SheetDB
  async testConnection() {
    try {
      console.log('Testing SheetDB connection...');
      const response = await axios.get(ENDPOINTS.trips);
      console.log('SheetDB connection successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SheetDB connection failed:', error.response?.data || error.message);
      throw new Error(`Connection failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create/Add trip data to 'trips' worksheet
  async addTrip(tripData) {
    try {
      const formattedData = createTripData(tripData);
      console.log('Sending trip data to SheetDB:', formattedData);
      const response = await axios.post(ENDPOINTS.trips, formattedData);
      console.log('SheetDB response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding trip to SheetDB:', error.response?.data || error.message);
      throw new Error(`Failed to save trip: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get all trips from 'trips' worksheet
  async getTrips() {
    try {
      const response = await axios.get(ENDPOINTS.trips);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching trips from SheetDB:', error);
      throw new Error(`Failed to fetch trips: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get trips by driver from 'trips' worksheet
  async getTripsByDriver(driverName) {
    try {
      const response = await axios.get(`${ENDPOINTS.trips}&driver_name=${encodeURIComponent(driverName)}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching driver trips from SheetDB:', error);
      throw new Error(`Failed to fetch driver trips: ${error.response?.data?.message || error.message}`);
    }
  }

  // Driver salary tracking - Add to 'driver_salaries' worksheet
  async updateDriverSalary(driverName, salaryAmount, wasPaid = false) {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
      
      // Check if record exists for this driver and month
      const existingResponse = await axios.get(
        `${ENDPOINTS.salaries}&driver_name=${encodeURIComponent(driverName)}&month=${currentMonth}`
      );
      
      const existingRecord = existingResponse.data && existingResponse.data.length > 0 
        ? existingResponse.data[0] 
        : null;

      const salaryRecord = {
        driver_name: driverName,
        month: currentMonth,
        total_trips: existingRecord ? (parseInt(existingRecord.total_trips) || 0) + 1 : 1,
        total_earnings: existingRecord ? 
          (parseFloat(existingRecord.total_earnings) || 0) + salaryAmount : 
          salaryAmount,
        total_salary_earned: existingRecord ? 
          (parseFloat(existingRecord.total_salary_earned) || 0) + salaryAmount : 
          salaryAmount,
        total_salary_paid: existingRecord ? 
          (parseFloat(existingRecord.total_salary_paid) || 0) + (wasPaid ? salaryAmount : 0) : 
          (wasPaid ? salaryAmount : 0),
        salary_pending: 0, // Will be calculated below
        last_updated: new Date().toISOString()
      };

      salaryRecord.salary_pending = salaryRecord.total_salary_earned - salaryRecord.total_salary_paid;

      if (existingRecord) {
        // Update existing record (SheetDB doesn't support direct updates, so we might need to handle this differently)
        await axios.post(ENDPOINTS.salaries, salaryRecord);
      } else {
        // Create new record
        await axios.post(ENDPOINTS.salaries, salaryRecord);
      }

      return salaryRecord;
    } catch (error) {
      console.error('Error updating driver salary:', error);
      throw new Error(`Failed to update driver salary: ${error.response?.data?.message || error.message}`);
    }
  }

  // Add cashier transaction to 'cashier_transactions' worksheet
  async addCashierTransaction(transactionData) {
    try {
      const transactionRecord = {
        date: transactionData.date,
        driver_name: transactionData.driver_name,
        amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        notes: transactionData.notes || '',
        created_at: new Date().toISOString()
      };

      console.log('Adding cashier transaction:', transactionRecord);
      const response = await axios.post(ENDPOINTS.cashier, transactionRecord);
      return response.data;
    } catch (error) {
      console.error('Error adding cashier transaction:', error);
      throw new Error(`Failed to add cashier transaction: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get cashier data from 'cashier_transactions' worksheet
  async getCashierTransactions() {
    try {
      const response = await axios.get(ENDPOINTS.cashier);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cashier transactions:', error);
      throw new Error(`Failed to fetch cashier transactions: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Export singleton instance
export default new SheetDBService();
