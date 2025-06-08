import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/', 
  withCredentials: true             
});

export const createTemplate = (formData) =>
  API.post('template/create-template', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getAllTemplates = () =>
  API.post('template/get-all-template', { role: 'admin' });  

export const updateTemplateFields = (payload) =>
  API.post('template/update-template', payload);

export const getTemplateData = (templateId) =>
  API.get(`template/get-template-data?templateID=${templateId}`);

export const downloadTemplatePDF = (templateId) =>
  API.post(`template/get-template-pdf?id=${templateId}`,{},{ responseType: "arraybuffer"});

export const createOrUpdateFieldForTemplate = async(templateId,fields) =>{
  API.post(`fields/create_update_fields_per_template_id`,{templateId,fields},{
        headers: {
          'Content-Type': 'application/json',
        }
      });}

export const getFieldsByTemplateId = async (templateId) => {
  return API.get(`/fields/get_fields_by_template_id?templateId=${templateId}`);
  // ^ matches the backend route!
};

export const createContract = async ({templateId="",adminId="",contractName=""}) => {
  const data ={
    templateId,adminId,contractName
  }
  return API.post("http://localhost:3000/contract/create_contract", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  // ^ matches the backend route!
};

export const getContractsByTempId = async ({templateId}) => {
  return API.post("http://localhost:3000/contract/get_contracts_by_template_id", {
    templateId
  }, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  // ^ matches the backend route!
};


// export const submitContract = (payload) =>
//   API.post('/submit-contract', payload);

// export const getContractsByTemplateId = (templateId) =>
//   API.get(`/contracts/by-template/${templateId}`);


// ✅ ADD THIS
// export const uploadFilledContractPdf = async (formData) => {
//   return await fetch('http://localhost:3000/api/auth/contracts/upload-pdf', {
//     method: 'POST',
//     body: formData
//   });
// };
