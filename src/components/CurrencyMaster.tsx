import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  Add,
  Search,
  List as ListIcon,
  GetApp,
  Print,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateCurrencyMutation,
  useDeleteCurrencyMutation,
  useGetCurrenciesQuery,
  useGetSingleCurrencyQuery,
  useUpdateCurrencyMutation,
} from "../RTK/services/currencyApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface CurrencyFormType {
  id?: number;
  currency_code: string;
  currency_name: string;
  currency_symbol?: string | null;
  country_name?: string | null;
  decimal_places: number;
  isActive?: boolean;
}

const CurrencyMaster: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: currenciesData, isLoading: isCurrenciesLoading } = useGetCurrenciesQuery();
  const { data: singleCurrencyData, isLoading: isSingleCurrencyLoading } = useGetSingleCurrencyQuery(selectedCurrencyId!, {
    skip: !selectedCurrencyId || viewMode !== "view",
  });
  const [createCurrency, { isLoading: isCreating }] = useCreateCurrencyMutation();
  const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencyMutation();
  const [deleteCurrency] = useDeleteCurrencyMutation();

  const rawCurrencies = Array.isArray(currenciesData?.result)
    ? currenciesData.result
    : Array.isArray(currenciesData?.data)
    ? currenciesData.data
    : Array.isArray(currenciesData)
    ? currenciesData
    : [];

  const formik = useFormik<CurrencyFormType>({
    initialValues: {
      currency_code: "",
      currency_name: "",
      currency_symbol: "",
      country_name: "",
      decimal_places: 2,
      isActive: true,
    },
    validationSchema: Yup.object({
      currency_code: Yup.string()
        .min(2, "Currency Code must be at least 2 characters")
        .max(10, "Currency Code must be at most 10 characters")
        .required("Currency Code is required"),
      currency_name: Yup.string()
        .min(2, "Currency Name must be at least 2 characters")
        .max(100, "Currency Name must be at most 100 characters")
        .required("Currency Name is required"),
      currency_symbol: Yup.string().optional().nullable(),
      country_name: Yup.string().optional().nullable(),
      decimal_places: Yup.number()
        .min(0, "Decimal places cannot be negative")
        .max(6, "Decimal places cannot exceed 6")
        .required("Decimal places is required"),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          currency_code: values.currency_code.toUpperCase(),
          currency_name: values.currency_name,
          currency_symbol: values.currency_symbol || null,
          country_name: values.country_name || null,
          decimal_places: Number(values.decimal_places),
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("currency")) {
            toast.error("You do not have permission to update currencies");
            return;
          }
          const response = await updateCurrency({ id: editId, payload }).unwrap();
          toast.success(response.message || "Currency updated successfully");
        } else {
          if (!canCreate("currency")) {
            toast.error("You do not have permission to create currencies");
            return;
          }
          const response = await createCurrency(payload).unwrap();
          toast.success(response.message || "Currency created successfully");
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
      setSelectedCurrencyId(idNum);

      if (urlAction === "edit") {
        const curr = rawCurrencies.find((c: any) => c.id === idNum);
        if (curr) {
          setSelectedCurrency(curr);
          formik.setValues({
            currency_code: curr.currency_code || "",
            currency_name: curr.currency_name || "",
            currency_symbol: curr.currency_symbol || "",
            country_name: curr.country_name || "",
            decimal_places: curr.decimal_places ?? 2,
            isActive: curr.isActive ?? true,
          });
          setEditId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const currFallback = rawCurrencies.find((c: any) => c.id === idNum);
        if (currFallback) {
          setSelectedCurrency(currFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditId(null);
        setSelectedCurrency(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedCurrencyId(null);
    }
  }, [searchParams, rawCurrencies.length]);

  const handleView = (id: number) => {
    setSelectedCurrencyId(id);
    const curr = rawCurrencies.find((c: any) => c.id === id);
    if (curr) setSelectedCurrency(curr);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("currency")) {
      toast.error("You do not have permission to edit currencies");
      return;
    }
    setSelectedCurrencyId(id);
    const curr = rawCurrencies.find((c: any) => c.id === id);
    if (curr) {
      setSelectedCurrency(curr);
      formik.setValues({
        currency_code: curr.currency_code || "",
        currency_name: curr.currency_name || "",
        currency_symbol: curr.currency_symbol || "",
        country_name: curr.country_name || "",
        decimal_places: curr.decimal_places ?? 2,
        isActive: curr.isActive ?? true,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("currency")) {
      toast.error("You do not have permission to delete currencies");
      return;
    }
    try {
      const response = await deleteCurrency(id).unwrap();
      toast.success(response.message || "Currency deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete currency");
    }
  };

  const handleAddCurrency = () => {
    if (!canCreate("currency")) {
      toast.error("You do not have permission to create currencies");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditId(null);
    setSelectedCurrency(null);
    setSelectedCurrencyId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawCurrencies.length === 0) {
      toast.error("No currencies to export");
      return;
    }
    const headers = ["Internal ID", "Code", "Name", "Symbol", "Country", "Decimal Places", "Status"];
    const rows = rawCurrencies.map((c: any) => [
      c.id,
      `"${c.currency_code || ""}"`,
      `"${c.currency_name || ""}"`,
      `"${c.currency_symbol || ""}"`,
      `"${c.country_name || ""}"`,
      c.decimal_places ?? 2,
      c.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Currencies_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Currencies List exported as CSV");
  };

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE CURRENCY BY ID API) ──
  if (viewMode === "view") {
    const activeCurr =
      (singleCurrencyData?.result && typeof singleCurrencyData.result === "object" ? singleCurrencyData.result : null) ||
      (singleCurrencyData && typeof singleCurrencyData === "object" && !Array.isArray(singleCurrencyData) && "currency_code" in singleCurrencyData ? singleCurrencyData : null) ||
      selectedCurrency ||
      rawCurrencies.find((c: any) => c.id === selectedCurrencyId);

    if (isSingleCurrencyLoading && !activeCurr) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading currency details from API...</div>
        </div>
      );
    }

    if (!activeCurr) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Currency record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Currencies List
          </button>
        </div>
      );
    }

    return (
      <RecordPageLayout
        recordType="Currency Master"
        subtitle={`${activeCurr.currency_code} - ${activeCurr.currency_name}`}
        mode="view"
        onEdit={() => handleEdit(activeCurr.id || selectedCurrencyId!)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY CODE</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeCurr.currency_code}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeCurr.currency_name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SYMBOL</span>
            <span className="text-xs font-bold text-sky-800">{activeCurr.currency_symbol || "N/A"}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">COUNTRY</span>
            <span className="text-xs font-semibold text-slate-800">{activeCurr.country_name || "N/A"}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">DECIMAL PRECISION</span>
            <span className="text-xs font-mono text-slate-800">{activeCurr.decimal_places ?? 2} Digits</span>
          </div>
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Currency Master"
          recordTitle={formik.values.currency_name || (isEdit ? "Edit Currency Record" : "New Currency Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                CURRENCY CODE <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="currency_code"
                value={formik.values.currency_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="USD / INR / EUR"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 uppercase font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                CURRENCY NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="currency_name"
                value={formik.values.currency_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="US Dollar / Indian Rupee"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">CURRENCY SYMBOL</label>
              <input
                type="text"
                name="currency_symbol"
                value={formik.values.currency_symbol || ""}
                onChange={formik.handleChange}
                placeholder="$ / ₹ / €"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-bold"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">COUNTRY NAME</label>
              <input
                type="text"
                name="country_name"
                value={formik.values.country_name || ""}
                onChange={formik.handleChange}
                placeholder="United States / India"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">DECIMAL PLACES</label>
              <input
                type="number"
                name="decimal_places"
                value={formik.values.decimal_places}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: NETSUITE LIST VIEW ──
  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Currencies</h1>
        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          <button onClick={() => setViewMode("list")} className="hover:underline flex items-center space-x-1">
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 p-2 rounded-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW</span>
          <select className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium">
            <option value="All Currencies">All Currencies</option>
          </select>
        </div>

        {canCreate("currency") && (
          <button
            onClick={handleAddCurrency}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New Currency</span>
          </button>
        )}
      </div>

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
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {rawCurrencies.length}</span>
      </div>

      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">CODE</th>
              <th className="px-3 py-2 border-r border-slate-300">NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">SYMBOL</th>
              <th className="px-3 py-2 border-r border-slate-300">COUNTRY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isCurrenciesLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 italic">Loading currencies...</td></tr>
            ) : rawCurrencies.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 italic">No currency records found.</td></tr>
            ) : (
              rawCurrencies.map((row: any, idx: number) => (
                <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                    <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{row.currency_code}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-slate-800">{row.currency_name}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-sky-800">{row.currency_symbol || "N/A"}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200">{row.country_name || "N/A"}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap">
                    {canDelete("currency") && (
                      <button onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} className="text-red-600 hover:underline font-semibold text-[11px]">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Delete Currency"
        message="Are you sure you want to delete this currency master record?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default CurrencyMaster;