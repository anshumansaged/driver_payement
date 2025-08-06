import React from 'react';

const Tabs = ({ children, defaultValue, value, onValueChange }) => {
  return (
    <div className="tabs">
      {children}
    </div>
  );
};

const TabsList = ({ children }) => {
  return (
    <div className="flex border-b border-gray-200">
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeValue, children }) => {
  if (value !== activeValue) return null;
  
  return (
    <div className="py-4">
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
