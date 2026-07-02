import axios from "axios";

const BASE_URL = "http://localhost:8080/vendor";

const getRequestConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json"
    }
  };
};

const vendorPaymentService = {
  // 🚀 GET: Fetch all payments for the logged-in vendor
  getMyPayments: async (vendorId) => {
    const response = await axios.get(`${BASE_URL}/payments?vendorId=${vendorId}`, getRequestConfig());
    return response.data?.data || response.data || [];
  },

  // 🚀 GET: Fetch complete view details for a single payment mapping using paymentId
  viewPayment: async (paymentId) => {
    const response = await axios.get(`${BASE_URL}/payments/view/${paymentId}`, getRequestConfig());
    return response.data?.data || response.data;
  },

  // 🚀 UPDATED METHOD: Fetch PDF receipt as Binary Blob stream with exact responseType configuration
  downloadReceipt: async (paymentId) => {
    return await axios.get(`${BASE_URL}/payments/download/${paymentId}`, {
      ...getRequestConfig(),
      responseType: "blob" // 🚀 CRITICAL: Required for raw PDF binary stream parsing
    });
  }
};

export default vendorPaymentService;