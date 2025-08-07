import React from 'react';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/calculations';

const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${
                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DailySummaryCards = ({ trips, selectedDate }) => {
  // Filter trips for selected date
  const dailyTrips = trips.filter(trip => trip.date === selectedDate);
  
  // Calculate daily totals
  const dailyStats = dailyTrips.reduce((acc, trip) => {
    const calc = trip.calculations || {};
    return {
      totalEarnings: acc.totalEarnings + (calc.totalEarnings || 0),
      totalDriverSalary: acc.totalDriverSalary + (calc.driverSalary || 0),
      totalCash: acc.totalCash + (calc.cashInHand || 0),
      tripsCount: acc.tripsCount + 1
    };
  }, {
    totalEarnings: 0,
    totalDriverSalary: 0,
    totalCash: 0,
    tripsCount: 0
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <SummaryCard
        title="Total Earnings"
        value={formatCurrency(dailyStats.totalEarnings)}
        subtitle={`From ${dailyStats.tripsCount} trips`}
        icon={DollarSign}
        color="green"
      />
      
      <SummaryCard
        title="Driver Salary"
        value={formatCurrency(dailyStats.totalDriverSalary)}
        subtitle="Driver earnings total"
        icon={Users}
        color="blue"
      />
      
      <SummaryCard
        title="Cash in Hand"
        value={formatCurrency(dailyStats.totalCash)}
        subtitle={`Date: ${formatDate(selectedDate)}`}
        icon={Calendar}
        color="orange"
      />
    </div>
  );
};

export { SummaryCard, DailySummaryCards };
export default SummaryCard;
