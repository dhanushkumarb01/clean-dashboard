import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check for OAuth callback success
    const params = new URLSearchParams(location.search);
    if (params.get("youtube_connected") === "true") {
      // Clear the URL parameter but stay on the current page
      window.history.replaceState({}, "", location.pathname);
    }
    setIsChecking(false);
  }, [location]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;