import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorPurchaseOrderService from "../../services/vendorPurchaseOrderService";
import vendorInvoiceService from "../../services/vendorInvoiceService";
import { toast } from "react-toastify";

// 🚀 IMPORT EXCEL PARSING LIBRARIES
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PurchaseOrderList = () => {
  const navigate = useNavigate();

  // State Management Buckets
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  
  // Loader States to track isolated asynchronous routines
  const [downloadingId, setDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false); // 🚀 Staged loading tracking for excel export

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("All Invoice Status");
  const [dateFilter, setDateFilter] = useState("");

  // Convert YYYY-MM-DD to standard DD MMM YYYY (e.g., 23 Jun 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Lifecycle logic to read current vendor user context on mount phase
  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        setLoading(true);
        setApiError("");

        const storedUser = localStorage.getItem("currentUser");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        console.log("Logged Vendor =", parsedUser);

        const vendorId = parsedUser?.vendorId;

        console.log("Vendor ID Sent =", vendorId);
        console.log("Calling API => /vendor/purchase-orders/" + vendorId);

        const data = await vendorPurchaseOrderService.getMyPurchaseOrders(vendorId);

        console.log("Purchase Order API Response =", data);

        setPurchaseOrders(Array.isArray(data) ? data : []);
        setFilteredOrders(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);
        setApiError("Unable to fetch purchase orders profile list from data server.");
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseOrders();
  }, []);

  // FRONTEND SEARCH AND FILTER IMPLEMENTATION
  useEffect(() => {
    let result = [...purchaseOrders];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          (order.poNumber && order.poNumber.toLowerCase().includes(query)) ||
          (order.employeeName && order.employeeName.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "All Status") {
      result = result.filter(
        (order) => order.status && order.status.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    if (invoiceStatusFilter !== "All Invoice Status") {
      result = result.filter(
        (order) => order.invoiceStatus && order.invoiceStatus.toUpperCase() === invoiceStatusFilter.toUpperCase()
      );
    }

    if (dateFilter) {
      result = result.filter((order) => order.orderDate === dateFilter);
    }

    setFilteredOrders(result);
  }, [searchQuery, statusFilter, invoiceStatusFilter, dateFilter, purchaseOrders]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All Status");
    setInvoiceStatusFilter("All Invoice Status");
    setDateFilter("");
  };

  // 🚀 HIGH PERFORMANCE ADVANCED EXCEL EXPORT IMPLEMENTATION
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.warning("No data assets available to export under active criteria filters.");
      return;
    }

    try {
      setExporting(true);

      // 1. Structured Column Definition Map Array
      const worksheetData = filteredOrders.map((order) => ({
        "PO Number": order.poNumber || "—",
        "Order Date": formatDate(order.orderDate),
        "Expected Delivery Date": formatDate(order.expectedDeliveryDate),
        "Employee": order.employeeName || "—",
        "Vendor": order.vendorName || "—",
        "Total Amount": parseFloat(order.amount || 0).toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2
        }),
        "Status": order.status || "PENDING",
        "Invoice Status": (order.invoiceStatus || "NOT_CREATED").toUpperCase().replace("_", " ")
      }));

      // 2. Initialize Worksheet container instance
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

      // 3. Dynamic Auto-calculation for Row/Column Auto-size limits
      const columnsWidths = Object.keys(worksheetData[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...worksheetData.map((row) => (row[key] ? row[key].toString().length : 0))
        );
        return { wch: maxLength + 4 }; // Padding clearance buffer
      });
      worksheet["!cols"] = columnsWidths;

      // 4. Transform sheets buffers array to file stream
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const finalBlob = new Blob([excelBuffer], { type: "application/octet-stream" });

      // Generate accurate timestamp descriptor file string (e.g., Vendor_Purchase_Orders_2026-07-02.xlsx)
      const currentIsoDate = new Date().toISOString().split("T")[0];
      const targetFilename = `Vendor_Purchase_Orders_${currentIsoDate}.xlsx`;

      // Trigger automatic background save payload pipeline
      saveAs(finalBlob, targetFilename);
      toast.success("Excel report exported successfully.");

    } catch (err) {
      console.error("Excel mapping workbook compile fault context:", err);
      toast.error("Unable to export Excel report.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "APPROVED") return "bg-success-subtle text-success border border-success-subtle";
    if (s === "REJECTED") return "bg-danger-subtle text-danger border border-danger-subtle";
    return "bg-warning-subtle text-warning border border-warning-subtle";
  };

  // Exact Invoice Status color badges mapping rules criteria
  const getInvoiceStatusBadgeClass = (status) => {
    const s = (status || "NOT_CREATED").toUpperCase();
    if (s === "APPROVED") return "bg-success-subtle text-success border border-success-subtle"; // Green
    if (s === "REJECTED") return "bg-danger-subtle text-danger border border-danger-subtle"; // Red
    if (s === "PENDING_REVIEW") return "bg-warning-subtle text-warning border border-warning-subtle"; // Orange
    if (s === "PAID") return "bg-primary-subtle text-primary border border-primary-subtle"; // Blue
    return "bg-secondary-subtle text-secondary border border-secondary-subtle"; // NOT_CREATED (Grey)
  };

  // Invoice PDF Download Handler Implementation
  const handleDownloadInvoice = async (poId) => {
    try {
      setDownloadingId(poId);
      const response = await vendorInvoiceService.downloadInvoice(poId);
      
      if (!response.data || response.data.size === 0) {
        toast.error("Invoice PDF not found.");
        return;
      }

      let filename = "Invoice.pdf";
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", filename);
      document.body.appendChild(tempAnchor);
      
      tempAnchor.click();
      
      tempAnchor.parentNode.removeChild(tempAnchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Binary invoice lookup operation crashed:", err);
      if (err.response && err.response.status === 404) {
        toast.error("Invoice PDF not found.");
      } else {
        toast.error("Unable to download Invoice.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <VendorLayout 
      pageTitle="My Purchase Orders" 
      pageSubtitle="View all purchase orders assigned to you by the admin."
    >
      
      {/* ==================== CONTROL FILTERS PANEL TOOLBAR ==================== */}
      <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 text-start bg-white">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Search</label>
            <div className="position-relative">
              <input 
                type="text" 
                className="form-control py-2 ps-3 pe-5" 
                placeholder="Search by PO Number, Employee..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "13px", borderRadius: "6px" }}
              />
              <span className="material-symbols-outlined position-absolute end-0 top-50 translate-middle-y me-3 text-muted" style={{ fontSize: "18px" }}>search</span>
            </div>
          </div>
          
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Order Date</label>
            <input 
              type="date" 
              className="form-control py-2 text-dark font-monospace" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ fontSize: "13px", borderRadius: "6px" }}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Status</label>
            <select 
              className="form-select py-2" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: "13px", borderRadius: "6px" }}
            >
              <option value="All Status">All Status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Invoice Status</label>
            <select 
              className="form-select py-2" 
              value={invoiceStatusFilter}
              onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              style={{ fontSize: "13px", borderRadius: "6px" }}
            >
              <option value="All Invoice Status">All Invoice Status</option>
              <option value="NOT_CREATED">Not Created</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-primary py-2 px-3 flex-grow-1 text-white fw-semibold" style={{ fontSize: "13px", borderRadius: "6px", backgroundColor: "#2563eb", border: "none" }}>
              Filter
            </button>
            <button type="button" className="btn btn-outline-secondary py-2 px-3 d-flex align-items-center justify-content-center" onClick={handleResetFilters} style={{ borderRadius: "6px" }} title="Reset Filters">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="alert alert-danger py-2 px-3 fw-semibold small mb-4 rounded-3 text-start" style={{ fontSize: "13px" }}>
          {apiError}
        </div>
      )}

      {/* ==================== CORE MASTER DATA LIST TABLE ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 overflow-hidden bg-white text-start mb-4">
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <span className="text-secondary small fw-semibold">Showing {filteredOrders.length} entries</span>
          
          {/* 🚀 EXPORT EXCEL INTEGRATED WITH DYNAMIC LOADERS AND DISABLED PROTECTION */}
          <button 
            type="button" 
            disabled={exporting}
            className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-3" 
            onClick={handleExportExcel} 
            style={{ fontSize: "12px", borderRadius: "6px", transition: "all 0.2s" }}
          >
            {exporting ? (
              <span className="spinner-border spinner-border-sm" role="status" style={{ width: "12px", height: "12px" }}></span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>text_snippet</span>
            )}
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center p-5" style={{ minHeight: "200px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading data streams...</span>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-5 text-center text-muted fw-medium fs-6">
              No Purchase Orders Found
            </div>
          ) : (
            <table className="table align-middle m-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ padding: "14px 16px" }}>PO Number</th>
                  <th style={{ padding: "14px 16px" }}>Order Date</th>
                  <th style={{ padding: "14px 16px" }}>Expected Delivery</th>
                  <th style={{ padding: "14px 16px" }}>Employee</th>
                  <th style={{ padding: "14px 16px" }}>Total Amount</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Status</th>
                  <th className="text-center" style={{ padding: "14px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => {
                  const invStatus = (order.invoiceStatus || "NOT_CREATED").toUpperCase();
                  const isItemDownloading = downloadingId === order.id;

                  return (
                    <tr key={order.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }} className="fw-semibold text-primary font-monospace">{order.poNumber}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(order.orderDate)}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(order.expectedDeliveryDate)}</td>
                      <td style={{ padding: "14px 16px" }} className="text-dark fw-medium">{order.employeeName || "—"}</td>
                      <td style={{ padding: "14px 16px" }} className="font-monospace fw-bold text-dark">
                        ₹{parseFloat(order.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${getStatusBadgeClass(order.status)}`} style={{ fontSize: "11px" }}>
                          {order.status || "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${getInvoiceStatusBadgeClass(order.invoiceStatus)}`} style={{ fontSize: "11px" }}>
                          {invStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          
                          {/* 📥 Download Invoice PDF: Hidden only when NOT_CREATED */}
                          {invStatus !== "NOT_CREATED" && (
                            <button 
                              type="button" 
                              disabled={downloadingId !== null}
                              className="btn btn-sm d-flex align-items-center justify-content-center text-success rounded-circle border-0" 
                              title="Download Invoice PDF" 
                              onClick={() => handleDownloadInvoice(order.id)} 
                              style={{ width: "32px", height: "32px", backgroundColor: "#f0fdf4", transition: "all 0.2s" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dcfce7"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"}
                            >
                              {isItemDownloading ? (
                                <span className="spinner-border spinner-border-sm" role="status" style={{ width: "14px", height: "14px" }}></span>
                              ) : (
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                              )}
                            </button>
                          )}

                          {/* Dynamic Business Actions Matrix */}
                          {invStatus === "NOT_CREATED" && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-primary px-3 py-1.5 fw-semibold text-white ms-1" 
                              onClick={() => navigate(`/vendor/invoices/create/${order.id}`)} 
                              style={{ fontSize: "12px", borderRadius: "6px", backgroundColor: "#2563eb", border: "none", boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)" }}
                            >
                              Create Invoice
                            </button>
                          )}
                          
                          {invStatus === "REJECTED" && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-warning px-3 py-1.5 fw-semibold text-dark ms-1" 
                              onClick={() => navigate(`/vendor/invoices/edit/${order.id}`)} 
                              style={{ fontSize: "12px", borderRadius: "6px", border: "none" }}
                            >
                              Edit Invoice
                            </button>
                          )}
                          
                          {(invStatus === "PENDING_REVIEW" || invStatus === "APPROVED" || invStatus === "PAID") && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-primary px-3 py-1.5 fw-semibold ms-1" 
                              onClick={() => navigate(`/vendor/invoices/view/${order.id}`)} 
                              style={{ fontSize: "12px", borderRadius: "6px" }}
                            >
                              View Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FOOTER NOTICE BLOCK */}
      <div className="alert alert-info py-2.5 px-3 rounded-3 text-start small border border-info-subtle bg-info-subtle text-info-emphasis d-flex align-items-center gap-2 m-0" style={{ fontSize: "12px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>info</span>
        <strong>Note:</strong> You can create an invoice only for approved purchase orders that do not have an existing active invoice profile.
      </div>

    </VendorLayout>
  );
};

export default PurchaseOrderList;