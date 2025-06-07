import React from "react";

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 min-w-[160px]">
    <div className="text-2xl font-semibold text-gray-800">{value}</div>
    <div className="text-gray-500 text-sm">{label}</div>
  </div>
);

export default StatCard; 