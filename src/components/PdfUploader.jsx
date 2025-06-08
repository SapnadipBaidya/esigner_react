import { useRef, useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import "./cssComponent/PdfUploader.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const LOCAL_STORAGE_KEY = "demo_templates";

function getTemplatesFromStorage() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
}

function saveTemplateToStorage(template) {
  const existing = getTemplatesFromStorage();
  const filtered = existing.filter(t => t.templateId !== template.templateId);
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify([...filtered, template])
  );
}

export default function PdfUploader({
  pdfDoc,
  setPdfDoc,
  totalPages,
  setTotalPages,
  currentPage,
  scale,
  setScale,
}) {
  const canvasRef = useRef(null);

  // New: List of saved templates
  const [templates, setTemplates] = useState(getTemplatesFromStorage());
  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  // PDF Upload handler
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
  };

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc) return;
    const render = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    };
    render();
  }, [pdfDoc, currentPage, scale]);

  // Handle save
  function handleSaveTemplate(e) {
    e.preventDefault();
    if (!templateName.trim() || !templateId.trim()) {
      alert("Please provide both template name and ID.");
      return;
    }
    setSaved(true);
    saveTemplateToStorage({ templateName, templateId });
    setTemplates(getTemplatesFromStorage());
  }

  // Handle selection from dropdown
  function handleSelectTemplate(e) {
    const tid = e.target.value;
    setSelectedId(tid);
    const t = templates.find(t => t.templateId === tid);
    if (t) {
      setTemplateName(t.templateName);
      setTemplateId(t.templateId);
    }
  }

  // Optionally: Reset to allow new entry
  function handleReset() {
    setSaved(false);
    setTemplateName("");
    setTemplateId("");
    setSelectedId("");
  }

  return (
    <div className="pdfu-root">
      {/* Dropdown for previous templates */}
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
            onChange={handleSelectTemplate}
          >
            <option value="">-- Select --</option>
            {templates.map(t => (
              <option key={t.templateId} value={t.templateId}>
                {t.templateName} ({t.templateId})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Template Name and ID Entry */}
      {!saved && (
        <form
          className="pdfu-form"
          onSubmit={handleSaveTemplate}
          style={{
            marginBottom: 18,
            background: "#f1f5f9",
            borderRadius: 8,
            padding: 14,
            minWidth: 290,
            boxShadow: "0 2px 10px 0 rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 500, fontSize: 14 }}>
              Template Name<br />
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 5,
                  border: "1.2px solid #cbd5e1",
                  marginTop: 4,
                  fontSize: 15
                }}
                required
              />
            </label>
          </div>
          <div>
            <label style={{ fontWeight: 500, fontSize: 14 }}>
              Template ID<br />
              <input
                type="text"
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 5,
                  border: "1.2px solid #cbd5e1",
                  marginTop: 4,
                  fontSize: 15
                }}
                required
              />
            </label>
          </div>
          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 5,
              padding: "7px 22px",
              border: "none",
              marginTop: 12,
              fontSize: 15,
              cursor: "pointer"
            }}
          >
            Save Template
          </button>
        </form>
      )}

      {/* Only show PDF upload if saved */}
      {saved && (
        <>
          <label className="pdfu-upload-label">
            <span className="pdfu-upload-btn">Attach PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              className="pdfu-upload-input"
            />
          </label>
          <div className="pdfu-canvas-container">
            <canvas ref={canvasRef} className="pdfu-canvas" />
          </div>
          <div style={{marginTop: 12, color: "#64748b", fontSize: 14}}>
            <strong>Template:</strong> <span>{templateName}</span><br/>
            <strong>ID:</strong> <span>{templateId}</span>
          </div>
          <button
            style={{
              marginTop: 14,
              color: "#334155",
              background: "#e0e7ef",
              padding: "5px 18px",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
            onClick={handleReset}
          >Switch Template</button>
        </>
      )}
    </div>
  );
}
