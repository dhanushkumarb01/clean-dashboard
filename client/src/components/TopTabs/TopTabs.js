import React, { useState } from "react";

const TopTabs = () => {
  const [active, setActive] = useState("TELEGRAM");
  return (
    <div className="flex items-center border-b bg-white px-8 pt-4">
      {['TELEGRAM', 'YOUTUBE'].map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`mr-8 pb-2 text-lg font-medium transition-colors duration-150 ${active === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TopTabs; 