import axios from "axios";

const BASE_URL = "http://localhost:8080/vendor/purchase-orders";

const getRequestConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json"
    }
  };
};

const vendorPurchaseOrderService = {
  // Existing method...
  getPurchaseOrderById: async (id) => {
    const response = await axios.get(`${BASE_URL}/view/${id}`, getRequestConfig());
    return response.data?.data || response.data;
  },

  // 🚀 NEW METHOD: Fetch list of purchase orders assigned to the logged-in vendor
  getMyPurchaseOrders: async (vendorId) => {

    console.log(
        "Calling Backend => /vendor/purchase-orders/" + vendorId
    );

    const response = await axios.get(
        `${BASE_URL}/${vendorId}`,
        getRequestConfig()
    );

    console.log("Backend Response =", response.data);

    return response.data?.data || response.data || [];
}

  
};

export default vendorPurchaseOrderService;