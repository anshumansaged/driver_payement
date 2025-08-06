import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, Plus, Minus, History, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/calculations';
import sheetDBService from '../services/sheetdb';

const CashierPanel = () => {
  const [cashierData, setCashierData] = useState({
    totalCash: 0,
    transactions: []
  });
  const [showPanel, setShowPanel] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [transactionType, setTransactionType] = useState('add');
  const [transactionNote, setTransactionNote] = useState('');

  const OWNER_PASSWORD = 'owner123'; // In production, use environment variables

  useEffect(() => {
    loadCashierData();
  }, []);

  const loadCashierData = () => {
    const data = sheetDBService.getCashierDataFromLocalStorage();
    setCashierData(data);
  };

  const handleOwnerLogin = () => {
    if (ownerPassword === OWNER_PASSWORD) {
      setShowPanel(true);
      setOwnerPassword('');
    } else {
      alert('Incorrect password');
      setOwnerPassword('');
    }
  };

  const handleManualTransaction = async () => {
    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await sheetDBService.updateCashierCash(
        parseFloat(manualAmount), 
        transactionType
      );
      
      loadCashierData();
      setManualAmount('');
      setTransactionNote('');
      alert(`Cash ${transactionType === 'add' ? 'added to' : 'withdrawn from'} cashier successfully`);
    } catch (error) {
      console.error('Error updating cashier cash:', error);
      alert('Error updating cash. Please try again.');
    }
  };

  const getTodaysTransactions = () => {
    const today = new Date().toISOString().split('T')[0];
    return cashierData.transactions.filter(transaction => 
      transaction.date === today
    );
  };

  const getWeeklyTotal = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return cashierData.transactions
      .filter(transaction => new Date(transaction.date) >= weekAgo)
      .reduce((total, transaction) => {
        return transaction.type === 'received' 
          ? total + transaction.amount 
          : total - transaction.amount;
      }, 0);
  };

  if (!showPanel) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="text-center">
          <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cashier Panel</h3>
          <p className="text-gray-600 mb-4">Owner access required to view cash details</p>
          
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Enter owner password"
              className="input-field"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleOwnerLogin()}
            />
            <button
              onClick={handleOwnerLogin}
              className="btn-primary w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Access Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todaysTransactions = getTodaysTransactions();
  const weeklyTotal = getWeeklyTotal();

  return (
    <div className="space-y-6">
      {/* Header with logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cashier Panel</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            Owner Access
          </span>
        </div>
        
        <button
          onClick={() => {
            setShowPanel(false);
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <EyeOff className="w-4 h-4" />
          Hide Panel
        </button>
      </div>

      {/* Cash Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Cash with Cashier</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(cashierData.totalCash)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Today's Transactions</h3>
              <p className="text-3xl font-bold text-blue-600">
                {todaysTransactions.length}
              </p>
            </div>
            <History className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Weekly Net</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(weeklyTotal)}
              </p>
            </div>
            <Plus className="w-12 h-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Manual Transaction */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Cash Transaction</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Transaction Type</label>
            <select
              className="input-field"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="add">Add Cash (Received)</option>
              <option value="subtract">Withdraw Cash (Given)</option>
            </select>
          </div>
          
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              placeholder="₹0.00"
              className="input-field"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="label">Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g., Cash from driver, Emergency withdrawal, etc."
            className="input-field"
            value={transactionNote}
            onChange={(e) => setTransactionNote(e.target.value)}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleManualTransaction}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              transactionType === 'add'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {transactionType === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {transactionType === 'add' ? 'Add Cash' : 'Withdraw Cash'}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions ({cashierData.transactions.length})
        </h3>
        
        {cashierData.transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet</p>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashierData.transactions
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 10)
                  .map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'received'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'received' ? 'Received' : 'Withdrawn'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
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

export default CashierPanel;
