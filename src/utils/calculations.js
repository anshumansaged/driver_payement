// Simple version without imports to test basic exports
const drivers = [
  { id: 1, name: "Vivek Bali", salaryPercentage: 30 },
  { id: 2, name: "Ramesh Kumar", salaryPercentage: 35 },
  { id: 3, name: "Suresh Singh", salaryPercentage: 35 },
  { id: 4, name: "Mukesh Sharma", salaryPercentage: 35 }
];

export const getDriverSalaryPercentage = (driverName) => {
  const driver = drivers.find(d => d.name === driverName);
  return driver ? driver.salaryPercentage : 35;
};

export const calculateTripEarnings = (tripData) => {
  const {
    driverName,
    platformEarnings = {},
    platformCash = {},
    commissions = {},
    otherExpenses = 0,
    fuelEntries = [],
    onlinePayments = 0,
    totalCashCollected = 0,
    driverTookSalary = false
  } = tripData;

  const totalPlatformEarnings = Object.values(platformEarnings).reduce((sum, earning) => sum + (parseFloat(earning) || 0), 0);
  const calculatedTotalCash = Object.values(platformCash).reduce((sum, cash) => sum + (parseFloat(cash) || 0), 0);
  const totalCommissions = Object.values(commissions).reduce((sum, commission) => sum + (parseFloat(commission) || 0), 0);
  const totalFuelExpenses = fuelEntries.reduce((sum, fuel) => sum + (parseFloat(fuel.amount) || 0), 0);
  
  const totalEarnings = totalPlatformEarnings - totalCommissions - (parseFloat(otherExpenses) || 0) - totalFuelExpenses;
  
  const driverPercentage = getDriverSalaryPercentage(driverName);
  const ownerPercentage = 100 - driverPercentage;
  
  const driverSalary = totalEarnings * (driverPercentage / 100);
  const ownerShare = totalEarnings * (ownerPercentage / 100);
  
  const totalCash = calculatedTotalCash || parseFloat(totalCashCollected) || 0;
  const online = parseFloat(onlinePayments) || 0;
  const cashInHand = totalCash - online - (driverTookSalary ? driverSalary : 0);

  return {
    totalPlatformEarnings: parseFloat(totalPlatformEarnings.toFixed(2)),
    totalCashCollected: parseFloat(totalCash.toFixed(2)),
    totalCommissions: parseFloat(totalCommissions.toFixed(2)),
    totalFuelExpenses: parseFloat(totalFuelExpenses.toFixed(2)),
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    driverSalary: parseFloat(driverSalary.toFixed(2)),
    ownerShare: parseFloat(ownerShare.toFixed(2)),
    cashInHand: parseFloat(Math.max(0, cashInHand).toFixed(2)),
    driverPercentage,
    ownerPercentage
  };
};

export const validateTripData = (tripData) => {
  const errors = {};
  
  if (!tripData.date) {
    errors.date = 'Date is required';
  }
  
  if (!tripData.driverName) {
    errors.driverName = 'Driver name is required';
  }
  
  if (!tripData.totalKm || tripData.totalKm <= 0) {
    errors.totalKm = 'Total kilometers must be greater than 0';
  }
  
  const hasEarnings = Object.values(tripData.platformEarnings || {}).some(earning => parseFloat(earning) > 0);
  if (!hasEarnings) {
    errors.earnings = 'At least one platform earning is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateForWhatsApp = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const generateWhatsAppSummary = (tripData) => {
  const calculations = calculateTripEarnings(tripData);
  const date = formatDateForWhatsApp(tripData.date);
  
  let summary = `🚕 *Trip Summary (${date})*\n`;
  summary += `👤 *Driver:* ${tripData.driverName}\n`;
  summary += `🚗 *Km Driven:* ${tripData.totalKm} km (${tripData.startKm || 'N/A'} → ${tripData.endKm || 'N/A'})\n`;
  summary += `💰 *Total Earnings:* ₹${calculations.totalEarnings.toFixed(2)}\n\n`;
  
  summary += `📊 *Platform Earnings:*\n`;
  Object.entries(tripData.platformEarnings || {}).forEach(([platform, amount]) => {
    if (amount > 0) {
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      summary += `   ${platformName}: ₹${parseFloat(amount).toFixed(2)}\n`;
    }
  });
  
  summary += `\n💳 *Online:* ₹${parseFloat(tripData.onlinePayments || 0).toFixed(2)} | 💵 *Total Cash:* ₹${calculations.totalCashCollected.toFixed(2)}\n`;
  
  if (tripData.fuelEntries && tripData.fuelEntries.length > 0) {
    summary += `⛽ *Fuel Expenses:*\n`;
    tripData.fuelEntries.forEach((fuel) => {
      summary += `   ${fuel.type.toUpperCase()}: ₹${parseFloat(fuel.amount).toFixed(2)}\n`;
    });
    summary += `   *Total Fuel:* ₹${calculations.totalFuelExpenses.toFixed(2)}\n`;
  }
  
  if (calculations.totalCommissions > 0) {
    let commissionText = '\n💼 *Commissions:*';
    if (tripData.hasUberCommission) {
      commissionText += ' Uber: ₹117.00';
    }
    if (tripData.yatriTrips && parseFloat(tripData.yatriTrips) > 0) {
      commissionText += ` | Yatri: ${tripData.yatriTrips} trips = ₹${(parseFloat(tripData.yatriTrips) * 10).toFixed(2)}`;
    }
    summary += commissionText;
  }
  
  if (tripData.otherExpenses > 0) {
    summary += `\n🔧 *Other Expenses:* ₹${parseFloat(tripData.otherExpenses).toFixed(2)}`;
  }
  
  summary += `\n\n👨‍✈️ *Driver Pay (${calculations.driverPercentage}%):* ₹${calculations.driverSalary.toFixed(2)}`;
  
  if (tripData.driverTookSalary) {
    summary += ` ✅ *Paid*`;
  } else {
    summary += ` ⏳ *Pending*`;
  }
  
  summary += `\n💸 *Cash in Driver Hand:* ₹${calculations.cashInHand.toFixed(2)}`;
  
  if (tripData.cashGivenToCashier && tripData.cashToCashier) {
    summary += `\n🧑‍💼 *Cash to Cashier:* ₹${parseFloat(tripData.cashToCashier).toFixed(2)} ✅`;
  }
  
  summary += `\n\n📱 *Generated by Fleet Manager Dashboard*`;
  summary += `\n⚡ *Automated Calculations Active*`;
  
  return summary;
};

export const calculateMonthlySalarySummary = (driverName, trips = []) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthlyTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
  });
  
  let totalEarningsThisMonth = 0;
  let totalSalaryEarned = 0;
  let totalSalaryPaid = 0;
  
  monthlyTrips.forEach(trip => {
    const calculations = calculateTripEarnings(trip);
    totalEarningsThisMonth += calculations.totalEarnings;
    totalSalaryEarned += calculations.driverSalary;
    if (trip.driverTookSalary) {
      totalSalaryPaid += calculations.driverSalary;
    }
  });
  
  const salaryRemaining = totalSalaryEarned - totalSalaryPaid;
  
  return {
    totalEarningsThisMonth: parseFloat(totalEarningsThisMonth.toFixed(2)),
    totalSalaryEarned: parseFloat(totalSalaryEarned.toFixed(2)),
    totalSalaryPaid: parseFloat(totalSalaryPaid.toFixed(2)),
    salaryRemaining: parseFloat(salaryRemaining.toFixed(2)),
    tripsCount: monthlyTrips.length
  };
};
