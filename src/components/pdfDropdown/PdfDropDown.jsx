
import React, { useCallback, useEffect, useState } from 'react'
import { getAllTemplates } from '../../config/api';

function ChooseTemplateDropdown({ onTemplateSelect, selectedId }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all templates
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllTemplates();
      const apiTemplates = res.data.templates.map(t => ({
        templateId: t.id || t._id,
        templateName: t.name,
        pdfUrl: t.pdfPath?.startsWith("http")
          ? t.pdfPath
          : `http://localhost:3000/${t.pdfPath}`,
      }));
      setTemplates(apiTemplates);
      // Optionally merge with local storage:
      // setTemplates([...apiTemplates, ...getTemplatesFromStorage()]);
    } catch (err) {
      console.error('Failed to load templates from API', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div style={{ marginBottom: 12, width: "100%" }}>
      <label style={{ fontWeight: 500, fontSize: 14 }}>
        Choose Saved Template: <br />
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
          value={selectedId}
          onChange={e => onTemplateSelect(e, templates)}
        >
          <option value="">-- Select --</option>
          {templates.map(t => (
            <option key={t.templateId} value={t.templateId}>
              {t.templateName} ({t.templateId})
            </option>
          ))}
        </select>
        {isLoading && <span style={{ marginLeft: 8, color: "#888" }}>Loading…</span>}
      </label>
    </div>
  );
}

export default ChooseTemplateDropdown