import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import vendorInvoiceService from "../../services/vendorInvoiceService";
import { toast } from "react-toastify"; 

const VendorInvoiceEdit = () => {
  const { purchaseOrderId } = useParams();
  const navigate = useNavigate();

  // Framework Structural States
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Editable Form Payload Bucket
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    remarks: ""
  });

  // Lifecycle load effect to fetch target PO and Invoice configuration records on mount phase
  useEffect(() => {
    const fetchInvoiceForEdit = async () => {
      try {
        setLoading(true);
        const data = await vendorInvoiceService.getInvoiceForEdit(purchaseOrderId);
        setInvoiceDetails(data);
        
        if (data) {
          // Prefill all the form inputs fields using existing rejected ledger datasets
          setFormData({
            invoiceNumber: data.invoiceNumber || "",
            invoiceDate: data.invoiceDate || "",
            dueDate: data.dueDate || "",
            amount: data.amount || "",
            remarks: data.remarks || ""
          });
        }
      } catch (err) {
        console.error("Framework failure fetching rejected invoice context profiles:", err);
        toast.error("Unable to load the requested invoice data for editing updates.");
      } finally {
        setLoading(false);
      }
    };

    if (purchaseOrderId) fetchInvoiceForEdit();
  }, [purchaseOrderId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Drag & Drop local file intercept handler
  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.warning("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { 
      toast.warning("Maximum file size is 5 MB");
      return;
    }
    setSelectedFile(file);
    toast.info(`New Attached Attachment File: ${file.name}`);
  };

  // Business validation logic rules tracking matching price constraints thresholds
  const poGrandTotal = invoiceDetails ? (invoiceDetails.grandTotal || invoiceDetails.poAmount || 0) : 0;
  const inputAmount = Number(formData.amount || 0);
  const isAmountInvalid = inputAmount > poGrandTotal;

  // Triggers view current document preview
  const handleViewPDF = () => {
    if (invoiceDetails?.id) {
      // Re-use the existing active secure blob preview window generator tab structure
      vendorInvoiceService.downloadInvoice(invoiceDetails.id)
        .then(res => {
          const fileViewUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
          window.open(fileViewUrl, "_blank");
        })
        .catch(() => toast.error("Unable to compile view window presentation stream."));
    }
  };

  // Triggers immediate background direct download stream link mapping 
  const handleDownloadPDF = () => {
    if (invoiceDetails?.id) {
      vendorInvoiceService.downloadInvoice(invoiceDetails.id)
        .then(res => {
          const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
          const tempLink = document.createElement("a");
          tempLink.href = blobUrl;
          tempLink.setAttribute("download", `Current_Invoice_${formData.invoiceNumber}.pdf`);
          document.body.appendChild(tempLink);
          tempLink.click();
          tempLink.remove();
        })
        .catch(() => toast.error("Unable to execute file buffer download transmission."));
    }
  };

  // Core Form Submit execution handler pipeline node
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceDate || !formData.dueDate || !formData.amount) {
      toast.warning("Please complete all required fields annotated with a red asterisk.");
      return;
    }

    if (isAmountInvalid) {
      toast.error("Invoice Amount cannot exceed Purchase Order Amount.");
      return;
    }

    try {
      setSubmitting(true);
      
      // Building standard structured PUT FormData payload mapping configuration
      const updateData = new FormData();
      updateData.append("invoiceDate", formData.invoiceDate);
      updateData.append("dueDate", formData.dueDate);
      updateData.append("amount", Number(formData.amount));
      updateData.append("remarks", formData.remarks || "");
      
      // Attaching file binary context blob only if user uploads a replacement advisory report
      if (selectedFile) {
        updateData.append("invoiceFile", selectedFile);
      }

      await vendorInvoiceService.updateInvoice(invoiceDetails.id, updateData);
      
      toast.success("Invoice updated and resubmitted successfully.");
      navigate("/vendor/purchase-orders/list");
    } catch (err) {
      console.error("Invoice updates compilation failed:", err);
      toast.error(err.response?.data?.message || "Failed to commit invoice revision adjustments.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout pageTitle="Loading Invoice Parameters...">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading telemetry records...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout pageTitle="Edit Invoice" pageSubtitle="Modify and resubmit rejected invoice parameters">
      
      <div className="text-start mb-3">
        <button 
          type="button"
          className="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1 text-secondary fw-semibold" 
          onClick={() => navigate("/vendor/purchase-orders/list")}
          style={{ fontSize: "13px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Purchase Orders
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="text-start mx-auto w-100" style={{ fontSize: "13px" }}>
        
        {/* ==================== BLOCK 1: READ ONLY PO REFERENCE AND SPECIFICATIONS ==================== */}
        <div className="card shadow-sm border border-light-subtle rounded-3 mb-4 bg-white">
          <div className="p-3 bg-light border-bottom text-primary fw-bold small d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>info</span>
            Purchase Order Information (Read-Only)
          </div>
          <div className="card-body p-4 bg-light-subtle">
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">PO Number</label>
                <input type="text" className="form-control py-2 bg-light text-secondary font-monospace fw-semibold" value={invoiceDetails?.poNumber || "—"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Vendor Entity Name</label>
                <input type="text" className="form-control py-2 bg-light text-secondary" value={invoiceDetails?.vendorName || "—"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Assigned Employee</label>
                <input type="text" className="form-control py-2 bg-light text-secondary" value={invoiceDetails?.employeeName || "—"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Payment Terms</label>
                <input type="text" className="form-control py-2 bg-light text-secondary font-monospace" value={invoiceDetails?.paymentTerms || "—"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">PO Total Threshold Amount (₹)</label>
                <input type="text" className="form-control py-2 bg-light text-dark fw-bold font-monospace" value={poGrandTotal ? parseFloat(poGrandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-5">
                <label className="form-label text-muted small mb-1">Delivery Destination Address</label>
                <input type="text" className="form-control py-2 bg-light text-secondary" value={invoiceDetails?.deliveryAddress || "—"} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Invoice Historical Status</label>
                <div>
                  <span className="badge px-3 py-2 bg-danger-subtle text-danger border border-danger-subtle fw-bold rounded-2" style={{ fontSize: "11px" }}>
                    {invoiceDetails?.status || "REJECTED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== BLOCK 2: EDITABLE TRANSACTION CONTROLS FORM ==================== */}
        <div className="card shadow-sm border border-light-subtle rounded-3 mb-4 bg-white">
          <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit_note</span>
            Invoice Details Revision
          </div>
          <div className="card-body p-4">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">Invoice Number (Locked) *</label>
                <input type="text" className="form-control py-2 bg-light font-monospace text-secondary fw-semibold" name="invoiceNumber" value={formData.invoiceNumber} readOnly style={{ cursor: "not-allowed", fontSize: "13px" }} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium mb-1">Invoice Date *</label>
                <input type="date" className="form-control py-2 text-dark font-monospace" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} required style={{ fontSize: "13px" }} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium mb-1">Due Date *</label>
                <input type="date" className="form-control py-2 text-dark font-monospace" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required style={{ fontSize: "13px" }} />
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-4">
                <label className="form-label text-secondary small fw-medium mb-1">Invoice Amount (₹) *</label>
                <input type="number" className={`form-control py-2 font-monospace fw-bold ${isAmountInvalid ? "is-invalid" : "text-dark"}`} name="amount" placeholder="Enter invoice amount" value={formData.amount} onChange={handleInputChange} required style={{ fontSize: "13px" }} />
                {isAmountInvalid && (
                  <div className="invalid-feedback fw-semibold" style={{ fontSize: "11px" }}>
                    Invoice Amount cannot exceed Purchase Order Amount.
                  </div>
                )}
              </div>
              <div className="col-md-8">
                <label className="form-label text-secondary small fw-medium mb-1">Remarks / Correction Response Log</label>
                <input type="text" className="form-control py-2 text-dark" name="remarks" placeholder="Provide adjustment notes" value={formData.remarks} onChange={handleInputChange} style={{ fontSize: "13px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== BLOCK 3: EXISTING PDF VIEW/DOWNLOAD PANEL WIDGET ==================== */}
        <div className="card shadow-sm border border-light-subtle rounded-3 mb-4 bg-white">
          <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>task</span>
            Currently Uploaded Invoice Document
          </div>
          <div className="card-body p-3 bg-light-subtle d-flex justify-content-between align-items-center px-4 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-danger" style={{ fontSize: "24px" }}>picture_as_pdf</span>
              <span className="fw-semibold text-dark font-monospace">{formData.invoiceNumber ? `${formData.invoiceNumber}.pdf` : "Current_Invoice.pdf"}</span>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-light border px-3 text-secondary d-flex align-items-center gap-1" onClick={handleViewPDF} style={{ fontSize: "12px", fontWeight: "500" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span> View PDF
              </button>
              <button type="button" className="btn btn-sm btn-light border px-3 text-secondary d-flex align-items-center gap-1" onClick={handleDownloadPDF} style={{ fontSize: "12px", fontWeight: "500" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span> Download
              </button>
            </div>
          </div>
        </div>

        {/* ==================== BLOCK 4: REPLACEMENT DRAG & DROP MULTIPART CONTAINER ==================== */}
        <div className="card shadow-sm border border-light-subtle rounded-3 mb-4 bg-white">
          <div className="p-3 bg-light border-bottom text-dark fw-bold small d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cloud_upload</span>
            Replace Invoice File (Optional - PDF only, Max 5MB)
          </div>
          <div className="card-body p-4">
            <div 
              className="border border-dashed p-4 rounded-3 text-center bg-light-subtle position-relative"
              style={{ borderStyle: "dashed", borderColor: "#cbd5e1", cursor: "pointer", transition: "all 0.2s" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("hiddenEditFileInput").click()}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <input type="file" id="hiddenEditFileInput" accept="application/pdf" className="d-none" onChange={handleFileSelect} />
              <div className="text-secondary d-flex flex-column align-items-center justify-content-center gap-2 py-1">
                <span className="material-symbols-outlined text-muted" style={{ fontSize: "36px" }}>upload_file</span>
                <span>Drag &amp; drop new document version, or <span className="text-primary fw-semibold">click to browse</span></span>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-3 p-2 bg-success-subtle text-success border border-success-subtle rounded-3 d-flex align-items-center justify-content-between px-3">
                <div className="d-flex align-items-center gap-2 fw-medium">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                  <span>New file staged: <strong>{selectedFile.name}</strong> <span className="text-muted font-monospace small">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span></span>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}></button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR CONTROLS */}
        <div className="d-flex justify-content-end align-items-center gap-2 border-top pt-4 mb-4">
          <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => navigate("/vendor/purchase-orders/list")} style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: "#ffffff" }}>Cancel</button>
          
          <button 
            type="submit" 
            disabled={submitting || isAmountInvalid} 
            className="btn btn-primary px-4 py-2 text-white d-flex align-items-center gap-2" 
            style={{ borderRadius: "6px", fontWeight: "600", fontSize: "13px", backgroundColor: (submitting || isAmountInvalid) ? "#94a3b8" : "#2563eb", border: "none" }}
          >
            {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            {submitting ? "Updating Invoice..." : "Update Invoice"}
          </button>
        </div>

      </form>
    </VendorLayout>
  );
};

export default VendorInvoiceEdit;