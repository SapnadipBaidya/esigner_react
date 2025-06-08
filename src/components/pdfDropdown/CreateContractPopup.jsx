import React, { useState } from "react";
import "./modal.css"; // Add minimal CSS for modal below or style inline

function CreateContractPopup({ selectedId, open, onClose, onSuccess, createContract }) {
  const [contractName, setContractName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !selectedId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await createContract({
        templateId: selectedId,
        adminId,
        contractName,
      });
      if (resp.status === 200 || resp.status === 201) {
        setContractName("");
        setAdminId("");
        onSuccess && onSuccess(resp.data);
        onClose();
      } else {
        setError("Failed to create contract.");
      }
    } catch (err) {
      setError("Error: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Contract</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Contract Name</label>
            <input
              type="text"
              value={contractName}
              onChange={e => setContractName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label>Admin ID</label>
            <input
              type="text"
              value={adminId}
              onChange={e => setAdminId(e.target.value)}
              required
            />
          </div>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              style={{ marginLeft: 12 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContractPopup;
