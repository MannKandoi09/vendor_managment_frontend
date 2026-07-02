import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorInvoiceService from "../../services/vendorInvoiceService";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const MyInvoiceList = () => {
  const navigate = useNavigate();

  // State Management Buckets
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Search and Filter States
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchPO, setSearchPO] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const [dateFilter, setDateFilter] = useState("");

  // Analytical Counters States
  const [metrics, setMetrics] = useState({
    total: 0, pending: 0, approved: 0, rejected: 0, paid: 0
  });

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
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("currentUser");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const vendorId = parsedUser?.vendorId || 8;

        const data = await vendorInvoiceService.getMyInvoices(vendorId);
        const cleanData = Array.isArray(data) ? data : [];
        
        setInvoices(cleanData);
        setFilteredInvoices(cleanData);

        // Compute Metric Dashboard Counters
        const stats = { total: cleanData.length, pending: 0, approved: 0, rejected: 0, paid: 0 };
        cleanData.forEach(inv => {
          const s = (inv.invoiceStatus || inv.status || "").toUpperCase();
          const p = (inv.paymentStatus || "").toUpperCase();
          if (s === "PENDING_REVIEW") stats.pending++;
          if (s === "APPROVED") stats.approved++;
          if (s === "REJECTED") stats.rejected++;
          if (p === "PAID") stats.paid++;
        });
        setMetrics(stats);

      } catch (err) {
        console.error(err);
        setApiError("Unable to fetch invoices list from server.");
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  // Live Multi-Filter Matrix Evaluation
  useEffect(() => {
    let result = [...invoices];

    if (searchInvoice.trim() !== "") {
      result = result.filter(inv => inv.invoiceNumber?.toLowerCase().includes(searchInvoice.toLowerCase()));
    }
    if (searchPO.trim() !== "") {
      result = result.filter(inv => inv.poNumber?.toLowerCase().includes(searchPO.toLowerCase()));
    }
    if (statusFilter !== "All Status") {
      result = result.filter(inv => (inv.invoiceStatus || inv.status || "").toUpperCase() === statusFilter.toUpperCase());
    }
    if (paymentFilter !== "All Payments") {
      result = result.filter(inv => (inv.paymentStatus || "").toUpperCase() === paymentFilter.toUpperCase());
    }
    if (dateFilter) {
      result = result.filter(inv => inv.invoiceDate === dateFilter);
    }
    setFilteredInvoices(result);
  }, [searchInvoice, searchPO, statusFilter, paymentFilter, dateFilter, invoices]);

  const handleResetFilters = () => {
    setSearchInvoice(""); setSearchPO(""); setStatusFilter("All Status"); setPaymentFilter("All Payments"); setDateFilter("");
  };

  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.warning("No data assets available to export.");
      return;
    }
    try {
      setExporting(true);
      const worksheetData = filteredInvoices.map(inv => ({
        "Invoice Number": inv.invoiceNumber || "—",
        "PO Number": inv.poNumber || "—",
        "Vendor": inv.vendorName || "—",
        "Employee": inv.employeeName || "—",
        "Invoice Date": formatDate(inv.invoiceDate),
        "Due Date": formatDate(inv.dueDate),
        "Amount": parseFloat(inv.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" }),
        "Status": (inv.invoiceStatus || inv.status || "PENDING_REVIEW").replace("_", " "),
        "Payment Status": inv.paymentStatus || "PENDING"
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "My Invoices");

      worksheet["!cols"] = Object.keys(worksheetData[0]).map(key => ({
        wch: Math.max(key.length, ...worksheetData.map(row => row[key] ? row[key].toString().length : 0)) + 4
      }));

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Vendor_Invoices_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Invoices spreadsheet report exported successfully.");
    } catch (err) {
      toast.error("Excel sheet generation failed.");
    } finally { setExporting(false); }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      setDownloadingId(id);
      const response = await vendorInvoiceService.downloadInvoice(id);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", `Invoice_${id}.pdf`);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
    } catch (err) {
      toast.error("Unable to download Invoice file.");
    } finally { setDownloadingId(null); }
  };

  return (
    <VendorLayout pageTitle="My Invoices" pageSubtitle="Track metrics, check payment statuses and download submitted invoices ledger.">
      
      {/* METRIC DASHBOARD METADATA SUMMARY COUNTERS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Invoices", value: metrics.total, color: "#2563eb", bg: "#eef2ff", icon: "description" },
          { label: "Pending Review", value: metrics.pending, color: "#d97706", bg: "#fffbeb", icon: "schedule" },
          { label: "Approved Invoices", value: metrics.approved, color: "#16a34a", bg: "#f0fdf4", icon: "check_circle" },
          { label: "Rejected Invoices", value: metrics.rejected, color: "#ef4444", bg: "#fef2f2", icon: "cancel" },
          { label: "Paid Invoices", value: metrics.paid, color: "#a855f7", bg: "#f3e8ff", icon: "payments" }
        ].map((c, i) => (
          <div key={i} className="card p-3 text-start bg-white border border-light-subtle rounded-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>{c.label}</span>
              <div style={{ width: "34px", height: "34px", backgroundColor: c.bg, color: c.color, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{c.icon}</span>
              </div>
            </div>
            <h3 className="m-0 fw-bold text-dark mb-1" style={{ fontSize: "24px" }}>{c.value}</h3>
          </div>
        ))}
      </div>

      {/* FILTER CONTROL PANEL WIDGET SHEET */}
      <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 text-start bg-white">
        <div className="row g-3 align-items-end" style={{ fontSize: "13px" }}>
          <div className="col-md-2.5">
            <label className="form-label text-secondary small fw-medium mb-1">Invoice Number</label>
            <input type="text" className="form-control py-2" placeholder="INV-2026-..." value={searchInvoice} onChange={e => setSearchInvoice(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2.5">
            <label className="form-label text-secondary small fw-medium mb-1">PO Number</label>
            <input type="text" className="form-control py-2" placeholder="PO-2026-..." value={searchPO} onChange={e => setSearchPO(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Invoice Date</label>
            <input type="date" className="form-control py-2 font-monospace" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ fontSize: "13px" }} />
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Status</label>
            <select className="form-select py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: "13px" }}>
              <option value="All Status">All Status</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label text-secondary small fw-medium mb-1">Payment</label>
            <select className="form-select py-2" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ fontSize: "13px" }}>
              <option value="All Payments">All Payments</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div className="col-md-1 d-flex gap-1">
            <button type="button" className="btn btn-outline-secondary py-2 px-3 align-middle" onClick={handleResetFilters} style={{ borderRadius: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", verticalAlign: "middle" }}>restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE DATA DATATABLE GRID STRUCTURE */}
      <div className="card shadow-sm border border-light-subtle rounded-3 overflow-hidden bg-white text-start mb-4">
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <span className="text-secondary small fw-semibold">Showing {filteredInvoices.length} records found</span>
          <button type="button" disabled={exporting} className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-3" onClick={handleExportExcel} style={{ fontSize: "12px", borderRadius: "6px" }}>
            {exporting ? <span className="spinner-border spinner-border-sm"></span> : <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>text_snippet</span>}
            Export Excel
          </button>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-5 text-center text-muted fw-medium fs-6">No Invoices Found</div>
          ) : (
            <table className="table align-middle m-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{ padding: "14px 16px" }}>Invoice Number</th>
                  <th style={{ padding: "14px 16px" }}>PO Number</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Date</th>
                  <th style={{ padding: "14px 16px" }}>Due Date</th>
                  <th style={{ padding: "14px 16px" }}>Vendor</th>
                  <th style={{ padding: "14px 16px" }}>Employee</th>
                  <th style={{ padding: "14px 16px" }}>Amount</th>
                  <th style={{ padding: "14px 16px" }}>Invoice Status</th>
                  <th style={{ padding: "14px 16px" }}>Payment Status</th>
                  <th className="text-center" style={{ padding: "14px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="fw-semibold text-primary font-monospace" style={{ padding: "14px 16px" }}>{inv.invoiceNumber}</td>
                    <td className="font-monospace text-secondary" style={{ padding: "14px 16px" }}>{inv.poNumber || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>{formatDate(inv.invoiceDate)}</td>
                    <td style={{ padding: "14px 16px" }}>{formatDate(inv.dueDate)}</td>
                    <td className="text-dark fw-medium" style={{ padding: "14px 16px" }}>{inv.vendorName || "—"}</td>
                    <td className="text-muted" style={{ padding: "14px 16px" }}>{inv.employeeName || "—"}</td>
                    <td className="font-monospace fw-bold text-dark" style={{ padding: "14px 16px" }}>
                      ₹{parseFloat(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${
                        (inv.invoiceStatus || inv.status || "").toUpperCase() === "APPROVED" ? "bg-success-subtle text-success border border-success-subtle" :
                        (inv.invoiceStatus || inv.status || "").toUpperCase() === "REJECTED" ? "bg-danger-subtle text-danger border border-danger-subtle" :
                        "bg-warning-subtle text-warning border border-warning-subtle"
                      }`} style={{ fontSize: "11px" }}>
                        {(inv.invoiceStatus || inv.status || "PENDING_REVIEW").replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`badge px-2.5 py-1.5 rounded-2 small fw-bold ${
                        (inv.paymentStatus || "").toUpperCase() === "PAID" ? "bg-primary-subtle text-primary border border-primary-subtle" :
                        (inv.paymentStatus || "").toUpperCase() === "PARTIALLY_PAID" ? "bg-info-subtle text-info border border-info-subtle" :
                        (inv.paymentStatus || "").toUpperCase() === "FAILED" ? "bg-danger-subtle text-danger border border-danger-subtle" :
                        "bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }`} style={{ fontSize: "11px" }}>
                        {inv.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div className="d-flex justify-content-center align-items-center gap-2">
                        {/* 🚀 FIXED: Eye icon now securely maps and navigates to the completely NEW MyInvoiceView route point */}
                        <button 
                          type="button" 
                          className="btn btn-sm d-flex align-items-center justify-content-center text-primary rounded-circle border-0" 
                          title="View Details" 
                          onClick={() => navigate(`/vendor/invoices/view-by-id/${inv.id}`)} 
                          style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                        </button>
                        <button type="button" disabled={downloadingId !== null} className="btn btn-sm d-flex align-items-center justify-content-center text-success rounded-circle border-0" title="Download PDF" onClick={() => handleDownloadInvoice(inv.id)} style={{ width: "32px", height: "32px", backgroundColor: "#f0fdf4" }}>
                          {downloadingId === inv.id ? <span className="spinner-border spinner-border-sm" style={{ width: "14px", height: "14px" }}></span> : <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </VendorLayout>
  );
};

export default MyInvoiceList;