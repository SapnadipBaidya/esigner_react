// FieldsOverlay.jsx
import { useRef } from "react";

export default function FieldsOverlay({
  pdfDoc, fields, setFields, activeFieldId, setActiveFieldId, currentPage,
}) {
  const dragging = useRef(null);

  function handleMouseDown(e, id) {
    const field = fields.find(f => f.id === id);
    if (!field) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: field.x, origY: field.y };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onMove(e) {
    if (!dragging.current) return;
    setFields(fields =>
      fields.map(f =>
        f.id === dragging.current.id
          ? { ...f, x: dragging.current.origX + (e.clientX - dragging.current.startX), y: dragging.current.origY + (e.clientY - dragging.current.startY) }
          : f
      )
    );
  }

  function onUp() {
    dragging.current = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  // Render only fields for current page
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        top: 0, left: 0, right: 0, bottom: 0,
      }}
    >
      {fields.filter(f => f.page === currentPage).map(field => (
        <div
          key={field.id}
          style={{
            position: "absolute",
            left: field.x, top: field.y,
            width: field.width, height: field.height,
            background: activeFieldId === field.id ? "#dbeafe" : "#f1f5f9",
            border: "1px solid #60a5fa",
            zIndex: 2,
            cursor: "move",
            userSelect: "none",
            boxSizing: "border-box",
            padding: 2,
            pointerEvents: "auto",
          }}
          onMouseDown={e => {
            e.stopPropagation();
            handleMouseDown(e, field.id);
            setActiveFieldId(field.id);
          }}
        >
          <div style={{ fontSize: 12 }}>{field.label}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{field.type}</div>
        </div>
      ))}
    </div>
  );
}
