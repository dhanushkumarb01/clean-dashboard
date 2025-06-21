import React from "react";

const Tabs = ({ activeTab, onTabChange }) => (
  <div className="flex items-center border-b bg-white px-8 pt-4">
    {["TELEGRAM", "YOUTUBE"].map((tab) => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        className={`mr-8 pb-2 text-lg font-medium transition-colors duration-150 ${
          activeTab === tab
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-500 hover:text-blue-500"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default Tabs; 