import { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router-dom";

import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ListItemButton from "@mui/material/ListItemButton";
import SummarizeIcon from "@mui/icons-material/Summarize";
import InventoryIcon from "@mui/icons-material/Inventory";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { usePermissions } from "../Hooks/usePermissions";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import StorageIcon from "@mui/icons-material/Storage";
import PaymentIcon from '@mui/icons-material/Payment';
import ListItem from "@mui/material/ListItem";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";

import {
  HomeRounded,
  LocationOnRounded,
  BusinessRounded,
  // HistoryRounded,
  PeopleRounded,
  WarehouseRounded,
  LocalShippingRounded,
  InventoryRounded,
  CurrencyExchangeRounded,
  CategoryRounded,
  WorkRounded,
  GroupRounded,
  // LocalOfferRounded,
  // FactoryRounded,
  // LocalShippingOutlined,
  // InfoRounded,
  // HelpRounded,
  PublicRounded,
  AccountTreeRounded,
  PersonAddRounded,
  ArticleRounded,
  QrCodeRounded,
  StraightenRounded,
  MiscellaneousServicesRounded,
  ReceiptRounded,
  SettingsRounded,
  AssignmentTurnedInRounded,
  AccountBalanceWalletRounded,
  AccountBalanceRounded,
} from "@mui/icons-material";

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  permission?: any;
  children?: MenuItem[];
}

// ── Section: Setup ──
const setupItems = [
  {
    text: "Company Details",
    icon: <BusinessRounded />,
    path: "/companyprofile",
    permission: null,
  },
  {
    text: "Currency",
    icon: <CurrencyExchangeRounded />,
    path: "/currency",
    permission: null,
  },
  {
    text: "State",
    icon: <PublicRounded />,
    path: "/state",
    permission: null,
  },
  {
    text: "Location",
    icon: <LocationOnRounded />,
    path: "/location",
    permission: null,
  },
  {
    text: "Subsidiaries",
    icon: <AccountTreeRounded />,
    path: "/subsidiary",
    permission: null,
  },
  {
    text: "HSN/SAC",
    icon: <QrCodeRounded />,
    path: "/hsnsac",
    permission: null,
  },
  {
    text: "UOM",
    icon: <StraightenRounded />,
    path: "/uom",
    permission: null,
  },
  {
    text: "Registration Type",
    icon: <StraightenRounded />,
    path: "/registration-type",
    permission: null,
  },
  {
    text: "Service Category",
    icon: <CategoryRounded />,
    path: "/service-category",
    permission: null,
  },
  {
    text: "Work Category",
    icon: <WorkRounded />,
    path: "/work-category",
    permission: null,
  },
  {
    text: "Category",
    icon: <CategoryRoundedIcon />,
    path: "/category",
    permission: null,
  },
  {
    text: "Service Types",
    icon: <MiscellaneousServicesRounded />,
    path: "/service-types",
    permission: { module: "servicetype", action: "read" },
  },
  {
    text: "Pan Availability",
    icon: <CreditCardIcon />,
    path: "/pan-availibility",
    permission: null,
  },
  {
    text: "Payment Method",
    icon: <PaymentIcon />,
    path: "/payment-method",
    permission: null,
  },
  {
    text: "Payment Terms",
    icon: <PaymentIcon />,
    path: "/terms",
    permission: null,
  },
  {
    text: "Transportation Mode",
    icon: <LocalShippingRounded />,
    path: "/transportation-mode",
    permission: null,
  },
  {
    text: "New Users",
    icon: <PersonAddRounded />,
    path: "/new-user",
    permission: { module: "NewUser", action: "read" },
  },
  {
    text: "System Logs",
    icon: <ArticleRounded />,
    path: "/system-logs",
    permission: null,
  },
];

// ── Section: Master ──
const masterItems = [
  {
    text: "Warehouses",
    icon: <WarehouseRounded />,
    path: "/warehouses",
    permission: { module: "warehouse", action: "read" },
  },
  {
    text: "Customers",
    icon: <PeopleRounded />,
    path: "/customer",
    permission: { module: "customer", action: "read" },
  },
  {
    id: "mis-types",
    text: "MIS Types",
    icon: <AssignmentTurnedInRounded />,
    path: "/mis-types",
    permission: { module: "mistype", action: "read" },
  },
  {
    id: "account-types",
    text: "Account Types",
    icon: <AccountBalanceWalletRounded />,
    path: "/account-types",
    permission: { module: "accounttype", action: "read" },
  },
  {
    id: "chart-of-accounts",
    text: "Chart of Accounts",
    icon: <AccountBalanceRounded />,
    path: "/chart-of-accounts",
    permission: { module: "chartofaccount", action: "read" },
  },
  {
    text: "Item Group",
    icon: <InventoryRounded />,
    path: "/item-group",
    permission: null,
  },
  {
    text: "Items",
    icon: <InventoryRounded />,
    path: "/item",
    permission: null,
  },
  {
    text: "Item Type",
    icon: <InventoryRounded />,
    path: "/item-type",
    permission: null,
  },
  {
    text: "Class Master",
    icon: <CategoryRoundedIcon />,
    path: "/class",
    permission: null,
  },
  {
    text: "Department Master",
    icon: <CategoryRoundedIcon />,
    path: "/department",
    permission: null,
  },
  {
    text: "Vendor",
    icon: <GroupRounded />,
    path: "/vendor",
    permission: null,
  },
  {
    text: "Employee",
    icon: <GroupRounded />,
    path: "/employee",
    permission: null,
  },
  // {
  //   text: "Commodities",
  //   icon: <CategoryRoundedIcon />,
  //   path: "/commodity",
  //   permission: { module: "commodity", action: "read" },
  // },
  // {
  //   text: "Grades",
  //   icon: <GradeRoundedIcon />,
  //   path: "/grades",
  //   permission: { module: "grade", action: "read" },
  // },
  // {
  //   text: "Rent",
  //   icon: <LocalAtmRoundedIcon />,
  //   path: "/rent",
  //   permission: { module: "rent", action: "read" },
  // },
];

// ── Section: Transactions ──
const transactionItems: MenuItem[] = [
  {
    text: "Sales",
    icon: <ReceiptRoundedIcon />,
    children: [
      {
        text: "Sales Order",
        icon: <DescriptionRoundedIcon />,
        path: "/sales-order",
        permission: { module: "sales", action: "read" },
      },
      {
        text: "Delivery Challan",
        icon: <LocalShippingRoundedIcon />,
        path: "/delivery-challan",
        permission: { module: "sales", action: "read" },
      },
      {
        text: "Sales Return",
        icon: <SwapHorizIcon />,
        path: "/sales-return",
        permission: { module: "sales", action: "read" },
      },
    ],
  },
  {
    text: "Purchase",
    icon: <AccountBalanceRoundedIcon />,
    children: [
      {
        text: "Purchase Order",
        icon: <DescriptionRoundedIcon />,
        path: "/purchase-order",
        permission: { module: "purchase", action: "read" },
      },
      {
        text: "GRN",
        icon: <InventoryIcon />,
        path: "/grn",
        permission: { module: "grn", action: "read" },
      },
      {
        text: "Quality Inspection",
        icon: <AssessmentRoundedIcon />,
        path: "/quality-inspection",
        permission: { module: "quality_report", action: "read" },
      },
      {
        text: "Purchase Bill",
        icon: <ReceiptRoundedIcon />,
        path: "/purchase-invoice",
        permission: { module: "purchase_invoice", action: "read" },
      },
      {
        text: "Purchase Payment",
        icon: <PaymentIcon />,
        path: "/purchase-payment",
        permission: { module: "purchase_payment", action: "read" },
      },
      {
        text: "Purchase Return",
        icon: <SwapHorizIcon />,
        path: "/purchase-return",
        permission: { module: "purchase_return", action: "read" },
      },
      {
        text: "Item Fulfillment (Vendor Return)",
        icon: <LocalShippingRoundedIcon />,
        path: "/return-fulfillment",
        permission: { module: "purchase_return", action: "read" },
      },
      {
        text: "Debit Note (Vendor Credit)",
        icon: <ReceiptRoundedIcon />,
        path: "/debit-note",
        permission: { module: "purchase_return", action: "read" },
      },
    ],
  },
  {
    text: "Inventory",
    icon: <InventoryIcon />,
    path: "/inventory",
    permission: { module: "inventory", action: "read" },
  },
  // {
  //   text: "WHR",
  //   icon: <DescriptionRoundedIcon />,
  //   path: "/whr",
  //   permission: { module: "deposit", action: "read" },
  // },
  // {
  //   text: "Request Delivery",
  //   icon: <LocalShippingRoundedIcon />,
  //   path: "/request-delivery",
  //   permission: { module: "delivery", action: "read" },
  // },
];

// ── Section: O2C ──
// const o2cItems: MenuItem[] = [
//   {
//     text: "Inventory",
//     icon: <InventoryIcon />,
//     path: "/inventory",
//     permission: { module: "inventory", action: "read" },
//   },
//   {
//     text: "Insurance",
//     icon: <ShieldRoundedIcon />,
//     path: "/insurance",
//     permission: { module: "insurance", action: "read" },
//   },
//   {
//     text: "Bills",
//     icon: <ReceiptRoundedIcon />,
//     path: "/bill",
//     permission: { module: "bill", action: "read" },
//   },
//   {
//     text: "Invoice",
//     icon: <DescriptionRoundedIcon />,
//     path: "/invoice",
//     permission: { module: "invoice", action: "read" },
//   },
//   {
//     text: "Ledger",
//     icon: <AccountBalanceRoundedIcon />,
//     path: "/ledger",
//     permission: { module: "ledger", action: "read" },
//   },
//   {
//     text: "Vouchers",
//     icon: <AccountBalanceWalletRoundedIcon />,
//     path: "/vouchers",
//     permission: { module: "voucher", action: "read" },
//   },
// ];

const reportItems = [
  {
    text: "Daily Summary",
    icon: <SummarizeIcon />,
    path: "/reports/daily-summary",
    permission: { module: "reports", action: "read" },
  },
  {
    text: "Inward/Outward",
    icon: <SwapHorizIcon />,
    path: "/reports/inward-outward",
    permission: { module: "reports", action: "read" },
  },
  {
    text: "Stock Register",
    icon: <InventoryIcon />,
    path: "/reports/stock-register",
    permission: { module: "reports", action: "read" },
  },
  {
    text: "Warehouse Occupancy",
    icon: <StorageIcon />,
    path: "/reports/warehouse-occupancy",
    permission: { module: "reports", action: "read" },
  },
  // {
  //   text: "Rent Collection",
  //   icon: <ReceiptRoundedIcon />,
  //   path: "/reports/rent-collection-report",
  //   permission: { module: "reports", action: "read" },
  // },
  // {
  //   text: "Due Payment",
  //   icon: <ReceiptRoundedIcon />,
  //   path: "/reports/due-payment-report",
  //   permission: { module: "reports", action: "read" },
  // },
  // {
  //   text: "WHR Report",
  //   icon: <ReceiptRoundedIcon />,
  //   path: "/reports/whr-report",
  //   permission: { module: "reports", action: "read" },
  // },
];

// ── Light Sidebar Shared Styles ──
const navItemSx = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: "12px",
  mb: 0.45,
  py: 0.7,
  px: 1.1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  color: 'rgba(0,0,0,0.72)',
  fontWeight: 500,
  backgroundColor: 'transparent',
  minHeight: 40,
  "&.Mui-selected": {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: '#1D4ED8',
    fontWeight: 600,
    "& .MuiListItemIcon-root": {
      color: '#2563EB',
      "& .MuiSvgIcon-root": {
        color: '#2563EB',
        opacity: 1,
      },
    },
    "& .MuiListItemText-root .MuiTypography-root": {
      color: '#1D4ED8',
      fontWeight: 600,
    },
    "&:hover": {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    // Left accent bar for active item
    "&::before": {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '16%',
      bottom: '16%',
      width: '3px',
      borderRadius: '0 3px 3px 0',
      backgroundColor: '#2563EB',
    },
  },
  "&:hover": {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: 'rgba(0,0,0,0.87)',
    "& .MuiListItemIcon-root .MuiSvgIcon-root": {
      color: 'rgba(59, 130, 246, 0.8)',
    },
  },
  position: 'relative',
};

const sectionToggleSx = {
  ...navItemSx,
  width: '100%',
  color: 'rgba(0,0,0,0.87)',
  fontWeight: 700,
  backgroundColor: 'rgba(59, 130, 246, 0.06)',
  mb: 1,
  py: 0.75,
  px: 1.2,
  '&:hover': {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
};

const navIconSx = {
  minWidth: 34,
  "& .MuiSvgIcon-root": {
    fontSize: "1.3rem",
    color: 'rgba(55, 51, 51, 0.65)',
    transition: 'color 0.2s ease',
  },
};

const navTextSx = {
  "& .MuiTypography-root": {
    fontSize: "12px",
    fontWeight: 500,
    color: "inherit",
    letterSpacing: '0.01em',
  },
};

const sectionTextSx = {
  "& .MuiTypography-root": {
    fontSize: "13px",
    fontWeight: 700,
    color: "inherit",
    letterSpacing: '0.01em',
  },
};

const expandIconSx = {
  fontSize: "1.15rem",
  color: "rgba(255,255,255,0.75)",
};

// ── Helper to render a section ──
function isPathActive(path: string, pathname: string) {
  return (
    pathname === path ||
    (path !== '/' && pathname.startsWith(path + '/'))
  );
}

function renderSection(
  items: any[],
  location: any,
  filterFn: (item: any) => boolean,
  depth = 0,
  keyPrefix = ""
) {
  const filtered = items.filter(filterFn);
  if (filtered.length === 0) return null;
  return filtered.map((item: any, index: number) => (
    <ListItem
      key={`${keyPrefix || "item"}-${index}`}
      disablePadding
      sx={{ display: "block", px: 0.75, mb: 0.5 }}
    >
      <NavLink
        to={item.path}
        style={() => ({
          textDecoration: "none",
          color: "inherit",
        })}
      >
        <ListItemButton
          selected={item.path ? isPathActive(item.path, location.pathname) : false}
          sx={{ ...navItemSx, pl: 1.5 + depth * 1.5 }}
        >
          <ListItemIcon sx={navIconSx}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} sx={navTextSx} />
        </ListItemButton>
      </NavLink>
    </ListItem>
  ));
}

function isItemActive(item: MenuItem, pathname: string): boolean {
  if (item.path) {
    return pathname === item.path;
  }

  return !!item.children?.some((child) => isItemActive(child, pathname));
}

function isSectionActive(items: MenuItem[], pathname: string): boolean {
  return items.some((item) => isItemActive(item, pathname));
}

export default function MenuContent() {
  const location = useLocation();
  const { hasPermission, isAdmin } = usePermissions();
  const isReportsActive = location.pathname.startsWith("/reports");
  const [setupOpen, setSetupOpen] = useState(isSectionActive(setupItems, location.pathname));
  const [masterOpen, setMasterOpen] = useState(isSectionActive(masterItems, location.pathname));
  const [transactionsOpen, setTransactionsOpen] = useState(isSectionActive(transactionItems, location.pathname));
  const [salesOpen, setSalesOpen] = useState(isItemActive(transactionItems[0], location.pathname));
  const [purchaseOpen, setPurchaseOpen] = useState(isItemActive(transactionItems[1], location.pathname));
  // const [o2cOpen, setO2COpen] = useState(isSectionActive(o2cItems, location.pathname));
  const [reportsOpen, setReportsOpen] = useState(isReportsActive);
  const reportActiveRef = useRef(null);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const hasScrolled = useRef(false);
  const userScrolled = useRef(false);

  useEffect(() => {
    if (isSectionActive(setupItems, location.pathname)) {
      setSetupOpen(true);
    }
    if (isSectionActive(masterItems, location.pathname)) {
      setMasterOpen(true);
    }
    if (isSectionActive(transactionItems, location.pathname)) {
      setTransactionsOpen(true);
    }
    if (isItemActive(transactionItems[0], location.pathname)) {
      setSalesOpen(true);
    }
    if (isItemActive(transactionItems[1], location.pathname)) {
      setPurchaseOpen(true);
    }
    if (location.pathname.startsWith("/reports")) {
      setReportsOpen(true);
    }
    hasScrolled.current = false;
  }, [location.pathname]);

  useEffect(() => {
    const node = navScrollRef.current;
    if (!node) return;

    const handleScroll = () => {
      userScrolled.current = true;
    };

    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);

  const canShow = (item: any) => {
    if (!item.permission) return true;
    if (isAdmin) return true;
    return hasPermission(item.permission);
  };

  // Auto-scroll to the active report sub-item when no manual scroll has occurred.
  useEffect(() => {
    if (
      isReportsActive &&
      reportsOpen &&
      reportActiveRef.current &&
      !hasScrolled.current &&
      !userScrolled.current
    ) {
      const delay = 400;
      setTimeout(() => {
        (reportActiveRef.current as any).scrollIntoView({ block: "nearest" });
        hasScrolled.current = true;
      }, delay);
    }
  }, [location.pathname, isReportsActive, reportsOpen]);

  const handleReportsClick = () => {
    if (!isReportsActive) {
      setReportsOpen(!reportsOpen);
    }
  };

  const filteredReportItems = reportItems.filter(canShow);

  return (
    <Stack
      ref={navScrollRef}
      sx={{
        flexGrow: 1,
        px: 0.5,
        pt: 0.5,
        pb: 2,
        justifyContent: "space-between",
        overflowY: "auto",
      }}
    >
      <List dense sx={{ flexGrow: 1 }}>
        {/* ── Dashboard (Home) ── */}
        <ListItem disablePadding sx={{ display: "block", px: 0.75, mb: 1.4 }}>
          <NavLink
            to="/dashboard"
            style={() => ({
              textDecoration: "none",
              color: "inherit",
            })}
          >
            <ListItemButton
              selected={location.pathname === "/dashboard"}
              sx={navItemSx}
            >
              <ListItemIcon sx={navIconSx}>
                <HomeRounded />
              </ListItemIcon>
              <ListItemText primary="Dashboard" sx={navTextSx} />
            </ListItemButton>
          </NavLink>
        </ListItem>

        {/* ── Setup Section ── */}
        {setupItems.filter(canShow).length > 0 && (
          <>
            {/* <Typography sx={sectionLabelSx}>Setup</Typography> */}
            <ListItem disablePadding sx={{ display: "block", px: 0.75, mb: 1.2 }}>
              <ListItemButton
                onClick={() => setSetupOpen(!setupOpen)}
                sx={sectionToggleSx}
              >
                <ListItemIcon sx={navIconSx}><SettingsRounded /></ListItemIcon>
                <ListItemText primary="Setup" sx={sectionTextSx} />
                {setupOpen ? (
                  <ExpandLess sx={expandIconSx} />
                ) : (
                  <ExpandMore sx={expandIconSx} />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={setupOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderSection(setupItems, location, canShow, 1, "setup")}
              </List>
            </Collapse>
          </>
        )}

        {/* ── Master Section ── */}
        {masterItems.filter(canShow).length > 0 && (
          <>
            {/* <Typography sx={sectionLabelSx}>Master</Typography> */}
            <ListItem disablePadding sx={{ display: "block", px: 0.75, mb: 1.2 }}>
              <ListItemButton
                onClick={() => setMasterOpen(!masterOpen)}
                sx={sectionToggleSx}
              >
                <ListItemIcon sx={navIconSx}><BusinessRounded /></ListItemIcon>
                <ListItemText primary="Master Data" sx={sectionTextSx} />
                {masterOpen ? (
                  <ExpandLess sx={expandIconSx} />
                ) : (
                  <ExpandMore sx={expandIconSx} />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={masterOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderSection(masterItems, location, canShow, 1, "master")}
              </List>
            </Collapse>
          </>
        )}

        {/* ── Transactions Section ── */}
        {transactionItems.filter(canShow).length > 0 && (
          <>
            {/* <Typography sx={sectionLabelSx}>Transactions</Typography> */}
            <ListItem disablePadding sx={{ display: "block", px: 0.75, mb: 1.2 }}>
              <ListItemButton
                onClick={() => setTransactionsOpen(!transactionsOpen)}
                sx={sectionToggleSx}
              >
                <ListItemIcon sx={navIconSx}><ReceiptRounded /></ListItemIcon>
                <ListItemText primary="Transactions" sx={sectionTextSx} />
                {transactionsOpen ? (
                  <ExpandLess sx={expandIconSx} />
                ) : (
                  <ExpandMore sx={expandIconSx} />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={transactionsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {transactionItems.filter(canShow).map((item, index) => {
                  const isActive = isItemActive(item, location.pathname);
                  if (item.children) {
                    const isSalesGroup = item.text === "Sales";
                    const isOpen = isSalesGroup ? salesOpen : purchaseOpen;
                    const toggle = () =>
                      isSalesGroup
                        ? setSalesOpen(!salesOpen)
                        : setPurchaseOpen(!purchaseOpen);

                    return (
                      <div key={index}>
                        <ListItem disablePadding sx={{ display: "block", px: 0.75 }}>
                          <ListItemButton
                            onClick={toggle}
                            selected={isActive}
                            sx={{ ...sectionToggleSx, pl: 2.5 }}
                          >
                            <ListItemIcon sx={navIconSx}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} sx={sectionTextSx} />
                            {isOpen ? (
                              <ExpandLess sx={expandIconSx} />
                            ) : (
                              <ExpandMore sx={expandIconSx} />
                            )}
                          </ListItemButton>
                        </ListItem>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {renderSection(item.children, location, canShow, 2, item.text.toLowerCase())}
                          </List>
                        </Collapse>
                      </div>
                    );
                  }

                  return renderSection([item], location, canShow, 1, `transaction-${index}`);
                })}
              </List>
            </Collapse>
          </>
        )}

        {/* ── O2C Section ── */}
        {/* {o2cItems.filter(canShow).length > 0 && (
          <>
            <Typography sx={sectionLabelSx}>O2C</Typography>
            <ListItem disablePadding sx={{ display: "block", px: 0.75 }}>
              <ListItemButton
                onClick={() => setO2COpen(!o2cOpen)}
                sx={navItemSx}
              >
                <ListItemIcon sx={navIconSx}><AccountBalanceWalletRoundedIcon /></ListItemIcon>
                <ListItemText primary="O2C" sx={navTextSx} />
                {o2cOpen ? (
                  <ExpandLess sx={expandIconSx} />
                ) : (
                  <ExpandMore sx={expandIconSx} />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={o2cOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderSection(o2cItems, location, canShow, 1, "o2c")}
              </List>
            </Collapse>
          </>
        )} */}

        {/* ── Reports Section with Collapsible ── */}
        {(isAdmin || hasPermission({ module: "reports", action: "read" })) && (
          <>
            {/* <Typography sx={sectionLabelSx}>Analytics</Typography> */}
            <ListItem disablePadding sx={{ display: "block", px: 0.75, mb: 1.2 }}>
              <ListItemButton
                onClick={handleReportsClick}
                selected={isReportsActive}
                sx={sectionToggleSx}
              >
                <ListItemIcon sx={navIconSx}>
                  <AssessmentRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Reports" sx={sectionTextSx} />
                {reportsOpen ? (
                  <ExpandLess sx={expandIconSx} />
                ) : (
                  <ExpandMore sx={expandIconSx} />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {filteredReportItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem
                      key={index}
                      ref={isActive ? reportActiveRef : null}
                      disablePadding
                      sx={{ display: "block", px: 0.75 }}
                    >
                      <NavLink
                        to={item.path}
                        style={() => ({
                          textDecoration: "none",
                          color: "inherit",
                        })}
                      >
                        <ListItemButton
                          sx={{ ...navItemSx, pl: 4 }}
                          selected={isActive}
                        >
                          <ListItemIcon sx={navIconSx}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.text} sx={navTextSx} />
                        </ListItemButton>
                      </NavLink>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </>
        )}
      </List>
    </Stack>
  );
}
