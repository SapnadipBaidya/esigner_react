import "./cssComponent/Toolbar.css";

const FIELD_TYPES = [
  { type: "text", label: "Text" },
  { type: "number", label: "Number" },
  { type: "date", label: "Date" },
  { type: "signature", label: "Signature" },
];

export default function Toolbar({
  addField,
  totalPages,
  currentPage,
  setCurrentPage,
  scale,
  setScale,
  fields // <-- Add this prop!
}) {
  // Local save handler (example: saves to localStorage)
  function handleSaveFields() {
    try {
      localStorage.setItem("pdf_template_fields", JSON.stringify(fields));
      alert("Fields saved successfully!");
    } catch (err) {
      alert("Failed to save fields!");
    }
  }

  return (
    <div className="tb-root">
      <div className="tb-field-btns">
        {FIELD_TYPES.map((f) => (
          <button
            key={f.type}
            className="tb-btn tb-field"
            onClick={() => addField(f.type)}
          >
            + {f.label}
          </button>
        ))}
        <button
          className="tb-btn tb-save"
          style={{ background: "#059669", marginLeft: 12 }}
          onClick={handleSaveFields}
        >
          Save Fields
        </button>
      </div>
      <div className="tb-zoom">
        <button
          className="tb-btn tb-zoom-btn"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
        >
          −
        </button>
        <span className="tb-zoom-info">
          Zoom: {Math.round(scale * 100)}%
        </span>
        <button
          className="tb-btn tb-zoom-btn"
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
        >
          +
        </button>
      </div>
      <div className="tb-pagination">
        <button
          className="tb-btn tb-nav"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          Prev
        </button>
        <span className="tb-page-info">
          Page {currentPage} / {totalPages}
        </span>
        <button
          className="tb-btn tb-nav"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
