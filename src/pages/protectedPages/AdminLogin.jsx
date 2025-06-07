import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // For demo, any credentials work; add real validation later
    localStorage.setItem("role", "admin");
    navigate("/"); // Refresh, shows admin dashboard/landing
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", textAlign: "center" }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input
          style={{ width: "80%", margin: "0.5rem" }}
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        /><br />
        <input
          style={{ width: "80%", margin: "0.5rem" }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        <button style={{ marginTop: 16 }} type="submit">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
