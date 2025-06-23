import React from 'react';
import { Activity } from 'lucide-react';

const ListCard = ({ title, items, icon, emptyMessage, isFullWidth = false, color = "from-pink-500 to-purple-600" }) => (
  <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${isFullWidth ? 'lg:col-span-2' : ''}`}>
    <div className="flex items-center space-x-3 mb-6">
      <div className={`bg-gradient-to-br ${color} p-2 rounded-lg`}>
        {React.cloneElement(icon, { className: "w-5 h-5 text-white" })}
      </div>
      <h3 className="font-bold text-xl text-gray-800">{title}</h3>
    </div>
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {items && items.length > 0 ? (
        items.map((item, index) => (
          <div key={index} className="group hover:bg-pink-50 p-4 rounded-xl border border-gray-100 hover:border-pink-200 transition-all duration-200 hover:shadow-md">
            <p className="text-gray-700 leading-relaxed">{item}</p>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
);

export default ListCard; 