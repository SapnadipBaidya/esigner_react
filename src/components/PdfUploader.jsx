import { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import "./cssComponent/PdfUploader.css";
import { createTemplate, downloadTemplatePDF } from "../config/api";
import ChooseTemplateDropdown from "./pdfDropdown/PdfDropDown";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

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

  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [uploadedPdfFile, setUploadedPdfFile] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fields, setFields] = useState([]);

  // DropDown needs templates, fetch logic can stay as is, or keep inside ChooseTemplateDropdown

  // Render PDF in canvas
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

  // Upload PDF file (from modal)
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedPdfFile(file);
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
  };

  // Save PDF to backend and render it (from modal)
  async function handleUploadAndSaveTemplate(e) {
    e.preventDefault();
    if (!uploadedPdfFile || !templateId || !templateName) {
      alert("Attach PDF and fill Template Name/ID.");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadedPdfFile);
    formData.append("templateId", templateId);
    formData.append("templateName", templateName);
    formData.append("role", "client");
    formData.append("fields", JSON.stringify(fields || []));
    try {
      await createTemplate(formData);
      alert("PDF uploaded and template saved.");

      // Render immediately (reload from backend for "real" version)
      const buf = await uploadedPdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      setModalOpen(false);
      setTemplateId("");
      setTemplateName("");
      setUploadedPdfFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload PDF.");
    }
  }

  // Handle dropdown template selection
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
        const buf = resp.data;
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (err) {
        alert("Failed to load PDF for this template.");
      }
    }
  }

  // UI
  return (
    <div className="pdfu-root">
      {/* Modularized Dropdown */}
      <ChooseTemplateDropdown
        selectedId={selectedId}
        onTemplateSelect={handleSelectTemplate}
      />

      {/* Button to open modal */}
      <button
        className="pdfu-upload-btn"
        style={{ marginBottom: 14, marginTop: 10 }}
        onClick={() => setModalOpen(true)}
      >
        Upload New Template
      </button>

      {/* Modal Popup */}
      {modalOpen && (
        <div className="pdfu-modal-overlay">
          <div className="pdfu-modal">
            <h3 style={{ marginBottom: 10 }}>Upload New Template</h3>
            <form onSubmit={handleUploadAndSaveTemplate}>
              <div style={{ marginBottom: 10 }}>
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
                      fontSize: 15,
                    }}
                    required
                  />
                </label>
              </div>
              <div style={{ marginBottom: 10 }}>
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
                      fontSize: 15,
                    }}
                    required
                  />
                </label>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label className="pdfu-upload-label">
                  <span className="pdfu-upload-btn">Attach PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFile}
                    className="pdfu-upload-input"
                  />
                  {uploadedPdfFile && (
                    <span style={{ marginLeft: 10, color: "#475569" }}>
                      {uploadedPdfFile.name}
                    </span>
                  )}
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="submit"
                  className="pdfu-upload-btn"
                  style={{ background: "#2563eb", color: "#fff" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="pdfu-upload-btn"
                  style={{ background: "#e0e7ef", color: "#334155" }}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview */}
      <div className="pdfu-canvas-container" style={{ marginTop: 20 }}>
        <canvas ref={canvasRef} className="pdfu-canvas" />
      </div>
    </div>
  );
}
