import React from "react";
import VendorLayout from "../../components/vendor_layout/VendorLayout";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);
console.log(
  JSON.parse(localStorage.getItem("currentUser"))
);

const VendorDashboard = () => {

  // ==================== STATIC EXACT DATA MAPPINGS ====================
  const approvedCount = 18;
  const pendingCount = 5;
  const rejectedCount = 2;
  const paidCount = 2;

  const donutData = {
    labels: ["Approved", "Pending", "Rejected", "Paid"],
    datasets: [{
      data: [approvedCount, pendingCount, rejectedCount, paidCount],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"],
      borderWidth: 0,
      cutout: "75%"
    }]
  };

  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{
      label: "Invoice Uploaded Volume",
      data: [8, 12, 16, 10, 14, 6],
      backgroundColor: "#2563eb",
      borderRadius: 4,
      barThickness: 18
    }]
  };

  // Static Rows for Recent Invoices
  const recentInvoicesList = [
    { id: 1, invoiceNumber: "INV-2024-0021", poNumber: "PO-2026-00121", invoiceDate: "20 May 2024", amount: 96800.00, status: "APPROVED" },
    { id: 2, invoiceNumber: "INV-2024-0020", poNumber: "PO-2026-00118", invoiceDate: "18 May 2024", amount: 56320.00, status: "PENDING" },
    { id: 3, invoiceNumber: "INV-2024-0019", poNumber: "PO-2026-00115", invoiceDate: "16 May 2024", amount: 125600.00, status: "PENDING" },
    { id: 4, invoiceNumber: "INV-2024-0018", poNumber: "PO-2026-00110", invoiceDate: "12 May 2024", amount: 78450.00, status: "REJECTED" },
    { id: 5, invoiceNumber: "INV-2024-0017", poNumber: "PO-2026-00105", invoiceDate: "10 May 2024", amount: 118280.00, status: "APPROVED" }
  ];

  // Static Timeline Feeds
  const recentActivityList = [
    { description: <>Invoice <strong style={{ color: "#2563eb" }}>INV-2024-0021</strong> uploaded</>, timestamp: "20 May 2024, 11:30 AM" },
    { description: <>Invoice <strong style={{ color: "#2563eb" }}>INV-2024-0020</strong> is pending</>, timestamp: "18 May 2024, 02:15 PM" },
    { description: <>Invoice <strong style={{ color: "#2563eb" }}>INV-2024-0016</strong> approved</>, timestamp: "15 May 2024, 10:45 AM" },
    { description: <>Invoice <strong style={{ color: "#2563eb" }}>INV-2024-0014</strong> rejected</>, timestamp: "14 May 2024, 04:20 PM" },
    { description: <>Payment received for <strong style={{ color: "#2563eb" }}>INV-2024-0013</strong></>, timestamp: "12 May 2024, 03:05 PM" }
  ];

  return (
    <VendorLayout 
      pageTitle="Welcome, Vishal Supply Co." 
      pageSubtitle="Here's what's happening with your invoices and orders."
    >

      {/* ==================== SECTION 1: UPPER ANALYTICS METRIC CARDS ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        {/* Card 1: Approved POs */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Approved Purchase Orders</span>
            <div style={{ width: "36px", height: "38px", backgroundColor: "#eef2ff", color: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>article</span>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>12</h2>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Total Approved POs</span>
        </div>

        {/* Card 2: Pending Invoices */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Pending Invoices</span>
            <div style={{ width: "36px", height: "38px", backgroundColor: "#fffbeb", color: "#d97706", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>schedule</span>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>5</h2>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Awaiting Approval</span>
        </div>

        {/* Card 3: Approved Invoices */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Approved Invoices</span>
            <div style={{ width: "36px", height: "38px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>check_circle</span>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>18</h2>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>This Month</span>
        </div>

        {/* Card 4: Rejected Invoices */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Rejected Invoices</span>
            <div style={{ width: "36px", height: "38px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>cancel</span>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>2</h2>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>This Month</span>
        </div>

        {/* Card 5: Total Invoice Amount */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Invoice Amount</span>
            <div style={{ width: "36px", height: "38px", backgroundColor: "#f3e8ff", color: "#a855f7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>currency_rupee</span>
            </div>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            ₹8,75,450
          </h2>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>This Month</span>
        </div>

      </div>

      {/* ==================== SECTION 2: CHARTS PLOTS HORIZONTAL LAYER ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Left Card: Invoice Status Overview */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Invoice Status Overview</h3>
          </div>
          <div style={{ height: "220px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Doughnut 
              data={donutData} 
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "right" } } }} 
            />
          </div>
        </div>

        {/* Right Card: Monthly Invoice Uploads Bar Chart */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Monthly Invoice Uploads</h3>
          </div>
          <div style={{ height: "220px" }}>
            <Bar 
              data={barData} 
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
            />
          </div>
        </div>

      </div>

      {/* ==================== SECTION 3: LOWER TABLES SUMMARY SHEETS ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px" }}>
        
        {/* Left Side Sheet Table: Recent Invoices */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", textAlign: "left" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Recent Invoices</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="dashboard-data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Invoice No.</th>
                  <th style={{ padding: "12px" }}>PO Number</th>
                  <th style={{ padding: "12px" }}>Invoice Date</th>
                  <th style={{ padding: "12px" }}>Amount</th>
                  <th style={{ padding: "12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoicesList.map((inv, idx) => {
                  let pillClass = "pill-warning";
                  if (inv.status === "APPROVED") pillClass = "pill-success";
                  else if (inv.status === "REJECTED") pillClass = "pill-danger";

                  return (
                    <tr key={inv.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", color: "#2563eb", fontWeight: "600" }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: "12px" }}>{inv.poNumber}</td>
                      <td style={{ padding: "12px", color: "#64748b" }}>{inv.invoiceDate}</td>
                      <td style={{ padding: "12px", fontWeight: "700" }}>₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "12px" }}><span className={`badge-pill ${pillClass}`}>{inv.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Sheet Table: Recent Activity Timeline feeds */}
        <div className="card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", textAlign: "left" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recentActivityList.map((activity, idx) => {
              let dotColor = "#10b981"; // Green for approved/upload
              if (idx === 1) dotColor = "#f59e0b"; // Orange for pending
              if (idx === 3) dotColor = "#ef4444"; // Red for rejected

              return (
                <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "8px", height: "8px", backgroundColor: dotColor, borderRadius: "50%", marginTop: "6px", flexShrink: 0 }}></div>
                  <div>
                    <span style={{ fontSize: "13px", color: "#334155", display: "block", fontWeight: "500" }}>{activity.description}</span>
                    <small style={{ fontSize: "11px", color: "#94a3b8" }}>{activity.timestamp}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </VendorLayout>
  );
};

export default VendorDashboard;