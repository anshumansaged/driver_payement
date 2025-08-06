import React, { useState, useEffect } from 'react';
import { User, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { drivers } from '../data/drivers';

const DriverSalaryPanel = () => {
  const [driverSalaries, setDriverSalaries] = useState({});

  useEffect(() => {
    // Load driver salary data from localStorage
    const loadSalaryData = () => {
      const existingSalaries = JSON.parse(localStorage.getItem('driver_salaries') || '{}');
      setDriverSalaries(existingSalaries);
    };

    loadSalaryData();

    // Update every 5 seconds to reflect real-time changes
    const interval = setInterval(loadSalaryData, 5000);
    return () => clearInterval(interval);
  }, []);

  const markSalaryAsPaid = (driverName, amount) => {
    const updatedSalaries = { ...driverSalaries };
    if (updatedSalaries[driverName]) {
      updatedSalaries[driverName].paid += amount;
      updatedSalaries[driverName].pending = Math.max(0, 
        updatedSalaries[driverName].earned - updatedSalaries[driverName].paid
      );
      
      // Save to localStorage
      localStorage.setItem('driver_salaries', JSON.stringify(updatedSalaries));
      setDriverSalaries(updatedSalaries);
      
      // Add transaction record
      const transactions = JSON.parse(localStorage.getItem('salary_transactions') || '[]');
      transactions.push({
        driver: driverName,
        amount: amount,
        date: new Date().toISOString(),
        type: 'salary_payment'
      });
      localStorage.setItem('salary_transactions', JSON.stringify(transactions));
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Driver Salary Status</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {drivers.map(driver => {
          const salaryData = driverSalaries[driver.name] || { earned: 0, paid: 0, pending: 0 };
          const hasPendingSalary = salaryData.pending > 0;
          
          return (
            <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                <div className={`p-2 rounded-full ${hasPendingSalary ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  {hasPendingSalary ? (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Earned:</span>
                    <span className="font-semibold">₹{salaryData.earned.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="font-semibold text-green-600">₹{salaryData.paid.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Pending:</span>
                    <span className={`font-bold text-lg ${hasPendingSalary ? 'text-yellow-600' : 'text-green-600'}`}>
                      ₹{salaryData.pending.toFixed(2)}
                    </span>
                  </div>
                </div>

                {hasPendingSalary && (
                  <button
                    onClick={() => markSalaryAsPaid(driver.name, salaryData.pending)}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Salaries are automatically calculated when trips are added</li>
              <li>• Pending amounts show what hasn't been paid yet</li>
              <li>• Click "Mark as Paid" when you give salary to a driver</li>
              <li>• Data is stored locally in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSalaryPanel;
