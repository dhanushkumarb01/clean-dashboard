import React, { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';

const EngagementChart = ({ data }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const chartConfig = {
        type: 'line',
        data: {
          labels: data.map(item => new Date(item.date).toLocaleDateString()),
          datasets: [{
            label: 'Engagement Rate',
            data: data.map(item => item.engagement_rate),
            borderColor: 'rgb(236, 72, 153)',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: value => value + '%' }
            }
          }
        }
      };
      setChartData(chartConfig);
    }
  }, [data]);

  if (!chartData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center py-8">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No engagement data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-xl text-gray-800">Engagement Over Time</h3>
      </div>
      <div className="h-64">
        {/* Chart would be rendered here with Chart.js */}
        <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
};

export default EngagementChart; 