import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/protectedPages/AdminLogin";
import FillPage from "./pages/FillPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/protectedPages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute children={<AdminPanel/>}/>
        } />
        <Route path="/fill" element={<FillPage />} />
        {/* Add other admin routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
