import { useState, useRef } from "react";

/**
 * Custom hook to manage fields, page, and PDF state.
 */
export default function useFields() {
  const [pdfDoc, setPdfDoc] = useState(null);          // PDF document instance
  const [totalPages, setTotalPages] = useState(1);      // Number of pages in PDF
  const [currentPage, setCurrentPage] = useState(1);    // Current PDF page
  const [fields, setFields] = useState([]);             // All fields (for all pages)
  const [activeFieldId, setActiveFieldId] = useState(null); // Which field is being edited

  // Simple counter for unique field IDs
  const fieldIdCounter = useRef(1);

  // Add a new field of given type to current page, and select it
  function addField(type) {
    const id = `field_${fieldIdCounter.current++}`;
    setFields(f => [
      ...f,
      {
        id,
        label: `${type[0].toUpperCase() + type.slice(1)} Field`,
        type,
        x: 100,
        y: 100,
        width: 120,
        height: 32,
        value: "",
        page: currentPage,
        // Optionally, more props (e.g., sigGroupId for signature type)
      },
    ]);
    setActiveFieldId(id);
  }

  // Update a field by id with new properties
  function updateField(id, updates) {
    setFields(f =>
      f.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  }

  // Delete a field by id, and clear active selection if needed
  function deleteField(id) {
    setFields(f => f.filter(field => field.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  }

  // Duplicate a field, offsetting position and appending to label
  function duplicateField(id) {
    const orig = fields.find(f => f.id === id);
    if (!orig) return;
    const newId = `field_${fieldIdCounter.current++}`;
    setFields(f => [
      ...f,
      {
        ...orig,
        id: newId,
        x: orig.x + 20,
        y: orig.y + 20,
        label: orig.label + " Copy",
        // Copy any additional properties, like sigGroupId if present
        ...(orig.sigGroupId && { sigGroupId: orig.sigGroupId }),
      },
    ]);
    setActiveFieldId(newId);
  }

  return {
    pdfDoc, setPdfDoc,
    totalPages, setTotalPages,
    currentPage, setCurrentPage,
    fields, setFields,
    addField, updateField, deleteField, duplicateField,
    activeFieldId, setActiveFieldId,
  };
}
