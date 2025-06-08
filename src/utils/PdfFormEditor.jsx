import React, { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const SIDEBAR_WIDTH = 290;

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
];

function getDefaultField(type, page) {
  return {
    id: "f_" + Math.random().toString(36).slice(2, 9),
    label: "New Field",
    type,
    x: 50, y: 50, width: 120, height: 32,
    value: "",
    page
  };
}

export default function PdfFormEditor() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fields, setFields] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [editField, setEditField] = useState(null);
  const pdfCanvasRef = useRef(null);
  const [canvasDims, setCanvasDims] = useState({ width: 600, height: 800 });

  // Load PDF
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    setPdfDoc(pdf);
    setCurrentPage(1);
    renderPage(pdf, 1);
    setFields([]);
    setActiveFieldId(null);
    setEditField(null);
  };

  // Render PDF to canvas and set dimensions
  const renderPage = async (pdf, pageNum) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = pdfCanvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    setCanvasDims({ width: viewport.width, height: viewport.height });
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
  };

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage);
  }, [pdfDoc, currentPage]);

  // Field select logic
  const handleSelectField = (id) => {
    setActiveFieldId(id);
    const f = fields.find(f => f.id === id);
    setEditField({ ...f });
  };

  // Field change (sidebar edits)
  const handleEditField = (key, value) => {
    setEditField(f => ({ ...f, [key]: value }));
  };

  // Save changes from sidebar
  const saveEditField = () => {
    setFields(fields => fields.map(f => f.id === editField.id ? { ...editField } : f));
  };

  // Add new field
  const handleAddField = (type) => {
    const newField = getDefaultField(type, currentPage);
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
    setEditField(newField);
  };

  // Delete field
  const handleDeleteField = (id) => {
    setFields(fields => fields.filter(f => f.id !== id));
    if (activeFieldId === id) {
      setActiveFieldId(null);
      setEditField(null);
    }
  };

  // Drag/resize overlays update fields
  const updateField = (id, updates) => {
    setFields(fields => fields.map(f => f.id === id ? { ...f, ...updates } : f));
    if (activeFieldId === id) setEditField(f => ({ ...f, ...updates }));
  };

  // Download
const downloadPdf = async () => {
  if (!pdfDoc) return;
  const pdfBytes = await pdfDoc.getData();
  const pdfLibDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const page = pdfLibDoc.getPage(field.page - 1);
    // PDF page size (true PDF units)
    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();
    console.log("pdf height , width",pdfHeight,pdfWidth)
    // Canvas size (screen, pixels)
    const canvasWidth = canvasDims.width;
    const canvasHeight = canvasDims.height;
    console.log("canvas height , width",canvasHeight,canvasWidth)
    // Scale factors
    const scaleX = pdfWidth / canvasWidth;
    const scaleY = pdfHeight / canvasHeight;
     console.log("scaleX",scaleX)
      console.log("scaleY",scaleY)
      console.log("field.x, field.y, field.width, field.height:", field.x, field.y, field.width, field.height);
    // Scale + adjust Y
    const pdfX = field.x * scaleX;
    // Y must be scaled, then flipped (canvas 0=top, pdf 0=bottom)
    const pdfY = pdfHeight - ((field.y + field.height) * scaleY);
    console.log("pdfX, pdfY:", pdfX, pdfY);
    // Font size: base size * Y-scale (optional, or tweak for your font)
const pdfWidthField = field.width * scaleX;
const pdfHeightField = field.height * scaleY;
const fontSize = 14;
const verticalAdjust = (pdfHeightField - fontSize) / 2;
const textWidth = font.widthOfTextAtSize(field.value?.toString() || "", fontSize);
// For left-aligned (input-style):
page.drawText(field.value?.toString() || "", {
  x: pdfX + (pdfWidthField - textWidth) / 2,
  y: pdfY + verticalAdjust,
  size: fontSize,
  font,
  color: rgb(0, 0, 0),
  maxWidth: pdfWidthField,
});

  }

  const pdfDataUri = await pdfLibDoc.saveAsBase64({ dataUri: true });
  const a = document.createElement("a");
  a.href = pdfDataUri;
  a.download = "filled.pdf";
  a.click();
};


  // Field overlay (draggable with handle, resizable with mouse)
  const renderField = (field) => {
    if (field.page !== currentPage) return null;
    return (
      <Rnd
        key={field.id}
        size={{ width: field.width, height: field.height }}
        position={{ x: field.x, y: field.y }}
        onDragStop={(e, d) => updateField(field.id, { x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) =>
          updateField(field.id, {
            width: parseInt(ref.style.width, 10),
            height: parseInt(ref.style.height, 10),
            x: position.x,
            y: position.y,
          })
        }
        bounds="parent"
        style={{
          zIndex: field.id === activeFieldId ? 20 : 10,
          background: "rgba(255,255,255,0.5)",
          border: field.id === activeFieldId ? "2px solid #007bff" : "1px solid #aaa",
          borderRadius: 4,
          boxShadow: field.id === activeFieldId ? "0 0 8px #007bff77" : "",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          pointerEvents: "auto",
        }}
        dragHandleClassName={`field-drag-handle-${field.id}`}
        enableResizing={true}
        onClick={() => handleSelectField(field.id)}
      >
        {/* Drag handle */}
        <div
          className={`field-drag-handle-${field.id}`}
          style={{
            width: 14,
            height: "100%",
            background: "#007bff33",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            marginRight: 4,
            userSelect: "none"
          }}
          title="Drag"
        >
          <span style={{ color: "#007bff", fontWeight: 700, fontSize: 16 }}>⠿</span>
        </div>
        {/* Field input */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", height: "100%" }}>
          {field.type === "text" || field.type === "number" ? (
            <input
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "transparent",
                fontSize: 14,
                outline: "none",
                padding: "2px 6px",
              }}
              value={field.value}
              onChange={(e) => updateField(field.id, { value: e.target.value })}
            />
          ) : field.type === "date" ? (
            <input
              type="date"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "transparent",
                fontSize: 14,
                outline: "none",
                padding: "2px 6px",
              }}
              value={field.value}
              onChange={(e) => updateField(field.id, { value: e.target.value })}
            />
          ) : null}
        </div>
      </Rnd>
    );
  };

  // Main UI
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f7fa" }}>
      {/* Sidebar */}
      <div style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        background: "#fff",
        boxShadow: "2px 0 6px #0001",
        padding: 16,
        overflowY: "auto",
        borderRight: "1px solid #e3e3e3",
      }}>
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Fields</h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {FIELD_TYPES.map(ft => (
            <button
              key={ft.value}
              style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", background: "#f5faff", cursor: "pointer" }}
              onClick={() => handleAddField(ft.value)}
            >+ {ft.label}</button>
          ))}
        </div>
        {fields.filter(f => f.page === currentPage).map(field => (
          <div
            key={field.id}
            style={{
              padding: "8px 10px",
              marginBottom: 8,
              background: field.id === activeFieldId ? "#e6f2ff" : "#f9f9f9",
              borderRadius: 6,
              border: field.id === activeFieldId ? "1.5px solid #1890ff" : "1px solid #e3e3e3",
              cursor: "pointer",
              transition: "all .15s",
              fontWeight: field.id === activeFieldId ? "600" : "normal",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
            onClick={() => handleSelectField(field.id)}
          >
            <div>
              <div style={{ fontSize: 13, color: "#333" }}>{field.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{field.type}</div>
              <div style={{ fontSize: 12, color: "#444" }}>{field.value || <span style={{color:"#ccc"}}>empty</span>}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }}
              style={{ marginLeft: 10, background: "transparent", color: "#e00", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >✕</button>
          </div>
        ))}
        {/* Edit panel for active field */}
        {editField && (
          <div style={{ marginTop: 20, padding: "10px 8px", background: "#f8faff", borderRadius: 5, border: "1px solid #ddeeff" }}>
            <h4 style={{ fontSize: 15, marginBottom: 10 }}>Edit Field</h4>
            <div style={{ marginBottom: 8 }}>
              <label>ID</label>
              <input
                value={editField.id}
                onChange={e => handleEditField("id", e.target.value)}
                style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Label</label>
              <input
                value={editField.label}
                onChange={e => handleEditField("label", e.target.value)}
                style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Type</label>
              <select
                value={editField.type}
                onChange={e => handleEditField("type", e.target.value)}
                style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
              >
                {FIELD_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Value</label>
              {editField.type === "date" ? (
                <input
                  type="date"
                  value={editField.value}
                  onChange={e => handleEditField("value", e.target.value)}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              ) : (
                <input
                  value={editField.value}
                  onChange={e => handleEditField("value", e.target.value)}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label>X</label>
                <input type="number"
                  value={editField.x}
                  onChange={e => handleEditField("x", Number(e.target.value))}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Y</label>
                <input type="number"
                  value={editField.y}
                  onChange={e => handleEditField("y", Number(e.target.value))}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <label>Width</label>
                <input type="number"
                  value={editField.width}
                  onChange={e => handleEditField("width", Number(e.target.value))}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Height</label>
                <input type="number"
                  value={editField.height}
                  onChange={e => handleEditField("height", Number(e.target.value))}
                  style={{ width: "100%", padding: 4, fontSize: 13, borderRadius: 3, border: "1px solid #ccc", marginTop: 2 }}
                />
              </div>
            </div>
            <button
              style={{ background: "#1890ff", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 4, marginTop: 10, width: "100%" }}
              onClick={saveEditField}
            >Save</button>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {currentPage}/{pdfDoc?.numPages || 1}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(pdfDoc?.numPages || 1, p + 1))}>Next</button>
          <button onClick={downloadPdf} style={{ marginLeft: 12, background: "#1890ff", color: "#fff", border: "none", padding: "6px 18px", borderRadius: 4 }}>Download</button>
        </div>
        {/* PDF Canvas + Overlay */}
        <div style={{
          position: "relative",
          boxShadow: "0 2px 24px #2221",
          borderRadius: 8,
          background: "#fff",
          overflow: "hidden",
          width: canvasDims.width,
          height: canvasDims.height,
        }}>
          <canvas ref={pdfCanvasRef} style={{ display: "block" }} />
          {/* Field overlays */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: canvasDims.width,
            height: canvasDims.height,
            pointerEvents: "none"
          }}>
            {fields.filter(f => f.page === currentPage).map(renderField)}
          </div>
        </div>
      </div>
    </div>
  );
}
