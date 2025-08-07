import React from 'react';
import { Calculator, TrendingDown, TrendingUp, Info } from 'lucide-react';

const CalculationBreakdown = ({ tripData, calculations }) => {
  if (!calculations) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Detailed Calculation Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Side */}
        <div className="space-y-4">
          <h4 className="font-medium text-green-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Revenue
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Platform Earnings:</span>
              <span className="font-medium">₹{calculations.totalPlatformEarnings.toFixed(2)}</span>
            </div>
            
            {/* Platform breakdown */}
            <div className="pl-4 space-y-1 text-xs text-gray-600">
              {Object.entries(tripData.platformEarnings || {}).map(([platform, amount]) => {
                if (parseFloat(amount) > 0) {
                  return (
                    <div key={platform} className="flex justify-between">
                      <span>• {platform.charAt(0).toUpperCase() + platform.slice(1)}:</span>
                      <span>₹{parseFloat(amount).toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Deductions Side */}
        <div className="space-y-4">
          <h4 className="font-medium text-red-700 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            Deductions
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Commissions:</span>
              <span className="font-medium">₹{calculations.totalCommissions.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Total Fuel Expenses:</span>
              <span className="font-medium">₹{calculations.totalFuelExpenses.toFixed(2)}</span>
            </div>
            
            {tripData.otherExpenses && parseFloat(tripData.otherExpenses) > 0 && (
              <div className="flex justify-between">
                <span>Other Expenses:</span>
                <span className="font-medium">₹{parseFloat(tripData.otherExpenses).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net Earnings */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Net Earnings:</span>
          <span className="text-blue-600">₹{calculations.totalEarnings.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Platform Earnings - Commissions - Fuel - Other Expenses
        </p>
      </div>

      {/* Salary Split */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
          <Info className="w-4 h-4" />
          Salary Split for {tripData.driverName}
        </h4>
        
        <div className="bg-green-50 border border-green-200 rounded p-3 max-w-xs">
          <div className="text-sm text-green-700">Driver Share</div>
          <div className="text-lg font-semibold text-green-800">
            {calculations.driverPercentage}% = ₹{calculations.driverSalary.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Cash Flow</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Cash Collected:</span>
            <span className="font-medium">₹{calculations.totalCashCollected.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Online Payments:</span>
            <span className="font-medium">₹{parseFloat(tripData.onlinePayments || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Driver Salary {tripData.driverTookSalary ? '(Paid)' : '(Pending)'}:</span>
            <span className="font-medium">
              {tripData.driverTookSalary ? '-' : ''}₹{calculations.driverSalary.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between font-semibold text-orange-600 pt-2 border-t">
            <span>Cash in Driver Hand:</span>
            <span>₹{calculations.cashInHand.toFixed(2)}</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Cash in Hand = Total Cash - Online Payments {tripData.driverTookSalary ? '- Driver Salary' : ''}
        </p>
      </div>
    </div>
  );
};

export default CalculationBreakdown;
