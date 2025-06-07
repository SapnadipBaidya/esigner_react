import React from "react";
import { Navigate } from "react-router-dom";
import AdminLogin from "../pages/protectedPages/AdminLogin";

const isAdminLoggedIn = () => {
  return localStorage.getItem("role") === "admin";
};

const ProtectedRoute = ({ children }) => {
  if (!isAdminLoggedIn()) {
    return   <AdminLogin />;
  }
  return children;
};

export default ProtectedRoute;
