import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router";

import InwardOutwardSummaryReport from "./components/Reports/reports/InwardOutwardSummaryReport";
import WarehouseOccupancyReport from "./components/Reports/reports/WarehouseOccupancyReport";
import TransportationModePage from "./Pages/TransaportationModePage/TransportationModePage";
import RentCollectionReport from "./components/Reports/reports/RentCollectionReport";
import StockRegisterReport from "./components/Reports/reports/StockRegisterReport";
import DailySummaryReport from "./components/Reports/reports/DailySummaryReport";
import CustomerBalanceSummary from "./Pages/LedgerPage/CustomerBalanceSummary";
import DuePaymentReport from "./components/Reports/reports/DuePaymentReport";
import RequestDetailPage from "./Pages/RequestDepositorPage/DetailPage";
import RequestDepositorPage from "./Pages/RequestDepositorPage/index";
import RequestDeliveryPage from "./Pages/RequestDeliveryPage/index";
import CustomerLedgerPage from "./Pages/LedgerPage/CustomerLedger";
import CustomerProfilePage from "./Pages/CustomerPage/profile";
import ResetPassword from "./Pages/AuthPages/ResetPassword";
import CompanyDetail from "./Pages/CompanyDetailPage/index";
import Company from "./Pages/CompanyRegisterForm/index";
import CommodityPage from "./Pages/CommodityPage/index";
import WareHousePage from "./Pages/WarehousePage/index";
import ProtectedRoute from "./Common/ProtectedRoute";
import Dashboard from "./Pages/DashboardPage/index";
import InvoiceComp from "./Pages/InvoicePage/index";
import InsuranceComp from "./Pages/InsurancePage";
import InventoryPage from "./Pages/InventoryPage";
import GodownPage from "./Pages/GodownPage/index";
import PrivateRoute from "./Common/PrivateRoute";
import GatePassPage from "./Pages/GatePassPage";
import StackPage from "./Pages/StackPage/index";
import CustomerPage from "./Pages/CustomerPage";
import RentPage from "./Pages/RentPage/index";
import SignIn from "./Pages/AuthPages/SignIn";
import SignUp from "./Pages/AuthPages/SignUp";
import NewUserPage from "./Pages/NewUserPage";
import VoucherPage from "./Pages/VoucherPage";
import LedgerPage from "./Pages/LedgerPage";
import GradeComp from "./Pages/GradePage";
import BillComp from "./Pages/BillPage";
// Individual Report Components
// import BillingInvoiceReport from "./components/Reports/reports/BillingInvoiceReport";
import RegistrationTypePage from "./Pages/RegistrationTypePage";
import WHRReport from "./components/Reports/reports/WHRReport";
import DeliveryChallanPage from "./Pages/DeliveryChallanPage";
import PurchaseInvoicePage from "./Pages/PurchaseInvoicePage";
import PurchasePaymentPage from "./Pages/PurchasePaymentPage";
import PurchaseReturnPage from "./Pages/PurchaseReturnPage";
import DebitNotePage from "./Pages/DebitNotePage";
import ReturnFulfillmentPage from "./Pages/ReturnFulfillmentPage";
import PanAvailibilityPage from "./Pages/PanAvailibityPage";
import ChartOfAccountPage from "./Pages/ChartOfAccountPage";
import PurchaseOrderPage from "./Pages/PurchaseOrderPage";
import PaymentMethodPage from "./Pages/PaymentMethodPage";
import TermPage from "./Pages/TermPage";
import ServiceCategoryPage from "./Pages/ServiceCatPage";
import CurrencyMasterPage from "./Pages/CurrencyMaster";
import QualityCheckPage from "./Pages/QualityCheckPage";
import ServiceTypePage from "./Pages/ServiceTypePage";
import AccountTypePage from "./Pages/AccountTypePage";
import SalesReturnPage from "./Pages/SalesReturnPage";
import SalesOrderPage from "./Pages/SalesOrderPage";
import CityMasterPage from "./Pages/CityMasterPage";
import WorkCategoryPage from "./Pages/WorkCatPage";
import StateMasterPage from "./Pages/StateMaster";
import SystemLogPage from "./Pages/SystemLogPage";
import ItemGroupPage from "./Pages/itemGroupPage";
import CategoryPage from "./Pages/CategoryPage";
import SubsidiaryPage from "./Pages/Subsidiary";
import ItemTypePage from "./Pages/ItemTypePage";
import MisTypePage from "./Pages/MisTypePage";
import VendorPage from "./Pages/VendorPage";
import HSNSACPage from "./Pages/HSNSAC";
import ItemPage from "./Pages/itemPage";
import ClassMasterPage from "./Pages/ClassPage";
import DepartmentMasterPage from "./Pages/DepartmentPage";
import UOMPage from "./Pages/UOMPages";
import GRNPage from "./Pages/GRNPages";
import NetSuiteVendorDemo from "./components/Demo/NetSuiteVendorDemo";

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/resetpassword/:resetToken" element={<ResetPassword />} />
        <Route path="/companyform" element={<Company />} />

        {/* Dashboard - Available to all authenticated users */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Company Profile - Available to all authenticated users */}
        <Route
          path="/companyprofile"
          element={
            <PrivateRoute>
              <CompanyDetail />
            </PrivateRoute>
          }
        />

        {/* Currency - Available to all authenticated users */}
        <Route
          path="/currency"
          element={
            <PrivateRoute>
              <CurrencyMasterPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/currencies"
          element={
            <PrivateRoute>
              <CurrencyMasterPage />
            </PrivateRoute>
          }
        />


        {/* State - Available to all authenticated users */}
        <Route
          path="/state"
          element={
            <PrivateRoute>
              <StateMasterPage />
            </PrivateRoute>
          }
        />

        {/* City - Available to all authenticated users */}
        <Route
          path="/location"
          element={
            <PrivateRoute>
              <CityMasterPage />
            </PrivateRoute>
          }
        />

        {/* Subsidiary - Available to all authenticated users */}
        <Route
          path="/subsidiary"
          element={
            <PrivateRoute>
              <SubsidiaryPage />
            </PrivateRoute>
          }
        />

        {/* System Logs - Available to all authenticated users */}
        <Route
          path="/system-logs"
          element={
            <PrivateRoute>
              <SystemLogPage />
            </PrivateRoute>
          }
        />

        {/* HSN/SAC - Available to all authenticated users */}
        <Route
          path="/hsnsac"
          element={
            <PrivateRoute>
              <HSNSACPage />
            </PrivateRoute>
          }
        />

        {/* UOM - Available to all authenticated users */}
        <Route
          path="/uom"
          element={
            <PrivateRoute>
              <UOMPage />
            </PrivateRoute>
          }
        />

        {/* Service Category - Available to all authenticated users */}
        <Route
          path="/service-category"
          element={
            <PrivateRoute>
              <ServiceCategoryPage />
            </PrivateRoute>
          }
        />

        {/* Service Type - Available to all authenticated users */}
        <Route
          path="/service-types"
          element={
            <PrivateRoute>
              <ServiceTypePage />
            </PrivateRoute>
          }
        />

        {/* Work Category - Available to all authenticated users */}
        <Route
          path="/work-category"
          element={
            <PrivateRoute>
              <WorkCategoryPage />
            </PrivateRoute>
          }
        />

        {/* Item Group - Available to all authenticated users */}
        <Route
          path="/item-group"
          element={
            <PrivateRoute>
              <ItemGroupPage />
            </PrivateRoute>
          }
        />

        {/* Category - Available to all authenticated users */}
        <Route
          path="/category"
          element={
            <PrivateRoute>
              <CategoryPage />
            </PrivateRoute>
          }
        />

        {/* Item - Available to all authenticated users */}
        <Route
          path="/item"
          element={
            <PrivateRoute>
              <ItemPage />
            </PrivateRoute>
          }
        />

        {/* Class - Available to all authenticated users */}
        <Route
          path="/class"
          element={
            <PrivateRoute>
              <ClassMasterPage />
            </PrivateRoute>
          }
        />

        {/* Department - Available to all authenticated users */}
        <Route
          path="/department"
          element={
            <PrivateRoute>
              <DepartmentMasterPage />
            </PrivateRoute>
          }
        />

        {/* Item Type - Available to all authenticated users */}
        <Route
          path="/item-type"
          element={
            <PrivateRoute>
              <ItemTypePage />
            </PrivateRoute>
          }
        />

        {/* MIS Types */}
        <Route
          path="/mis-types"
          element={
            <PrivateRoute>
              <ProtectedRoute module="mistype" action="read">
                <MisTypePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Account Types */}
        <Route
          path="/account-types"
          element={
            <PrivateRoute>
              <ProtectedRoute module="accounttype" action="read">
                <AccountTypePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Chart of Accounts */}
        <Route
          path="/chart-of-accounts"
          element={
            <PrivateRoute>
              <ProtectedRoute module="chartofaccount" action="read">
                <ChartOfAccountPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Transportation Mode - Available to all authenticated users */}
        <Route
          path="/transportation-mode"
          element={
            <PrivateRoute>
              <TransportationModePage />
            </PrivateRoute>
          }
        />

        {/* Vendor - Available to all authenticated users */}
        <Route
          path="/vendor"
          element={
            <PrivateRoute>
              <VendorPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/netsuite-vendor-demo"
          element={
            <PrivateRoute>
              <NetSuiteVendorDemo />
            </PrivateRoute>
          }
        />

        {/* Warehouse Management - Requires warehouse permissions */}
        <Route
          path="/warehouses"
          element={
            <PrivateRoute>
              <ProtectedRoute module="warehouse" action="read">
                <WareHousePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/warehouses/:id"
          element={
            <PrivateRoute>
              <ProtectedRoute module="godown" action="read">
                <GodownPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/warehouses/:warehouseId/godown/:id"
          element={
            <PrivateRoute>
              <ProtectedRoute module="stack" action="read">
                <StackPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/registration-type"
          element={
            <PrivateRoute>
              <ProtectedRoute module="registrationType" action="read">
                <RegistrationTypePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/payment-method"
          element={
            <PrivateRoute>
              <ProtectedRoute module="paymentMethod" action="read">
                <PaymentMethodPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <PrivateRoute>
              <ProtectedRoute module="vendor" action="read">
                <TermPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/pan-availibility"
          element={
            <PrivateRoute>
              <ProtectedRoute module="panAvailibitlity" action="read">
                <PanAvailibilityPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Customer Management - Requires customer permissions */}
        <Route
          path="/customer"
          element={
            <PrivateRoute>
              <ProtectedRoute module="customer" action="read">
                <CustomerPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/:id"
          element={
            <PrivateRoute>
              <ProtectedRoute module="customer" action="read">
                <CustomerProfilePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Commodity Management */}
        <Route
          path="/commodity"
          element={
            <PrivateRoute>
              <ProtectedRoute module="commodity" action="read">
                <CommodityPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Rent Management */}
        <Route
          path="/rent"
          element={
            <PrivateRoute>
              <ProtectedRoute module="rent" action="read">
                <RentPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* WHR (Warehouse Receipt) */}
        <Route
          path="/whr"
          element={
            <PrivateRoute>
              <ProtectedRoute module="deposit" action="read">
                <RequestDepositorPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/whr/:id"
          element={
            <PrivateRoute>
              <ProtectedRoute module="deposit" action="read">
                <RequestDetailPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Gate Pass Management */}
        <Route
          path="/gatepass"
          element={
            <PrivateRoute>
              <ProtectedRoute module="gatepass" action="read">
                <GatePassPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Request Delivery */}
        <Route
          path="/request-delivery"
          element={
            <PrivateRoute>
              <ProtectedRoute module="delivery" action="read">
                <RequestDeliveryPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <ProtectedRoute
                module="inventory"
                action="read"
                redirectTo="/dashboard"
              >
                <InventoryPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Grades */}
        <Route
          path="/grades"
          element={
            <PrivateRoute>
              <ProtectedRoute module="grade" action="read">
                <GradeComp />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Insurance */}
        <Route
          path="/insurance"
          element={
            <PrivateRoute>
              <ProtectedRoute module="insurance" action="read">
                <InsuranceComp />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Bills */}
        <Route
          path="/bill"
          element={
            <PrivateRoute>
              <ProtectedRoute module="bill" action="read">
                <BillComp />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Invoice */}
        <Route
          path="/invoice"
          element={
            <PrivateRoute>
              <ProtectedRoute module="invoice" action="read">
                <InvoiceComp />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Sales Order Management */}
        <Route
          path="/sales-order"
          element={
            <PrivateRoute>
              <ProtectedRoute module="sales_order" action="read">
                <SalesOrderPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Delivery Challan Management */}
        <Route
          path="/delivery-challan"
          element={
            <PrivateRoute>
              <ProtectedRoute module="delivery_challan" action="read">
                <DeliveryChallanPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Sales Return Management */}
        <Route
          path="/sales-return"
          element={
            <PrivateRoute>
              <ProtectedRoute module="sales_return" action="read">
                <SalesReturnPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Purchase Order Management */}
        <Route
          path="/purchase-order"
          element={
            <PrivateRoute>
              <ProtectedRoute module="purchase_order" action="read">
                <PurchaseOrderPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* GRN Management */}
        <Route
          path="/grn"
          element={
            <PrivateRoute>
              <ProtectedRoute module="grn" action="read">
                <GRNPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Quality Inspection Management */}
        <Route
          path="/quality-inspection"
          element={
            <PrivateRoute>
              <ProtectedRoute module="quality_report" action="read">
                <QualityCheckPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Purchase Invoice Management */}
        <Route
          path="/purchase-invoice"
          element={
            <PrivateRoute>
              <ProtectedRoute module="purchase_invoice" action="read">
                <PurchaseInvoicePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Purchase Payment Management */}
        <Route
          path="/purchase-payment"
          element={
            <PrivateRoute>
              <ProtectedRoute module="purchase_payment" action="read">
                <PurchasePaymentPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Purchase Return Management */}
        <Route
          path="/purchase-return"
          element={
            <PrivateRoute>
              <ProtectedRoute module="purchase_return" action="read">
                <PurchaseReturnPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Item Return Fulfillment */}
        <Route
          path="/return-fulfillment"
          element={
            <PrivateRoute>
              <ProtectedRoute module="purchase_return" action="read">
                <ReturnFulfillmentPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Finance Debit Note Management */}
        <Route
          path="/finance/debit-notes"
          element={
            <PrivateRoute>
              <ProtectedRoute module="debit_note" action="read">
                <DebitNotePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/debit-note"
          element={
            <PrivateRoute>
              <ProtectedRoute module="debit_note" action="read">
                <DebitNotePage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* User Management - Admin only */}
        <Route
          path="/new-user"
          element={
            <PrivateRoute>
              <ProtectedRoute module="NewUser" action="read">
                <NewUserPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Ledger Management */}
        <Route
          path="/ledger"
          element={
            <PrivateRoute>
              <ProtectedRoute module="ledger" action="read">
                <LedgerPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/ledger/customer"
          element={
            <PrivateRoute>
              <ProtectedRoute module="ledger" action="read">
                <CustomerLedgerPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/ledger/customer-summary"
          element={
            <PrivateRoute>
              <ProtectedRoute module="ledger" action="read">
                <CustomerBalanceSummary />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Voucher Management */}
        <Route
          path="/vouchers"
          element={
            <PrivateRoute>
              <ProtectedRoute module="voucher" action="read">
                <VoucherPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />

        {/* Reports Management - Individual Report Routes */}
        <Route
          path="/reports/daily-summary"
          element={
            <PrivateRoute>
              <DailySummaryReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports/inward-outward"
          element={
            <PrivateRoute>
              <InwardOutwardSummaryReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports/stock-register"
          element={
            <PrivateRoute>
              <StockRegisterReport />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports/warehouse-occupancy"
          element={
            <PrivateRoute>
              <WarehouseOccupancyReport />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports/rent-collection-report"
          element={
            <PrivateRoute>
              <RentCollectionReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports/due-payment-report"
          element={
            <PrivateRoute>
              <DuePaymentReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports/whr-report"
          element={
            <PrivateRoute>
              <WHRReport />
            </PrivateRoute>
          }
        />
        {/* <Route
          path="/reports/billing-invoice"
          element={
            <PrivateRoute>
              <BillingInvoiceReport />
            </PrivateRoute>
          }
        /> */}

        {/* Unauthorized page */}
        <Route
          path="/unauthorized"
          element={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                flexDirection: "column",
              }}
            >
              <h2>Access Denied</h2>
              <p>You don't have permission to access this page.</p>
            </div>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
