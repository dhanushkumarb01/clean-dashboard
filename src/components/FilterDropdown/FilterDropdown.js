import React from "react";

const FilterDropdown = ({ value, onChange }) => (
  <select
    className="border rounded px-4 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    <option value="all">All Time</option>
    <option value="month">This Month</option>
    <option value="week">This Week</option>
  </select>
);

export default FilterDropdown; 