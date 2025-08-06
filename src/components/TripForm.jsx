import React, { useState, useEffect } from 'react';
import { Calendar, User, MapPin, DollarSign, Fuel, CreditCard, Wallet, Calculator, Save, Copy } from 'lucide-react';
import { drivers, platforms, commissionTypes } from '../data/drivers';
import { calculateTripEarnings, validateTripData, generateWhatsAppSummary } from '../utils/calculations';
import sheetDBService from '../services/sheetdb';

const TripForm = ({ onTripAdded }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driverName: '',
    startKm: '',
    endKm: '',
    totalKm: '',
    platformEarnings: {
      uber: '',
      indrive: '',
      yatri: '',
      rapido: '',
      offline: ''
    },
    platformCash: {
      uber: '',
      indrive: '',
      yatri: '',
      rapido: '',
      offline: ''
    },
    commissions: {
      uber_commission: '',
      yatri_commission: ''
    },
    // Automated commission flags
    hasUberCommission: false,
    yatriTrips: '',
    fuelEntries: [], // Multiple fuel entries with type
    onlinePayments: '',
    cashCollected: '',
    otherExpenses: '',
    driverTookSalary: false,
    cashGivenToCashier: false,
    // Automated cash fields
    totalCashCollected: '',
    cashInDriverHand: '',
    cashToCashier: ''
  });

  const [calculations, setCalculations] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [errors, setErrors] = useState({});
  const [testStatus, setTestStatus] = useState(null);

  // Test SheetDB connection
  const testConnection = async () => {
    setTestStatus('testing');
    try {
      console.log('Testing SheetDB connection...');
      await sheetDBService.testConnection();
      setTestStatus('success');
      console.log('✅ SheetDB connection successful!');
    } catch (error) {
      setTestStatus('error');
      console.error('❌ SheetDB connection failed:', error);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  // Recalculate when form data changes
  useEffect(() => {
    // Auto-calculate total KM
    if (formData.startKm && formData.endKm) {
      const totalKm = parseFloat(formData.endKm) - parseFloat(formData.startKm);
      if (totalKm >= 0) {
        setFormData(prev => ({ ...prev, totalKm: totalKm.toString() }));
      }
    }

    // Auto-calculate Uber commission (fixed ₹117)
    if (formData.hasUberCommission && formData.platformEarnings.uber) {
      setFormData(prev => ({
        ...prev,
        commissions: {
          ...prev.commissions,
          uber_commission: '117'
        }
      }));
    } else if (!formData.hasUberCommission) {
      setFormData(prev => ({
        ...prev,
        commissions: {
          ...prev.commissions,
          uber_commission: ''
        }
      }));
    }

    // Auto-calculate Yatri commission (trips × ₹10)
    if (formData.yatriTrips && parseFloat(formData.yatriTrips) > 0) {
      const yatriCommission = parseFloat(formData.yatriTrips) * 10;
      setFormData(prev => ({
        ...prev,
        commissions: {
          ...prev.commissions,
          yatri_commission: yatriCommission.toString()
        }
      }));
    }

    // Auto-calculate total cash collected (sum of all platform earnings)
    const platformEarningsTotal = Object.values(formData.platformEarnings)
      .reduce((sum, earning) => sum + (parseFloat(earning) || 0), 0);
    
    if (platformEarningsTotal > 0) {
      setFormData(prev => ({ ...prev, totalCashCollected: platformEarningsTotal.toString() }));
    }

    // Calculate main trip calculations
    const calc = calculateTripEarnings(formData);
    setCalculations(calc);

    // Auto-calculate cash in driver hand and cash to cashier
    if (formData.totalCashCollected && formData.onlinePayments !== undefined) {
      const totalCash = parseFloat(formData.totalCashCollected) || 0;
      const online = parseFloat(formData.onlinePayments) || 0;
      const driverSalary = calc.driverSalary || 0;
      
      // Cash in driver hand = Total cash - Online payments - Driver salary (if taking)
      const cashInDriverHand = totalCash - online - (formData.driverTookSalary ? driverSalary : 0);
      
      setFormData(prev => ({ 
        ...prev, 
        cashInDriverHand: Math.max(0, cashInDriverHand).toFixed(2),
        cashCollected: totalCash.toString() // Update the original cashCollected field
      }));

      // Remove automatic cashToCashier calculation - now user input only
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlatformEarningChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      platformEarnings: {
        ...prev.platformEarnings,
        [platform]: value
      }
    }));
  };

  const handlePlatformCashChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      platformCash: {
        ...prev.platformCash,
        [platform]: value
      }
    }));
  };

  const handleCommissionChange = (commissionType, value) => {
    setFormData(prev => ({
      ...prev,
      commissions: {
        ...prev.commissions,
        [commissionType]: value
      }
    }));
  };

  const addFuelEntry = () => {
    setFormData(prev => ({
      ...prev,
      fuelEntries: [
        ...prev.fuelEntries,
        { type: 'petrol', amount: '' }
      ]
    }));
  };

  const updateFuelEntry = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      fuelEntries: prev.fuelEntries.map((fuel, i) => 
        i === index ? { ...fuel, [field]: value } : fuel
      )
    }));
  };

  const removeFuelEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      fuelEntries: prev.fuelEntries.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    const validation = validateTripData(formData);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      setErrors(validation.errors);
      return;
    }

    console.log('Validation passed, starting save process...');
    
    setIsSubmitting(true);

    const tripDataWithCalculations = {
      ...formData,
      calculations
    };

    console.log('Trip data with calculations:', tripDataWithCalculations);

    try {
      console.log('Saving to SheetDB...');
      
      // Save to SheetDB (no localStorage fallback)
      const savedTrip = await sheetDBService.addTrip(tripDataWithCalculations);
      console.log('Trip saved to SheetDB successfully:', savedTrip);
      
      // Update driver salary tracking in SheetDB
      try {
        await sheetDBService.updateDriverSalary(formData.driverName, calculations.driverSalary, formData.driverTookSalary);
        console.log('Driver salary updated in SheetDB');
      } catch (salaryError) {
        console.warn('Driver salary update failed:', salaryError);
      }

      // Update cashier cash if applicable
      if (formData.cashGivenToCashier && formData.cashToCashier) {
        try {
          await sheetDBService.addCashierTransaction({
            date: formData.date,
            driver_name: formData.driverName,
            amount: parseFloat(formData.cashToCashier),
            transaction_type: 'received',
            notes: 'Cash from trip'
          });
          console.log('Cashier transaction added to SheetDB');
        } catch (cashierError) {
          console.warn('Cashier transaction failed:', cashierError);
        }
      }

      // Show success summary
      setShowSummary(true);
      
      if (onTripAdded) onTripAdded(tripDataWithCalculations);
      console.log('Trip added callback executed');

    } catch (error) {
      console.error('Error saving trip to SheetDB:', error);
      alert(`Error saving trip: ${error.message || 'Please check your internet connection and try again.'}`);
    } finally {
      setIsSubmitting(false);
      console.log('Save process completed');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      driverName: '',
      startKm: '',
      endKm: '',
      totalKm: '',
      platformEarnings: {
        uber: '',
        indrive: '',
        yatri: '',
        rapido: '',
        offline: ''
      },
      platformCash: {
        uber: '',
        indrive: '',
        yatri: '',
        rapido: '',
        offline: ''
      },
      commissions: {
        uber_commission: '',
        yatri_commission: ''
      },
      hasUberCommission: false,
      yatriTrips: '',
      fuelEntries: [],
      onlinePayments: '',
      cashCollected: '',
      otherExpenses: '',
      driverTookSalary: false,
      cashGivenToCashier: false,
      totalCashCollected: '',
      cashInDriverHand: '',
      cashToCashier: ''
    });
    setShowSummary(false);
    setErrors({});
    setIsSubmitting(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  if (showSummary) {
    const whatsappSummary = generateWhatsAppSummary(formData);
    
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Trip Added Successfully! ✅</h2>
          <p className="text-gray-600 mb-2">Here's your trip summary:</p>
          {isSubmitting && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">💾 Saving to database in background...</p>
            </div>
          )}
          {!isSubmitting && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">✅ Trip saved successfully!</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
          <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
            {whatsappSummary}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => copyToClipboard(whatsappSummary)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Copy size={16} />
            Copy Summary
          </button>
          <button
            onClick={resetForm}
            className="btn-secondary"
          >
            Add Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <DollarSign className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Add Trip Details</h2>
          {testStatus === 'testing' && (
            <p className="text-sm text-yellow-600">🔄 Testing database connection...</p>
          )}
          {testStatus === 'success' && (
            <p className="text-sm text-green-600">✅ Database connected successfully!</p>
          )}
          {testStatus === 'error' && (
            <p className="text-sm text-red-600">❌ Database connection failed - check console</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="label">
              <Calendar className="w-4 h-4 inline mr-2" />
              Trip Date
            </label>
            <input
              type="date"
              className={`input-field ${errors.date ? 'border-red-500' : ''}`}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="label">
              <User className="w-4 h-4 inline mr-2" />
              Driver Name
            </label>
            <select
              className={`input-field ${errors.driverName ? 'border-red-500' : ''}`}
              value={formData.driverName}
              onChange={(e) => handleInputChange('driverName', e.target.value)}
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.name}>
                  {driver.name}
                </option>
              ))}
            </select>
            {errors.driverName && <p className="text-red-500 text-sm mt-1">{errors.driverName}</p>}
          </div>

          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-2" />
              Start KM
            </label>
            <input
              type="number"
              placeholder="e.g., 1000"
              className="input-field"
              value={formData.startKm}
              onChange={(e) => handleInputChange('startKm', e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-2" />
              End KM
            </label>
            <input
              type="number"
              placeholder="e.g., 1400"
              className="input-field"
              value={formData.endKm}
              onChange={(e) => handleInputChange('endKm', e.target.value)}
            />
          </div>
        </div>

        {/* Auto-calculated Total KM */}
        {formData.totalKm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                Total KM Driven: <span className="text-xl font-bold">{formData.totalKm} km</span>
              </span>
            </div>
          </div>
        )}

        {/* Platform Earnings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Earnings</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {platforms.map(platform => (
              <div key={platform.id}>
                <label className="label">{platform.name}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  className="input-field"
                  value={formData.platformEarnings[platform.id]}
                  onChange={(e) => handlePlatformEarningChange(platform.id, e.target.value)}
                />
              </div>
            ))}
          </div>
          {errors.earnings && <p className="text-red-500 text-sm mt-2">{errors.earnings}</p>}
        </div>

        {/* Cash Collected by Platform */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Collected by Platform</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {platforms.map(platform => (
              <div key={platform.id}>
                <label className="label">{platform.name} Cash</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  className="input-field"
                  value={formData.platformCash[platform.id]}
                  onChange={(e) => handlePlatformCashChange(platform.id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Total Cash Collected:</span>
              <span className="text-lg font-bold text-blue-600">₹{calculations?.totalCashCollected?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Commissions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Deductions (Automated)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uber Commission */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Uber Commission</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasUberCommission"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.hasUberCommission}
                    onChange={(e) => handleInputChange('hasUberCommission', e.target.checked)}
                  />
                  <label htmlFor="hasUberCommission" className="text-sm text-gray-700">
                    Has Uber Commission
                  </label>
                </div>
              </div>
              {formData.hasUberCommission && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <span className="text-green-800 font-semibold">
                    Auto-calculated: ₹117.00
                  </span>
                </div>
              )}
            </div>

            {/* Yatri Commission */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Yatri Sathi Commission</h4>
              <div className="space-y-3">
                <div>
                  <label className="label">Number of Yatri Trips</label>
                  <input
                    type="number"
                    placeholder="e.g., 5"
                    className="input-field"
                    value={formData.yatriTrips}
                    onChange={(e) => handleInputChange('yatriTrips', e.target.value)}
                  />
                </div>
                {formData.yatriTrips && parseFloat(formData.yatriTrips) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <span className="text-green-800 font-semibold">
                      Auto-calculated: {formData.yatriTrips} trips × ₹10 = ₹{(parseFloat(formData.yatriTrips) * 10).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Collection and Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">
                    <Fuel className="w-4 h-4 inline mr-2" />
                    Fuel Expenses
                  </label>
                  <button
                    type="button"
                    onClick={addFuelEntry}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Fuel Entry
                  </button>
                </div>
                {formData.fuelEntries.map((fuel, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <select
                      value={fuel.type}
                      onChange={(e) => updateFuelEntry(index, 'type', e.target.value)}
                      className="flex-shrink-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="cng">CNG</option>
                      <option value="diesel">Diesel</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹0.00"
                      className="flex-1 input-field"
                      value={fuel.amount}
                      onChange={(e) => updateFuelEntry(index, 'amount', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeFuelEntry(index)}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {formData.fuelEntries.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No fuel entries added yet. Click "Add Fuel Entry" to begin.</p>
                )}
              </div>
              <div>
                <label className="label">Other Expenses</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  className="input-field"
                  value={formData.otherExpenses}
                  onChange={(e) => handleInputChange('otherExpenses', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Collection (Automated)</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Online Payments Received
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  className="input-field"
                  value={formData.onlinePayments}
                  onChange={(e) => handleInputChange('onlinePayments', e.target.value)}
                />
              </div>
              
              {/* Hidden - Auto-calculated Total Cash Collected 
              {formData.totalCashCollected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900 font-medium">Total Cash Collected (Auto)</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{parseFloat(formData.totalCashCollected).toFixed(2)}
                  </span>
                  <p className="text-sm text-blue-700 mt-1">
                    Sum of all platform earnings
                  </p>
                </div>
              )}

              Hidden - Auto-calculated Cash in Driver Hand 
              {formData.cashInDriverHand && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <span className="text-green-900 font-medium">Cash in Driver Hand:</span>
                  <div className="text-xl font-bold text-green-600">
                    ₹{formData.cashInDriverHand}
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Total Cash - Online - {formData.driverTookSalary ? 'Driver Salary' : 'No Salary'}
                  </p>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* Driver Actions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="driverTookSalary"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.driverTookSalary}
                onChange={(e) => handleInputChange('driverTookSalary', e.target.checked)}
              />
              <label htmlFor="driverTookSalary" className="text-sm font-medium text-gray-700">
                Driver took salary today
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="cashGivenToCashier"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.cashGivenToCashier}
                onChange={(e) => handleInputChange('cashGivenToCashier', e.target.checked)}
              />
              <label htmlFor="cashGivenToCashier" className="text-sm font-medium text-gray-700">
                Cash given to cashier
              </label>
            </div>

            {/* Cashier Money Input - appears when checkbox is checked */}
            {formData.cashGivenToCashier && (
              <div className="col-span-2">
                <label className="label">Amount Given to Cashier</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  className="input-field"
                  value={formData.cashToCashier}
                  onChange={(e) => handleInputChange('cashToCashier', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Cashier Cash Calculation */}
          {formData.cashGivenToCashier && formData.cashToCashier && parseFloat(formData.cashToCashier) > 0 && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900 font-medium">Cash to Cashier</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    ₹{parseFloat(formData.cashToCashier).toFixed(2)}
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    Amount given to cashier
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <span className="text-green-900 font-medium">Remaining with Driver</span>
                  </div>
                  {(() => {
                    const remaining = calculations ? Math.max(0, calculations.cashInHand - parseFloat(formData.cashToCashier || 0)) : 0;
                    return (
                      <div className="text-xl font-bold text-green-600">
                        ₹{remaining.toFixed(2)}
                      </div>
                    );
                  })()}
                  <p className="text-sm text-green-700 mt-1">
                    Cash in hand - Cashier money
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Calculations */}
        {calculations && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Live Calculations</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Earnings:</span>
                <div className="font-semibold text-lg">₹{calculations.totalEarnings.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Driver Salary (65%):</span>
                <div className="font-semibold text-lg text-green-600">₹{calculations.driverSalary.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Cash in Hand:</span>
                {(() => {
                  const cashInHand = formData.cashGivenToCashier && formData.cashToCashier && 
                    parseFloat(formData.cashToCashier) >= calculations.cashInHand 
                    ? 0 
                    : calculations.cashInHand - parseFloat(formData.cashToCashier || 0);
                  return (
                    <div className="font-semibold text-lg text-orange-600">₹{Math.max(0, cashInHand).toFixed(2)}</div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : 'Save Trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripForm;
