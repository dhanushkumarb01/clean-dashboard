import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

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
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && (!user || user.role !== requiredRole)) {
    // Not authorized for this role
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;