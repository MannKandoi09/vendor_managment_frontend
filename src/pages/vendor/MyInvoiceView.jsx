import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorInvoiceService from "../../services/vendorInvoiceService";
import { toast } from "react-toastify";

const MyInvoiceView = () => {
  const { invoiceId } = useParams(); // 🚀 Reads invoiceId param matching route path definition
  const navigate = useNavigate();

  // Framework Structural States
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [viewingPdf, setViewingPDF] = useState(false);

  // Convert YYYY-MM-DD to standard DD MMM YYYY (e.g., 23 Jun 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Lifecycle fetch on mount phase
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        setError("");
        
        // 🚀 UPDATED: Calling the new frontend service method for precise Invoice ID mapping
        const data = await vendorInvoiceService.viewInvoiceByInvoiceId(invoiceId);
        
        // 🚀 FIXED: Added debugging console logs immediately before setting state parameters
        console.log("Invoice ID =", invoiceId);
        console.log("Invoice Response =", data);

        setInvoice(data);
      } catch (err) {
        console.error("Invoice custom lookup fault context:", err);
        setError("Unable to load Invoice Details.");
        toast.error("Failed to load requested invoice data details.");
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) fetchInvoiceDetails();
  }, [invoiceId]);

  // Status Badges Layout Configuration Classes mapping
  const getStatusBadgeClass = (status) => {
    const s = (status || "PENDING_REVIEW").toUpperCase();
    if (s === "APPROVED") return "bg-success-subtle text-success border border-success-subtle";
    if (s === "REJECTED") return "bg-danger-subtle text-danger border border-danger-subtle";
    return "bg-warning-subtle text-warning border border-warning-subtle"; // PENDING_REVIEW
  };

  const getPaymentStatusBadgeClass = (status) => {
    const p = (status || "PENDING").toUpperCase();
    if (p === "PAID") return "bg-primary-subtle text-primary border border-primary-subtle";
    if (p === "PARTIALLY_PAID") return "bg-info-subtle text-info border border-info-subtle";
    if (p === "FAILED") return "bg-danger-subtle text-danger border border-danger-subtle";
    return "bg-secondary-subtle text-secondary border border-secondary-subtle"; // PENDING
  };

  // Binary direct download handler execution system
  const handleDownloadInvoice = async () => {
    if (!invoice || !invoice.id) return;
    try {
      setDownloading(true);
      const response = await vendorInvoiceService.downloadInvoice(invoice.id);
      
      if (!response.data || response.data.size === 0) {
        toast.error("Invoice PDF binary layout not found.");
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", `Invoice_${invoice.invoiceNumber || "Record"}.pdf`);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download initialized successfully.");
    } catch (err) {
      console.error("PDF blob export crashed:", err);
      toast.error("Unable to execute file download stream.");
    } finally {
      setDownloading(false);
    }
  };

  // Direct tab iframe preview trigger
  const handleViewPDF = async () => {
    if (!invoice || !invoice.id) return;
    try {
      setViewingPDF(true);
      const response = await vendorInvoiceService.downloadInvoice(invoice.id);
      
      if (!response.data || response.data.size === 0) {
        toast.error("Invoice PDF context stream is empty.");
        return;
      }
      
      const fileBlob = new Blob([response.data], { type: "application/pdf" });
      const fileViewUrl = window.URL.createObjectURL(fileBlob);
      window.open(fileViewUrl, "_blank");
    } catch (err) {
      console.error("PDF preview initialization fault:", err);
      toast.error("Unable to render document snapshot layout.");
    } finally {
      setViewingPDF(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout pageTitle="My Invoice Details">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading system telemetry...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error || !invoice) {
    return (
      <VendorLayout pageTitle="My Invoice Details">
        <div className="alert alert-danger py-3 px-4 rounded-3 text-start mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 fw-bold mb-1">
            <span className="material-symbols-outlined">warning</span>
            Error Code Resolve
          </div>
          <p className="m-0 small">{error || "Requested invoice entity could not be verified."}</p>
        </div>
        <div className="text-start">
          <button className="btn btn-secondary px-4 py-2" onClick={() => navigate("/vendor/invoices/list")} style={{ fontSize: "13px", borderRadius: "6px", fontWeight: "600" }}>
            ← Back to Invoices List
          </button>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout 
      pageTitle="My Invoice Details" 
      pageSubtitle="View complete invoice information."
    >
      
      {/* BREADCRUMB SYSTEM LINK TRACE */}
      <nav aria-label="breadcrumb" className="text-start mb-4">
        <ol className="breadcrumb small fw-medium" style={{ fontSize: "12px" }}>
          <li className="breadcrumb-item"><Link to="/vendor/dashboard" className="text-decoration-none text-muted">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/vendor/invoices/list" className="text-decoration-none text-muted">My Invoices</Link></li>
          <li className="breadcrumb-item active text-primary" aria-current="page">View Invoice</li>
        </ol>
      </nav>

      {/* ==================== SECTION 1: INVOICE INFORMATION ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 text-start mb-4 bg-white">
        <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>description</span>
          Invoice Information
        </div>
        <div className="card-body p-4">
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Invoice Number</label>
              <strong className="text-dark font-monospace" style={{ fontSize: "14px" }}>{invoice.invoiceNumber || "—"}</strong>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Invoice Date</label>
              <span className="text-dark fw-medium">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Due Date</label>
              <span className="text-dark fw-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Invoice Amount</label>
              <strong className="text-primary font-monospace" style={{ fontSize: "15px" }}>
                ₹{parseFloat(invoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Invoice Status</label>
              <div className="pt-0.5">
                <span className={`badge px-2.5 py-1.5 fw-bold rounded-2 text-uppercase ${getStatusBadgeClass(invoice.invoiceStatus || invoice.status)}`} style={{ fontSize: "11px" }}>
                  {(invoice.invoiceStatus || invoice.status || "PENDING_REVIEW").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4 border-top pt-3">
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Payment Status</label>
              <div className="pt-0.5">
                <span className={`badge px-2.5 py-1.5 fw-bold rounded-2 text-uppercase ${getPaymentStatusBadgeClass(invoice.paymentStatus)}`} style={{ fontSize: "11px" }}>
                  {invoice.paymentStatus || "PENDING"}
                </span>
              </div>
            </div>
            <div className="col-md-9">
              <label className="text-muted d-block small mb-1">Remarks</label>
              <p className="text-secondary m-0 bg-light p-2.5 rounded small font-monospace" style={{ minHeight: "38px" }}>
                {invoice.remarks || "No supplementary corrections notes left on this record."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2 & 3: PURCHASE ORDER & VENDOR SUMMARY ==================== */}
      <div className="row g-4 text-start mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>article</span>
              Purchase Order Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">PO Number</label>
                  <strong className="text-dark font-monospace text-primary">{invoice.poNumber || "—"}</strong>
                </div>
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Payment Terms</label>
                  <strong className="text-dark font-monospace text-uppercase">{invoice.paymentTerms || "—"}</strong>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Order Date</label>
                  <span className="text-dark fw-medium">{formatDate(invoice.orderDate)}</span>
                </div>
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Expected Delivery Date</label>
                  <span className="text-dark fw-medium">{formatDate(invoice.expectedDeliveryDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>store</span>
              Vendor Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="mb-1">
                <label className="text-muted d-block small mb-1">Vendor Name</label>
                <strong className="text-dark text-uppercase" style={{ fontSize: "14px" }}>{invoice.vendorName || "—"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 4 & 5: EMPLOYEE & ADDRESS OVERLAYS ==================== */}
      <div className="row g-4 text-start mb-4">
        <div className="col-md-5">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>badge</span>
              Employee Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="mb-3">
                <label className="text-muted d-block small mb-1">Employee Name</label>
                <strong className="text-dark">{invoice.employeeName || "—"}</strong>
              </div>
              <div>
                <label className="text-muted d-block small mb-1">Employee Code</label>
                <span className="font-monospace fw-semibold text-secondary">{invoice.employeeCode || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>location_on</span>
              Addresses
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="row g-3">
                <div className="col-6 border-end">
                  <label className="text-muted d-block small mb-1">Billing Address</label>
                  <p className="text-secondary m-0 small" style={{ lineHeight: "1.5" }}>{invoice.billingAddress || "—"}</p>
                </div>
                <div className="col-6 ps-3">
                  <label className="text-muted d-block small mb-1">Delivery Address</label>
                  <p className="text-secondary m-0 small" style={{ lineHeight: "1.5" }}>{invoice.deliveryAddress || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 6 & 7: FINANCIAL SUMMARY & PDF VIEWER EXTRA ==================== */}
      <div className="row g-4 text-start mb-5">
        <div className="col-md-5">
          <div className="card shadow-sm border border-light-subtle rounded-3 p-4 bg-white h-100" style={{ fontSize: "13px" }}>
            <label className="text-secondary small fw-bold text-uppercase mb-3" style={{ letterSpacing: "0.5px" }}>Financial Summary</label>
            <div className="d-flex justify-content-between align-items-center mb-2.5">
              <span className="text-muted">Sub Total:</span>
              <span className="font-monospace text-secondary fw-semibold">
                ₹{parseFloat(invoice.subTotal || invoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Tax Amount:</span>
              <span className="font-monospace text-danger fw-semibold">
                + ₹{parseFloat(invoice.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <hr className="my-2 text-muted" />
            <div className="d-flex justify-content-between align-items-center pt-1">
              <strong className="text-dark" style={{ fontSize: "14px" }}>Grand Total:</strong>
              <strong className="text-primary font-monospace" style={{ fontSize: "16px" }}>
                ₹{parseFloat(invoice.grandTotal || invoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>picture_as_pdf</span>
              Invoice PDF Document
            </div>
            <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-2 bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>picture_as_pdf</span>
                </div>
                <div>
                  <strong className="text-dark d-block mb-0.5">{invoice.invoiceNumber ? `${invoice.invoiceNumber}.pdf` : "Invoice_Document.pdf"}</strong>
                  <span className="text-muted small" style={{ fontSize: "11px" }}>Format: PDF File</span>
                </div>
              </div>
              <div className="d-flex gap-2">
                {invoice.pdfUrl && (
                  <button 
                    type="button" 
                    disabled={downloading || viewingPdf}
                    className="btn btn-sm btn-outline-secondary px-3 py-2 d-flex align-items-center gap-1" 
                    onClick={handleViewPDF} 
                    style={{ borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}
                  >
                    {viewingPdf ? <span className="spinner-border spinner-border-sm me-1"></span> : <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>}
                    View Preview
                  </button>
                )}
                <button 
                  type="button" 
                  disabled={downloading || viewingPdf}
                  className="btn btn-sm btn-outline-success px-3 py-2 d-flex align-items-center gap-1" 
                  onClick={handleDownloadInvoice} 
                  style={{ borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}
                >
                  {downloading ? <span className="spinner-border spinner-border-sm me-1"></span> : <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>}
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CONTROL BAR */}
      <div className="d-flex justify-content-between align-items-center border-top pt-4 mb-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary px-4 py-2" 
          onClick={() => navigate("/vendor/invoices/list")}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: "#ffffff" }}
        >
          ← Back
        </button>
        <button 
          type="button" 
          disabled={downloading || viewingPdf}
          className="btn btn-primary px-4 py-2 text-white d-flex align-items-center gap-2" 
          onClick={handleDownloadInvoice}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: (downloading || viewingPdf) ? "#94a3b8" : "#2563eb", border: "none" }}
        >
          {downloading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
          {downloading ? "Downloading PDF..." : "Download PDF"}
        </button>
      </div>

    </VendorLayout>
  );
};

export default MyInvoiceView;