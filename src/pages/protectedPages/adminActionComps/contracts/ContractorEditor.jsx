import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ChooseTemplateDropdown from "../../../../components/pdfDropdown/PdfDropDown";
import PdfFormEditorForContact from "../../../../utils/PdfFormEditorForContact";
import { createContract, downloadTemplatePDF, getContractsByTempId } from "../../../../config/api";
function ContractorEditor() {
  const [selectedId, setSelectedId] = useState();
  const [pdfDoc, setPdfDoc] = useState();

  async function handleSelectTemplate(e, templates) {
    const tid = e.target.value;
    setSelectedId(tid);
    const t = templates.find((t) => t.templateId === tid);
    if (t) {
      //   setTemplateName(t.templateName);
      //   setTemplateId(t.templateId);
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

  const handleAPI = async () => {
    // const resp = await createContract({
    //   templateId: "68456672ea304ee5fe0c50df",
    //   adminId: "665e7c3212318e593abdc101",
    //   contractName: "demo contract 2",
    // });

    const resp = await getContractsByTempId({
           "templateId":"68456672ea304ee5fe0c50df"
    })

    console.log("resp", resp);
  };

  return (
    <>
      <div>
        <ChooseTemplateDropdown
          selectedId={selectedId}
          onTemplateSelect={handleSelectTemplate}
        />
      </div>

      {/* {you are selecting a contract from a dropdown or creating a contract and selecting it} */}

      <button onClick={handleAPI}>hi</button>

      {selectedId && <PdfFormEditorForContact />}
    </>
  );
}

export default ContractorEditor;
