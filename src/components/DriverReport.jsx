import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, DollarSign, TrendingUp, Download, Filter } from 'lucide-react';
import { formatCurrency, formatDate, calculateMonthlySalarySummary } from '../utils/calculations';
import { drivers } from '../data/drivers';

const DriverReport = ({ trips = [] }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [driverSummary, setDriverSummary] = useState(null);

  // Filter trips based on selected driver and month
  useEffect(() => {
    let filtered = trips;
    
    if (selectedDriver) {
      filtered = filtered.filter(trip => trip.driverName === selectedDriver);
    }
    
    if (selectedMonth) {
      filtered = filtered.filter(trip => trip.date.startsWith(selectedMonth));
    }
    
    setFilteredTrips(filtered);
    
    // Calculate driver summary if driver is selected
    if (selectedDriver) {
      const summary = calculateMonthlySalarySummary(selectedDriver, filtered);
      setDriverSummary(summary);
    } else {
      setDriverSummary(null);
    }
  }, [selectedDriver, selectedMonth, trips]);

  const exportToCSV = () => {
    if (filteredTrips.length === 0) {
      alert('No trips to export');
      return;
    }

    const csvData = [
      ['Date', 'Driver', 'Total KM', 'Total Earnings', 'Driver Salary', 'Cash in Hand', 'Salary Taken', 'Cash to Cashier'],
      ...filteredTrips.map(trip => [
        trip.date,
        trip.driverName,
        trip.totalKm,
        trip.calculations?.totalEarnings || 0,
        trip.calculations?.driverSalary || 0,
        trip.calculations?.cashInHand || 0,
        trip.driverTookSalary ? 'Yes' : 'No',
        trip.cashGivenToCashier ? 'Yes' : 'No'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip_report_${selectedDriver || 'all'}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformEarningsTotal = (trip) => {
    return Object.values(trip.platformEarnings || {}).reduce((sum, earning) => sum + (parseFloat(earning) || 0), 0);
  };

  const getCommissionsTotal = (trip) => {
    return Object.values(trip.commissions || {}).reduce((sum, commission) => sum + (parseFloat(commission) || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Trip Reports</h2>
        </div>
        
        <button
          onClick={exportToCSV}
          disabled={filteredTrips.length === 0}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Driver</label>
            <select
              className="input-field"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">All Drivers</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.name}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Select Month</label>
            <input
              type="month"
              className="input-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Driver Summary */}
      {driverSummary && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Summary - {selectedDriver}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {driverSummary.tripsCount}
              </div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(driverSummary.totalSalaryEarned)}
              </div>
              <div className="text-sm text-gray-600">Salary Earned</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(driverSummary.totalSalaryPaid)}
              </div>
              <div className="text-sm text-gray-600">Salary Paid</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(driverSummary.salaryRemaining)}
              </div>
              <div className="text-sm text-gray-600">Salary Remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Trip History Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Trip History ({filteredTrips.length} trips)
          </h3>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trips found for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash in Hand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrips.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(trip.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{trip.driverName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{trip.totalKm}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(getPlatformEarningsTotal(trip))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(getCommissionsTotal(trip))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(trip.calculations?.totalEarnings || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {formatCurrency(trip.calculations?.driverSalary || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(trip.calculations?.cashInHand || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trip.driverTookSalary 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Salary: {trip.driverTookSalary ? 'Paid' : 'Pending'}
                        </span>
                        {trip.cashGivenToCashier && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Cash to Cashier
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverReport;
