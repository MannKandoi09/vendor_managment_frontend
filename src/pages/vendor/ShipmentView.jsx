import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorShipmentService from "../../services/vendorShipmentService";
import { toast } from "react-toastify";

const ShipmentView = () => {
  const { shipmentId } = useParams(); // 🚀 Reads shipmentId parameter from router context
  const navigate = useNavigate();

  // Core Functional States
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Convert YYYY-MM-DD to standard corporate format (e.g., 23 Jun 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    } catch (e) { return dateStr; }
  };

  // Fetch metrics data on component mount
  useEffect(() => {
    const fetchShipmentDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await vendorShipmentService.viewShipment(shipmentId);
        setShipment(data);
      } catch (err) {
        console.error("Fulfillment details lookup fault:", err);
        setError("Unable to load Shipment Details.");
        toast.error("Failed to load requested shipment profile parameters.");
      } finally {
        setLoading(false);
      }
    };

    if (shipmentId) fetchShipmentDetails();
  }, [shipmentId]);

  // Status Badges Aesthetic Classes mapping criteria
  const getStatusBadgeClass = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "DELIVERED") return "bg-success-subtle text-success border border-success-subtle"; // Green
    if (s === "DISPATCHED") return "bg-primary-subtle text-primary border border-primary-subtle"; // Blue
    if (s === "IN_TRANSIT" || s === "IN TRANSIT") return "bg-purple-subtle text-purple border border-purple-subtle"; // Purple
    if (s === "CANCELLED") return "bg-danger-subtle text-danger border border-danger-subtle"; // Red
    return "bg-warning-subtle text-warning border border-warning-subtle"; // Orange / PENDING
  };

  // 🚀 FIXED: Proof Asset Downloader Handler without Binary Corruption
  const handleDownloadProof = async () => {
    if (!shipment || !shipment.id) return;
    try {
      setDownloading(true);
      const response = await vendorShipmentService.downloadProof(shipment.id);
      
      if (!response.data || response.data.size === 0) {
        toast.error("Proof image/document file not found on server store.");
        return;
      }

      // Extract dynamic filename from Content-Disposition header safely if available
      let filename = `Proof_Delivery_${shipment.deliveryCode || "Doc"}.png`;
      const disposition = response.headers?.["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, "");
      }

      // 🚀 FIXED: Passing response.data directly to createObjectURL to prevent binary stream damage
      const blobUrl = window.URL.createObjectURL(response.data);
      const tempAnchor = document.createElement("a");
      tempAnchor.href = blobUrl;
      tempAnchor.setAttribute("download", filename);
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      tempAnchor.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Proof file downloaded successfully.");
    } catch (err) {
      console.error("Blob downloader exception context:", err);
      toast.error("Unable to execute proof document download.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout pageTitle="Shipment Details">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Syncing telemetry data streams...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error || !shipment) {
    return (
      <VendorLayout pageTitle="Shipment Details">
        <div className="alert alert-danger py-3 px-4 rounded-3 text-start mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2 fw-bold mb-1">
            <span className="material-symbols-outlined">warning</span>
            System Execution Fault
          </div>
          <p className="m-0 small">{error || "Requested shipment logistics entity could not be verified."}</p>
        </div>
        <div className="text-start">
          <button className="btn btn-secondary px-4 py-2" onClick={() => navigate("/vendor/shipments")} style={{ fontSize: "13px", borderRadius: "6px", fontWeight: "600" }}>
            ← Back to Shipment History
          </button>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout 
      pageTitle="Shipment Details" 
      pageSubtitle="View complete invoice and logistics tracking telemetry data layouts."
    >
      {/* BREADCRUMB ROUTING TRACE NAVIGATION */}
      <nav aria-label="breadcrumb" className="text-start mb-4">
        <ol className="breadcrumb small fw-medium" style={{ fontSize: "12px" }}>
          <li className="breadcrumb-item"><Link to="/vendor/dashboard" className="text-decoration-none text-muted">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/vendor/shipments" className="text-decoration-none text-muted">Shipment History</Link></li>
          <li className="breadcrumb-item active text-primary" aria-current="page">View Shipment</li>
        </ol>
      </nav>

      {/* ==================== SECTION 1: SHIPMENT INFORMATION ==================== */}
      <div className="card shadow-sm border border-light-subtle rounded-3 text-start mb-4 bg-white">
        <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>local_shipping</span>
          Shipment Information
        </div>
        <div className="card-body p-4">
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Delivery Code</label>
              <strong className="text-dark font-monospace" style={{ fontSize: "14px" }}>{shipment.deliveryCode || "—"}</strong>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Dispatch Date</label>
              <span className="text-dark fw-medium">{formatDate(shipment.dispatchDate)}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Expected Delivery Date</label>
              <span className="text-dark fw-medium">{formatDate(shipment.expectedDate)}</span>
            </div>
            <div className="col-md-3">
              <label className="text-muted d-block small mb-1">Actual Delivery Date</label>
              <span className="text-dark fw-medium">{formatDate(shipment.deliveryDate)}</span>
            </div>
          </div>

          <div className="row g-4 border-top pt-3 align-items-center">
            <div className="col-md-6">
              <label className="text-muted d-block small mb-1">Current Location Log</label>
              <span className="text-dark fw-bold font-monospace bg-light p-2.5 rounded d-block border border-light-subtle" style={{ fontSize: "13px" }}>
                <span className="material-symbols-outlined me-2 text-muted" style={{ fontSize: "16px", verticalAlign: "middle" }}>fmd_good</span>
                {shipment.currentLocation || "Location checkpoint unassigned."}
              </span>
            </div>
            <div className="col-md-6">
              <label className="text-muted d-block small mb-1">Shipment Status</label>
              <div className="pt-1">
                <span className={`badge px-3 py-1.5 fw-bold rounded-2 text-uppercase ${getStatusBadgeClass(shipment.status)}`} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  {shipment.status ? shipment.status.replace("_", " ") : "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2 & 3: PURCHASE ORDER & VENDOR SPECIFICATIONS ==================== */}
      <div className="row g-4 text-start mb-4">
        
        {/* Purchase Order Docs Card links */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>article</span>
              Purchase Order Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="row g-3">
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">PO Number</label>
                  <strong className="text-primary font-monospace" style={{ fontSize: "14px" }}>{shipment.poNumber || "—"}</strong>
                </div>
                <div className="col-6">
                  <label className="text-muted d-block small mb-1">Invoice Number</label>
                  <strong className="text-secondary font-monospace" style={{ fontSize: "14px" }}>{shipment.invoiceNumber || "—"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Corporate Data Profile Card */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>store</span>
              Vendor Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div>
                <label className="text-muted d-block small mb-1">Vendor Name</label>
                <strong className="text-dark text-uppercase" style={{ fontSize: "14px", color: "#0f172a" }}>{shipment.vendorName || "—"}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== SECTION 4 & 5: EMPLOYEE & ADDRESS PARAMETERS LAYOUT ==================== */}
      <div className="row g-4 text-start mb-4">
        
        {/* Internal Assigned Staff Metadata Segment */}
        <div className="col-md-5">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>badge</span>
              Employee Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="mb-3">
                <label className="text-muted d-block small mb-1">Employee Name</label>
                <strong className="text-dark">{shipment.employeeName || "—"}</strong>
              </div>
              <div>
                <label className="text-muted d-block small mb-1">Employee Code</label>
                <span className="font-monospace fw-semibold text-secondary">{shipment.employeeCode || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Address Directory Mapping Cards */}
        <div className="col-md-7">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>location_on</span>
              Address Information
            </div>
            <div className="card-body p-4" style={{ fontSize: "13px" }}>
              <div className="row g-3">
                <div className="col-6 border-end">
                  <label className="text-muted d-block small mb-1">Billing Address</label>
                  <p className="text-secondary m-0 small fw-medium" style={{ lineHeight: "1.5" }}>{shipment.billingAddress || "—"}</p>
                </div>
                <div className="col-6 ps-3">
                  <label className="text-muted d-block small mb-1">Delivery Address</label>
                  <p className="text-secondary m-0 small fw-medium" style={{ lineHeight: "1.5" }}>{shipment.deliveryAddress || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== SECTION 6 & 7: REMARKS & PROOF PREVIEW BLOCKS ==================== */}
      <div className="row g-4 text-start mb-5">
        
        {/* Read-Only Workflow Notes Area */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 p-4 h-100 bg-white" style={{ fontSize: "13px" }}>
            <label className="form-label text-secondary small fw-bold text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>Remarks</label>
            <textarea 
              className="form-control bg-light text-secondary font-monospace small" 
              rows="5" 
              value={shipment.remarks || "No additional delivery or verification notes left against this routing docket."} 
              readOnly 
              style={{ cursor: "default", resize: "none", fontSize: "13px", lineHeight: "1.5" }}
            />
          </div>
        </div>

        {/* Proof Document Frame / Preview Box */}
        <div className="col-md-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 bg-white h-100">
            {/* 🚀 FIXED: Changed typo icon token from 'task_validate' to standard 'verified' to resolve typography distortion */}
            <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>verified</span>
              Delivery Proof Verification
            </div>
            <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center h-100">
              
              {/* Dynamic Rendering Image Container */}
              {shipment.proofImageUrl ? (
                <div className="w-100 text-center">
                  <div className="mb-3 border rounded-3 overflow-hidden bg-light mx-auto" style={{ maxWidth: "100%", maxHeight: "160px" }}>
                    <img 
                      src={`http://localhost:8080/${shipment.proofImageUrl}`} 
                      alt="Fulfillment Proof Snapshot" 
                      style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "160px", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://placehold.co/300x150?text=Preview+Unavailable";
                      }}
                    />
                  </div>
                  <button 
                    type="button" 
                    disabled={downloading} 
                    className="btn btn-sm btn-outline-success px-4 py-2 w-100 d-flex align-items-center justify-content-center gap-1.5" 
                    onClick={handleDownloadProof} 
                    style={{ borderRadius: "6px", fontWeight: "600", fontSize: "12px" }}
                  >
                    {downloading ? <span className="spinner-border spinner-border-sm"></span> : <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>}
                    {downloading ? "Downloading..." : "Download Proof Document"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-muted mb-2" style={{ fontSize: "36px" }}>image_not_supported</span>
                  <p className="text-secondary small mb-0">Fulfillment digital image proof placeholder is detached.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ==================== BOTTOM INTERACTIVE BACK AND EXPORT BAR CONTROLS ==================== */}
      <div className="d-flex justify-content-between align-items-center border-top pt-4 mb-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary px-4 py-2" 
          onClick={() => navigate("/vendor/shipments")}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: "#ffffff" }}
        >
          ← Back to Shipment History
        </button>
        
        <button 
          type="button" 
          disabled={downloading}
          className="btn btn-primary px-4 py-2 text-white d-flex align-items-center gap-2" 
          onClick={handleDownloadProof}
          style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: downloading ? "#94a3b8" : "#2563eb", border: "none" }}
        >
          {downloading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
          {downloading ? "Downloading Document..." : "Download Proof"}
        </button>
      </div>

    </VendorLayout>
  );
};

export default ShipmentView;