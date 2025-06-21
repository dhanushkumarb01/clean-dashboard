import React from "react";
import PropTypes from "prop-types";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import "../styles/PieChart.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#4285F4", "#34A853", "#FBBC05", "#EA4335",
  "#4285F4", "#34A853", "#FBBC05", "#EA4335"
];

const PieChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: COLORS.slice(0, data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="pie-chart-container">
      <Pie data={chartData} options={options} height={220} />
    </div>
  );
};

PieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    channelId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired
  })).isRequired
};

export default PieChart;