import axios from "axios";

const BASE_URL = "http://localhost:8080/vendor";

// 🚀 1. JSON REQUEST CONFIGURATION (For GET, DELETE, and normal JSON streams)
const getJsonConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json"
    }
  };
};

// 🚀 2. MULTIPART FORM-DATA REQUEST CONFIGURATION (Authorization Only)
const getMultipartConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {})
      // Do NOT manually set Content-Type here. 
      // Axios must automatically generate 'multipart/form-data' with boundaries.
    }
  };
};

const vendorInvoiceService = {
  // 🚀 POST: Create invoice linked to a particular Purchase Order (Uses Multipart Config)
  createInvoice: async (formData) => {
    const response = await axios.post(`${BASE_URL}/invoices`, formData, getMultipartConfig());
    return response.data?.data || response.data;
  },

  // 🚀 GET: Fetch Binary Blob stream for targeted invoice PDF file direct download (Uses JSON Config)
  downloadInvoice: async (id) => {
    return await axios.get(`${BASE_URL}/invoices/download/${id}`, {
      ...getJsonConfig(),
      responseType: "blob"
    });
  },

  // 🚀 GET: Fetch complete Invoice & PO relational details for view mode (Uses JSON Config)
  viewInvoice: async (purchaseOrderIdOrInvoiceId) => {
    const response = await axios.get(`${BASE_URL}/invoices/view/${purchaseOrderIdOrInvoiceId}`, getJsonConfig());
    return response.data?.data || response.data;
  },

  // 🚀 GET: Fetch existing rejected invoice records data details for editing configuration (Uses JSON Config)
  getInvoiceForEdit: async (purchaseOrderId) => {
    const response = await axios.get(`${BASE_URL}/invoices/edit/${purchaseOrderId}`, getJsonConfig());
    return response.data?.data || response.data;
  },

  // 🚀 PUT: Multipart/form-data invoice modification update re-submission pipeline (Uses Multipart Config)
  updateInvoice: async (invoiceId, formData) => {
    const response = await axios.put(`${BASE_URL}/invoices/${invoiceId}`, formData, getMultipartConfig());
    return response.data?.data || response.data;
  },

  // 🚀 GET: Fetch all invoices submitted by the logged-in vendor (Uses JSON Config)
  getMyInvoices: async (vendorId) => {
    const response = await axios.get(`${BASE_URL}/invoices?vendorId=${vendorId}`, getJsonConfig());
    return response.data?.data || response.data || [];
  },

  // 🚀 GET: Fetch single invoice detailed payload via unique Invoice ID (Uses JSON Config)
  viewInvoiceByInvoiceId: async (invoiceId) => {
    const response = await axios.get(`${BASE_URL}/invoices/view-by-id/${invoiceId}`, getJsonConfig());
    return response.data?.data || response.data;
  }
};

export default vendorInvoiceService;