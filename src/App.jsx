import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin / Dashboard Module
import AdminDashboard from './pages/admin/AdminDashboard';
// Vendor Pages Imports
import VendorDashboard from "./pages/vendor/VendorDashboard";

// Vendors Module Imports
import VendorList from "./pages/admin/vendorList";
import AddVendor from "./pages/admin/addVendor";
import EditVendor from "./pages/admin/editVendor";
import ViewVendor from "./pages/admin/viewVendor";

// Purchase Orders Module Imports
import PurchaseOrderDashboard from "./pages/purchaseOrders/PurchaseOrderDashboard";
import AddPurhcaseOrder from "./pages/purchaseOrders/AddPurchaseOrder";
import PurchaseOrderList from "./pages/purchaseOrders/PurchaseOrderList";
import ViewPurchaseOrder from './pages/purchaseOrders/ViewPurchaseOrder';
import EditPurchaseOrder from './pages/purchaseOrders/EditPurchaseOrder';

// Employees Module Imports
import EmployeeList from "./pages/employees/EmployeeList";
import AddEmployee from "./pages/employees/AddEmployee";
import ViewEmployee from "./pages/employees/ViewEmployee";
import EditEmployee from "./pages/employees/EditEmployee";

// Delivery Module Imports
import AddDelivery from "./pages/delivery/AddDelivery";
import DeliveryList from "./pages/delivery/DeliveryList";
import DeliveryEdit from "./pages/delivery/DeliveryEdit";
import DeliveryView from "./pages/delivery/DeliveryView";

// Invoice Module Imports
import InvoiceList from "./pages/invoice/InvoiceList";
import InvoiceCreate from "./pages/invoice/InvoiceCreate"; 
import InvoiceView from "./pages/invoice/InvoiceView";
import InvoiceEdit from "./pages/invoice/InvoiceEdit";

// Payment Module Imports
import PaymentList from "./pages/payment/PaymentList";
import PaymentCreate from "./pages/payment/PaymentCreate";
import PaymentEdit from "./pages/payment/PaymentEdit";
import PaymentView from "./pages/payment/PaymentView";

// REGISTERED VENDOR ROUTE MODULE IMPORTS
import VendorPurchaseOrderList from "./pages/vendor/PurchaseOrderList";
import VendorViewPurchaseOrder from "./pages/vendor/ViewPurchaseOrder";
import VendorInvoiceCreate from "./pages/vendor/VendorInvoiceCreate";
import VendorInvoiceView from "./pages/vendor/VendorInvoiceView";
import VendorInvoiceEdit from "./pages/vendor/VendorInvoiceEdit";
import MyInvoiceList from './pages/vendor/MyInvoiceList';
import MyInvoiceView from "./pages/vendor/MyInvoiceView";
import ShipmentHistory from "./pages/vendor/ShipmentHistory";
import ShipmentView from "./pages/vendor/ShipmentView.jsx";

import PaymentHistory from "./pages/vendor/PaymentHistory";
// 🚀 FIXED ALIAS: Renamed identifier import block to completely eliminate collision conflicts
import VendorPaymentView from "./pages/vendor/PaymentView";

function App() {
  return (
    <Routes>
      {/* Auth Gateways Routing Layouts */}
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Central Admin & Vendor Core Dashboards */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      
      {/* Vendors Sub-system Endpoints Routing */}
      <Route path="/vendors" element={<VendorList />} />
      <Route path="/vendors/add" element={<AddVendor />} />
      <Route path="/vendors/edit/:id" element={<EditVendor />} />
      <Route path="/vendors/view/:id" element={<ViewVendor />} />
      
      {/* Purchase Orders Sub-system Endpoints Routing */}
      <Route path="/admin/purchase-orders" element={<PurchaseOrderDashboard />} />
      <Route path="/admin/purchase-orders/add" element={<AddPurhcaseOrder />} />
      <Route path="/admin/purchase-orders/list" element={<PurchaseOrderList />} />
      <Route path="/admin/purchase-orders/view/:id" element={<ViewPurchaseOrder />} />
      <Route path="/admin/purchase-orders/edit/:id" element={<EditPurchaseOrder />} />
      
      {/* Employees Sub-system Endpoints Routing */}
      <Route path="/admin/employees/list" element={<EmployeeList />} />
      <Route path="/admin/employees/add" element={<AddEmployee />} />
      <Route path="/admin/employees/view/:id" element={<ViewEmployee />} />
      <Route path="/admin/employees/edit/:id" element={<EditEmployee />} />
      
      {/* Delivery Sub-system Endpoints Routing */}
      <Route path="/admin/delivery/add" element={<AddDelivery />} />
      <Route path="/admin/delivery/list" element={<DeliveryList />} />
      <Route path="/admin/delivery/edit/:id" element={<DeliveryEdit />} />
      <Route path="/admin/delivery/view/:id" element={<DeliveryView />} />
      
      {/* INVOICE MODULE Protected Routes */}
      <Route path="/admin/invoice/list" element={<InvoiceList />} />
      <Route path="/admin/invoice/add" element={<InvoiceCreate />} />
      <Route path="/admin/invoice/view/:id" element={<InvoiceView />} />
      <Route path="/admin/invoice/edit/:id" element={<InvoiceEdit />} />
      
      {/* CORPORATE TREASURY MODULE PAYMENT PIPELINES */}
      <Route path="/admin/payment/list" element={<PaymentList />} />
      <Route path="/admin/payment/add" element={<PaymentCreate />} />
      <Route path="/admin/payment/edit/:id" element={<PaymentEdit />} />
      <Route path="/admin/payment/view/:id" element={<PaymentView />} />

      {/* 🏢 REGISTERED VENDOR ASSIGNED PURCHASE ORDERS ROUTING SECTION */}
      <Route path="/vendor/purchase-orders/list" element={<VendorPurchaseOrderList />} />
      
      {/* 🏢 INVOICE INBOUND ROUTE SUB-SYSTEM FOR VENDORS */}
      <Route path="/vendor/invoices/create/:purchaseOrderId" element={<VendorInvoiceCreate />} />
      <Route path="/vendor/invoices/view/:purchaseOrderId" element={<VendorInvoiceView />} />
      <Route path="/vendor/invoices/edit/:purchaseOrderId" element={<VendorInvoiceEdit />} />
      <Route path="/vendor/invoices/list" element={<MyInvoiceList />} />
      <Route path="/vendor/invoices/view-by-id/:invoiceId" element={<MyInvoiceView />} />
      
      {/* 🏢 VENDOR SPECIFIC REMITTANCE PROTECTED PROFILE DETAIL OVERLAYS */}
      <Route path="/vendor/payments" element={<PaymentHistory />} />
      {/* 🚀 FIXED: Pointed safely to the unique clean alias wrapper view element */}
      <Route path="/vendor/payments/view/:paymentId" element={<VendorPaymentView />} />
      <Route path="/vendor/shipments" element={<ShipmentHistory />} />
      <Route path="/vendor/shipments/view/:shipmentId" element={<ShipmentView />} />

      {/* Wildcard Fallback tracking element */}
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}

export default App;