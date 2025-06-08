import React, { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import SignaturePadModal from "./SignaturePadModal";
import { downloadTemplatePDF } from "../config/api";
import ChooseTemplateDropdown from "../components/pdfDropdown/PdfDropDown";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const SIDEBAR_WIDTH = 290;

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "image", label: "Sign" },
];

function getDefaultField(type, page) {
  return {
    id: "f_" + Math.random().toString(36).slice(2, 9),
    label: "New Field",
    type,
    x: 50,
    y: 50,
    width: 120,
    height: 32,
    value: "",
    page,
    clientField: false,
    imageId: type === "image" ? "img_" + Math.random().toString(36).slice(2, 7) : undefined, // assign a random imageId for new image field
    imageData: "", // only for image type
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

  // Signature pad modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [pendingImageFieldId, setPendingImageFieldId] = useState(null);
  const [selectedId, setSelectedId] = useState("");


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
    // eslint-disable-next-line
  }, [pdfDoc, currentPage]);

  // Find field by ID (even if ID has changed)
  const getFieldById = (id) => fields.find((f) => f.id === id);

  // Field select logic
  const handleSelectField = (id) => {
    setActiveFieldId(id);
    const f = getFieldById(id);
    setEditField(f ? { ...f } : null);
  };

  // Field change (sidebar edits)
  const handleEditField = (key, value) => {
    setEditField((f) => ({ ...f, [key]: value }));
  };

  // When the ID is changed, all state references must update to keep things working
  useEffect(() => {
    if (!editField) return;
    // If user edited the field id, update all relevant state
    if (activeFieldId && editField.id !== activeFieldId) {
      // Update the ID everywhere in the fields list
      setFields((fields) =>
        fields.map((f) => (f.id === activeFieldId ? { ...editField } : f))
      );
      setActiveFieldId(editField.id); // Update activeFieldId to new id
    }
    // eslint-disable-next-line
  }, [editField?.id]);

  // Save changes from sidebar
  const saveEditField = () => {
    setFields((fields) =>
      fields.map((f) => (f.id === activeFieldId ? { ...editField } : f))
    );
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
    setFields((fields) => fields.filter((f) => f.id !== id));
    if (activeFieldId === id) {
      setActiveFieldId(null);
      setEditField(null);
    }
  };

  // Drag/resize overlays update fields
  const updateField = (id, updates) => {
    // For id change, we already handle in effect, so just update normally
    setFields((fields) =>
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    if (activeFieldId === id) setEditField((f) => ({ ...f, ...updates }));
  };

  // Download logic
  const downloadPdf = async () => {
    if (!pdfDoc) return;
    const pdfBytes = await pdfDoc.getData();
    const pdfLibDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

    for (const field of fields) {
      const page = pdfLibDoc.getPage(field.page - 1);
      const pdfWidth = page.getWidth();
      const pdfHeight = page.getHeight();
      const canvasWidth = canvasDims.width;
      const canvasHeight = canvasDims.height;
      const scaleX = pdfWidth / canvasWidth;
      const scaleY = pdfHeight / canvasHeight;
      const pdfX = field.x * scaleX;
      const pdfY = pdfHeight - (field.y + field.height) * scaleY;
      const pdfWidthField = field.width * scaleX;
      const pdfHeightField = field.height * scaleY;

      if (field.type === "image" && field.imageData) {
        let imgEmbed;
        if (field.imageData.startsWith("data:image/png")) {
          imgEmbed = await pdfLibDoc.embedPng(field.imageData);
        } else {
          imgEmbed = await pdfLibDoc.embedJpg(field.imageData);
        }
        page.drawImage(imgEmbed, {
          x: pdfX,
          y: pdfY,
          width: pdfWidthField,
          height: pdfHeightField,
        });
      } else {
        // text/number/date field
        const fontSize = 14;
        const text = field.value?.toString() || "";
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const verticalAdjust = (pdfHeightField - fontSize) / 2;
        page.drawText(text, {
          x: pdfX + (pdfWidthField - textWidth) / 2,
          y: pdfY + verticalAdjust,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: pdfWidthField,
        });
      }
    }
    const pdfDataUri = await pdfLibDoc.saveAsBase64({ dataUri: true });
    const a = document.createElement("a");
    a.href = pdfDataUri;
    a.download = "filled.pdf";
    a.click();
  };

  // Sidebar image upload: update all fields with same imageId
  const handleSidebarImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !editField?.imageId) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imgData = evt.target.result;
      setFields((fields) =>
        fields.map((f) =>
          f.type === "image" && f.imageId === editField.imageId
            ? { ...f, imageData: imgData }
            : f
        )
      );
      // Also update editField for immediate sidebar preview
      setEditField((f) => ({ ...f, imageData: imgData }));
    };
    reader.readAsDataURL(file);
  };

  // Save signature: update all fields with same imageId
  const handleSaveSignature = (imgData) => {
    const field = getFieldById(pendingImageFieldId);
    if (!field?.imageId) return;
    setFields((fields) =>
      fields.map((f) =>
        f.type === "image" && f.imageId === field.imageId
          ? { ...f, imageData: imgData }
          : f
      )
    );
    if (editField?.imageId === field.imageId)
      setEditField((f) => ({ ...f, imageData: imgData }));

    setShowSignModal(false);
    setPendingImageFieldId(null);
  };
  // Load PDF
    async function handleSelectTemplate(e, templates) {
      const tid = e.target.value;
    //   setSelectedId(tid);
      const t = templates.find(t => t.templateId === tid);
      if (t) {
        // setTemplateName(t.templateName);
        // setTemplateId(t.templateId);
  
        try {
          const resp = await downloadTemplatePDF(t.templateId);
          if (resp.status !== 200 && resp.status !== 201) throw new Error("PDF fetch failed");
          const buf = resp.data; // axios returns .data (already arraybuffer)
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          setPdfDoc(pdf);
        //   setTotalPages(pdf.numPages);
        } catch (err) {
          console.log(err)
          alert("Failed to load PDF for this template.");
        }
      }
    }
  


  // Change imageId for image fields in the sidebar (sync all matching ones)
  const handleEditImageId = (newImageId) => {
    if (!editField) return;
    // Update this field's imageId, and editField state
    setEditField((f) => ({ ...f, imageId: newImageId }));
    // Also update the fields array for this field only (others keep their imageId)
    setFields((fields) =>
      fields.map((f) =>
        f.id === editField.id ? { ...f, imageId: newImageId } : f
      )
    );
  };

  // Field overlay (draggable, resizable, editable)
  const renderField = (field) => {
    if (field.page !== currentPage) return null;
    // For image, find the imageData from fields with same imageId
    let imageData = field.imageData;
    if (field.type === "image" && field.imageId) {
      const src = fields.find(
        (f) => f.type === "image" && f.imageId === field.imageId && f.imageData
      );
      if (src) imageData = src.imageData;
    }

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
          border:
            field.id === activeFieldId ? "2px solid #007bff" : "1px solid #aaa",
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
            userSelect: "none",
          }}
          title="Drag"
        >
          <span style={{ color: "#007bff", fontWeight: 700, fontSize: 16 }}>
            ⠿
          </span>
        </div>
        {/* Field input */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
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
          ) : field.type === "image" ? (
            imageData ? (
              <img
                src={imageData}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
                alt="Sign"
              />
            ) : (
              <span
                style={{
                  color: "#aaa",
                  fontSize: 13,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                No image
              </span>
            )
          ) : null}
        </div>
      </Rnd>
    );
  };

  // Main UI
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f7fa" }}>
      {/* Sidebar */}
      <div
        style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          background: "#fff",
          boxShadow: "2px 0 6px #0001",
          padding: 16,
          overflowY: "auto",
          borderRight: "1px solid #e3e3e3",
        }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Fields</h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft.value}
              style={{
                padding: "3px 10px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "#f5faff",
                cursor: "pointer",
              }}
              onClick={() => handleAddField(ft.value)}
            >
              + {ft.label}
            </button>
          ))}
        </div>
        {fields
          .filter((f) => f.page === currentPage)
          .map((field) => (
            <div
              key={field.id}
              style={{
                padding: "8px 10px",
                marginBottom: 8,
                background: field.id === activeFieldId ? "#e6f2ff" : "#f9f9f9",
                borderRadius: 6,
                border:
                  field.id === activeFieldId
                    ? "1.5px solid #1890ff"
                    : "1px solid #e3e3e3",
                cursor: "pointer",
                transition: "all .15s",
                fontWeight: field.id === activeFieldId ? "600" : "normal",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => handleSelectField(field.id)}
            >
              <div>
                <div style={{ fontSize: 13, color: "#333" }}>{field.label}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{field.type}</div>
                <div style={{ fontSize: 12, color: "#444" }}>
                  {field.type === "image" ? (
                    field.imageData ? (
                      "Image"
                    ) : (
                      <span style={{ color: "#ccc" }}>no image</span>
                    )
                  ) : (
                    field.value || <span style={{ color: "#ccc" }}>empty</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteField(field.id);
                }}
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  color: "#e00",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        {/* Edit panel for active field */}
        {editField && (
          <div
            style={{
              marginTop: 20,
              padding: "10px 8px",
              background: "#f8faff",
              borderRadius: 5,
              border: "1px solid #ddeeff",
            }}
          >
            <h4 style={{ fontSize: 15, marginBottom: 10 }}>Edit Field</h4>
            <div style={{ marginBottom: 8 }}>
              <label>ID</label>
              <input
                value={editField.id}
                onChange={(e) => handleEditField("id", e.target.value)}
                style={{
                  width: "100%",
                  padding: 4,
                  fontSize: 13,
                  borderRadius: 3,
                  border: "1px solid #ccc",
                  marginTop: 2,
                }}
              />
            </div>
            {editField.type === "image" && (
              <div style={{ marginBottom: 8 }}>
                <label>imageId</label>
                <input
                  value={editField.imageId}
                  onChange={(e) => handleEditImageId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  All fields with the same imageId share the image/signature.
                </div>
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <label>Label</label>
              <input
                value={editField.label}
                onChange={(e) => handleEditField("label", e.target.value)}
                style={{
                  width: "100%",
                  padding: 4,
                  fontSize: 13,
                  borderRadius: 3,
                  border: "1px solid #ccc",
                  marginTop: 2,
                }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Type</label>
              <select
                value={editField.type}
                onChange={(e) => handleEditField("type", e.target.value)}
                style={{
                  width: "100%",
                  padding: 4,
                  fontSize: 13,
                  borderRadius: 3,
                  border: "1px solid #ccc",
                  marginTop: 2,
                }}
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={!!editField.clientField}
                onChange={(e) =>
                  handleEditField("clientField", e.target.checked)
                }
                id="clientField"
              />
              <label htmlFor="clientField">Client Field</label>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Value</label>
              {editField.type === "date" ? (
                <input
                  type="date"
                  value={editField.value}
                  onChange={(e) => handleEditField("value", e.target.value)}
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              ) : editField.type === "image" ? (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <button
                      onClick={() => {
                        setPendingImageFieldId(editField.id);
                        setShowSignModal(true);
                      }}
                      style={{
                        padding: "2px 12px",
                        borderRadius: 3,
                        border: "1px solid #aaa",
                        background: "#f0f5ff",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      Draw Signature
                    </button>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleSidebarImageUpload}
                      style={{ border: "none", fontSize: 13 }}
                    />
                  </div>
                  {editField.imageData && (
                    <img
                      src={editField.imageData}
                      alt="Signature"
                      style={{
                        width: 100,
                        border: "1px solid #ddd",
                        borderRadius: 3,
                        marginTop: 5,
                      }}
                    />
                  )}
                </div>
              ) : (
                <input
                  value={editField.value}
                  onChange={(e) => handleEditField("value", e.target.value)}
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label>X</label>
                <input
                  type="number"
                  value={editField.x}
                  onChange={(e) => handleEditField("x", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Y</label>
                <input
                  type="number"
                  value={editField.y}
                  onChange={(e) => handleEditField("y", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <label>Width</label>
                <input
                  type="number"
                  value={editField.width}
                  onChange={(e) =>
                    handleEditField("width", Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Height</label>
                <input
                  type="number"
                  value={editField.height}
                  onChange={(e) =>
                    handleEditField("height", Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: 4,
                    fontSize: 13,
                    borderRadius: 3,
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                />
              </div>
            </div>
            <button
              style={{
                background: "#1890ff",
                color: "#fff",
                border: "none",
                padding: "6px 16px",
                borderRadius: 4,
                marginTop: 10,
                width: "100%",
              }}
              onClick={saveEditField}
              type="button"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 16,
        }}
      >
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
      <ChooseTemplateDropdown
        selectedId={selectedId}
        onTemplateSelect={handleSelectTemplate}
      />
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>
            Page {currentPage}/{pdfDoc?.numPages || 1}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(pdfDoc?.numPages || 1, p + 1))
            }
          >
            Next
          </button>
          <button
            onClick={downloadPdf}
            style={{
              marginLeft: 12,
              background: "#1890ff",
              color: "#fff",
              border: "none",
              padding: "6px 18px",
              borderRadius: 4,
            }}
          >
            Download
          </button>
        </div>
        {/* PDF Canvas + Overlay */}
        <div
          style={{
            position: "relative",
            boxShadow: "0 2px 24px #2221",
            borderRadius: 8,
            background: "#fff",
            overflow: "scroll",
            width: canvasDims.width,
            height: canvasDims.height,
          }}
        >
          <canvas
            ref={pdfCanvasRef}
            style={{ display: "block", overflow: "visible" }}
          />
          {/* Field overlays */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: canvasDims.width,
              height: canvasDims.height,
              pointerEvents: "none",
            }}
          >
            {fields.filter((f) => f.page === currentPage).map(renderField)}
          </div>
        </div>
      </div>
      {/* SignaturePadModal (when needed) */}
      {showSignModal && pendingImageFieldId && (
        <SignaturePadModal
          onSave={handleSaveSignature}
          onClose={() => {
            setShowSignModal(false);
            setPendingImageFieldId(null);
          }}
        />
      )}
    </div>
  );
}
