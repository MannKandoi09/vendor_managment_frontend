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

const vendorShipmentService = {
  // GET: Fetch all shipments for the logged-in vendor
  getMyShipments: async (vendorId) => {
    const response = await axios.get(`${BASE_URL}/shipments?vendorId=${vendorId}`, getRequestConfig());
    return response.data?.data || response.data || [];
  },

  // GET: Fetch complete single shipment metrics by tracking ID
  viewShipment: async (shipmentId) => {
    const response = await axios.get(`${BASE_URL}/shipments/view/${shipmentId}`, getRequestConfig());
    return response.data?.data || response.data;
  },

  // 🚀 UPDATED METHOD: Fetch shipment proof document with exact blob configuration
  downloadProof: async (shipmentId) => {
    return await axios.get(`${BASE_URL}/shipments/download/${shipmentId}`, {
      ...getRequestConfig(),
      responseType: "blob" // 🚀 CRITICAL: Required for raw image/document binary stream parsing
    });
  }
};

export default vendorShipmentService;