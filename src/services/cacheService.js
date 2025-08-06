// Cache Service for managing browser storage with 24h expiration
class CacheService {
  constructor() {
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.CACHE_KEYS = {
      trips: 'cached_trips_data',
      timestamp: 'cache_timestamp',
      tripCount: 'daily_trip_count',
      driverSalaries: 'cached_driver_salaries',
      cashierTransactions: 'cached_cashier_transactions'
    };
  }

  // Check if cache is still valid (within 24 hours)
  isCacheValid(key = this.CACHE_KEYS.timestamp) {
    const timestamp = localStorage.getItem(key);
    if (!timestamp) return false;
    
    const timeDiff = Date.now() - parseInt(timestamp);
    return timeDiff < this.CACHE_DURATION;
  }

  // Get cached data if valid
  getCachedData(key) {
    if (this.isCacheValid()) {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  }

  // Store data in cache with timestamp
  setCachedData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(this.CACHE_KEYS.timestamp, Date.now().toString());
      console.log(`✅ Data cached successfully for ${key}`);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Update cached trips with new trip
  addTripToCache(newTrip) {
    const cachedTrips = this.getCachedData(this.CACHE_KEYS.trips) || [];
    const updatedTrips = [...cachedTrips, newTrip];
    this.setCachedData(this.CACHE_KEYS.trips, updatedTrips);
    
    // Update daily trip count
    this.incrementDailyTripCount();
    
    return updatedTrips;
  }

  // Get today's trip count
  getTodayTripCount() {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(this.CACHE_KEYS.tripCount);
    
    if (!cached) return 0;
    
    try {
      const data = JSON.parse(cached);
      return data[today] || 0;
    } catch {
      return 0;
    }
  }

  // Increment today's trip count
  incrementDailyTripCount() {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(this.CACHE_KEYS.tripCount) || '{}';
    
    try {
      const data = JSON.parse(cached);
      data[today] = (data[today] || 0) + 1;
      localStorage.setItem(this.CACHE_KEYS.tripCount, JSON.stringify(data));
    } catch (error) {
      console.error('Error updating trip count:', error);
    }
  }

  // Clear all cache
  clearCache() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Cache cleared');
  }

  // Clear expired cache (older than 24h)
  clearExpiredCache() {
    if (!this.isCacheValid()) {
      this.clearCache();
      console.log('🧹 Expired cache cleared');
    }
  }

  // Get cache info for display
  getCacheInfo() {
    const timestamp = localStorage.getItem(this.CACHE_KEYS.timestamp);
    if (!timestamp) {
      return { status: 'none', lastRefresh: null, isValid: false };
    }

    const lastRefresh = new Date(parseInt(timestamp));
    const isValid = this.isCacheValid();
    const hoursOld = Math.floor((Date.now() - parseInt(timestamp)) / (1000 * 60 * 60));
    
    return {
      status: isValid ? 'valid' : 'expired',
      lastRefresh,
      isValid,
      hoursOld
    };
  }

  // Clean up old daily trip counts (keep only last 7 days)
  cleanupOldTripCounts() {
    const cached = localStorage.getItem(this.CACHE_KEYS.tripCount);
    if (!cached) return;

    try {
      const data = JSON.parse(cached);
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      // Filter out dates older than 7 days
      const cleanedData = {};
      Object.keys(data).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date >= sevenDaysAgo) {
          cleanedData[dateStr] = data[dateStr];
        }
      });

      localStorage.setItem(this.CACHE_KEYS.tripCount, JSON.stringify(cleanedData));
    } catch (error) {
      console.error('Error cleaning up trip counts:', error);
    }
  }
}

// Export singleton instance
export default new CacheService();
