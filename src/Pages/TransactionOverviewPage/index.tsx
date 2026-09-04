import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Receipt,
  Inventory2,
  AccountBalance,
  Description,
  TrendingUp,
  Refresh,
  FilterList,
  Search as SearchIcon,
  OpenInNew,
  ArrowForward,
  CheckCircle,
  HourglassEmpty,
  Payment,
  SwapHoriz,
  Visibility,
  FileDownload,
  LocalShipping,
  AssignmentTurnedIn,
} from "@mui/icons-material";

import AppLayout from "../../components/Layout/AppLayout";
import {
  useGetTransactionSummaryQuery,
  useGetTransactionListQuery,
  type UnifiedTransactionRow,
} from "../../RTK/services/transactionOverviewApi";
import { useGetPurchaseOrdersQuery } from "../../RTK/services/purchaseApi";
import { useGetDebitNotesQuery } from "../../RTK/services/debitNoteApi";
import { useGetVendorRefundsQuery } from "../../RTK/services/vendorRefundApi";

type TransactionTab = "ALL" | "PURCHASES" | "SALES" | "WAREHOUSE" | "FINANCIALS";

export default function TransactionOverviewPage() {
  const navigate = useNavigate();

  // Filters & State
  const [activeTab, setActiveTab] = useState<TransactionTab>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // RTK Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetTransactionSummaryQuery();

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useGetTransactionListQuery({
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: searchTerm.trim() ? searchTerm.trim() : undefined,
    page,
    limit,
  });

  // Fallback direct queries for local / simulated resilience
  const { data: directPOs } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 });
  const { data: directCredits } = useGetDebitNotesQuery({ page: 1, limit: 50 });
  const { data: directRefunds } = useGetVendorRefundsQuery({ page: 1, limit: 50 });

  // Handle Refresh
  const handleRefresh = () => {
    refetchSummary();
    refetchList();
  };

  // Extract Summary or Compute Fallback
  const kpis = useMemo(() => {
    if (summaryData?.result?.kpis) {
      return summaryData.result.kpis;
    }
    // Fallback computation from direct endpoints if backend route is in sync
    const poRows = directPOs?.result?.rows || directPOs?.data || [];
    const vcRows = directCredits?.result?.rows || directCredits?.data || [];
    const vrRows = directRefunds?.result?.rows || directRefunds?.data || [];

    const totalCreditsAmt = vcRows.reduce((acc: number, c: any) => acc + Number(c.totalAmount || c.total_amount || c.amount || 0), 0);
    const totalRefundsAmt = vrRows.reduce((acc: number, r: any) => acc + Number(r.refundAmount || r.refund_amount || 0), 0);

    return {
      purchases: {
        totalPOs: poRows.length || 0,
        openPOs: poRows.filter((p: any) => !["CLOSED", "COMPLETED", "CANCELLED"].includes(String(p.status).toUpperCase())).length || 0,
        totalGRNs: 0,
        totalBills: 0,
        totalBilledAmount: 0,
        totalPaidAmount: 0,
        unpaidBillAmount: 0,
        totalReturns: 0,
        totalCredits: vcRows.length || 0,
        totalCreditsAmount: totalCreditsAmt,
        totalRefunds: vrRows.length || 0,
        totalRefundsAmount: totalRefundsAmt,
      },
      sales: {
        totalSOs: 0,
        openSOs: 0,
        totalSOAmount: 0,
        totalChallans: 0,
        totalSalesReturns: 0,
      },
      finance: {
        totalJournalEntries: 0,
        totalDebitAmount: 0,
      },
    };
  }, [summaryData, directPOs, directCredits, directRefunds]);

  // Unified Rows for the table (with tab filtering)
  const rows: UnifiedTransactionRow[] = useMemo(() => {
    let sourceRows = listData?.result?.rows || [];

    // If backend list empty, synthesize from direct queries as fallback
    if (sourceRows.length === 0) {
      const fallbackList: UnifiedTransactionRow[] = [];

      const poRows = directPOs?.result?.rows || directPOs?.data || [];
      poRows.forEach((po: any) => {
        fallbackList.push({
          id: `PO-${po.id}`,
          rawId: po.id,
          transactionType: "Purchase Order",
          transactionTypeCode: "PO",
          docNumber: po.purchaseNo || `PO-#${po.id}`,
          date: po.purchaseDate || po.createdAt || new Date().toISOString(),
          entityName: po.vendor?.company_name || po.vendor?.vendor_name || `Vendor #${po.vendor_id || ""}`,
          entityType: "Vendor",
          subsidiaryName: po.subsidiary?.name || "—",
          amount: undefined,
          status: po.status || "OPEN",
          viewUrl: `/purchase-order?id=${po.id}&action=view`,
        });
      });

      const vcRows = directCredits?.result?.rows || directCredits?.data || [];
      vcRows.forEach((vc: any) => {
        fallbackList.push({
          id: `VC-${vc.id}`,
          rawId: vc.id,
          transactionType: "Vendor Credit",
          transactionTypeCode: "VC",
          docNumber: vc.creditNoteNumber || `VC-#${vc.id}`,
          date: vc.creditDate || vc.createdAt || new Date().toISOString(),
          entityName: vc.vendor?.company_name || vc.vendor?.vendor_name || `Vendor #${vc.vendorId || ""}`,
          entityType: "Vendor",
          subsidiaryName: vc.subsidiary?.name || "—",
          amount: Number(vc.totalAmount || vc.total_amount || 0),
          currency: vc.currency || "INR",
          status: vc.status || "OPEN",
          viewUrl: `/debit-note?id=${vc.id}&action=view`,
        });
      });

      const vrRows = directRefunds?.result?.rows || directRefunds?.data || [];
      vrRows.forEach((vr: any) => {
        fallbackList.push({
          id: `VR-${vr.id}`,
          rawId: vr.id,
          transactionType: "Vendor Refund",
          transactionTypeCode: "VR",
          docNumber: vr.refundNumber || `VR-#${vr.id}`,
          date: vr.refundDate || vr.createdAt || new Date().toISOString(),
          entityName: vr.vendor?.company_name || vr.vendor?.vendor_name || `Vendor #${vr.vendorId || ""}`,
          entityType: "Vendor",
          subsidiaryName: "—",
          amount: Number(vr.refundAmount || vr.refund_amount || 0),
          currency: vr.currency || "INR",
          status: vr.status || "COMPLETED",
          viewUrl: `/vendor-refund?id=${vr.id}&action=view`,
        });
      });

      sourceRows = fallbackList;
    }

    // Filter by Tab
    if (activeTab === "PURCHASES") {
      return sourceRows.filter((r) => ["PO", "GRN", "BILL", "PAY", "VC", "VR", "PR"].includes(r.transactionTypeCode));
    }
    if (activeTab === "SALES") {
      return sourceRows.filter((r) => ["SO", "DC", "SR", "INV"].includes(r.transactionTypeCode));
    }
    if (activeTab === "WAREHOUSE") {
      return sourceRows.filter((r) => ["GRN", "DC", "WHR", "GP"].includes(r.transactionTypeCode));
    }
    if (activeTab === "FINANCIALS") {
      return sourceRows.filter((r) => ["BILL", "PAY", "VC", "VR", "JE", "VOUCHER"].includes(r.transactionTypeCode));
    }

    return sourceRows;
  }, [listData, activeTab, directPOs, directCredits, directRefunds]);

  // Status Badge Colors (NetSuite Enterprise Theme)
  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (["PAID", "COMPLETED", "DELIVERED", "APPROVED"].includes(s)) {
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    }
    if (["POSTED", "CONFIRMED", "RECEIVED", "AUTHORIZED", "DISPATCHED"].includes(s)) {
      return "bg-sky-50 text-sky-700 border-sky-300";
    }
    if (["OPEN", "PENDING_RECEIPT", "PARTIALLY_RECEIVED", "PARTIAL_PAID", "QC_PENDING"].includes(s)) {
      return "bg-amber-50 text-amber-800 border-amber-300";
    }
    if (["CANCELLED", "VOID", "REJECTED"].includes(s)) {
      return "bg-rose-50 text-rose-700 border-rose-300";
    }
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  // Transaction Type Icon & Pill
  const getTypeChip = (typeCode: string, typeName: string) => {
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
    let icon = <Receipt className="!w-3 !h-3 mr-1" />;

    switch (typeCode) {
      case "PO":
        colorClass = "bg-sky-50 text-sky-800 border-sky-200";
        icon = <Receipt className="!w-3 !h-3 mr-1 text-sky-600" />;
        break;
      case "GRN":
        colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        icon = <AssignmentTurnedIn className="!w-3 !h-3 mr-1 text-emerald-600" />;
        break;
      case "BILL":
        colorClass = "bg-blue-50 text-blue-800 border-blue-200";
        icon = <Description className="!w-3 !h-3 mr-1 text-blue-600" />;
        break;
      case "PAY":
        colorClass = "bg-teal-50 text-teal-800 border-teal-200";
        icon = <Payment className="!w-3 !h-3 mr-1 text-teal-600" />;
        break;
      case "VC":
        colorClass = "bg-amber-50 text-amber-800 border-amber-200";
        icon = <AccountBalance className="!w-3 !h-3 mr-1 text-amber-600" />;
        break;
      case "VR":
        colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        icon = <SwapHoriz className="!w-3 !h-3 mr-1 text-emerald-600" />;
        break;
      case "PR":
        colorClass = "bg-rose-50 text-rose-800 border-rose-200";
        icon = <Receipt className="!w-3 !h-3 mr-1 text-rose-600" />;
        break;
      case "SO":
        colorClass = "bg-purple-50 text-purple-800 border-purple-200";
        icon = <Receipt className="!w-3 !h-3 mr-1 text-purple-600" />;
        break;
      case "DC":
        colorClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
        icon = <LocalShipping className="!w-3 !h-3 mr-1 text-indigo-600" />;
        break;
      case "JE":
        colorClass = "bg-slate-100 text-slate-800 border-slate-300";
        icon = <AccountBalance className="!w-3 !h-3 mr-1 text-slate-600" />;
        break;
      default:
        break;
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}>
        {icon}
        {typeName}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-[1800px] mx-auto pb-8">
        {/* ── HEADER ACTION & TITLE BAR (NetSuite Style) ── */}
        <div className="bg-white border border-slate-300 rounded-xs px-4 py-3 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Transactions Overview</h1>
              <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Consolidated Register
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated transactions audit, lifecycle management, and status reporting across P2P, O2C, Logistics, and General Ledger.
            </p>
          </div>

          {/* Quick Create Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleRefresh}
              title="Refresh register"
              className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Refresh className={`!w-3.5 !h-3.5 ${isListFetching ? "animate-spin text-sky-600" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/purchase-order?action=new"
              className="h-7 px-2.5 bg-[#244b5a] hover:bg-[#1b3a47] text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ New PO</span>
            </Link>

            <Link
              to="/grn?action=new"
              className="h-7 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ New GRN</span>
            </Link>

            <Link
              to="/purchase-invoice?action=new"
              className="h-7 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ New Bill</span>
            </Link>

            <Link
              to="/debit-note?action=new"
              className="h-7 px-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ Vendor Credit</span>
            </Link>

            <Link
              to="/vendor-refund?action=new"
              className="h-7 px-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ Vendor Refund</span>
            </Link>

            <Link
              to="/sales-order?action=new"
              className="h-7 px-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xs text-xs font-semibold flex items-center space-x-1 transition-colors no-underline cursor-pointer"
            >
              <span>+ New Sales Order</span>
            </Link>
          </div>
        </div>

        {/* ── KPI METRICS STRIP (6 Color Portlets) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Portlet 1: Open Purchase Orders */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-sky-500">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Open POs</span>
              <Receipt className="!w-4 !h-4 text-sky-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading ? "—" : kpis.purchases.openPOs}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Orders: <strong className="text-slate-700">{kpis.purchases.totalPOs}</strong>
              </div>
            </div>
            <Link
              to="/purchase-order"
              className="mt-2 text-[10px] text-sky-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Purchase Orders</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>

          {/* Portlet 2: Unpaid Purchase Bills */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-blue-600">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Unpaid AP Bills</span>
              <Description className="!w-4 !h-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading
                  ? "—"
                  : `₹${Number(kpis.purchases.unpaidBillAmount || 0).toLocaleString("en-IN")}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Billed: <strong className="text-slate-700">₹{Number(kpis.purchases.totalBilledAmount || 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>
            <Link
              to="/purchase-invoice"
              className="mt-2 text-[10px] text-blue-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Invoices</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>

          {/* Portlet 3: Disbursements / Paid */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-emerald-600">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Disbursements</span>
              <Payment className="!w-4 !h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading
                  ? "—"
                  : `₹${Number(kpis.purchases.totalPaidAmount || 0).toLocaleString("en-IN")}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Paid to Vendors
              </div>
            </div>
            <Link
              to="/purchase-payment"
              className="mt-2 text-[10px] text-emerald-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Payments</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>

          {/* Portlet 4: Vendor Credits & Refunds */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-amber-600">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Vendor Credits</span>
              <AccountBalance className="!w-4 !h-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading
                  ? "—"
                  : `₹${Number(kpis.purchases.totalCreditsAmount || 0).toLocaleString("en-IN")}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Refunds: <strong className="text-slate-700">₹{Number(kpis.purchases.totalRefundsAmount || 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>
            <Link
              to="/debit-note"
              className="mt-2 text-[10px] text-amber-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Credits</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>

          {/* Portlet 5: Sales Orders (O2C) */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-purple-600">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Sales Orders</span>
              <TrendingUp className="!w-4 !h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading ? "—" : kpis.sales.totalSOs}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Value: <strong className="text-slate-700">₹{Number(kpis.sales.totalSOAmount || 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>
            <Link
              to="/sales-order"
              className="mt-2 text-[10px] text-purple-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Sales Orders</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>

          {/* Portlet 6: Goods Receipts & Returns */}
          <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex flex-col justify-between border-t-4 border-t-teal-600">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
              <span>Receipts & Challans</span>
              <Inventory2 className="!w-4 !h-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-800">
                {isSummaryLoading
                  ? "—"
                  : kpis.purchases.totalGRNs + kpis.sales.totalChallans}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                GRNs: {kpis.purchases.totalGRNs} • Challans: {kpis.sales.totalChallans}
              </div>
            </div>
            <Link
              to="/grn"
              className="mt-2 text-[10px] text-teal-700 hover:underline font-semibold flex items-center space-x-1 no-underline"
            >
              <span>View Receipts</span>
              <ArrowForward className="!w-3 !h-3" />
            </Link>
          </div>
        </div>

        {/* ── WORKFLOW LIFECYCLE PROGRESS RIBBONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* P2P Flow Visual */}
          <div className="bg-white border border-slate-300 rounded-xs p-3.5 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Procure-to-Pay (P2P) Lifecycle Sequence</span>
              </span>
              <span className="text-[10px] text-slate-400 normal-case">Standard NetSuite Workflow</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2 text-xs">
              <Link to="/purchase-order" className="text-center font-medium text-slate-700 hover:text-sky-700 no-underline">
                <div className="font-bold text-sky-800">1. PO</div>
                <div className="text-[10px] text-slate-500">Purchase Order</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/grn" className="text-center font-medium text-slate-700 hover:text-emerald-700 no-underline">
                <div className="font-bold text-emerald-800">2. GRN</div>
                <div className="text-[10px] text-slate-500">Goods Receipt</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/purchase-invoice" className="text-center font-medium text-slate-700 hover:text-blue-700 no-underline">
                <div className="font-bold text-blue-800">3. Bill</div>
                <div className="text-[10px] text-slate-500">Vendor Invoice</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/purchase-payment" className="text-center font-medium text-slate-700 hover:text-teal-700 no-underline">
                <div className="font-bold text-teal-800">4. Payment</div>
                <div className="text-[10px] text-slate-500">Disbursement</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/debit-note" className="text-center font-medium text-slate-700 hover:text-amber-700 no-underline">
                <div className="font-bold text-amber-800">5. Credit</div>
                <div className="text-[10px] text-slate-500">Debit Note</div>
              </Link>
            </div>
          </div>

          {/* O2C Flow Visual */}
          <div className="bg-white border border-slate-300 rounded-xs p-3.5 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Order-to-Cash (O2C) Lifecycle Sequence</span>
              </span>
              <span className="text-[10px] text-slate-400 normal-case">Sales Fulfillment</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2 text-xs">
              <Link to="/sales-order" className="text-center font-medium text-slate-700 hover:text-purple-700 no-underline">
                <div className="font-bold text-purple-800">1. Sales Order</div>
                <div className="text-[10px] text-slate-500">Booking</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/delivery-challan" className="text-center font-medium text-slate-700 hover:text-indigo-700 no-underline">
                <div className="font-bold text-indigo-800">2. Challan</div>
                <div className="text-[10px] text-slate-500">Dispatch</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/invoice" className="text-center font-medium text-slate-700 hover:text-blue-700 no-underline">
                <div className="font-bold text-blue-800">3. Invoice</div>
                <div className="text-[10px] text-slate-500">Billing</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/ledger/customer" className="text-center font-medium text-slate-700 hover:text-emerald-700 no-underline">
                <div className="font-bold text-emerald-800">4. Settlement</div>
                <div className="text-[10px] text-slate-500">Collection</div>
              </Link>
              <span className="text-slate-400 font-bold">→</span>
              <Link to="/sales-return" className="text-center font-medium text-slate-700 hover:text-rose-700 no-underline">
                <div className="font-bold text-rose-800">5. Return</div>
                <div className="text-[10px] text-slate-500">Credit Memo</div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── UNIFIED TRANSACTIONS REGISTER (DATAGRID) ── */}
        <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-hidden">
          {/* View Filter Ribbon */}
          <div className="bg-[#f8fafc] border-b border-slate-300 px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
            {/* Tab Switches */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {[
                { key: "ALL", label: "All Transactions" },
                { key: "PURCHASES", label: "Purchases (P2P)" },
                { key: "SALES", label: "Sales (O2C)" },
                { key: "WAREHOUSE", label: "Warehouse & Receipts" },
                { key: "FINANCIALS", label: "Financials & Accounting" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as TransactionTab);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-[#244b5a] text-white"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Record Counter */}
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{rows.length}</strong> matching transaction records
            </div>
          </div>

          {/* Secondary Filter Controls */}
          <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <SearchIcon className="!w-4 !h-4 absolute left-2.5 top-1.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search document #, entity, status..."
                className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Type Dropdown */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-7 border border-slate-300 rounded-xs px-2 text-xs bg-white focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="ALL">All Types</option>
                <option value="PO">Purchase Orders (PO)</option>
                <option value="GRN">Goods Receipt (GRN)</option>
                <option value="BILL">Purchase Bills</option>
                <option value="PAYMENT">Purchase Payments</option>
                <option value="VENDOR_CREDIT">Vendor Credits (VC)</option>
                <option value="VENDOR_REFUND">Vendor Refunds (VR)</option>
                <option value="RETURN">Purchase Returns</option>
                <option value="SALES_ORDER">Sales Orders (SO)</option>
                <option value="CHALLAN">Delivery Challans (DC)</option>
                <option value="JOURNAL">Journal Entries (JE)</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-7 border border-slate-300 rounded-xs px-2 text-xs bg-white focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="POSTED">Posted</option>
                <option value="RECEIVED">Received</option>
                <option value="PAID">Paid</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Clear filters */}
            {(typeFilter !== "ALL" || statusFilter !== "ALL" || searchTerm) && (
              <button
                onClick={() => {
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  setPage(1);
                }}
                className="text-xs text-sky-700 hover:underline font-semibold ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* DataGrid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-2.5 border-r border-slate-200">DOCUMENT #</th>
                  <th className="p-2.5 border-r border-slate-200">TRANSACTION TYPE</th>
                  <th className="p-2.5 border-r border-slate-200">DATE</th>
                  <th className="p-2.5 border-r border-slate-200">ENTITY (VENDOR / CUSTOMER)</th>
                  <th className="p-2.5 border-r border-slate-200">SUBSIDIARY</th>
                  <th className="p-2.5 border-r border-slate-200 text-right">AMOUNT</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">STATUS</th>
                  <th className="p-2.5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isListLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      Loading consolidated transaction register...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      No transaction records found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={`${row.id}-${idx}`}
                      className="hover:bg-sky-50/60 transition-colors group"
                    >
                      {/* Document # */}
                      <td className="p-2.5 border-r border-slate-200 font-mono font-semibold text-sky-800">
                        <Link
                          to={row.viewUrl}
                          className="hover:underline flex items-center space-x-1 text-sky-700 font-bold no-underline"
                        >
                          <span>{row.docNumber}</span>
                        </Link>
                      </td>

                      {/* Transaction Type */}
                      <td className="p-2.5 border-r border-slate-200">
                        {getTypeChip(row.transactionTypeCode, row.transactionType)}
                      </td>

                      {/* Date */}
                      <td className="p-2.5 border-r border-slate-200 text-slate-600 font-medium">
                        {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                      </td>

                      {/* Entity */}
                      <td className="p-2.5 border-r border-slate-200 font-medium text-slate-800 max-w-[220px] truncate">
                        {row.entityName || "—"}
                      </td>

                      {/* Subsidiary */}
                      <td className="p-2.5 border-r border-slate-200 text-slate-600">
                        {row.subsidiaryName || "—"}
                      </td>

                      {/* Amount */}
                      <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        {row.amount !== undefined && row.amount !== null
                          ? `₹${Number(row.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="p-2.5 border-r border-slate-200 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-2.5 text-center">
                        <Link
                          to={row.viewUrl}
                          className="inline-flex items-center space-x-1 text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[11px] font-semibold border border-slate-300 no-underline cursor-pointer"
                        >
                          <Visibility className="!w-3.5 !h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Ribbon */}
          <div className="bg-[#f8fafc] border-t border-slate-300 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-6 border border-slate-300 rounded bg-white px-1.5 text-xs font-semibold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>records per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-6 px-2.5 bg-white border border-slate-300 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-bold text-slate-800">Page {page}</span>
              <button
                disabled={rows.length < limit}
                onClick={() => setPage((p) => p + 1)}
                className="h-6 px-2.5 bg-white border border-slate-300 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
