import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";

const DashboardContainer = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Hide logout button on YouTube dashboard if not authenticated
  const token = localStorage.getItem('token');
  const isYouTubeDashboard = window.location.pathname === '/dashboard';
  const showLogout = !isYouTubeDashboard || !!token;

  return (
    <div className="flex min-h-screen min-w-screen bg-gray-50" style={{ width: '100vw', height: '100vh' }}>
      <Sidebar onLogout={handleLogout} showLogout={showLogout} />
      <div className="flex-1 flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
        {/* Main content area, renders children */}
        <div className="flex-1 overflow-y-auto p-8" style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;