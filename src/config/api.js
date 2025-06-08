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
