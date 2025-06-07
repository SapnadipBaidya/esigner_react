import './cssComponent/FieldConfigPanel.css';

export default function FieldConfigPanel({
  fields, activeFieldId, setActiveFieldId, updateField, deleteField, duplicateField, currentPage
}) {
  const field = fields.find(f => f.id === activeFieldId);

  function handleIdChange(e) {
    const newId = e.target.value.trim();
    if (!newId) return;
    updateField(field.id, { id: newId });
    setActiveFieldId(newId);
  }

  function handleSigGroupIdChange(e) {
    updateField(field.id, { sigGroupId: e.target.value });
  }

  return (
    <div className="fcp-root">
      {/* Field editor if one is selected */}
      {field ? (
        <div>
          <div className="fcp-group">
            <label className="fcp-label">Field ID<br />
              <input
                value={field.id}
                onChange={handleIdChange}
                className="fcp-input"
              />
            </label>
          </div>
          <div className="fcp-group">
            <label className="fcp-label">Label<br />
              <input
                value={field.label}
                onChange={e => updateField(field.id, { label: e.target.value })}
                className="fcp-input"
              />
            </label>
          </div>
          <div className="fcp-group">
            <label className="fcp-label">Type<br />
              <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value })} className="fcp-input">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="signature">Signature</option>
              </select>
            </label>
          </div>
          {/* Signature Group Link UI */}
          {field.type === 'signature' && (
            <div className="fcp-group fcp-signature-group">
              <label className="fcp-label">Signature Group ID<br />
                <input
                  value={field.sigGroupId || ""}
                  onChange={handleSigGroupIdChange}
                  placeholder="Enter or copy/paste to link"
                  className="fcp-input"
                />
              </label>
              <div className="fcp-hint">
                Fields with the same group ID will share signatures.
              </div>
              {field.sigGroupId && fields.filter(
                f => f.type === "signature" && f.sigGroupId === field.sigGroupId && f.id !== field.id
              ).length > 0 && (
                <div className="fcp-link-info">
                  Linked to {fields.filter(
                    f => f.type === "signature" && f.sigGroupId === field.sigGroupId && f.id !== field.id
                  ).length} other signature(s).
                </div>
              )}
            </div>
          )}
          <div className="fcp-group fcp-flex-row">
            <label className="fcp-label">Width<br />
              <input type="number" value={field.width} onChange={e => updateField(field.id, { width: parseInt(e.target.value) || 40 })} className="fcp-input fcp-input-short" />
            </label>
            <label className="fcp-label" style={{ marginLeft: 16 }}>Height<br />
              <input type="number" value={field.height} onChange={e => updateField(field.id, { height: parseInt(e.target.value) || 24 })} className="fcp-input fcp-input-short" />
            </label>
          </div>
          <div className="fcp-group fcp-flex-row">
            <label className="fcp-label">X<br />
              <input type="number" value={field.x} onChange={e => updateField(field.id, { x: parseInt(e.target.value) || 0 })} className="fcp-input fcp-input-short" />
            </label>
            <label className="fcp-label" style={{ marginLeft: 16 }}>Y<br />
              <input type="number" value={field.y} onChange={e => updateField(field.id, { y: parseInt(e.target.value) || 0 })} className="fcp-input fcp-input-short" />
            </label>
          </div>
          <div className="fcp-group fcp-btn-row">
            <button className="fcp-btn" onClick={() => duplicateField(field.id)}>Duplicate</button>
            <button className="fcp-btn fcp-btn-danger" onClick={() => deleteField(field.id)}>Delete</button>
          </div>
          <div className="fcp-group">
            <button className="fcp-btn fcp-btn-secondary" onClick={() => setActiveFieldId(null)}>Deselect</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="fcp-empty-title">Select a field to edit</div>
          <div className="fcp-empty-hint">
            Or click a field on the PDF or from below:
          </div>
        </div>
      )}

      {/* Always show list of fields */}
      <div className="fcp-fields-list-section">
        <div className="fcp-fields-list-title">Fields on Page {currentPage}</div>
        <ul className="fcp-fields-list">
          {fields.filter(f => f.page === currentPage).map(f => (
            <li key={f.id}
                className={
                  f.id === activeFieldId ? "fcp-fields-list-item fcp-fields-list-item-active" : "fcp-fields-list-item"
                }
                onClick={() => setActiveFieldId(f.id)}
            >
              {f.label} ({f.type}) [{f.id}]
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
