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
  useCreateSubsidiaryMutation,
  useDeleteSubsidiaryMutation,
  useGetSubsidiariesQuery,
  useGetSingleSubsidiaryQuery,
  useUpdateSubsidiaryMutation,
} from "../RTK/services/subsdiaryApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface SubsidiaryType {
  id?: number;
  subsidiary_name: string;
  currency_id: number | string;
  parent_subsidiary_id?: number | string | null;
  isActive?: boolean;
}

const SubsidiaryComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<number | null>(null);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showInactives, setShowInactives] = useState(false);

  // RTK Queries
  const { data: subsidiariesData, isLoading: isSubsidiariesLoading } = useGetSubsidiariesQuery();
  const { data: singleSubsidiaryData, isLoading: isSingleSubsidiaryLoading } = useGetSingleSubsidiaryQuery(selectedSubsidiaryId!, {
    skip: !selectedSubsidiaryId || viewMode !== "view",
  });
  const { data: currenciesData } = useGetCurrenciesQuery();

  const [createSubsidiary, { isLoading: isCreating }] = useCreateSubsidiaryMutation();
  const [updateSubsidiary, { isLoading: isUpdating }] = useUpdateSubsidiaryMutation();
  const [deleteSubsidiary] = useDeleteSubsidiaryMutation();

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

  const formik = useFormik<SubsidiaryType>({
    initialValues: {
      subsidiary_name: "",
      currency_id: "",
      parent_subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      subsidiary_name: Yup.string()
        .min(1, "Name must be at least 1 character")
        .max(200, "Name must be at most 200 characters")
        .required("Subsidiary Name is required"),
      currency_id: Yup.number()
        .typeError("Please select a currency")
        .required("Currency is required"),
      parent_subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          subsidiary_name: values.subsidiary_name,
          currency_id: Number(values.currency_id),
          parent_subsidiary_id:
            values.parent_subsidiary_id === "" || values.parent_subsidiary_id === null
              ? null
              : Number(values.parent_subsidiary_id),
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("subsidiary")) {
            toast.error("You do not have permission to update subsidiaries");
            return;
          }
          const response = await updateSubsidiary({ id: editId, payload }).unwrap();
          toast.success(response.message || "Subsidiary updated successfully");
        } else {
          if (!canCreate("subsidiary")) {
            toast.error("You do not have permission to create subsidiaries");
            return;
          }
          const response = await createSubsidiary(payload).unwrap();
          toast.success(response.message || "Subsidiary created successfully");
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
      setSelectedSubsidiaryId(idNum);

      if (urlAction === "edit") {
        const sub = rawSubsidiaries.find((s: any) => s.id === idNum);
        if (sub) {
          setSelectedSubsidiary(sub);
          formik.setValues({
            subsidiary_name: sub.subsidiary_name || sub.name || "",
            currency_id: sub.currency_id || sub.currency?.id || "",
            parent_subsidiary_id: sub.parent_subsidiary_id || sub.parentSubsidiary?.id || "",
            isActive: sub.isActive ?? true,
          });
          setEditId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const subFallback = rawSubsidiaries.find((s: any) => s.id === idNum);
        if (subFallback) {
          setSelectedSubsidiary(subFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditId(null);
        setSelectedSubsidiary(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedSubsidiaryId(null);
    }
  }, [searchParams, rawSubsidiaries.length]);

  const handleView = (id: number) => {
    setSelectedSubsidiaryId(id);
    const sub = rawSubsidiaries.find((s: any) => s.id === id);
    if (sub) setSelectedSubsidiary(sub);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("subsidiary")) {
      toast.error("You do not have permission to edit subsidiaries");
      return;
    }
    setSelectedSubsidiaryId(id);
    const sub = rawSubsidiaries.find((s: any) => s.id === id);
    if (sub) {
      setSelectedSubsidiary(sub);
      formik.setValues({
        subsidiary_name: sub.subsidiary_name || sub.name || "",
        currency_id: sub.currency_id || sub.currency?.id || "",
        parent_subsidiary_id: sub.parent_subsidiary_id || sub.parentSubsidiary?.id || "",
        isActive: sub.isActive ?? true,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("subsidiary")) {
      toast.error("You do not have permission to delete subsidiaries");
      return;
    }
    try {
      const response = await deleteSubsidiary(id).unwrap();
      toast.success(response.message || "Subsidiary deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete subsidiary");
    }
  };

  const handleAddSubsidiary = () => {
    if (!canCreate("subsidiary")) {
      toast.error("You do not have permission to create subsidiaries");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditId(null);
    setSelectedSubsidiary(null);
    setSelectedSubsidiaryId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawSubsidiaries.length === 0) {
      toast.error("No subsidiaries to export");
      return;
    }
    const headers = ["Internal ID", "Name", "Currency", "Parent Subsidiary", "Status"];
    const rows = rawSubsidiaries.map((s: any) => [
      s.id,
      `"${s.subsidiary_name || s.name || ""}"`,
      `"${s.currency?.currency_name || ""}"`,
      `"${s.parentSubsidiary?.subsidiary_name || "N/A"}"`,
      s.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Subsidiaries_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subsidiaries List exported as CSV");
  };

  const filteredSubsidiaries = rawSubsidiaries.filter((sub: any) => {
    if (!showInactives && sub.isActive === false) return false;
    return true;
  });

  if (!canRead("subsidiary")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view subsidiaries.
      </div>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE SUBSIDIARY BY ID API) ──
  if (viewMode === "view") {
    const activeSub =
      (singleSubsidiaryData?.result && typeof singleSubsidiaryData.result === "object" ? singleSubsidiaryData.result : null) ||
      (singleSubsidiaryData && typeof singleSubsidiaryData === "object" && !Array.isArray(singleSubsidiaryData) && "subsidiary_name" in singleSubsidiaryData ? singleSubsidiaryData : null) ||
      selectedSubsidiary ||
      rawSubsidiaries.find((s: any) => s.id === selectedSubsidiaryId);

    if (isSingleSubsidiaryLoading && !activeSub) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading subsidiary details from API...</div>
        </div>
      );
    }

    if (!activeSub) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Subsidiary record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Subsidiaries List
          </button>
        </div>
      );
    }

    const currencyName = activeSub.currency?.currency_name || currencies.find((c: any) => String(c.id) === String(activeSub.currency_id))?.currency_name || "N/A";
    const parentName = activeSub.parentSubsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeSub.parent_subsidiary_id))?.subsidiary_name || "Parent Company";

    return (
      <RecordPageLayout
        recordType="Subsidiary"
        subtitle={`${activeSub.subsidiary_name || activeSub.name}`}
        mode="view"
        onEdit={() => handleEdit(activeSub.id || selectedSubsidiaryId!)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">INTERNAL ID</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeSub.id}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeSub.subsidiary_name || activeSub.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">PARENT SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{parentName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
            <span className="text-xs font-bold text-sky-800">{currencyName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
            <span className="text-xs font-semibold text-slate-800">{activeSub.isActive !== false ? "Active" : "Inactive"}</span>
          </div>
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE (MATCHING SCREENSHOT 2 LAYOUT BASED ON SCHEMA) ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Subsidiary"
          recordTitle={formik.values.subsidiary_name || (isEdit ? "Edit Subsidiary Record" : "New Subsidiary Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          {/* Top Checkbox: SUBSIDIARY IS INACTIVE (Matching NetSuite Screenshot 2) */}
          <div className="px-4 pt-2 pb-1 flex items-center space-x-2">
            <input
              type="checkbox"
              id="inactive-checkbox"
              name="isActive"
              checked={!formik.values.isActive}
              onChange={(e) => formik.setFieldValue("isActive", !e.target.checked)}
              className="w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="inactive-checkbox" className="text-xs font-semibold text-slate-600 uppercase cursor-pointer select-none">
              SUBSIDIARY IS INACTIVE
            </label>
          </div>

          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="subsidiary_name"
                value={formik.values.subsidiary_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Subsidiary Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                PARENT SUBSIDIARY <span className="text-amber-600">*</span>
              </label>
              <select
                name="parent_subsidiary_id"
                value={formik.values.parent_subsidiary_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">Parent Company</option>
                {rawSubsidiaries
                  .filter((s: any) => (editId ? s.id !== editId : true))
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.subsidiary_name || s.name}
                    </option>
                  ))}
              </select>
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
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: NETSUITE LIST VIEW (MATCHING SCREENSHOT 1) ──
  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      {/* ── TOP TITLE BAR (BLUE SQUARE + SUBSIDIARIES TITLE) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Subsidiaries</h1>
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

      {/* ── VIEW CONTROL RIBBON (VIEW: Subsidiary Default | Customise View | New Subsidiary) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 p-2 rounded-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW</span>
            <select className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500">
              <option value="Subsidiary Default">Subsidiary Default</option>
              <option value="All Subsidiaries">All Subsidiaries</option>
            </select>
          </div>

          {canCreate("subsidiary") && (
            <button
              onClick={handleAddSubsidiary}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New Subsidiary</span>
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
          <div className="p-3 bg-white text-xs">
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
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {filteredSubsidiaries.length}</span>
      </div>

      {/* ── DATA TABLE GRID (MATCHING SCREENSHOT 1 COLUMNS) ── */}
      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">CURRENCY</th>
              <th className="px-3 py-2 border-r border-slate-300">PARENT SUBSIDIARY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isSubsidiariesLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Loading subsidiaries...</td></tr>
            ) : filteredSubsidiaries.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No subsidiary records found.</td></tr>
            ) : (
              filteredSubsidiaries.map((row: any, idx: number) => {
                const currName = row.currency?.currency_name || currencies.find((c: any) => String(c.id) === String(row.currency_id))?.currency_name || "N/A";
                const parentName = row.parentSubsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(row.parent_subsidiary_id))?.subsidiary_name || "N/A";

                return (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.subsidiary_name || row.name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-sky-800">{currName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{parentName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("subsidiary") && (
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
        title="Delete Subsidiary"
        message="Are you sure you want to delete this subsidiary record?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default SubsidiaryComp;