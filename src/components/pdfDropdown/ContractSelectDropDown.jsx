import React, { useEffect, useState, useCallback } from 'react';
import { getContractsByTempId } from '../../config/api'; // <-- update import as needed

function ContractSelectDropDown({ templateId, onContractSelect, selectedContractId }) {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all contracts for the templateId
  const fetchContracts = useCallback(async () => {
    if (!templateId) {
      setContracts([]);
      return;
    }
    setIsLoading(true);
    try {
      const resp = await getContractsByTempId({ templateId });
      // resp.data should be an array of contract objects
      setContracts(resp?.data?.contracts || []);
    } catch (err) {
      console.error('Failed to load contracts from API', err);
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return (
    <div style={{ marginBottom: 12, width: "100%" }}>
      <label style={{ fontWeight: 500, fontSize: 14 }}>
        Choose Contract:
        <br />
        <select
          style={{
            marginTop: 6,
            padding: "6px 10px",
            borderRadius: 5,
            border: "1.2px solid #cbd5e1",
            fontSize: 15,
            minWidth: 220,
            background: "#f8fafc"
          }}
          value={selectedContractId}
          onChange={e => onContractSelect(e, contracts)}
          disabled={!contracts.length}
        >
          <option value="">-- Select --</option>
          {contracts?.map(c => (
            <option key={c._id} value={c._id}>
              {c.contractName} ({c._id})
            </option>
          ))}
        </select>
        {isLoading && <span style={{ marginLeft: 8, color: "#888" }}>Loading…</span>}
      </label>
    </div>
  );
}

export default ContractSelectDropDown;
