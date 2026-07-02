import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorPaymentService from "../../services/vendorPaymentService";
import { toast } from "react-toastify";

const PaymentView = () => {
  const { paymentId } = useParams(); // 🚀 Reads exact paymentId from URL parameter tracking
  const navigate = useNavigate();

  // Component Framework States
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

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

  // Lifecycle fetch mapping on mount phase
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await vendorPaymentService.viewPayment(paymentId);
        setPayment(data);
      } catch (err) {
        console.error("Payment details fetch failure:", err);
        setError("Unable to load Payment Details.");
        toast.error("Failed to load requested payment parameters.");
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) fetchPaymentDetails();
  }, [paymentId]);

  // Payment Status Badge Renderer mapping project style
  const getStatusBadgeClass = (status) => {
    const p = (status || "PENDING").toUpperCase();
    if (p === "PAID") return "bg-primary-subtle text-primary border border-primary-subtle"; // Blue
    if (p === "FAILED") return "bg-danger-subtle text-danger border border-danger-subtle"; // Red
    return "bg-secondary-subtle text-secondary border border-secondary-subtle"; // Grey / PENDING
  };

  // Direct Binary Blob Download Handler
  const handleDownloadReceipt = async () => {
    if (!payment || !payment.id) return;
    try {
      setDownloading(true);
      const response = await vendorPaymentService.downloadReceipt(payment.id);
      
      if (!response.data || response.data.size === 0) {
        toast.error("PDF Receipt document not found.");
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", `Receipt_${payment.paymentNumber || "Document"}.pdf`);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Receipt downloaded successfully.");
    } catch (err) {
      console.error("Receipt download failure block:", err);
      toast.error("Unable to download transaction receipt.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout pageTitle="Payment Details">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading data segments...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error || !payment) {
    return (
      <VendorLayout pageTitle="Payment Details">
        <div className="alert alert-danger py-3 px-4 rounded-3 text-start mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2 fw-bold mb-1">
            <span className="material-symbols-outlined">warning</span>
            System Fault Resolve
          </div>
          <p className="m-0 small">{error || "Requested settlement record cannot be successfully generated."}</p>
        </div>
        <div className="text-start">
          <button className="btn btn-secondary px-4 py-2" onClick={() => navigate("/vendor/payments")} style={{ fontSize: "13px", borderRadius: "6px", fontWeight: "600" }}>
            ← Back to Payment History
          </button>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout 
      pageTitle="Payment Details" 
      pageSubtitle="View complete invoice payment information."
    >
      {/* BREADCRUMB ROUTING MAP NAVIGATION */}
      <nav aria-label="breadcrumb" className="text-start mb-4">
        <ol className="breadcrumb small fw-medium" style={{ fontSize: "12px" }}>
          <li className="breadcrumb-item"><Link to="/vendor/dashboard" className="text-decoration-none text-muted">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/vendor/payments" className="text-decoration-none text-muted">Payment History</Link></li>
          <li className="breadcrumb-item active text-primary" aria-current="page">View Payment</li>
        </ol>
      </nav>

      {/* ==================== SECTION 1: PAYMENT INFORMATION ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 text-start mb-4 bg-white">
        <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>payments</span>
          Payment Information
        </div>
        <div className="card-body p-4">
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Payment Number</label>
              <strong className="text-dark font-monospace" style={{ fontSize: "14px" }}>{payment.paymentNumber || "—"}</strong>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Payment Date</label>
              <span className="text-dark fw-medium">{formatDate(payment.paymentDate)}</span>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Payment Method</label>
              <span className="text-dark fw-semibold font-monospace text-uppercase">{payment.paymentMethod || "—"}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Payment Amount</label>
              <strong className="text-primary font-monospace" style={{ fontSize: "16px" }}>
                ₹{parseFloat(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="col-md-2">
              <label className="text-muted d-block small mb-1">Payment Status</label>
              <div className="pt-0.5">
                <span className={`badge px-2.5 py-1.5 fw-bold rounded-2 text-uppercase ${getStatusBadgeClass(payment.status)}`} style={{ fontSize: "11px" }}>
                  {payment.status || "PENDING"}
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4 border-top pt-3">
            <div className="col-md-4">
              <label className="text-muted d-block small mb-1">Reference Number / UTR</label>
              <span className="text-dark font-monospace fw-bold" style={{ fontSize: "13px" }}>{payment.referenceNumber || "—"}</span>
            </div>
            <div className="col-md-8">
              <label className="text-muted d-block small mb-1">Remarks</label>
              <p className="text-secondary m-0 bg-light p-2.5 rounded small font-monospace">
                {payment.remarks || "No additional transaction notes appended against this payment voucher."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2: INVOICE & PO INFORMATION ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 bg-white text-start mb-4">
        <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>description</span>
          Invoice &amp; Purchase Order Information
        </div>
        <div className="card-body p-4" style={{ fontSize: "13px" }}>
          <div className="row g-4">
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Invoice Number</label>
              <strong className="text-dark font-monospace text-primary" style={{ fontSize: "14px" }}>{payment.invoiceNumber || "—"}</strong>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Invoice Date</label>
              <span className="text-dark fw-medium">{formatDate(payment.invoiceDate)}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Due Date</label>
              <span className="text-dark fw-medium">{formatDate(payment.dueDate)}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Purchase Order Number</label>
              <strong className="text-secondary font-monospace" style={{ fontSize: "14px" }}>{payment.poNumber || "—"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 3 & 4: VENDOR & EMPLOYEE SPLIT LAYOUT ==================== */}
      <div className="row g-4 text-start mb-4">
        {/* Vendor Segment */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>store</span>
              Vendor Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div>
                <label className="text-muted d-block small mb-1">Vendor Name</label>
                <strong className="text-dark text-uppercase" style={{ fontSize: "14px" }}>{payment.vendorName || "—"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Segment */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>badge</span>
              Employee Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="row g-3">
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Employee Name</label>
                  <strong className="text-dark">{payment.employeeName || "—"}</strong>
                </div>
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Employee Code</label>
                  <span className="font-monospace fw-semibold text-secondary">{payment.employeeCode || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 5: ADDRESS DETAILS CONTAINER ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 text-start mb-5 bg-white" style={{ fontSize: "13px" }}>
        <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>location_on</span>
          Address Information
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6 border-end">
              <label className="text-muted d-block small mb-1">Billing Address</label>
              <p className="text-secondary m-0 small fw-medium" style={{ lineHeight: "1.5" }}>{payment.billingAddress || "—"}</p>
            </div>
            <div className="col-md-6 ps-md-4">
              <label className="text-muted d-block small mb-1">Delivery Address</label>
              <p className="text-secondary m-0 small fw-medium" style={{ lineHeight: "1.5" }}>{payment.deliveryAddress || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE ACTION PANEL FOOTER CONTROLS BAR */}
      <div className="d-flex justify-content-between align-items-center border-top pt-4 mb-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary px-4 py-2" 
          onClick={() => navigate("/vendor/payments")}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: "#ffffff" }}
        >
          ← Back
        </button>
        <button 
          type="button" 
          disabled={downloading}
          className="btn btn-primary px-4 py-2 text-white d-flex align-items-center gap-2" 
          onClick={handleDownloadReceipt}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: downloading ? "#94a3b8" : "#2563eb", border: "none" }}
        >
          {downloading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
          {downloading ? "Downloading..." : "Download Receipt"}
        </button>
      </div>

    </VendorLayout>
  );
};

export default PaymentView;