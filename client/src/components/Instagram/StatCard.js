import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, change, icon, color = "from-pink-500 to-purple-600" }) => {
  const isIncrease = change >= 0;
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex-1 min-w-[220px] border border-gray-100 hover:border-pink-200 hover:scale-105`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-2 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
        </div>
        <div className={`bg-gradient-to-br ${color} p-3 rounded-xl shadow-lg`}>
          {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
        </div>
      </div>
      {change !== undefined && change !== null && (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
          isIncrease 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${isIncrease ? 'rotate-0' : 'rotate-180'}`} />
          {Math.abs(change)}% {isIncrease ? 'Increase' : 'Decrease'}
        </div>
      )}
    </div>
  );
};

export default StatCard; 