import { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import "./cssComponent/PdfUploader.css";
import { createTemplate, downloadTemplatePDF, getAllTemplates } from "../config/api";
import ChooseTemplateDropdown from "./pdfDropdown/PdfDropDown";

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

  // State
  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [uploadedPdfFile, setUploadedPdfFile] = useState(null);
  const [fields, setFields] = useState([]);

  // Load PDF page into canvas
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

  // File upload handler
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedPdfFile(file);
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
  };

  // Save template metadata locally and reset state
  function handleSaveTemplate(e) {
    e.preventDefault();
    if (!templateName.trim() || !templateId.trim()) {
      alert("Please provide both template name and ID.");
      return;
    }
    setSaved(true);
    saveTemplateToStorage({ templateName, templateId });
  }

  // Save PDF to backend
  async function handleUploadAndSaveTemplate() {
    if (!uploadedPdfFile || !templateId || !templateName) {
      alert("Attach PDF and fill Template Name/ID.");
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadedPdfFile);
    formData.append('templateId', templateId);
    formData.append('templateName', templateName);
    formData.append('role', 'client');
    formData.append('fields', JSON.stringify(fields || []));
    try {
      const res = await createTemplate(formData);
      alert("PDF uploaded and template saved.");
      // You might want to refresh template list here if needed
    } catch (err) {
      console.error('Upload failed:', err);
      alert("Failed to upload PDF.");
    }
  }

  // Download and load template PDF on select
  async function handleSelectTemplate(e, templates) {
    const tid = e.target.value;
    setSelectedId(tid);
    const t = templates.find(t => t.templateId === tid);
    if (t) {
      setTemplateName(t.templateName);
      setTemplateId(t.templateId);

      try {
        const resp = await downloadTemplatePDF(t.templateId);
        if (resp.status !== 200 && resp.status !== 201) throw new Error("PDF fetch failed");
        const buf = resp.data; // axios returns .data (already arraybuffer)
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.log(err)
        alert("Failed to load PDF for this template.");
      }
    }
  }

  // Optionally: Reset form to allow new entry
  function handleReset() {
    setSaved(false);
    setTemplateName("");
    setTemplateId("");
    setSelectedId("");
    setUploadedPdfFile(null);
    setPdfDoc(null);
    setFields([]);
  }

  return (
    <div className="pdfu-root">
      {/* Modularized Dropdown */}
      <ChooseTemplateDropdown
        selectedId={selectedId}
        onTemplateSelect={handleSelectTemplate}
      />

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
          <button
            className="pdfu-upload-btn"
            style={{ marginLeft: 12, marginBottom: 8, background: "#2563eb", color: "#fff" }}
            onClick={handleUploadAndSaveTemplate}
            type="button"
          >
            Save PDF
          </button>
          <div className="pdfu-canvas-container">
            <canvas ref={canvasRef} className="pdfu-canvas" />
          </div>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
            <strong>Template:</strong> <span>{templateName}</span><br />
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
