import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" />;
  }

  // Render the component if authenticated
  return children;
};

export default PrivateRoute;
