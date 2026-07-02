import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorShipmentService from "../../services/vendorShipmentService";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ShipmentHistory = () => {
  const navigate = useNavigate();

  // Core Functional States
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  
  // 🚀 FIXED: downloadingId tracks row-isolated download operations spinner status safely
  const [downloadingId, setDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filter & Search Matrix Parameters
  const [searchDelCode, setSearchDelCode] = useState("");
  const [searchPO, setSearchPO] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [searchLoc, setSearchLoc] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    } catch (e) { return dateStr; }
  };

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true);
        setApiError("");
        const storedUser = localStorage.getItem("currentUser");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const vendorId = parsedUser?.vendorId || 8;

        const data = await vendorShipmentService.getMyShipments(vendorId);
        const cleanData = Array.isArray(data) ? data : [];
        setShipments(cleanData);
        setFilteredPayments(cleanData);
      } catch (err) {
        console.error("Fulfillment engine telemetry connection lost:", err);
        setApiError("Unable to fetch shipment history streams from remote database lines.");
      } finally {
        setLoading(false);
      }
    };
    loadShipments();
  }, []);

  // Multi-Filter Matrix Processor Engine
  useEffect(() => {
    let result = [...shipments];

    if (searchDelCode.trim() !== "") {
      result = result.filter(s => s.deliveryCode?.toLowerCase().includes(searchDelCode.toLowerCase()));
    }
    if (searchPO.trim() !== "") {
      result = result.filter(s => s.poNumber?.toLowerCase().includes(searchPO.toLowerCase()));
    }
    if (searchInvoice.trim() !== "") {
      result = result.filter(s => s.invoiceNumber?.toLowerCase().includes(searchInvoice.toLowerCase()));
    }
    if (searchVendor.trim() !== "") {
      result = result.filter(s => s.vendorName?.toLowerCase().includes(searchVendor.toLowerCase()));
    }
    if (searchEmployee.trim() !== "") {
      result = result.filter(s => s.employeeName?.toLowerCase().includes(searchEmployee.toLowerCase()));
    }
    if (searchLoc.trim() !== "") {
      result = result.filter(s => s.currentLocation?.toLowerCase().includes(searchLoc.toLowerCase()));
    }
    if (dateFilter) {
      result = result.filter(s => s.dispatchDate === dateFilter);
    }
    if (statusFilter !== "All") {
      result = result.filter(s => (s.status || "").toUpperCase() === statusFilter.toUpperCase());
    }
    setFilteredPayments(result);
  }, [searchDelCode, searchPO, searchInvoice, searchVendor, searchEmployee, searchLoc, dateFilter, statusFilter, shipments]);

  const handleResetFilters = () => {
    setSearchDelCode(""); setSearchPO(""); setSearchInvoice(""); setSearchVendor("");
    setSearchEmployee(""); setSearchLoc(""); setDateFilter(""); setStatusFilter("All");
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "DELIVERED") return "bg-success-subtle text-success border border-success-subtle";
    if (s === "DISPATCHED") return "bg-primary-subtle text-primary border border-primary-subtle";
    if (s === "IN_TRANSIT" || s === "IN TRANSIT") return "bg-purple-subtle text-purple border border-purple-subtle";
    if (s === "CANCELLED") return "bg-danger-subtle text-danger border border-danger-subtle";
    return "bg-warning-subtle text-warning border border-warning-subtle";
  };

  const handleExportExcel = () => {
    if (filteredShipments.length === 0) {
      toast.warning("No data assets available to export.");
      return;
    }
    try {
      setExporting(true);
      const worksheetData = filteredShipments.map(s => ({
        "Delivery Code": s.deliveryCode || "—",
        "PO Number": s.poNumber || "—",
        "Invoice Number": s.invoiceNumber || "—",
        "Vendor Name": s.vendorName || "—",
        "Employee Name": s.employeeName || "—",
        "Dispatch Date": formatDate(s.dispatchDate),
        "Expected Delivery Date": formatDate(s.expectedDate),
        "Actual Delivery Date": formatDate(s.deliveryDate),
        "Current Location Log": s.currentLocation || "—",
        "Status": s.status || "PENDING"
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments Ledger");

      worksheet["!cols"] = Object.keys(worksheetData[0]).map(key => ({
        wch: Math.max(key.length, ...worksheetData.map(row => row[key] ? row[key].toString().length : 0)) + 4
      }));

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Shipment_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Shipments dataset report exported successfully.");
    } catch (err) {
      toast.error("Excel tracking log generation failure.");
    } finally { setExporting(false); }
  };

  // 🚀 DYNAMIC ROW-ISOLATED PROOF FILE DOWNLOAD HANDLER WITH COMPREHENSIVE ERROR HANDLING
  const handleDownloadProof = async (id) => {
    try {
      setApiError("");
      // Lock loader only for this row item to activate inline spinner animation
      setDownloadingId(id);
      const response = await vendorShipmentService.downloadProof(id);
      
      // Extract dynamic filename parameter safely from headers context stream
      let filename = `Proof_Delivery_${id}.png`;
      const disposition = response.headers?.["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, "");
      }

      // Trigger automatic background save process sequence directly with raw binary payload blob object
      const blobUrl = window.URL.createObjectURL(response.data);
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", filename);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      // Success feedback notification display
      toast.success("Shipment proof downloaded successfully.");
    } catch (err) {
      console.error("Proof file lookup execution crashed:", err);
      // 🚀 FIXED: Dynamic conditional check parsing strict error specifications map rules
      if (err.response && err.response.status === 404) {
        setApiError("Shipment proof not found.");
      } else {
        setApiError("Unable to download shipment proof.");
      }
    } finally {
      // Clear row operation lock constraints parameters
      setDownloadingId(null);
    }
  };

  return (
    <VendorLayout pageTitle="Shipment History" pageSubtitle="View all shipments assigned to you.">
      
      {/* CONTROL MATRIX FILTER PANEL CARD */}
      <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 text-start bg-white">
        <div className="row g-3 align-items-end" style={{ fontSize: "13px" }}>
          <div className="col-md-2.5">
            <label className="form-label text-secondary small fw-medium mb-1">Delivery Code</label>
            <input type="text" className="form-control py-2 font-monospace" placeholder="DEL-..." value={searchDelCode} onChange={e => setSearchDelCode(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2.5">
            <label className="form-label text-secondary small fw-medium mb-1">PO Number</label>
            <input type="text" className="form-control py-2 font-monospace" placeholder="PO-..." value={searchPO} onChange={e => setSearchPO(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Invoice Number</label>
            <input type="text" className="form-control py-2 font-monospace" placeholder="INV-..." value={searchInvoice} onChange={e => setSearchInvoice(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Vendor Name</label>
            <input type="text" className="form-control py-2" placeholder="Vendor entity..." value={searchVendor} onChange={e => setSearchVendor(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Employee Name</label>
            <input type="text" className="form-control py-2" placeholder="Employee..." value={searchEmployee} onChange={e => setSearchEmployee(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Current Location Log</label>
            <input type="text" className="form-control py-2" placeholder="Hub, Facility, City..." value={searchLoc} onChange={e => setSearchLoc(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Dispatch Date</label>
            <input type="date" className="form-control py-2 font-monospace" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Status</label>
            <select className="form-select py-2" value={statusFilter} onChange={statusFilter => setStatusFilter(statusFilter.target.value)} style={{ fontSize: "13px" }}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In_Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-2 d-flex gap-1">
            <button type="button" className="btn btn-outline-secondary py-2 px-3 align-middle" onClick={handleResetFilters} style={{ borderRadius: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", verticalAlign: "middle" }}>restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="alert alert-danger py-2 px-3 fw-semibold small mb-4 rounded-3 text-start shadow-sm" role="alert" style={{ fontSize: "13px" }}>
          {apiError}
        </div>
      )}

      {/* CORE MASTER DATA GRID LIST TABLE */}
      <div className="card shadow-sm border border-light-subtle rounded-3 overflow-hidden bg-white text-start mb-4">
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <span className="text-secondary small fw-semibold">Showing {filteredShipments.length} log transactions</span>
          <button type="button" disabled={exporting} className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-3" onClick={handleExportExcel} style={{ fontSize: "12px", borderRadius: "6px" }}>
            {exporting ? <span className="spinner-border spinner-border-sm"></span> : <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>text_snippet</span>}
            Export Excel
          </button>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center p-5" style={{ minHeight: "200px" }}>
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-5 text-center text-muted fw-medium fs-6">No Shipments Found</div>
          ) : (
            <table className="table align-middle m-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ padding: "14px 16px" }}>Delivery Code</th>
                  <th style={{ padding: "14px 16px" }}>PO Number</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Number</th>
                  <th style={{ padding: "14px 16px" }}>Vendor Name</th>
                  <th style={{ padding: "14px 16px" }}>Employee Name</th>
                  <th style={{ padding: "14px 16px" }}>Dispatch Date</th>
                  <th style={{ padding: "14px 16px" }}>Expected Date</th>
                  <th style={{ padding: "14px 16px" }}>Delivery Date</th>
                  <th style={{ padding: "14px 16px" }}>Current Location</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th className="text-center" style={{ padding: "14px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((s, idx) => {
                  const isItemDownloading = downloadingId === s.id;
                  return (
                    <tr key={s.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="fw-semibold text-primary font-monospace" style={{ padding: "14px 16px" }}>{s.deliveryCode}</td>
                      <td className="font-monospace text-secondary" style={{ padding: "14px 16px" }}>{s.poNumber || "—"}</td>
                      <td className="font-monospace text-dark fw-medium" style={{ padding: "14px 16px" }}>{s.invoiceNumber || "—"}</td>
                      <td className="text-dark fw-medium" style={{ padding: "14px 16px" }}>{s.vendorName || "—"}</td>
                      <td className="text-muted" style={{ padding: "14px 16px" }}>{s.employeeName || "—"}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(s.dispatchDate)}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(s.expectedDate)}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(s.deliveryDate)}</td>
                      <td className="font-monospace small text-secondary" style={{ padding: "14px 16px" }}>{s.currentLocation || "—"}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${getStatusBadgeClass(s.status)}`} style={{ fontSize: "11px" }}>
                          {s.status ? s.status.replace("_", " ") : "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          <button type="button" className="btn btn-sm d-flex align-items-center justify-content-center text-primary rounded-circle border-0" title="View details" onClick={() => navigate(`/vendor/shipments/view/${s.id}`)} style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                          </button>
                          
                          {/* 🚀 DOWNLOAD PROOF BUTTON WITH DYNAMIC INTERACTIVE ROW LOCK */}
                          <button 
                            type="button" 
                            disabled={downloadingId !== null} 
                            className="btn btn-sm d-flex align-items-center justify-content-center text-success rounded-circle border-0" 
                            title="Download Proof" 
                            onClick={() => handleDownloadProof(s.id)} 
                            style={{ width: "32px", height: "32px", backgroundColor: "#f0fdf4" }}
                          >
                            {isItemDownloading ? (
                              <span className="spinner-border spinner-border-sm" style={{ width: "14px", height: "14px" }}></span>
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                            )}
                          </button>
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
    </VendorLayout>
  );
};

export default ShipmentHistory;