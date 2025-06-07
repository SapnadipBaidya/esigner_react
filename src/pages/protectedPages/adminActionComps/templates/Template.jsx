// Template.jsx
import useFields from "../../../../components/useFields";
import PdfUploader from "../../../../components/PdfUploader";
import Toolbar from "../../../../components/Toolbar";
import FieldsOverlay from "../../../../components/FieldsOverlay";
import FieldConfigPanel from "../../../../components/FieldConfigPanel";
import { useState } from "react";
import "./Template.css";

function Template() {
  const {
    pdfDoc, setPdfDoc, totalPages, setTotalPages, currentPage, setCurrentPage,
    fields, setFields, addField, updateField, deleteField, duplicateField,
    activeFieldId, setActiveFieldId,
  } = useFields();

  const [scale, setScale] = useState(1.2);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Sidebar */}
      <FieldConfigPanel
        fields={fields}
        activeFieldId={activeFieldId}
        setActiveFieldId={setActiveFieldId}
        updateField={updateField}
        deleteField={deleteField}
        duplicateField={duplicateField}
        currentPage={currentPage}
      />
      {/* Main PDF area */}
      <div style={{ flex: 1, padding: 24 }}>
        <Toolbar
          addField={addField}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          scale={scale}
          setScale={setScale}
        />
        <div style={{ position: "relative", minHeight: 600 }}>
          <PdfUploader
            pdfDoc={pdfDoc}
            setPdfDoc={setPdfDoc}
            totalPages={totalPages}
            setTotalPages={setTotalPages}
            currentPage={currentPage}
            scale={scale}
            setScale={setScale}
          />
          <FieldsOverlay
            pdfDoc={pdfDoc}
            fields={fields}
            setFields={setFields}
            activeFieldId={activeFieldId}
            setActiveFieldId={setActiveFieldId}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
}

export default Template;
