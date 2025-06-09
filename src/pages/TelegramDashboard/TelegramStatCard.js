import React from "react";

const TelegramStatCard = ({ label, value, icon, color }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
      pink: "bg-pink-50 border-pink-200 text-pink-800",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
      red: "bg-red-50 border-red-200 text-red-800",
      teal: "bg-teal-50 border-teal-200 text-teal-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800"
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIconBgColor = (color) => {
    const colorMap = {
      blue: "bg-blue-100",
      green: "bg-green-100",
      purple: "bg-purple-100",
      indigo: "bg-indigo-100",
      pink: "bg-pink-100",
      yellow: "bg-yellow-100",
      red: "bg-red-100",
      teal: "bg-teal-100",
      orange: "bg-orange-100"
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${getColorClasses(color)} p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`${getIconBgColor(color)} rounded-full p-3 flex items-center justify-center`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default TelegramStatCard; 