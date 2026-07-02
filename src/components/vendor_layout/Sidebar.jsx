import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => (location.pathname.startsWith(path) ? "active" : "");

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box">
          <span className="material-symbols-outlined">store</span>
        </div>
        <div className="brand-text">
          <h1>Vendor Portal</h1>
          <p>ProcureManage ERP</p>
        </div>
      </div>
      
      <div className="sidebar-menu-wrapper">
        <p className="menu-category-title">OPERATIONS</p>
        <nav className="nav-section">
          
          {/* Vendor Dashboard Node */}
          <Link className={`nav-item ${location.pathname === "/vendor/dashboard" ? "active" : ""}`} to="/vendor/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          
          {/* Purchase Orders assigned by Admin */}
          <Link className={`nav-item ${isActive("/vendor/purchase-orders")}`} to="/vendor/purchase-orders/list">
            <span className="material-symbols-outlined">shopping_bag</span>
            My Purchase Orders
          </Link>

          {/* My Invoices module route point */}
          <Link className={`nav-item ${isActive("/vendor/invoices")}`} to="/vendor/invoices/list">
            <span className="material-symbols-outlined">description</span>
            My Invoices
          </Link>
          
          {/* Supply chain dispatch tracking */}
          <Link className={`nav-item ${isActive("/vendor/shipments")}`} to="/vendor/shipments">
            <span className="material-symbols-outlined">local_shipping</span>
            Shipments &amp; Delivery
          </Link>
        </nav>

        <p className="menu-category-title">FINANCIALS</p>
        <nav className="nav-section">
          <Link className={`nav-item ${isActive("/vendor/payments")}`} to="/vendor/payments">
            <span className="material-symbols-outlined">payments</span>
            Payment History
          </Link>
        </nav>

        <p className="menu-category-title">ACCOUNT SYSTEM</p>
        <nav className="nav-section">
          {/* 🚀 FIXED: Removed Company Profile and Settings. Logout button is now tailored to perfectly match existing nav-items padding and flex properties */}
          <button 
            className="nav-item border-0 text-start w-100 bg-transparent d-flex align-items-center" 
            onClick={handleLogout}
            style={{ 
              cursor: "pointer", 
              outline: "none",
              gap: "12px" /* Aligns icon and text spacing perfectly */
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "#ef4444" }}>logout</span>
            <span style={{ color: "#ef4444" }}>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;