import React from "react";
import PdfFormEditor from "../../../../utils/PdfFormEditor";
import PdfFormEditorForContact from "../../../../utils/PdfFormEditorForContact";
import ContractorEditor from "./ContractorEditor";

function Contract({ role }) {
  if (role == "ADMIN") {
    return <PdfFormEditor />;
  }

  if (role == "CONTRACTOR") {


    return <ContractorEditor />;
  }
}

export default Contract;
