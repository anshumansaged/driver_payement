import React, { useState, useEffect } from 'react';
import { Calendar, Plus, BarChart3 } from 'lucide-react';
import TripForm from '../components/TripForm';
import { DailySummaryCards } from '../components/SummaryCard';
import DriverSalaryPanel from '../components/DriverSalaryPanel';
import { formatDate, generateWhatsAppSummary } from '../utils/calculations';
import sheetDBService from '../services/sheetdb';
import cacheService from '../services/cacheService';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState({ status: 'checking' });

  useEffect(() => {
    const loadData = async () => {
      await loadTripsWithCache();
      // Clean up old data on load
      cacheService.cleanupOldTripCounts();
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTripsWithCache = async () => {
    setLoading(true);
    setCacheInfo({ status: 'checking' });
    
    try {
      // Try to load from cache first
      const cachedTrips = cacheService.getCachedData(cacheService.CACHE_KEYS.trips);
      
      if (cachedTrips && cacheService.isCacheValid()) {
        console.log('🔄 Loading trips from cache (valid for 24h)');
        setTrips(cachedTrips);
        setCacheInfo({ status: 'cached', ...cacheService.getCacheInfo() });
        setLoading(false);
        return;
      }

      // Cache is invalid or doesn't exist, fetch from API
      console.log('🌐 Fetching fresh data from SheetDB...');
      setCacheInfo({ status: 'fetching' });
      
      const tripsData = await sheetDBService.getTrips();
      
      // Store in cache
      cacheService.setCachedData(cacheService.CACHE_KEYS.trips, tripsData);
      
      setTrips(tripsData);
      setCacheInfo({ status: 'fresh', ...cacheService.getCacheInfo() });
      console.log('✅ Data cached successfully');
      
    } catch (error) {
      console.error('Error loading trips:', error);
      setCacheInfo({ status: 'error' });
      
      // Try to use cached data as fallback even if expired
      const cachedTrips = cacheService.getCachedData(cacheService.CACHE_KEYS.trips);
      if (cachedTrips) {
        console.log('⚠️ Using expired cache as fallback');
        setTrips(cachedTrips);
        setCacheInfo({ status: 'stale', ...cacheService.getCacheInfo() });
      }
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = async () => {
    // Clear cache and reload
    cacheService.clearCache();
    await loadTripsWithCache();
  };

  const handleTripAdded = async (newTrip) => {
    // Add to current state
    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);
    
    // Update cache immediately
    cacheService.setCachedData(cacheService.CACHE_KEYS.trips, updatedTrips);
    cacheService.incrementDailyTripCount();
    
    setShowTripForm(false);
    setCacheInfo({ status: 'updated', ...cacheService.getCacheInfo() });
    console.log('🔄 Cache updated with new trip');
  };

  const getDailyTrips = () => {
    return trips.filter(trip => trip.date === selectedDate);
  };

  const dailyTrips = getDailyTrips();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">Manage daily trips and driver payments</p>
              {/* Cache Status Indicator */}
              <div className="text-xs">
                {cacheInfo.status === 'cached' && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    📱 Using cached data (24h valid)
                  </span>
                )}
                {cacheInfo.status === 'fresh' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    🌐 Fresh data loaded
                  </span>
                )}
                {cacheInfo.status === 'fetching' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    🔄 Loading from database...
                  </span>
                )}
                {cacheInfo.status === 'stale' && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                    ⚠️ Using offline data
                  </span>
                )}
                {cacheInfo.status === 'updated' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    ✅ Cache updated
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Refresh Button - only show if cache is older than 1 hour */}
            {cacheInfo.lastRefresh && cacheInfo.hoursOld > 1 && (
              <button
                onClick={forceRefresh}
                className="btn-secondary text-sm"
                title="Force refresh from database"
              >
                🔄 Refresh Data
              </button>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                className="input-field"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowTripForm(!showTripForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Trip
            </button>
          </div>
        </div>

        {/* Trip Form */}
        {showTripForm && (
          <div className="mb-8">
            <TripForm onTripAdded={handleTripAdded} />
          </div>
        )}

        {/* Daily Summary Cards */}
        <DailySummaryCards trips={trips} selectedDate={selectedDate} />

        {/* Cache & Daily Stats Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Trips Added</h3>
            <div className="text-2xl font-bold text-blue-600">{cacheService.getTodayTripCount()}</div>
            <p className="text-xs text-gray-500">Trips added today</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cache Status</h3>
            <div className="text-sm">
              {cacheInfo.lastRefresh ? (
                <span className="text-green-600">Last refresh: {cacheInfo.lastRefresh.toLocaleTimeString()}</span>
              ) : (
                <span className="text-gray-500">No refresh yet</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {cacheInfo.status === 'cached' ? `Using cache (${cacheInfo.hoursOld}h old)` : 
               cacheInfo.status === 'fresh' ? 'Fresh from DB' : 
               cacheInfo.status === 'stale' ? 'Offline mode' : 
               cacheInfo.status === 'updated' ? 'Recently updated' : 'Loading...'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Total Trips</h3>
            <div className="text-2xl font-bold text-purple-600">{trips.length}</div>
            <p className="text-xs text-gray-500">All time trips</p>
          </div>
        </div>

        {/* Driver Salary Panel */}
        <div className="mb-8">
          <DriverSalaryPanel />
        </div>

        {/* Daily Trips */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Daily Trips - {formatDate(selectedDate)}
              </h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {dailyTrips.length} trips
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-4">Loading trips...</p>
            </div>
          ) : dailyTrips.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips for this date</h3>
              <p className="text-gray-500 mb-4">Start by adding your first trip for {formatDate(selectedDate)}</p>
              {!showTripForm && (
                <button
                  onClick={() => setShowTripForm(true)}
                  className="btn-primary"
                >
                  Add First Trip
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dailyTrips.map((trip, index) => (
                <TripCard key={index} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TripCard = ({ trip }) => {
  const [showSummary, setShowSummary] = useState(false);
  
  const calculations = trip.calculations || {};
  const whatsappSummary = generateWhatsAppSummary(trip);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Trip Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{trip.driverName}</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {trip.totalKm} km
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Earnings:</span>
              <div className="font-semibold text-green-600">₹{calculations.totalEarnings?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <span className="text-gray-500">Driver Salary:</span>
              <div className="font-semibold text-blue-600">₹{calculations.driverSalary?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <span className="text-gray-500">Cash in Hand:</span>
              <div className="font-semibold">₹{calculations.cashInHand?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="flex flex-wrap gap-1">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  trip.driverTookSalary ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {trip.driverTookSalary ? 'Paid' : 'Pending'}
                </span>
                {trip.cashGivenToCashier && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    To Cashier
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="btn-secondary text-sm"
          >
            {showSummary ? 'Hide Summary' : 'View Summary'}
          </button>
        </div>
      </div>

      {/* WhatsApp Summary */}
      {showSummary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">WhatsApp Summary</h4>
              <button
                onClick={() => copyToClipboard(whatsappSummary)}
                className="btn-primary text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {whatsappSummary}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
