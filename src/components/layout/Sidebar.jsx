import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  // Helper check function to highlight active tab gracefully
  // Mapped strictly with singular/plural matching routing standards
  const isActive = (path) => (location.pathname.startsWith(path) ? "active" : "");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box">
          <span className="material-symbols-outlined">dataset</span>
        </div>
        <div className="brand-text">
          <h1>ProcureManage</h1>
          <p>Vendor Management System</p>
        </div>
      </div>
      
      <div className="sidebar-menu-wrapper">
        <p className="menu-category-title">MANAGEMENT</p>
        <nav className="nav-section">
          
          {/* Dashboard Link */}
          <Link className={`nav-item ${location.pathname === "/admin/dashboard" ? "active" : ""}`} to="/admin/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          
          {/* Employee Link */}
          <Link className={`nav-item ${isActive("/admin/employees")}`} to="/admin/employees/add">
            <span className="material-symbols-outlined">badge</span>
            Employee
          </Link>
          
          {/* Vendors Link */}
          <Link className={`nav-item ${isActive("/vendors")}`} to="/vendors">
            <span className="material-symbols-outlined">store</span>
            Vendors
          </Link>
          
          {/* Purchase Orders Link */}
          <Link className={`nav-item ${isActive("/admin/purchase-orders/list")}`} to="/admin/purchase-orders/list ">
            <span className="material-symbols-outlined">shopping_cart</span>
            Purchase Orders
          </Link>

          {/* Invoices Link */}
          <Link className={`nav-item ${isActive("/admin/invoice")}`} to="/admin/invoice/list">
            <span className="material-symbols-outlined">description</span>
            Invoices
          </Link>

          {/* 🚀 FIXED: Linked directly to your fresh Payments List endpoint with active layout tracking */}
          <Link className={`nav-item ${isActive("/admin/payment")}`} to="/admin/payment/list">
            <span className="material-symbols-outlined">payments</span>
            Payments
          </Link>
          
          {/* Deliveries Link */}
          <Link className={`nav-item ${isActive("/admin/delivery")}`} to="/admin/delivery/list">
            <span className="material-symbols-outlined">local_shipping</span>
            Deliveries
          </Link>
        </nav>

        <p className="menu-category-title">REPORTS</p>
        <nav className="nav-section">
          <a className="nav-item" href="#analytics">
            <span className="material-symbols-outlined">analytics</span>
            Reports &amp; Analytics
          </a>
          <a className="nav-item" href="#performance">
            <span className="material-symbols-outlined">trending_up</span>
            Vendor Performance
          </a>
        </nav>

        <p className="menu-category-title">SYSTEM</p>
        <nav className="nav-section">
          <a className="nav-item" href="#settings">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </a>
          <a className="nav-item" href="#profile">
            <span className="material-symbols-outlined">person</span>
            Profile
          </a>
          <a className="nav-item" href="#logout">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </a>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;