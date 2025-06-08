import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ChooseTemplateDropdown from "../../../../components/pdfDropdown/PdfDropDown";
import PdfFormEditorForContact from "../../../../utils/PdfFormEditorForContact";
import {
  createContract,
  downloadTemplatePDF,
  getContractsByTempId,
} from "../../../../config/api";
import ContractSelectDropDown from "../../../../components/pdfDropdown/ContractSelectDropDown";
import CreateContractPopup from "../../../../components/pdfDropdown/CreateContractPopup";

function ContractorEditor() {
  const [selectedId, setSelectedId] = useState(""); // templateId
  const [selectedContractId, setSelectedContractId] = useState(""); // contractId
  const [pdfDoc, setPdfDoc] = useState();
  const [popupOpen, setPopupOpen] = useState(false);
  async function handleSelectTemplate(e, templates) {
    const tid = e.target.value;
    setSelectedId(tid);
    setSelectedContractId(""); // reset contract selection when template changes
    const t = templates.find((t) => t.templateId === tid);
    if (t) {
      try {
        const resp = await downloadTemplatePDF(t.templateId);
        if (resp.status !== 200 && resp.status !== 201)
          throw new Error("PDF fetch failed");
        const buf = resp.data;
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        setPdfDoc(pdf);
      } catch (err) {
        alert("Failed to load PDF for this template.");
      }
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <ChooseTemplateDropdown
          selectedId={selectedId}
          onTemplateSelect={handleSelectTemplate}
        />
        <ContractSelectDropDown
          templateId={selectedId}
          selectedContractId={selectedContractId}
          onContractSelect={(e, contracts) => {
            setSelectedContractId(e.target.value);
            // You can access selected contract details from contracts array if needed
          }}
        />

        <button onClick={() => setPopupOpen(true)} disabled={!selectedId}>
          Create Contract
        </button>
      </div>
      <CreateContractPopup
        selectedId={selectedId}
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        createContract={createContract}
        onSuccess={(contractData) => {
          // Optionally reload contract dropdown, show toast, etc.
          // e.g. fetchContracts();
          setSelectedId("")
        }}
      />
      {/* You are selecting a contract from a dropdown or creating a contract and selecting it */}

      {selectedId && selectedContractId && <PdfFormEditorForContact />}
    </>
  );
}

export default ContractorEditor;
