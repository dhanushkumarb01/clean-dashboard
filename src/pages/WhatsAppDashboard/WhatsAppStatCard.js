import React from 'react';

const WhatsAppStatCard = ({ label, value, icon, color = 'green' }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700'
  };

  const iconColorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    pink: 'bg-pink-100 text-pink-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color] || colorClasses.green} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className={`p-3 rounded-full text-2xl ${iconColorClasses[color] || iconColorClasses.green}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppStatCard;
