import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Search,
  AccessTime,
  Star,
  StarBorder,
  Home,
  Add,
  HelpOutline,
  ChatBubbleOutline,
  KeyboardArrowDown,
  ChevronRight,
  Menu as MenuIcon,
  Close as CloseIcon,
  NavigateNext,
} from "@mui/icons-material";

import NotificationDropdown from "../Notification";
import OptionsMenu from "../OptionsMenu";
import { useFetchCompanyQuery } from "../../RTK/services/companyApi";
import { usePermissions } from "../../Hooks/usePermissions";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: companyData } = useFetchCompanyQuery();
  const { hasPermission, isAdmin, isPlatformSuperAdmin } = usePermissions();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [activeThirdMenu, setActiveThirdMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["/vendor", "/purchase-order", "/sales-order"]);
  const [recentHistory, setRecentHistory] = useState<{ label: string; path: string }[]>([
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

  // Global keyboard shortcut '/' to focus search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Clean Mega-menu definitions matching NetSuite Enterprise architecture
  const megaMenuData: MegaMenuItem[] = [
    { label: "Activities", path: "/dashboard" },
    {
      label: "Transactions",
      items: [
        { label: "Transactions Overview", path: "/dashboard" },
        {
          label: "Purchases",
          children: [
            {
              label: "Purchase Orders",
              path: "/purchase-order",
              permission: { module: "purchase_order", action: "read" },
              subChildren: [
                { label: "New", path: "/purchase-order?action=new", permission: { module: "purchase_order", action: "create" } },
                { label: "Search / List", path: "/purchase-order", permission: { module: "purchase_order", action: "read" } },
              ],
            },
            {
              label: "Goods Receipt Note (GRN)",
              path: "/grn",
              permission: { module: "grn", action: "read" },
              subChildren: [
                { label: "New GRN", path: "/grn?action=new", permission: { module: "grn", action: "create" } },
                { label: "Search / List", path: "/grn", permission: { module: "grn", action: "read" } },
              ],
            },
            { label: "Quality Inspection", path: "/quality-inspection", permission: { module: "quality_report", action: "read" } },
            { label: "Purchase Bills", path: "/purchase-invoice", permission: { module: "purchase_invoice", action: "read" } },
            { label: "Purchase Payments", path: "/purchase-payment", permission: { module: "purchase_payment", action: "read" } },
            { label: "Purchase Returns", path: "/purchase-return", permission: { module: "purchase_return", action: "read" } },
            { label: "Debit Notes", path: "/finance/debit-notes", permission: { module: "purchase_return", action: "read" } },
          ],
        },
        {
          label: "Sales & Billing",
          children: [
            {
              label: "Sales Orders",
              path: "/sales-order",
              permission: { module: "sales_order", action: "read" },
              subChildren: [
                { label: "New", path: "/sales-order?action=new", permission: { module: "sales_order", action: "create" } },
                { label: "Search / List", path: "/sales-order", permission: { module: "sales_order", action: "read" } },
              ],
            },
            { label: "Delivery Challans", path: "/delivery-challan", permission: { module: "delivery_challan", action: "read" } },
            { label: "Sales Returns", path: "/sales-return", permission: { module: "sales_return", action: "read" } },
            { label: "Customer Bills", path: "/bill", permission: { module: "bill", action: "read" } },
            { label: "Invoices", path: "/invoice", permission: { module: "invoice", action: "read" } },
          ],
        },
        {
          label: "Warehouse & Inventory",
          children: [
            { label: "Inventory Master", path: "/inventory", permission: { module: "inventory", action: "read" } },
            { label: "Warehouses", path: "/warehouses", permission: { module: "warehouse", action: "read" } },
            { label: "WHR (Warehouse Receipts)", path: "/whr", permission: { module: "deposit", action: "read" } },
            { label: "Gate Pass Management", path: "/gatepass", permission: { module: "gatepass", action: "read" } },
            { label: "Request Delivery", path: "/request-delivery", permission: { module: "delivery", action: "read" } },
            { label: "Insurance Policies", path: "/insurance", permission: { module: "insurance", action: "read" } },
          ],
        },
        {
          label: "Financials & Ledger",
          children: [
            { label: "Chart of Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
            { label: "General Ledger", path: "/ledger", permission: { module: "ledger", action: "read" } },
            { label: "Customer Ledger", path: "/ledger/customer", permission: { module: "ledger", action: "read" } },
            { label: "Vouchers", path: "/vouchers", permission: { module: "voucher", action: "read" } },
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
              label: "Vendors",
              path: "/vendor",
              subChildren: [
                { label: "New", path: "/vendor?action=new" },
                { label: "Search", path: "/vendor" },
              ],
            },
            {
              label: "Customers",
              path: "/customer",
              permission: { module: "customer", action: "read" },
              subChildren: [
                { label: "New", path: "/customer?action=new", permission: { module: "customer", action: "create" } },
                { label: "Search", path: "/customer", permission: { module: "customer", action: "read" } },
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
          label: "Supply Chain",
          children: [
            { label: "Warehouses", path: "/warehouses", permission: { module: "warehouse", action: "read" } },
          ],
        },
        {
          label: "Items & Materials",
          children: [
            {
              label: "Items",
              path: "/item",
              subChildren: [
                { label: "New Item", path: "/item?action=new" },
                { label: "Search Items", path: "/item" },
              ],
            },
            { label: "Item Group", path: "/item-group" },
            { label: "Categories", path: "/category" },
            { label: "Item Types", path: "/item-type" },
            { label: "Classes", path: "/class" },
            { label: "Departments", path: "/department" },
            { label: "Units of Measure (UOM)", path: "/uom" },
            { label: "HSN / SAC Codes", path: "/hsnsac" },
          ],
        },
        {
          label: "Accounting",
          children: [
            { label: "Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Currencies", path: "/currencies" },
            {
              label: "Items",
              path: "/item",
              subChildren: [
                { label: "New", path: "/item?action=new" },
                { label: "Search", path: "/item" },
              ],
            },
            { label: "Units Of Measure (UOM)", path: "/uom" },
            { label: "HSN / SAC Codes", path: "/hsnsac" },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
            { label: "MIS Types", path: "/mis-types", permission: { module: "mistype", action: "read" } },
            { label: "PAN Availabilities", path: "/pan-availibility", permission: { module: "panAvailibility", action: "read" } },
            { label: "Transportation Modes", path: "/transportation-mode", permission: { module: "transportationMode", action: "read" } },
            { label: "Registration Types", path: "/registration-type", permission: { module: "registrationType", action: "read" } },
          ],
        },

        {
          label: "Classification",
          children: [
            { label: "Subsidiaries", path: "/subsidiary" },
            { label: "Classes", path: "/class" },
            { label: "Departments", path: "/department" },
            { label: "Cities & Locations", path: "/location" },
            { label: "States", path: "/state" },
            { label: "Service Categories", path: "/service-category" },
            { label: "Service Types", path: "/service-types", permission: { module: "servicetype", action: "read" } },
            { label: "Work Categories", path: "/work-category" },
            { label: "Registration Types", path: "/registration-type", permission: { module: "registrationType", action: "read" } },
            { label: "Payment Methods", path: "/payment-method", permission: { module: "paymentMethod", action: "read" } },
            { label: "Payment Terms", path: "/terms", permission: { module: "vendor", action: "read" } },
          ],
        },
      ],
    },
    {
      label: "Reports",
      items: [
        {
          label: "Daily & Summary",
          children: [
            { label: "Daily Summary Report", path: "/reports/daily-summary" },
            { label: "Customer Balance Summary", path: "/ledger/customer-summary", permission: { module: "ledger", action: "read" } },
          ],
        },
        {
          label: "Inventory & Warehouses",
          children: [
            { label: "Inward / Outward Report", path: "/reports/inward-outward" },
            { label: "Stock Register Report", path: "/reports/stock-register" },
            { label: "Warehouse Occupancy Report", path: "/reports/warehouse-occupancy" },
            { label: "WHR Report", path: "/reports/whr-report" },
          ],
        },
        {
          label: "Financial Reports",
          children: [
            { label: "Rent Collection Report", path: "/reports/rent-collection-report" },
            { label: "Due Payment Report", path: "/reports/due-payment-report" },
          ],
        },
      ],
    },
    { label: "Analytics", path: "/dashboard" },
    {
      label: "Customization",
      items: [
        { label: "MIS Types", path: "/mis-types", permission: { module: "mistype", action: "read" } },
        { label: "PAN Availability", path: "/pan-availibility", permission: { module: "panAvailibitlity", action: "read" } },
        { label: "Transportation Modes", path: "/transportation-mode" },
      ],
    },
    { label: "Documents", path: "/companyprofile" },
    {
      label: "Setup",
      items: [
        { label: "Setup Manager", path: "/dashboard" },
        {
          label: "Company",
          children: [
            { label: "Company Details", path: "/companyprofile" },
            { label: "Subsidiaries", path: "/subsidiary" },
          ],
        },
        {
          label: "Accounting Setup",
          children: [
            { label: "Currency Master", path: "/currency" },
            { label: "Chart of Accounts", path: "/chart-of-accounts", permission: { module: "chartofaccount", action: "read" } },
            { label: "Account Types", path: "/account-types", permission: { module: "accounttype", action: "read" } },
            { label: "Payment Terms", path: "/terms", permission: { module: "vendor", action: "read" } },
            { label: "General Ledger", path: "/ledger", permission: { module: "ledger", action: "read" } },
            { label: "Vouchers", path: "/vouchers", permission: { module: "voucher", action: "read" } },
          ],
        },
        {
          label: "Sales & Services Setup",
          children: [
            { label: "Registration Types", path: "/registration-type", permission: { module: "registrationType", action: "read" } },
            { label: "Payment Methods", path: "/payment-method", permission: { module: "paymentMethod", action: "read" } },
            { label: "Payment Terms", path: "/terms", permission: { module: "vendor", action: "read" } },
            { label: "Transportation Modes", path: "/transportation-mode" },
            { label: "Service Categories", path: "/service-category" },
            { label: "Service Types", path: "/service-types", permission: { module: "servicetype", action: "read" } },
            { label: "Work Categories", path: "/work-category" },
          ],
        },
        {
          label: "Import / Export Codes",
          children: [
            { label: "HSN / SAC Codes", path: "/hsnsac" },
            { label: "Units of Measure (UOM)", path: "/uom" },
          ],
        },
        {
          label: "Users & Security",
          children: [
            { label: "New Users / Roles", path: "/new-user", permission: { module: "NewUser", action: "read" } },
            { label: "System Audit Logs", path: "/system-logs" },
            { label: "PAN Availability", path: "/pan-availibility", permission: { module: "panAvailibitlity", action: "read" } },
          ],
        },
      ],
    },
  ];

  function getBreadcrumbTitle(path: string): string {
    const routeMap: Record<string, string> = {
      "/dashboard": "Dashboard Overview",
      "/vendor": "Vendors Master Record",
      "/customer": "Customer Records",
      "/purchase-order": "Purchase Orders",
      "/grn": "Goods Receipt Note (GRN)",
      "/purchase-invoice": "Purchase Invoices",
      "/purchase-payment": "Purchase Payments",
      "/purchase-return": "Purchase Returns",
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
      "/netsuite-vendor-demo": "NetSuite Vendor Demo",
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

  const userFullName = companyData?.result?.user
    ? `${companyData.result.user.FirstName} ${companyData.result.user.LastName}`
    : "EMP0098 Choudhary, Preeti";
  const companyName = companyData?.result?.name || "Ignitive software labs";

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f3f6] text-slate-800 font-sans antialiased select-none">
      {/* ── TIER 1 GLOBAL HEADER BAR ── */}
      <header className="h-[46px] bg-[#1e2d3d] text-white flex items-center justify-between px-3 z-30 shadow-md border-b border-slate-700 relative">
        {/* Left: NetSuite Brand & Utility Icons */}
        <div className="flex items-center space-x-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-300 hover:text-white focus:outline-none p-1"
          >
            <MenuIcon className="!w-5 !h-5" />
          </button>

          {/* NetSuite / Company Branding */}
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <div className="flex flex-col leading-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">ORACLE</span>
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
                NetSuite
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
                className={`p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors ${
                  isHistoryOpen ? "bg-slate-700 text-white" : ""
                }`}
              >
                <AccessTime className="!w-4 !h-4" />
              </button>
              {isHistoryOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 flex justify-between items-center">
                    <span>Recent History</span>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                      ×
                    </button>
                  </div>
                  {recentHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setIsHistoryOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 truncate"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                      <span className="truncate">{item.label}</span>
                    </button>
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
                className={`p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors ${
                  isFavOpen ? "bg-slate-700 text-amber-400" : ""
                }`}
              >
                {isCurrentFav ? (
                  <Star className="!w-4 !h-4 text-amber-400" />
                ) : (
                  <StarBorder className="!w-4 !h-4" />
                )}
              </button>
              {isFavOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 flex justify-between items-center">
                    <span>Favorites Menu</span>
                    <button
                      onClick={toggleFavorite}
                      className="text-sky-600 hover:text-sky-800 font-normal normal-case text-[11px]"
                    >
                      {isCurrentFav ? "- Remove Current" : "+ Add Current Page"}
                    </button>
                  </div>
                  {favorites.length === 0 ? (
                    <div className="px-3 py-2 text-slate-400 text-center italic">No favorites saved</div>
                  ) : (
                    favorites.map((favPath, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(favPath);
                          setIsFavOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center space-x-2 truncate"
                      >
                        <Star className="!w-3.5 !h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{getBreadcrumbTitle(favPath)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Home Icon */}
            <button
              onClick={() => navigate("/dashboard")}
              title="Global Dashboard"
              className="p-1.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors"
            >
              <Home className="!w-4 !h-4" />
            </button>
          </div>
        </div>

        {/* Center: Global Search Input Box */}
        <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="!w-4 !h-4 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search records, transactions, help..."
              className="w-full bg-slate-900/90 border border-slate-600/90 rounded text-xs text-slate-100 placeholder-slate-400 pl-8 pr-8 py-1 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
            />
            <span className="absolute right-2 text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1 rounded font-mono pointer-events-none">
              /
            </span>
          </div>

          {/* Quick Search Results Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 z-50 text-xs max-h-72 overflow-y-auto">
              <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase border-b border-slate-100">
                Quick Navigation & Search
              </div>
              {[
                { name: "Vendor Master List", path: "/vendor", type: "Master Record" },
                { name: "Purchase Order Register", path: "/purchase-order", type: "Transaction" },
                { name: "Sales Orders", path: "/sales-order", type: "Transaction" },
                { name: "Inventory Management", path: "/inventory", type: "Warehouse" },
                { name: "Warehouse Receipts (WHR)", path: "/whr", type: "Receipt" },
                { name: "Customer Records", path: "/customer", type: "Entity" },
                { name: "System Audit Logs", path: "/system-logs", type: "Audit" },
                { name: "NetSuite Vendor Demo", path: "/netsuite-vendor-demo", type: "Demo View" },
              ]
                .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(res.path);
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between group"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-sky-700">{res.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {res.type}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right: Quick Add, Help, Feedback & User Profile */}
        <div className="flex items-center space-x-2">
          {/* Quick Add Menu (+) */}
          <div className="relative">
            <button
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              title="Quick Create Record"
              className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors flex items-center justify-center cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
            </button>
            {isQuickAddOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white text-slate-800 rounded shadow-2xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100">
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Quick Create Record
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/vendor?action=new");
                      setIsQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 text-slate-700 font-medium"
                  >
                    <Add className="!w-3.5 !h-3.5 text-sky-600" />
                    <span>+ New Vendor</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/customer?action=new");
                      setIsQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 text-slate-700 font-medium"
                  >
                    <Add className="!w-3.5 !h-3.5 text-sky-600" />
                    <span>+ New Customer</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/purchase-order?action=new");
                      setIsQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 text-slate-700 font-medium"
                  >
                    <Add className="!w-3.5 !h-3.5 text-sky-600" />
                    <span>+ New Purchase Order</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/sales-order?action=new");
                      setIsQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 flex items-center space-x-2 text-slate-700 font-medium"
                  >
                    <Add className="!w-3.5 !h-3.5 text-sky-600" />
                    <span>+ New Sales Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center">
            <NotificationDropdown />
          </div>

          {/* Help Icon */}
          <button
            onClick={() => window.open("https://docs.oracle.com/en/cloud/saas/netsuite/", "_blank")}
            className="hidden md:flex items-center space-x-1 text-slate-300 hover:text-white text-xs px-1.5 py-1 rounded hover:bg-slate-700/70"
          >
            <HelpOutline className="!w-3.5 !h-3.5" />
            <span>Help</span>
          </button>

          {/* Feedback */}
          <button
            onClick={() => alert("NetSuite User Feedback logged.")}
            className="hidden md:flex items-center space-x-1 text-slate-300 hover:text-white text-xs px-1.5 py-1 rounded hover:bg-slate-700/70"
          >
            <ChatBubbleOutline className="!w-3.5 !h-3.5" />
            <span>Feedback</span>
          </button>

          {/* User Profile Badge */}
          <div className="pl-2 border-l border-slate-700 flex items-center space-x-1.5">
            <div className="hidden xl:flex flex-col text-right leading-tight">
              <span className="text-[11px] font-semibold text-slate-100">{userFullName}</span>
              <span className="text-[10px] text-slate-400">{companyName} - Administrator</span>
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

                {/* Level 1 Dropdown Flyout Menu */}
                {hasSub && isActive && (
                  <div className="absolute left-0 top-full bg-white text-slate-800 shadow-2xl rounded-b border border-slate-200 py-1.5 min-w-[220px] z-50 text-xs">
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
                            <button
                              onClick={() => {
                                if (subItem.path) {
                                  navigate(subItem.path);
                                  setActiveMegaMenu(null);
                                  setActiveSubMenu(null);
                                }
                              }}
                              className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors ${
                                isSubActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span>{subItem.label}</span>
                              {hasChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                            </button>

                            {/* Level 2 Nested Flyout Submenu */}
                            {hasChildren && isSubActive && (
                              <div className="absolute left-full top-0 bg-white text-slate-800 shadow-2xl rounded border border-slate-200 py-1.5 min-w-[210px] z-50 text-xs -ml-1">
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
                                      <button
                                        onClick={() => {
                                          if (child.path) {
                                            navigate(child.path);
                                            setActiveMegaMenu(null);
                                            setActiveSubMenu(null);
                                            setActiveThirdMenu(null);
                                          }
                                        }}
                                        className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between transition-colors ${
                                          isThirdActive ? "bg-sky-50 text-sky-700 font-semibold" : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        <span>{child.label}</span>
                                        {hasSubChildren && <ChevronRight className="!w-3.5 !h-3.5 text-slate-400" />}
                                      </button>

                                      {/* Level 3 Nested Flyout Submenu (e.g., Vendors -> New, Search) */}
                                      {hasSubChildren && isThirdActive && (
                                        <div className="absolute left-full top-0 bg-white text-slate-800 shadow-2xl rounded border border-slate-200 py-1.5 min-w-[160px] z-50 text-xs -ml-1">
                                          {allowedSubChildren.map((subChild) => (
                                            <button
                                              key={subChild.label}
                                              onClick={() => {
                                                navigate(subChild.path);
                                                setActiveMegaMenu(null);
                                                setActiveSubMenu(null);
                                                setActiveThirdMenu(null);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-sky-50 hover:text-sky-700 text-slate-700 flex items-center space-x-1.5 font-medium"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 opacity-60"></span>
                                              <span>{subChild.label}</span>
                                            </button>
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
                <span className="text-xs font-bold text-sky-400 uppercase">ORACLE NetSuite</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
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
                        <button
                          onClick={() => {
                            navigate(sub.path!);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left py-1.5 px-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded"
                        >
                          {sub.label}
                        </button>
                      ) : (
                        <div className="py-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{sub.label}</span>
                          {sub.children?.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => {
                                navigate(c.path!);
                                setIsMobileMenuOpen(false);
                              }}
                              className="w-full text-left py-1 pl-3 text-slate-300 hover:text-sky-300 block"
                            >
                              • {c.label}
                            </button>
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

      {/* ── BREADCRUMB TRAIL ── */}
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
          <span>Role: <strong className="text-slate-600 font-semibold">Administrator</strong></span>
          <span>•</span>
          <span>Environment: <strong className="text-emerald-600 font-semibold">Production</strong></span>
        </div>
      </div>

      {/* ── VIEWPORT / CONTENT BODY ── */}
      <main className="flex-1 p-3 md:p-5 overflow-y-auto max-w-[1920px] w-full mx-auto">{children}</main>
    </div>
  );
}
