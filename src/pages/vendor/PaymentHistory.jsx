import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorPaymentService from "../../services/vendorPaymentService";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PaymentHistory = () => {
  const navigate = useNavigate();

  // State Management Buckets
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  
  // 🚀 FIXED: downloadingId tracks row-isolated download operation spinner status
  const [downloadingId, setDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Search and Filter States
  const [searchPayNum, setSearchPayNum] = useState("");
  const [searchInvNum, setSearchInvoiceNum] = useState("");
  const [searchPONum, setSearchPONum] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("");

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
    const loadPayments = async () => {
      try {
        setLoading(true);
        setApiError("");
        const storedUser = localStorage.getItem("currentUser");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const vendorId = parsedUser?.vendorId || parsedUser?.id || 8;

        const data = await vendorPaymentService.getMyPayments(vendorId);
        const cleanData = Array.isArray(data) ? data : [];
        setPayments(cleanData);
        setFilteredPayments(cleanData);
      } catch (err) {
        console.error(err);
        setApiError("Unable to fetch payment history list from data server.");
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  // Frontend Live Filtering Logic
  useEffect(() => {
    let result = [...payments];

    if (searchPayNum.trim() !== "") {
      result = result.filter(p => p.paymentNumber?.toLowerCase().includes(searchPayNum.toLowerCase()));
    }
    if (searchInvNum.trim() !== "") {
      result = result.filter(p => p.invoiceNumber?.toLowerCase().includes(searchInvNum.toLowerCase()));
    }
    if (searchPONum.trim() !== "") {
      result = result.filter(p => p.poNumber?.toLowerCase().includes(searchPONum.toLowerCase()));
    }
    if (searchVendor.trim() !== "") {
      result = result.filter(p => p.vendorName?.toLowerCase().includes(searchVendor.toLowerCase()));
    }
    if (searchRef.trim() !== "") {
      result = result.filter(p => p.referenceNumber?.toLowerCase().includes(searchRef.toLowerCase()));
    }
    if (statusFilter !== "All Status") {
      result = result.filter(p => (p.paymentStatus || "").toUpperCase() === statusFilter.toUpperCase());
    }
    if (dateFilter) {
      result = result.filter(p => p.paymentDate === dateFilter);
    }
    setFilteredPayments(result);
  }, [searchPayNum, searchInvNum, searchPONum, searchVendor, searchRef, statusFilter, dateFilter, payments]);

  const handleResetFilters = () => {
    setSearchPayNum(""); setSearchInvoiceNum(""); setSearchPONum(""); setSearchVendor(""); setSearchRef("");
    setStatusFilter("All Status"); setDateFilter("");
  };

  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      toast.warning("No data assets available to export.");
      return;
    }
    try {
      setExporting(true);
      const worksheetData = filteredPayments.map(p => ({
        "Payment Number": p.paymentNumber || "—",
        "Invoice Number": p.invoiceNumber || "—",
        "PO Number": p.poNumber || "—",
        "Vendor": p.vendorName || "—",
        "Employee": p.employeeName || "—",
        "Payment Date": formatDate(p.paymentDate),
        "Amount": parseFloat(p.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        "Payment Method": p.paymentMethod || "—",
        "Reference Number": p.referenceNumber || "—",
        "Payment Status": p.paymentStatus || "PENDING",
        "Invoice Status": p.invoiceStatus || "—"
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payment History");

      worksheet["!cols"] = Object.keys(worksheetData[0]).map(key => ({
        wch: Math.max(key.length, ...worksheetData.map(row => row[key] ? row[key].toString().length : 0)) + 4
      }));

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Payment_History_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Payment history exported successfully.");
    } catch (err) {
      toast.error("Excel sheet generation failed.");
    } finally { setExporting(false); }
  };

  // 🚀 DYNAMIC ROW-ISOLATED RECEIPT PDF DOWNLOAD HANDLER
  const handleDownloadReceipt = async (id) => {
    try {
      // Set downloading status only for this specific row item to animate spinner
      setDownloadingId(id);
      const response = await vendorPaymentService.downloadReceipt(id);
      
      // Extract dynamic filename from Content-Disposition header safely
      let filename = `Receipt_${id}.pdf`;
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      // Compile binary blob context data system download trigger
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", filename);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      // Success toast feedback notification
      toast.success("Receipt downloaded successfully.");
    } catch (err) {
      console.error("PDF Receipt download fault context:", err);
      // Explicit backend multi-tier error matching criteria
      if (err.response && err.response.status === 404) {
        toast.error("Receipt not found.");
      } else {
        toast.error("Unable to download receipt.");
      }
    } finally {
      // Release button loader locks cleanly
      setDownloadingId(null);
    }
  };

  return (
    <VendorLayout pageTitle="Payment History" pageSubtitle="View remittance settlements, UTR reference maps, and download transaction receipts.">
      
      {/* FILTER CONTROL TOOLBAR BOX PANEL */}
      <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 text-start bg-white">
        <div className="row g-3 align-items-end" style={{ fontSize: "13px" }}>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Payment Number</label>
            <input type="text" className="form-control py-2" placeholder="PAY-2026-..." value={searchPayNum} onChange={e => setSearchPayNum(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Invoice Number</label>
            <input type="text" className="form-control py-2" placeholder="INV-2026-..." value={searchInvNum} onChange={e => setSearchInvoiceNum(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">PO Number</label>
            <input type="text" className="form-control py-2" placeholder="PO-2026-..." value={searchPONum} onChange={e => setSearchPONum(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Vendor Name</label>
            <input type="text" className="form-control py-2" placeholder="Search vendor..." value={searchVendor} onChange={e => setSearchVendor(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Reference / UTR</label>
            <input type="text" className="form-control py-2" placeholder="UTR number..." value={searchRef} onChange={e => setSearchRef(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Payment Date</label>
            <input type="date" className="form-control py-2 font-monospace" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-3">
            <label className="form-label text-secondary small fw-medium mb-1">Status</label>
            <select className="form-select py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: "13px" }}>
              <option value="All Status">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div className="col-md-2.5 d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary py-2 px-3 d-flex align-items-center justify-content-center" onClick={handleResetFilters} style={{ borderRadius: "6px" }} title="Reset Filters">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="alert alert-danger py-2 px-3 fw-semibold small mb-4 rounded-3 text-start shadow-sm" style={{ fontSize: "13px" }}>
          {apiError}
        </div>
      )}

      {/* DATATABLE DATA GRID WRAPPER */}
      <div className="card shadow-sm border border-light-subtle rounded-3 overflow-hidden bg-white text-start mb-4">
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <span className="text-secondary small fw-semibold">Showing {filteredPayments.length} entries</span>
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
          ) : filteredPayments.length === 0 ? (
            <div className="p-5 text-center text-muted fw-medium fs-6">No Payments Found</div>
          ) : (
            <table className="table align-middle m-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ padding: "14px 16px" }}>Payment Number</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Number</th>
                  <th style={{ padding: "14px 16px" }}>PO Number</th>
                  <th style={{ padding: "14px 16px" }}>Vendor</th>
                  <th style={{ padding: "14px 16px" }}>Employee</th>
                  <th style={{ padding: "14px 16px" }}>Payment Date</th>
                  <th style={{ padding: "14px 16px" }}>Amount</th>
                  <th style={{ padding: "14px 16px" }}>Method</th>
                  <th style={{ padding: "14px 16px" }}>Reference No</th>
                  <th style={{ padding: "14px 16px" }}>Payment Status</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Status</th>
                  <th className="text-center" style={{ padding: "14px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, idx) => {
                  const isItemDownloading = downloadingId === p.id;

                  return (
                    <tr key={p.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="fw-semibold text-primary font-monospace" style={{ padding: "14px 16px" }}>{p.paymentNumber}</td>
                      <td className="font-monospace text-dark fw-medium" style={{ padding: "14px 16px" }}>{p.invoiceNumber || "—"}</td>
                      <td className="font-monospace text-secondary" style={{ padding: "14px 16px" }}>{p.poNumber || "—"}</td>
                      <td className="text-dark fw-medium" style={{ padding: "14px 16px" }}>{p.vendorName || "—"}</td>
                      <td className="text-muted" style={{ padding: "14px 16px" }}>{p.employeeName || "—"}</td>
                      <td style={{ padding: "14px 16px" }}>{formatDate(p.paymentDate)}</td>
                      <td className="font-monospace fw-bold text-dark" style={{ padding: "14px 16px" }}>
                        ₹{parseFloat(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="small font-monospace" style={{ padding: "14px 16px" }}>{p.paymentMethod}</td>
                      <td className="font-monospace small text-secondary" style={{ padding: "14px 16px" }}>{p.referenceNumber || "—"}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${
                          (p.paymentStatus || "").toUpperCase() === "PAID" ? "bg-primary-subtle text-primary border border-primary-subtle" :
                          (p.paymentStatus || "").toUpperCase() === "FAILED" ? "bg-danger-subtle text-danger border border-danger-subtle" :
                          "bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }`} style={{ fontSize: "11px" }}>
                          {p.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${
                          (p.invoiceStatus || "").toUpperCase() === "APPROVED" ? "bg-success-subtle text-success border border-success-subtle" :
                          (p.invoiceStatus || "").toUpperCase() === "REJECTED" ? "bg-danger-subtle text-danger border border-danger-subtle" :
                          "bg-warning-subtle text-warning border border-warning-subtle"
                        }`} style={{ fontSize: "11px" }}>
                          {(p.invoiceStatus || "PENDING_REVIEW").replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          <button type="button" className="btn btn-sm d-flex align-items-center justify-content-center text-primary rounded-circle border-0" title="View Payment" onClick={() => navigate(`/vendor/payments/view/${p.id}`)} style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                          </button>
                          
                          {/* 🚀 DOWNLOAD RECEIPT PDF BUTTON WITH ISOLATED LOADING LOCK */}
                          <button 
                            type="button" 
                            disabled={downloadingId !== null} 
                            className="btn btn-sm d-flex align-items-center justify-content-center text-success rounded-circle border-0" 
                            title="Download Receipt" 
                            onClick={() => handleDownloadReceipt(p.id)} 
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

export default PaymentHistory;