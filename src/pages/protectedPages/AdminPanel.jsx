import React, { useState } from "react";
import "./AdminPanel.css";
import Contract from "./adminActionComps/contracts/Contract";
import Template from "./adminActionComps/templates/Template";

const SIDEBAR_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "templates", label: "Templates" },
  { key: "contracts", label: "Contracts" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit Logs" },
  { key: "settings", label: "Settings" }
];

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Simple stub content for demonstration
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <h2>Welcome to Admin Panel</h2>
            <p>This is your dashboard. Select an item from the sidebar.</p>
          </>
        );
      case "templates":
        return <Template/>;
      case "contracts":
        return <Contract/>;
      case "users":
        return <h2>User Management</h2>;
      case "audit":
        return <h2>Audit Logs</h2>;
      case "settings":
        return <h2>Settings</h2>;
      default:
        return null;
    }
  };

  return (
    <div className="admin-root">
      <nav className="admin-topbar">
        <div className="admin-logo">e-Contract Admin</div>
        <div className="admin-top-actions">
          <button className="admin-btn">Notifications</button>
          <button className="admin-btn">Profile</button>
          <button className="admin-btn logout">Logout</button>
        </div>
      </nav>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <ul>
            {SIDEBAR_TABS.map(tab => (
              <li
                key={tab.key}
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </li>
            ))}
          </ul>
        </aside>
        <main className="admin-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default AdminPanel;
