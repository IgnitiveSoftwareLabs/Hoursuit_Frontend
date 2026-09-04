import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Search,
  AccessTime,
  Star,
  StarBorder,
  Home,
  KeyboardArrowDown,
  ChevronRight,
  Menu as MenuIcon,
  Close as CloseIcon,
  NavigateNext,
  Receipt,
  Inventory2,
  AccountBalance,
  Description,
  Settings,
  Assessment,
  People,
  ArrowForward,
} from "@mui/icons-material";

import NotificationDropdown from "../Notification";
import OptionsMenu from "../OptionsMenu";
import { useFetchCompanyQuery } from "../../RTK/services/companyApi";
import { usePermissions } from "../../Hooks/usePermissions";
import { useAppSelector } from "../../Hooks/Reduxhook/hooks";

interface MegaLeafItem {
  label: string;
  path: string;
  permission?: any;
}

interface MegaChildItem {
  label: string;
  path?: string;
  permission?: any;
  subChildren?: MegaLeafItem[];
}

interface MegaSubItem {
  label: string;
  path?: string;
  permission?: any;
  children?: MegaChildItem[];
}

interface MegaMenuItem {
  label: string;
  path?: string;
  permission?: any;
  items?: MegaSubItem[];
}

interface SearchableItem {
  name: string;
  path: string;
  category: "Transactions" | "Masters & Lists" | "Reports" | "Setup & Config" | "Actions";
  keywords: string;
  icon?: React.ReactNode;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: companyData } = useFetchCompanyQuery();
  const { hasPermission, isAdmin, isPlatformSuperAdmin } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [activeThirdMenu, setActiveThirdMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  const [favorites, setFavorites] = useState<string[]>(["/vendor", "/purchase-order", "/debit-note"]);
  const [recentHistory, setRecentHistory] = useState<{ label: string; path: string }[]>([
    { label: "Vendor Credits", path: "/debit-note" },
    { label: "Vendor Master", path: "/vendor" },
    { label: "Purchase Orders", path: "/purchase-order" },
    { label: "Inventory Summary", path: "/inventory" },
    { label: "Customer Ledger", path: "/ledger/customer" },
  ]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);

  // Permission check helper
  const isAllowed = (itemPermission?: any) => {
    if (!itemPermission) return true;
    if (isAdmin || isPlatformSuperAdmin) return true;
    return hasPermission(itemPermission);
  };

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut '/' to focus search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "Escape") {
        setIsSearchFocused(false);
        setIsHistoryOpen(false);
        setIsFavOpen(false);
        setActiveMegaMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Comprehensive Search Registry
  const searchableRegistry: SearchableItem[] = useMemo(
    () => [
      // ── Actions / Quick Create ──
      { name: "Create Purchase Order", path: "/purchase-order?action=new", category: "Actions", keywords: "new po purchase order create add", icon: <Receipt className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Create Goods Receipt (GRN)", path: "/grn?action=new", category: "Actions", keywords: "new grn receipt goods receive create", icon: <Receipt className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Create Purchase Bill", path: "/purchase-invoice?action=new", category: "Actions", keywords: "new bill invoice purchase bill vendor bill create", icon: <Description className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Create Vendor Credit (Debit Note)", path: "/debit-note?action=new", category: "Actions", keywords: "new vendor credit debit note credit memo return credit", icon: <AccountBalance className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Create Vendor Refund", path: "/vendor-refund?action=new", category: "Actions", keywords: "new vendor refund cash bank reimbursement refund credit", icon: <AccountBalance className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Create Sales Order", path: "/sales-order?action=new", category: "Actions", keywords: "new so sales order customer order create", icon: <Receipt className="!w-3.5 !h-3.5 text-purple-600" /> },
      { name: "Create Vendor Record", path: "/vendor?action=new", category: "Actions", keywords: "new vendor supplier party create add", icon: <People className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Create Customer Record", path: "/customer?action=new", category: "Actions", keywords: "new customer client debtor create", icon: <People className="!w-3.5 !h-3.5 text-teal-600" /> },

      // ── Transactions ──
      { name: "Transactions Overview & Register", path: "/transactions", category: "Transactions", keywords: "transactions overview register p2p o2c all transactions consolidated", icon: <Assessment className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Purchase Orders (PO)", path: "/purchase-order", category: "Transactions", keywords: "po purchase order register orders purchase", icon: <Receipt className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Goods Receipt Notes (GRN)", path: "/grn", category: "Transactions", keywords: "grn goods receipt note receiving warehouse receipt", icon: <Receipt className="!w-3.5 !h-3.5 text-emerald-600" /> },
      // { name: "Quality Inspection Check", path: "/quality-inspection", category: "Transactions", keywords: "quality qc inspection check testing qa report", icon: <Assessment className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "Purchase Bills & Invoices", path: "/purchase-invoice", category: "Transactions", keywords: "purchase bills invoices vendor bill ap accounts payable", icon: <Description className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Purchase Payments (Disbursements)", path: "/purchase-payment", category: "Transactions", keywords: "purchase payment payments vendor payment check bill payment", icon: <AccountBalance className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Purchase Return Authorizations", path: "/purchase-return", category: "Transactions", keywords: "purchase return return authorization rma return vendor", icon: <Receipt className="!w-3.5 !h-3.5 text-rose-600" /> },
      { name: "Item Return Fulfillments", path: "/return-fulfillment", category: "Transactions", keywords: "item return fulfillment dispatch return physical fulfillment shipping", icon: <Inventory2 className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Vendor Credits (Debit Notes)", path: "/debit-note", category: "Transactions", keywords: "vendor credit debit note credit memo apply credit bill apply", icon: <AccountBalance className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Vendor Refunds", path: "/vendor-refund", category: "Transactions", keywords: "vendor refund refund check cash disbursement reimbursement", icon: <AccountBalance className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Sales Orders", path: "/sales-order", category: "Transactions", keywords: "sales orders customer orders so sales", icon: <Receipt className="!w-3.5 !h-3.5 text-purple-600" /> },
      { name: "Delivery Challans", path: "/delivery-challan", category: "Transactions", keywords: "delivery challan dispatch dc shipping note", icon: <Inventory2 className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Sales Invoices & Billing", path: "/invoice", category: "Transactions", keywords: "sales invoice customer invoice ar accounts receivable billing", icon: <Description className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Customer Bills", path: "/bill", category: "Transactions", keywords: "customer bills bills rent bills storage billing", icon: <Description className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "Sales Returns", path: "/sales-return", category: "Transactions", keywords: "sales return credit memo customer return", icon: <Receipt className="!w-3.5 !h-3.5 text-rose-600" /> },
      { name: "Warehouse Receipts (WHR)", path: "/whr", category: "Transactions", keywords: "whr warehouse receipt deposit token storage", icon: <Inventory2 className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Gate Pass Management", path: "/gatepass", category: "Transactions", keywords: "gate pass gatepass security entry exit vehicle pass", icon: <Receipt className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "General Ledger & Journals", path: "/ledger", category: "Transactions", keywords: "general ledger journal entry gl posting financial records", icon: <AccountBalance className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Customer Ledger", path: "/ledger/customer", category: "Transactions", keywords: "customer ledger party statement statement of account balance", icon: <AccountBalance className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Vouchers Management", path: "/vouchers", category: "Transactions", keywords: "vouchers journal voucher debit voucher credit voucher payment voucher", icon: <Receipt className="!w-3.5 !h-3.5 text-purple-600" /> },

      // ── Masters & Lists ──
      { name: "Vendors Master List", path: "/vendor", category: "Masters & Lists", keywords: "vendors supplier master party vendor details vendor list", icon: <People className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Customers Master List", path: "/customer", category: "Masters & Lists", keywords: "customers client debtor customer list customer master", icon: <People className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Employees / Users List", path: "/new-user", category: "Masters & Lists", keywords: "users employees staff roles permissions user list", icon: <People className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "Items & Materials Master", path: "/item", category: "Masters & Lists", keywords: "item items product materials sku goods inventory item master", icon: <Inventory2 className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Inventory Summary", path: "/inventory", category: "Masters & Lists", keywords: "inventory stock summary stock levels items on hand quantity available", icon: <Inventory2 className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Warehouses Master", path: "/warehouses", category: "Masters & Lists", keywords: "warehouse warehouses godown location storage facility", icon: <Inventory2 className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Chart of Accounts (COA)", path: "/chart-of-accounts", category: "Masters & Lists", keywords: "chart of accounts coa accounts gl accounts balance sheet p&l", icon: <AccountBalance className="!w-3.5 !h-3.5 text-purple-600" /> },
      { name: "Account Types", path: "/account-types", category: "Masters & Lists", keywords: "account types assets liabilities equity revenue expense", icon: <AccountBalance className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "Subsidiaries Master", path: "/subsidiary", category: "Masters & Lists", keywords: "subsidiary subsidiaries legal entity company branch", icon: <Settings className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Classes Master", path: "/class", category: "Masters & Lists", keywords: "class classes product line business unit classification", icon: <Settings className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Departments Master", path: "/department", category: "Masters & Lists", keywords: "department departments cost center division team", icon: <Settings className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Locations / Cities Master", path: "/location", category: "Masters & Lists", keywords: "location locations city cities address geo", icon: <Settings className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "States Master", path: "/state", category: "Masters & Lists", keywords: "state states province region gst state", icon: <Settings className="!w-3.5 !h-3.5 text-slate-600" /> },
      { name: "Currencies Master", path: "/currencies", category: "Masters & Lists", keywords: "currencies currency inr usd exchange rate money", icon: <AccountBalance className="!w-3.5 !h-3.5 text-yellow-600" /> },
      { name: "Units of Measure (UOM)", path: "/uom", category: "Masters & Lists", keywords: "uom units measure kg pcs box unit metric", icon: <Inventory2 className="!w-3.5 !h-3.5 text-slate-600" /> },
      { name: "HSN / SAC Codes", path: "/hsnsac", category: "Masters & Lists", keywords: "hsn sac gst tax codes tariff commodity code", icon: <Description className="!w-3.5 !h-3.5 text-slate-600" /> },
      { name: "Item Categories", path: "/category", category: "Masters & Lists", keywords: "category categories item group classification", icon: <Inventory2 className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "Payment Terms", path: "/terms", category: "Masters & Lists", keywords: "payment terms credit period net 30 net 60 due terms", icon: <Description className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Payment Methods", path: "/payment-method", category: "Masters & Lists", keywords: "payment method payment methods bank cash upi cheque mode", icon: <AccountBalance className="!w-3.5 !h-3.5 text-emerald-600" /> },

      // ── Reports ──
      { name: "Daily Summary Report", path: "/reports/daily-summary", category: "Reports", keywords: "daily summary report daily operations transactions summary", icon: <Assessment className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "Customer Balance Summary", path: "/ledger/customer-summary", category: "Reports", keywords: "customer balance summary aging report balances receivables", icon: <Assessment className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "Stock Register Report", path: "/reports/stock-register", category: "Reports", keywords: "stock register inventory valuation movement report stock ledger", icon: <Assessment className="!w-3.5 !h-3.5 text-emerald-600" /> },
      { name: "Inward / Outward Report", path: "/reports/inward-outward", category: "Reports", keywords: "inward outward material movement gate pass movement report", icon: <Assessment className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Warehouse Occupancy Report", path: "/reports/warehouse-occupancy", category: "Reports", keywords: "warehouse occupancy space utilization capacity report", icon: <Assessment className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "WHR Summary Report", path: "/reports/whr-report", category: "Reports", keywords: "whr report warehouse receipts token report depositor", icon: <Assessment className="!w-3.5 !h-3.5 text-purple-600" /> },
      { name: "Rent Collection Report", path: "/reports/rent-collection-report", category: "Reports", keywords: "rent collection report lease rent billing revenue report", icon: <Assessment className="!w-3.5 !h-3.5 text-blue-600" /> },
      { name: "Due Payment Report", path: "/reports/due-payment-report", category: "Reports", keywords: "due payment report overdue payables receivables aging", icon: <Assessment className="!w-3.5 !h-3.5 text-rose-600" /> },

      // ── Setup & Config ──
      { name: "Company Profile & Details", path: "/companyprofile", category: "Setup & Config", keywords: "company profile details company settings organization", icon: <Settings className="!w-3.5 !h-3.5 text-sky-600" /> },
      { name: "User Roles & Permissions", path: "/new-user", category: "Setup & Config", keywords: "user management roles permissions admin security access control", icon: <Settings className="!w-3.5 !h-3.5 text-indigo-600" /> },
      { name: "System Audit Logs", path: "/system-logs", category: "Setup & Config", keywords: "system audit logs activity logs audit trail security logs", icon: <Assessment className="!w-3.5 !h-3.5 text-slate-600" /> },
      { name: "MIS Types Configuration", path: "/mis-types", category: "Setup & Config", keywords: "mis types custom types parameters config", icon: <Settings className="!w-3.5 !h-3.5 text-amber-600" /> },
      { name: "PAN Availability Settings", path: "/pan-availibility", category: "Setup & Config", keywords: "pan availability tax compliance setting", icon: <Settings className="!w-3.5 !h-3.5 text-teal-600" /> },
      { name: "Transportation Modes", path: "/transportation-mode", category: "Setup & Config", keywords: "transportation mode road rail air sea freight", icon: <Settings className="!w-3.5 !h-3.5 text-emerald-600" /> },
    ],
    []
  );

  // Filtered search results
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchableRegistry.slice(0, 8);
    }
    const query = searchQuery.toLowerCase().trim();
    return searchableRegistry
      .filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.keywords.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.path.toLowerCase().includes(query)
        );
      })
      .slice(0, 12);
  }, [searchQuery, searchableRegistry]);

  // Handle Search item click
  const handleSelectSearchResult = (item: SearchableItem) => {
    navigate(item.path);
    setIsSearchFocused(false);
    setSearchQuery("");
  };

  // Keyboard navigation inside search dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev + 1) % (filteredSearchResults.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev - 1 + filteredSearchResults.length) % (filteredSearchResults.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSearchResults[selectedSearchIndex]) {
        handleSelectSearchResult(filteredSearchResults[selectedSearchIndex]);
      }
    }
  };

  // Update history on route change
  useEffect(() => {
    const matchedLabel = getBreadcrumbTitle(location.pathname);
    if (matchedLabel && matchedLabel !== "Dashboard Overview") {
      setRecentHistory((prev) => {
        const filtered = prev.filter((item) => item.path !== location.pathname);
        return [{ label: matchedLabel, path: location.pathname }, ...filtered.slice(0, 5)];
      });
    }
  }, [location.pathname]);

  // Clean Mega-menu definitions (without repetitive paths)
  const megaMenuData: MegaMenuItem[] = [
    { label: "Activities", path: "/dashboard" },
    {
      label: "Transactions",
      items: [
        { label: "Transactions Overview", path: "/transactions" },
        {
          label: "Purchases (P2P)",
          children: [
            {
              label: "Purchase Orders",
              path: "/purchase-order",
              permission: { module: "purchase_order", action: "read" },
              subChildren: [
                { label: "New Purchase Order", path: "/purchase-order?action=new", permission: { module: "purchase_order", action: "create" } },
                { label: "Purchase Orders List", path: "/purchase-order", permission: { module: "purchase_order", action: "read" } },
              ],
            },
            {
              label: "Goods Receipt Note (GRN)",
              path: "/grn",
              permission: { module: "grn", action: "read" },
              subChildren: [
                { label: "New GRN", path: "/grn?action=new", permission: { module: "grn", action: "create" } },
                { label: "GRN List", path: "/grn", permission: { module: "grn", action: "read" } },
              ],
            },
            // { label: "Quality Inspection Check", path: "/quality-inspection", permission: { module: "quality_report", action: "read" } },
            { label: "Purchase Bills & Invoices", path: "/purchase-invoice", permission: { module: "purchase_invoice", action: "read" } },
            { label: "Purchase Payments", path: "/purchase-payment", permission: { module: "purchase_payment", action: "read" } },
            { label: "Purchase Return Authorizations", path: "/purchase-return", permission: { module: "purchase_return", action: "read" } },
            { label: "Item Return Fulfillments", path: "/return-fulfillment", permission: { module: "purchase_return", action: "read" } },
            { label: "Vendor Credits (Debit Notes)", path: "/debit-note", permission: { module: "purchase_return", action: "read" } },
            { label: "Vendor Refunds", path: "/vendor-refund", permission: { module: "purchase_return", action: "read" } },
          ],
        },
        {
          label: "Sales & Billing (O2C)",
          children: [
            {
              label: "Sales Orders",
              path: "/sales-order",
              permission: { module: "sales_order", action: "read" },
              subChildren: [
                { label: "New Sales Order", path: "/sales-order?action=new", permission: { module: "sales_order", action: "create" } },
                { label: "Sales Orders List", path: "/sales-order", permission: { module: "sales_order", action: "read" } },
              ],
            },
            { label: "Delivery Challans", path: "/delivery-challan", permission: { module: "delivery_challan", action: "read" } },
            { label: "Sales Invoices", path: "/invoice", permission: { module: "invoice", action: "read" } },
            { label: "Customer Bills", path: "/bill", permission: { module: "bill", action: "read" } },
            { label: "Sales Returns", path: "/sales-return", permission: { module: "sales_return", action: "read" } },
          ],
        },
        {
          label: "Warehouse & Logistics",
          children: [
            { label: "Inventory Summary", path: "/inventory", permission: { module: "inventory", action: "read" } },
            { label: "Warehouses Master", path: "/warehouses", permission: { module: "warehouse", action: "read" } },
            { label: "Warehouse Receipts (WHR)", path: "/whr", permission: { module: "deposit", action: "read" } },
            { label: "Gate Pass Management", path: "/gatepass", permission: { module: "gatepass", action: "read" } },
            { label: "Request Delivery", path: "/request-delivery", permission: { module: "delivery", action: "read" } },
            { label: "Insurance Policies", path: "/insurance", permission: { module: "insurance", action: "read" } },
          ],
        },
        {
          label: "Financials & Accounting",
          children: [
            { label: "General Ledger", path: "/ledger", permission: { module: "ledger", action: "read" } },
            { label: "Customer Ledger", path: "/ledger/customer", permission: { module: "ledger", action: "read" } },
            { label: "Vouchers Management", path: "/vouchers", permission: { module: "voucher", action: "read" } },
            { label: "Chart of Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
          ],
        },
      ],
    },
    {
      label: "Lists",
      items: [
        { label: "Lists Overview", path: "/dashboard" },
        {
          label: "Relationships",
          children: [
            {
              label: "Vendors Master",
              path: "/vendor",
              subChildren: [
                { label: "New Vendor", path: "/vendor?action=new" },
                { label: "Search Vendors", path: "/vendor" },
              ],
            },
            {
              label: "Customers Master",
              path: "/customer",
              permission: { module: "customer", action: "read" },
              subChildren: [
                { label: "New Customer", path: "/customer?action=new", permission: { module: "customer", action: "create" } },
                { label: "Search Customers", path: "/customer", permission: { module: "customer", action: "read" } },
              ],
            },
            {
              label: "Employees / Users",
              path: "/new-user",
              permission: { module: "NewUser", action: "read" },
              subChildren: [
                { label: "New User", path: "/new-user?action=new", permission: { module: "NewUser", action: "create" } },
                { label: "Search Users", path: "/new-user", permission: { module: "NewUser", action: "read" } },
              ],
            },
          ],
        },
        {
          label: "Items & Inventory",
          children: [
            {
              label: "Items Master",
              path: "/item",
              subChildren: [
                { label: "New Item", path: "/item?action=new" },
                { label: "Search Items", path: "/item" },
              ],
            },
            { label: "Item Groups", path: "/item-group" },
            { label: "Categories", path: "/category" },
            { label: "Item Types", path: "/item-type" },
            { label: "Units of Measure (UOM)", path: "/uom" },
            { label: "HSN / SAC Codes", path: "/hsnsac" },
          ],
        },
        {
          label: "Accounting Masters",
          children: [
            { label: "Chart of Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
            { label: "Currencies", path: "/currencies" },
          ],
        },
        {
          label: "Classifications",
          children: [
            { label: "Subsidiaries", path: "/subsidiary" },
            { label: "Classes", path: "/class" },
            { label: "Departments", path: "/department" },
            { label: "Locations & Cities", path: "/location" },
            { label: "States", path: "/state" },
            { label: "Payment Terms", path: "/terms", permission: { module: "vendor", action: "read" } },
            { label: "Payment Methods", path: "/payment-method", permission: { module: "paymentMethod", action: "read" } },
          ],
        },
      ],
    },
    {
      label: "Reports",
      items: [
        {
          label: "Daily & Customer Reports",
          children: [
            { label: "Daily Summary Report", path: "/reports/daily-summary" },
            { label: "Customer Balance Summary", path: "/ledger/customer-summary", permission: { module: "ledger", action: "read" } },
            { label: "Customer Ledger Report", path: "/ledger/customer", permission: { module: "ledger", action: "read" } },
          ],
        },
        {
          label: "Inventory & Warehouse Reports",
          children: [
            { label: "Stock Register Report", path: "/reports/stock-register" },
            { label: "Inward / Outward Summary", path: "/reports/inward-outward" },
            { label: "Warehouse Occupancy Report", path: "/reports/warehouse-occupancy" },
            { label: "WHR Receipts Report", path: "/reports/whr-report" },
          ],
        },
        {
          label: "Financial & Revenue Reports",
          children: [
            { label: "Rent Collection Report", path: "/reports/rent-collection-report" },
            { label: "Due Payment Aging Report", path: "/reports/due-payment-report" },
          ],
        },
      ],
    },
    { label: "Analytics", path: "/dashboard" },
    {
      label: "Customization",
      items: [
        { label: "MIS Types Configuration", path: "/mis-types", permission: { module: "mistype", action: "read" } },
        { label: "PAN Availability Rules", path: "/pan-availibility", permission: { module: "panAvailibility", action: "read" } },
        { label: "Transportation Modes", path: "/transportation-mode" },
        { label: "Service Categories", path: "/service-category" },
        { label: "Service Types", path: "/service-types", permission: { module: "servicetype", action: "read" } },
        { label: "Work Categories", path: "/work-category" },
      ],
    },
    { label: "Documents", path: "/companyprofile" },
    {
      label: "Setup",
      items: [
        { label: "Setup Manager", path: "/dashboard" },
        {
          label: "Company Configuration",
          children: [
            { label: "Company Profile", path: "/companyprofile" },
            { label: "Subsidiaries Master", path: "/subsidiary" },
          ],
        },
        {
          label: "Accounting Setup",
          children: [
            { label: "Currency Master", path: "/currency" },
            { label: "Chart of Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
            { label: "Vouchers Management", path: "/vouchers", permission: { module: "voucher", action: "read" } },
            { label: "General Ledger", path: "/ledger", permission: { module: "ledger", action: "read" } },
          ],
        },
        {
          label: "Sales & Purchasing Setup",
          children: [
            { label: "Payment Terms", path: "/terms", permission: { module: "vendor", action: "read" } },
            { label: "Payment Methods", path: "/payment-method", permission: { module: "paymentMethod", action: "read" } },
            { label: "Registration Types", path: "/registration-type", permission: { module: "registrationType", action: "read" } },
            { label: "Transportation Modes", path: "/transportation-mode" },
          ],
        },
        {
          label: "Users & Security",
          children: [
            { label: "User Management & Roles", path: "/new-user", permission: { module: "NewUser", action: "read" } },
            { label: "System Audit Logs", path: "/system-logs" },
          ],
        },
      ],
    },
  ];

  function getBreadcrumbTitle(path: string): string {
    const routeMap: Record<string, string> = {
      "/dashboard": "Dashboard Overview",
      "/transactions": "Transactions Overview",
      "/transactions-overview": "Transactions Overview",
      "/vendor": "Vendors Master Record",
      "/customer": "Customer Records",
      "/purchase-order": "Purchase Orders",
      "/grn": "Goods Receipt Note (GRN)",
      "/purchase-invoice": "Purchase Invoices",
      "/purchase-payment": "Purchase Payments",
      "/purchase-return": "Purchase Return Authorizations",
      "/return-fulfillment": "Item Return Fulfillments",
      "/debit-note": "Vendor Credits",
      "/vendor-credit": "Vendor Credits",
      "/vendor-refund": "Vendor Refunds",
      "/sales-order": "Sales Orders",
      "/delivery-challan": "Delivery Challans",
      "/invoice": "Sales Invoices",
      "/sales-return": "Sales Returns",
      "/inventory": "Inventory Records",
      "/warehouses": "Warehouse Management",
      "/whr": "Warehouse Receipts (WHR)",
      "/companyprofile": "Company Profile",
      "/subsidiary": "Subsidiaries Master",
      "/class": "Class Master",
      "/department": "Department Master",
      "/item": "Items List",
      "/ledger": "General Ledger",
      "/vouchers": "Vouchers Management",
      "/system-logs": "System Audit Logs",
      "/reports/daily-summary": "Daily Summary Report",
      "/ledger/customer-summary": "Customer Balance Summary",
      "/reports/stock-register": "Stock Register Report",
      "/reports/inward-outward": "Inward / Outward Report",
      "/reports/warehouse-occupancy": "Warehouse Occupancy Report",
      "/reports/whr-report": "WHR Report",
      "/reports/rent-collection-report": "Rent Collection Report",
      "/reports/due-payment-report": "Due Payment Report",
    };
    return routeMap[path] || "Enterprise Workspace";
  }

  const isCurrentFav = favorites.includes(location.pathname);

  const toggleFavorite = () => {
    if (isCurrentFav) {
      setFavorites((prev) => prev.filter((p) => p !== location.pathname));
    } else {
      setFavorites((prev) => [...prev, location.pathname]);
    }
  };

  const userFullName = currentUser
    ? `${currentUser.FirstName || ""} ${currentUser.LastName || ""}`.trim() || currentUser.username || currentUser.email || "Administrator"
    : companyData?.result?.user
    ? `${companyData.result.user.FirstName || ""} ${companyData.result.user.LastName || ""}`.trim() || "User"
    : "Administrator";

  const companyName = companyData?.result?.name || "Ignitive Software Labs";

  const isLocalEnv =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("192.168.") ||
      window.location.port === "5173" ||
      window.location.port === "3000" ||
      import.meta.env.DEV);

  const environmentName = isLocalEnv ? "Development" : "Production";
  const environmentColor = isLocalEnv ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold";

  const displayRole = isPlatformSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Administrator"
    : currentUser?.Type || currentUser?.role_name || "User";

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f3f6] text-slate-800 font-sans antialiased">
      {/* ── TIER 1 GLOBAL HEADER BAR ── */}
      <header className="h-[46px] bg-[#1e2d3d] text-white flex items-center justify-between px-3 z-50 shadow-md border-b border-slate-700 relative">
        {/* Left: Hoursuite Brand & Quick Nav Icons */}
        <div className="flex items-center space-x-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-300 hover:text-white focus:outline-none p-1 cursor-pointer"
          >
            <MenuIcon className="!w-5 !h-5" />
          </button>

          {/* Hoursuite Branding */}
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <div className="flex flex-col leading-none">
              <span className="text-[9px] uppercase font-semibold text-sky-400 tracking-wider">ENTERPRISE</span>
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                Hoursuite
              </span>
            </div>
            <span className="hidden sm:inline-block text-slate-500 font-light">|</span>
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded text-[11px] font-medium text-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>{companyName}</span>
            </div>
          </Link>

          {/* History, Favorites, Home Shortcuts */}
          <div className="hidden md:flex items-center space-x-1 pl-2 border-l border-slate-700/80">
            {/* History Clock */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsHistoryOpen(!isHistoryOpen);
                  setIsFavOpen(false);
                }}
                title="Recent History"
                className={`p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer ${
                  isHistoryOpen ? "bg-slate-700 text-white" : ""
                }`}
              >
                <AccessTime className="!w-4 !h-4" />
              </button>
              {isHistoryOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white text-slate-800 rounded shadow-2xl border border-slate-200 py-1 z-[9999] text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 flex justify-between items-center">
                    <span>Recent History</span>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      ×
                    </button>
                  </div>
                  {recentHistory.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.path}
                      onClick={() => setIsHistoryOpen(false)}
                      className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 truncate cursor-pointer text-slate-700 no-underline"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Star */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFavOpen(!isFavOpen);
                  setIsHistoryOpen(false);
                }}
                title="Favorites"
                className={`p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer ${
                  isFavOpen ? "bg-slate-700 text-amber-400" : ""
                }`}
              >
                {isCurrentFav ? <Star className="!w-4 !h-4 text-amber-400" /> : <StarBorder className="!w-4 !h-4" />}
              </button>
              {isFavOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white text-slate-800 rounded shadow-2xl border border-slate-200 py-1 z-[9999] text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 flex justify-between items-center">
                    <span>Favorites Menu</span>
                    <button
                      onClick={toggleFavorite}
                      className="text-sky-600 hover:text-sky-800 font-normal normal-case text-[11px] cursor-pointer"
                    >
                      {isCurrentFav ? "- Remove Current" : "+ Add Current Page"}
                    </button>
                  </div>
                  {favorites.length === 0 ? (
                    <div className="px-3 py-2 text-slate-400 text-center italic">No favorites saved</div>
                  ) : (
                    favorites.map((favPath, idx) => (
                      <Link
                        key={idx}
                        to={favPath}
                        onClick={() => setIsFavOpen(false)}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center space-x-2 truncate cursor-pointer text-slate-700 no-underline"
                      >
                        <Star className="!w-3.5 !h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{getBreadcrumbTitle(favPath)}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Home Icon */}
            <Link
              to="/dashboard"
              title="Global Dashboard"
              className="p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            >
              <Home className="!w-4 !h-4" />
            </Link>
          </div>
        </div>

        {/* Center: Workable Global Search Input Box */}
        <div ref={searchContainerRef} className="flex-1 max-w-lg mx-4 relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="!w-4 !h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSearchIndex(0);
                if (!isSearchFocused) setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search records, transactions, reports, setup (Press '/' to focus)..."
              className="w-full bg-slate-900/90 border border-slate-600/90 rounded text-xs text-slate-100 placeholder-slate-400 pl-8 pr-8 py-1 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-sans"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                ×
              </button>
            ) : (
              <span className="absolute right-2 text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1 rounded font-mono pointer-events-none">
                /
              </span>
            )}
          </div>

          {/* Quick Search Results Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white text-slate-800 rounded-md shadow-2xl border border-slate-200 py-1 z-[9999] text-xs max-h-96 overflow-y-auto divide-y divide-slate-100">
              <div className="px-3 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider flex justify-between items-center bg-slate-50">
                <span>{searchQuery ? `Search Results (${filteredSearchResults.length})` : "Quick Navigation & Jump"}</span>
                <span className="text-[9px] text-slate-400 font-normal">Use ↑↓ keys + Enter</span>
              </div>

              {filteredSearchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-400 italic">
                  No matches found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredSearchResults.map((res, i) => {
                  const isSelected = i === selectedSearchIndex;
                  return (
                    <Link
                      key={i}
                      to={res.path}
                      onClick={() => handleSelectSearchResult(res)}
                      onMouseEnter={() => setSelectedSearchIndex(i)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer no-underline ${
                        isSelected ? "bg-sky-50 text-sky-800 font-semibold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="flex-shrink-0">{res.icon || <ArrowForward className="!w-3.5 !h-3.5 text-slate-400" />}</span>
                        <span className="truncate">{res.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-2">
                        {res.category}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="flex items-center">
            <NotificationDropdown />
          </div>

          {/* User Profile Badge */}
          <div className="pl-2 border-l border-slate-700 flex items-center space-x-1.5">
            <div className="hidden xl:flex flex-col text-right leading-tight">
              <span className="text-[11px] font-semibold text-slate-100">{userFullName}</span>
              <span className="text-[10px] text-slate-400">
                {companyName}
                {isAdmin || isPlatformSuperAdmin ? " • Administrator" : currentUser?.Type ? ` • ${currentUser.Type}` : ""}
              </span>
            </div>
            <OptionsMenu />
          </div>
        </div>
      </header>

      {/* ── TIER 2 ENTERPRISE MODULE RIBBON / MEGA-MENU ── */}
      <nav className="hidden lg:block bg-[#244b5a] text-white border-b border-[#1b3a47] relative z-40 shadow-sm">
        <div className="flex flex-wrap items-center whitespace-nowrap px-2 relative z-40">
          {megaMenuData.map((menuItem) => {
            const hasSub = Boolean(menuItem.items && menuItem.items.length > 0);
            const isActive = activeMegaMenu === menuItem.label;

            return (
              <div
                key={menuItem.label}
                className="relative group"
                onMouseEnter={() => {
                  setActiveMegaMenu(menuItem.label);
                  setActiveSubMenu(null);
                  setActiveThirdMenu(null);
                }}
                onMouseLeave={() => {
                  setActiveMegaMenu(null);
                  setActiveSubMenu(null);
                  setActiveThirdMenu(null);
                }}
              >
                {menuItem.path && !hasSub ? (
                  <Link
                    to={menuItem.path}
                    className={`px-3 py-1.5 text-xs font-semibold tracking-tight transition-colors flex items-center space-x-1 border-b-2 cursor-pointer no-underline ${
                      location.pathname === menuItem.path
                        ? "bg-[#1b3a47] text-white border-sky-400"
                        : "text-slate-100 hover:bg-[#1b3a47]/70 hover:text-white border-transparent"
                    }`}
                  >
                    <span>{menuItem.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setActiveMegaMenu(null);
                      } else {
                        setActiveMegaMenu(menuItem.label);
                      }
                      if (menuItem.path && !hasSub) {
                        navigate(menuItem.path);
                        setActiveMegaMenu(null);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold tracking-tight transition-colors flex items-center space-x-1 border-b-2 cursor-pointer ${
                      isActive || (menuItem.path && location.pathname.startsWith(menuItem.path) && menuItem.path !== "/dashboard")
                        ? "bg-[#1b3a47] text-white border-sky-400"
                        : "text-slate-100 hover:bg-[#1b3a47]/70 hover:text-white border-transparent"
                    }`}
                  >
                    <span>{menuItem.label}</span>
                    {hasSub && <KeyboardArrowDown className="!w-3 !h-3 opacity-70" />}
                  </button>
                )}

                {/* Level 1 Dropdown Flyout Menu */}
                {hasSub && isActive && (
                  <div className="absolute left-0 top-full bg-white text-slate-800 shadow-2xl rounded-b border border-slate-200 py-1.5 min-w-[230px] z-[9999] text-xs">
                    {menuItem.items!
                      .filter((sub) => isAllowed(sub.permission))
                      .map((subItem) => {
                        const allowedChildren = subItem.children?.filter((c) => isAllowed(c.permission)) || [];
                        const hasChildren = allowedChildren.length > 0;
                        const isSubActive = activeSubMenu === subItem.label;

                        return (
                          <div
                            key={subItem.label}
                            className="relative"
                            onMouseEnter={() => {
                              setActiveSubMenu(subItem.label);
                              setActiveThirdMenu(null);
                            }}
                          >
                            {subItem.path ? (
                              <Link
                                to={subItem.path}
                                onClick={() => {
                                  setActiveMegaMenu(null);
                                  setActiveSubMenu(null);
                                }}
                                className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors cursor-pointer no-underline ${
                                  isSubActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <span>{subItem.label}</span>
                                {hasChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors cursor-pointer ${
                                  isSubActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <span>{subItem.label}</span>
                                {hasChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                              </button>
                            )}

                            {/* Level 2 Nested Flyout Submenu */}
                            {hasChildren && isSubActive && (
                              <div className="absolute left-full top-0 bg-white text-slate-800 shadow-2xl rounded border border-slate-200 py-1.5 min-w-[220px] z-[10000] text-xs -ml-1">
                                {allowedChildren.map((child) => {
                                  const allowedSubChildren = child.subChildren?.filter((sc) => isAllowed(sc.permission)) || [];
                                  const hasSubChildren = allowedSubChildren.length > 0;
                                  const isThirdActive = activeThirdMenu === child.label;

                                  return (
                                    <div
                                      key={child.label}
                                      className="relative"
                                      onMouseEnter={() => setActiveThirdMenu(child.label)}
                                    >
                                      {child.path ? (
                                        <Link
                                          to={child.path}
                                          onClick={() => {
                                            setActiveMegaMenu(null);
                                            setActiveSubMenu(null);
                                            setActiveThirdMenu(null);
                                          }}
                                          className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors cursor-pointer no-underline ${
                                            isThirdActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                                          }`}
                                        >
                                          <span>{child.label}</span>
                                          {hasSubChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                                        </Link>
                                      ) : (
                                        <button
                                          type="button"
                                          className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors cursor-pointer ${
                                            isThirdActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                                          }`}
                                        >
                                          <span>{child.label}</span>
                                          {hasSubChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                                        </button>
                                      )}

                                      {/* Level 3 Nested Flyout Submenu */}
                                      {hasSubChildren && isThirdActive && (
                                        <div className="absolute left-full top-0 bg-white text-slate-800 shadow-2xl rounded border border-slate-200 py-1.5 min-w-[180px] z-[10001] text-xs -ml-1">
                                          {allowedSubChildren.map((subChild) => (
                                            <Link
                                              key={subChild.label}
                                              to={subChild.path}
                                              onClick={() => {
                                                setActiveMegaMenu(null);
                                                setActiveSubMenu(null);
                                                setActiveThirdMenu(null);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-sky-50 hover:text-sky-700 text-slate-700 flex items-center space-x-1.5 font-medium cursor-pointer no-underline"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 opacity-60"></span>
                                              <span>{subChild.label}</span>
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── MOBILE / TABLET COLLAPSIBLE DRAWER NAV ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>

          <div className="relative flex-1 max-w-xs w-full bg-[#1e2d3d] text-white flex flex-col shadow-2xl z-50">
            <div className="p-3 bg-[#111827] flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-sky-400 uppercase">Hoursuite</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <CloseIcon className="!w-5 !h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 text-xs divide-y divide-slate-700/50">
              {megaMenuData.map((menuItem, idx) => (
                <div key={idx} className="py-1">
                  <div className="px-3 py-2 font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex justify-between items-center">
                    <span>{menuItem.label}</span>
                  </div>
                  {menuItem.items?.map((sub, sIdx) => (
                    <div key={sIdx} className="pl-4">
                      {sub.path ? (
                        <Link
                          to={sub.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-left py-1.5 px-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded cursor-pointer block no-underline"
                        >
                          {sub.label}
                        </Link>
                      ) : (
                        <div className="py-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{sub.label}</span>
                          {sub.children?.map((c, cIdx) => (
                            <React.Fragment key={cIdx}>
                              {c.path ? (
                                <Link
                                  to={c.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="w-full text-left py-1 pl-3 text-slate-300 hover:text-sky-300 block no-underline cursor-pointer"
                                >
                                  • {c.label}
                                </Link>
                              ) : (
                                <span className="w-full text-left py-1 pl-3 text-slate-400 block font-semibold text-[11px]">
                                  {c.label}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BREADCRUMB TRAIL & ENVIRONMENT STATUS ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap">
          <Link to="/dashboard" className="hover:text-sky-600 font-medium flex items-center">
            Home
          </Link>
          <NavigateNext className="!w-3.5 !h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Enterprise Portal</span>
          <NavigateNext className="!w-3.5 !h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">{getBreadcrumbTitle(location.pathname)}</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400">
          <span>
            Role: <strong className="text-slate-700 font-semibold">{displayRole}</strong>
          </span>
          <span>•</span>
          <span>
            Environment: <strong className={environmentColor}>{environmentName}</strong>
          </span>
        </div>
      </div>

      {/* ── VIEWPORT / CONTENT BODY ── */}
      <main className="flex-1 p-3 md:p-5 overflow-y-auto max-w-[1920px] w-full mx-auto">{children}</main>
    </div>
  );
}

