import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  Add,
  Search,
  List as ListIcon,
  GetApp,
  Print,
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetChartOfAccountsQuery,
  useGetSingleChartOfAccountQuery,
  useUpdateChartOfAccountMutation,
} from "../RTK/services/chartOfAccountApi";
import { useGetAccountTypesQuery } from "../RTK/services/accountTypeApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface ChartType {
  id?: number;
  account_number: string;
  account_name: string;
  account_type_id: number | string;
  subsidiary_id: number | string;
  parent_account_number?: string | null;
  currency_id: number | string;
  isActive?: boolean;
}

const ChartOfAccountComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showInactives, setShowInactives] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // RTK Queries
  const { data: chartData, isLoading: isChartLoading } = useGetChartOfAccountsQuery();
  const { data: singleAccountData, isLoading: isSingleAccountLoading } = useGetSingleChartOfAccountQuery(selectedAccountId!, {
    skip: !selectedAccountId || viewMode !== "view",
  });
  const { data: accountTypesData } = useGetAccountTypesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: currenciesData } = useGetCurrenciesQuery();

  const [createChart, { isLoading: isCreating }] = useCreateChartOfAccountMutation();
  const [updateChart, { isLoading: isUpdating }] = useUpdateChartOfAccountMutation();
  const [deleteChart] = useDeleteChartOfAccountMutation();

  const rawAccounts = Array.isArray(chartData?.result)
    ? chartData.result
    : Array.isArray(chartData?.data)
    ? chartData.data
    : Array.isArray(chartData)
    ? chartData
    : [];

  const accountTypes = Array.isArray(accountTypesData?.result)
    ? accountTypesData.result
    : Array.isArray(accountTypesData?.data)
    ? accountTypesData.data
    : Array.isArray(accountTypesData)
    ? accountTypesData
    : [];

  const rawSubsidiaries = Array.isArray(subsidiariesData?.result)
    ? subsidiariesData.result
    : Array.isArray(subsidiariesData?.data)
    ? subsidiariesData.data
    : Array.isArray(subsidiariesData)
    ? subsidiariesData
    : [];

  const currencies = Array.isArray(currenciesData?.result)
    ? currenciesData.result
    : Array.isArray(currenciesData?.data)
    ? currenciesData.data
    : Array.isArray(currenciesData)
    ? currenciesData
    : [];

  const formik = useFormik<ChartType>({
    initialValues: {
      account_number: "",
      account_name: "",
      account_type_id: "",
      subsidiary_id: "",
      parent_account_number: "",
      currency_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      account_number: Yup.string()
        .min(1, "Account number is required")
        .max(100)
        .required("Account number is required"),
      account_name: Yup.string()
        .min(1, "Account name is required")
        .max(200)
        .required("Account name is required"),
      account_type_id: Yup.number().required("Select account type"),
      subsidiary_id: Yup.mixed().optional().nullable(),
      currency_id: Yup.number().required("Select currency"),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          account_number: values.account_number,
          account_name: values.account_name,
          account_type_id: Number(values.account_type_id),
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          parent_account_number: values.parent_account_number || null,
          currency_id: Number(values.currency_id),
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("chartofaccount")) {
            toast.error("You do not have permission to update chart of accounts");
            return;
          }
          const response = await updateChart({ id: editId, payload }).unwrap();
          toast.success(response.message || "Account updated successfully");
        } else {
          if (!canCreate("chartofaccount")) {
            toast.error("You do not have permission to create chart of accounts");
            return;
          }
          const response = await createChart(payload).unwrap();
          toast.success(response.message || "Account created successfully");
        }

        formik.resetForm();
        setViewMode("list");
        setIsEdit(false);
        setSearchParams({});
      } catch (error: any) {
        toast.error(error?.data?.message || error?.message || "Something went wrong");
      }
    },
  });

  // URL search parameter page routing
  useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlId) {
      const idNum = Number(urlId);
      setSelectedAccountId(idNum);

      if (urlAction === "edit") {
        const acc = rawAccounts.find((a: any) => a.id === idNum);
        if (acc) {
          setSelectedAccount(acc);
          formik.setValues({
            account_number: acc.account_number || "",
            account_name: acc.account_name || "",
            account_type_id: acc.account_type_id || acc.accountType?.id || "",
            subsidiary_id: acc.subsidiary_id || acc.subsidiary?.id || "",
            parent_account_number: acc.parent_account_number || "",
            currency_id: acc.currency_id || acc.currency?.id || "",
            isActive: acc.isActive ?? true,
          });
          setEditId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const accFallback = rawAccounts.find((a: any) => a.id === idNum);
        if (accFallback) {
          setSelectedAccount(accFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditId(null);
        setSelectedAccount(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedAccountId(null);
    }
  }, [searchParams, rawAccounts.length]);

  const handleView = (id: number) => {
    setSelectedAccountId(id);
    const acc = rawAccounts.find((a: any) => a.id === id);
    if (acc) setSelectedAccount(acc);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("chartofaccount")) {
      toast.error("You do not have permission to edit chart of accounts");
      return;
    }
    setSelectedAccountId(id);
    const acc = rawAccounts.find((a: any) => a.id === id);
    if (acc) {
      setSelectedAccount(acc);
      formik.setValues({
        account_number: acc.account_number || "",
        account_name: acc.account_name || "",
        account_type_id: acc.account_type_id || acc.accountType?.id || "",
        subsidiary_id: acc.subsidiary_id || acc.subsidiary?.id || "",
        parent_account_number: acc.parent_account_number || "",
        currency_id: acc.currency_id || acc.currency?.id || "",
        isActive: acc.isActive ?? true,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("chartofaccount")) {
      toast.error("You do not have permission to delete chart of accounts");
      return;
    }
    try {
      const response = await deleteChart(id).unwrap();
      toast.success(response.message || "Account deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const handleAddAccount = () => {
    if (!canCreate("chartofaccount")) {
      toast.error("You do not have permission to create chart of accounts");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditId(null);
    setSelectedAccount(null);
    setSelectedAccountId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawAccounts.length === 0) {
      toast.error("No accounts to export");
      return;
    }
    const headers = ["Internal ID", "Number", "Account Name", "Type", "Currency", "Subsidiary", "Status"];
    const rows = rawAccounts.map((a: any) => [
      a.id,
      `"${a.account_number || ""}"`,
      `"${a.account_name || ""}"`,
      `"${a.accountType?.account_type_name || ""}"`,
      `"${a.currency?.currency_name || ""}"`,
      `"${a.subsidiary?.subsidiary_name || "N/A"}"`,
      a.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Chart_Of_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Chart of Accounts exported as CSV");
  };

  const filteredAccounts = rawAccounts.filter((acc: any) => {
    if (selectedTypeFilter !== "all" && String(acc.account_type_id) !== selectedTypeFilter) return false;
    if (!showInactives && acc.isActive === false) return false;
    return true;
  });

  if (!canRead("chartofaccount")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view Chart of Accounts.
      </div>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE ACCOUNT BY ID API) ──
  if (viewMode === "view") {
    const activeAcc =
      (singleAccountData?.result && typeof singleAccountData.result === "object" ? singleAccountData.result : null) ||
      (singleAccountData && typeof singleAccountData === "object" && !Array.isArray(singleAccountData) && "account_name" in singleAccountData ? singleAccountData : null) ||
      selectedAccount ||
      rawAccounts.find((a: any) => a.id === selectedAccountId);

    if (isSingleAccountLoading && !activeAcc) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading account details from API...</div>
        </div>
      );
    }

    if (!activeAcc) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Account record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Chart of Accounts
          </button>
        </div>
      );
    }

    const typeName = activeAcc.accountType?.account_type_name || accountTypes.find((t: any) => String(t.id) === String(activeAcc.account_type_id))?.account_type_name || "N/A";
    const currName = activeAcc.currency?.currency_name || currencies.find((c: any) => String(c.id) === String(activeAcc.currency_id))?.currency_name || "N/A";
    const subName = activeAcc.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeAcc.subsidiary_id))?.subsidiary_name || "N/A";

    return (
      <RecordPageLayout
        recordType="Account"
        subtitle={`${activeAcc.account_number ? `${activeAcc.account_number} - ` : ""}${activeAcc.account_name}`}
        mode="view"
        onEdit={() => handleEdit(activeAcc.id || selectedAccountId!)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">NUMBER</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeAcc.account_number}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeAcc.account_name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">ACCOUNT TYPE</span>
            <span className="text-xs font-semibold text-slate-800">{typeName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBACCOUNT OF</span>
            <span className="text-xs font-mono text-slate-800">{activeAcc.parent_account_number || "N/A"}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
            <span className="text-xs font-bold text-sky-800">{currName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{subName}</span>
          </div>
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE (STRICTLY SCHEMA FIELDS, MATCHING SCREENSHOT 3) ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Account"
          recordTitle={formik.values.account_name || (isEdit ? "Edit Account Record" : "New Account Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          {/* Top Checkbox: ACCOUNT IS INACTIVE */}
          <div className="px-4 pt-2 pb-1 flex items-center space-x-2">
            <input
              type="checkbox"
              id="inactive-acc-checkbox"
              name="isActive"
              checked={!formik.values.isActive}
              onChange={(e) => formik.setFieldValue("isActive", !e.target.checked)}
              className="w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="inactive-acc-checkbox" className="text-xs font-semibold text-slate-600 uppercase cursor-pointer select-none">
              ACCOUNT IS INACTIVE
            </label>
          </div>

          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                NUMBER <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="account_number"
                value={formik.values.account_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. 1000 / 4000"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="account_name"
                value={formik.values.account_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Account Display Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                TYPE <span className="text-amber-600">*</span>
              </label>
              <select
                name="account_type_id"
                value={formik.values.account_type_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Account Type --</option>
                {accountTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.account_type_name || t.type_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBACCOUNT OF</label>
              <input
                type="text"
                name="parent_account_number"
                value={formik.values.parent_account_number || ""}
                onChange={formik.handleChange}
                placeholder="Parent Account Number"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                CURRENCY <span className="text-amber-600">*</span>
              </label>
              <select
                name="currency_id"
                value={formik.values.currency_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Currency --</option>
                {currencies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.currency_name} ({c.currency_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">PRIMARY SUBSIDIARY</label>
              <select
                name="subsidiary_id"
                value={formik.values.subsidiary_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Subsidiary --</option>
                {rawSubsidiaries.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.subsidiary_name || s.name}
                  </option>
                ))}
              </select>
            </div>
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: NETSUITE LIST VIEW (MATCHING SCREENSHOT 2) ──
  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      {/* ── TOP TITLE BAR (BLUE SQUARE + CHART OF ACCOUNTS TITLE) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Chart of Accounts</h1>
        </div>
        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          <button onClick={() => setViewMode("list")} className="hover:underline flex items-center space-x-1">
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
          <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="hover:underline flex items-center space-x-1">
            <Search className="!w-3.5 !h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* ── VIEW CONTROL RIBBON (VIEW: Financial | New) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 p-2 rounded-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW</span>
            <select className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500">
              <option value="Financial">Financial</option>
              <option value="All Accounts">All Accounts</option>
            </select>
          </div>

          {canCreate("chartofaccount") && (
            <button
              onClick={handleAddAccount}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* ── COLLAPSIBLE FILTERS PANEL (+ FILTERS) ── */}
      <div className="border border-slate-300 rounded-xs bg-white overflow-hidden shadow-2xs">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-700 select-none border-b border-slate-200"
        >
          <div className="flex items-center space-x-1.5">
            <FilterList className="!w-4 !h-4 text-slate-500" />
            <span className="uppercase tracking-wider text-[11px]">+ FILTERS</span>
          </div>
          {isFiltersOpen ? <KeyboardArrowUp className="!w-4 !h-4" /> : <KeyboardArrowDown className="!w-4 !h-4" />}
        </button>

        {isFiltersOpen && (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Account Type</label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All Account Types</option>
                {accountTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.account_type_name || t.type_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-4">
              <label className="inline-flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactives}
                  onChange={(e) => setShowInactives(e.target.checked)}
                  className="w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500"
                />
                <span className="uppercase text-[10px] font-semibold">SHOW INACTIVES</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION TOOLBAR (EXPORT CSV, PRINT, TOTAL) ── */}
      <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-3">
          <button onClick={handleExportCSV} className="p-1 text-slate-600 hover:text-sky-700 flex items-center space-x-1 font-semibold text-[11px]">
            <GetApp className="!w-4 !h-4" />
            <span>CSV</span>
          </button>
          <button onClick={() => window.print()} className="p-1 text-slate-600 hover:text-sky-700 flex items-center space-x-1 font-semibold text-[11px]">
            <Print className="!w-4 !h-4" />
            <span>Print</span>
          </button>
        </div>
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {filteredAccounts.length}</span>
      </div>

      {/* ── DATA TABLE GRID (MATCHING SCREENSHOT 2 COLUMNS) ── */}
      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">NUMBER</th>
              <th className="px-3 py-2 border-r border-slate-300">ACCOUNT</th>
              <th className="px-3 py-2 border-r border-slate-300">TYPE</th>
              <th className="px-3 py-2 border-r border-slate-300">CURRENCY</th>
              <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isChartLoading ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">Loading chart of accounts...</td></tr>
            ) : filteredAccounts.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">No account records found matching criteria.</td></tr>
            ) : (
              filteredAccounts.map((row: any, idx: number) => {
                const typeName = row.accountType?.account_type_name || accountTypes.find((t: any) => String(t.id) === String(row.account_type_id))?.account_type_name || "N/A";
                const currName = row.currency?.currency_name || currencies.find((c: any) => String(c.id) === String(row.currency_id))?.currency_name || "N/A";
                const subName = row.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(row.subsidiary_id))?.subsidiary_name || "N/A";

                return (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{row.account_number}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.account_name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200">{typeName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-sky-800">{currName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{subName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("chartofaccount") && (
                        <button onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} className="text-red-600 hover:underline font-semibold text-[11px]">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Delete Account"
        message="Are you sure you want to delete this account record from Chart of Accounts?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default ChartOfAccountComp;