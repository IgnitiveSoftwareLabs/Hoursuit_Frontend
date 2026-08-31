import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateHSNSACMutation,
  useDeleteHSNSACMutation,
  useGetHSNSACsQuery,
  useGetSingleHSNSACQuery,
  useUpdateHSNSACMutation,
} from "../RTK/services/hsnSacApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface HSNSACType {
  id?: number;
  code: string;
  type: "HSN" | "SAC";
  description: string;
  taxPercentage?: number;
  subsidiary_id?: number | string | null;
  isActive?: boolean;
}

const HSNSACComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: hsnSacData, isLoading } = useGetHSNSACsQuery();
  const { data: singleRecordData, isLoading: isSingleLoading } = useGetSingleHSNSACQuery(selectedId!, {
    skip: !selectedId || viewMode !== "view",
  });
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createHSNSAC, { isLoading: isCreating }] = useCreateHSNSACMutation();
  const [updateHSNSAC, { isLoading: isUpdating }] = useUpdateHSNSACMutation();
  const [deleteHSNSAC] = useDeleteHSNSACMutation();

  const rawRecords = Array.isArray(hsnSacData?.result)
    ? hsnSacData.result
    : Array.isArray(hsnSacData?.data)
    ? hsnSacData.data
    : Array.isArray(hsnSacData)
    ? hsnSacData
    : [];

  const rawSubsidiaries = Array.isArray(subsidiariesData?.result)
    ? subsidiariesData.result
    : Array.isArray(subsidiariesData?.data)
    ? subsidiariesData.data
    : Array.isArray(subsidiariesData)
    ? subsidiariesData
    : [];

  const formik = useFormik<HSNSACType>({
    initialValues: {
      code: "",
      type: "HSN",
      description: "",
      taxPercentage: 0,
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      code: Yup.string()
        .min(2, "Code must be at least 2 characters")
        .max(50, "Code must be at most 50 characters")
        .required("HSN / SAC Code is required"),
      type: Yup.string().oneOf(["HSN", "SAC"]).required("Select HSN or SAC Type"),
      description: Yup.string().optional(),
      taxPercentage: Yup.number().min(0, "Tax percentage cannot be negative").optional(),
      subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          code: values.code,
          type: values.type,
          description: values.description || "",
          taxPercentage: values.taxPercentage ? Number(values.taxPercentage) : 0,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("hsnSac")) {
            toast.error("You do not have permission to update HSN/SAC codes");
            return;
          }
          const response = await updateHSNSAC({ id: editId, payload }).unwrap();
          toast.success(response.message || "HSN/SAC Code updated successfully");
        } else {
          if (!canCreate("hsnSac")) {
            toast.error("You do not have permission to create HSN/SAC codes");
            return;
          }
          const response = await createHSNSAC(payload).unwrap();
          toast.success(response.message || "HSN/SAC Code created successfully");
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
      setSelectedId(idNum);

      if (urlAction === "edit") {
        const rec = rawRecords.find((r: any) => r.id === idNum);
        if (rec) {
          setSelectedRecord(rec);
          formik.setValues({
            code: rec.code || "",
            type: rec.type || "HSN",
            description: rec.description || "",
            taxPercentage: rec.taxPercentage || 0,
            subsidiary_id: rec.subsidiary_id || rec.subsidiary?.id || "",
            isActive: rec.isActive ?? true,
          });
          setEditId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const recFallback = rawRecords.find((r: any) => r.id === idNum);
        if (recFallback) {
          setSelectedRecord(recFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditId(null);
        setSelectedRecord(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedId(null);
    }
  }, [searchParams, rawRecords.length]);

  const handleView = (id: number) => {
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) setSelectedRecord(rec);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("hsnSac")) {
      toast.error("You do not have permission to edit HSN/SAC codes");
      return;
    }
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) {
      setSelectedRecord(rec);
      formik.setValues({
        code: rec.code || "",
        type: rec.type || "HSN",
        description: rec.description || "",
        taxPercentage: rec.taxPercentage || 0,
        subsidiary_id: rec.subsidiary_id || rec.subsidiary?.id || "",
        isActive: rec.isActive ?? true,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("hsnSac")) {
      toast.error("You do not have permission to delete HSN/SAC codes");
      return;
    }
    try {
      const response = await deleteHSNSAC(id).unwrap();
      toast.success(response.message || "HSN/SAC Code deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete HSN/SAC code");
    }
  };

  const handleAddRecord = () => {
    if (!canCreate("hsnSac")) {
      toast.error("You do not have permission to create HSN/SAC codes");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditId(null);
    setSelectedRecord(null);
    setSelectedId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawRecords.length === 0) {
      toast.error("No records to export");
      return;
    }
    const headers = ["Internal ID", "Code", "Type", "Description", "Tax %", "Subsidiary", "Status"];
    const rows = rawRecords.map((r: any) => [
      r.id,
      `"${r.code || ""}"`,
      `"${r.type || "HSN"}"`,
      `"${r.description || ""}"`,
      r.taxPercentage || 0,
      `"${r.subsidiary?.subsidiary_name || "N/A"}"`,
      r.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HSN_SAC_Codes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("HSN/SAC Codes exported as CSV");
  };

  if (!canRead("hsnSac")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view HSN/SAC Codes.
      </div>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE BY ID API) ──
  if (viewMode === "view") {
    const activeRec =
      (singleRecordData?.result && typeof singleRecordData.result === "object" ? singleRecordData.result : null) ||
      (singleRecordData && typeof singleRecordData === "object" && !Array.isArray(singleRecordData) ? singleRecordData : null) ||
      selectedRecord ||
      rawRecords.find((r: any) => r.id === selectedId);

    if (isSingleLoading && !activeRec) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading HSN/SAC code details from API...</div>
        </div>
      );
    }

    if (!activeRec) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>HSN/SAC code record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to List
          </button>
        </div>
      );
    }

    const subName = activeRec.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeRec.subsidiary_id))?.subsidiary_name || "N/A";

    return (
      <RecordPageLayout
        recordType="HSN / SAC Code"
        subtitle={`${activeRec.code}`}
        mode="view"
        onEdit={() => handleEdit(activeRec.id || selectedId!)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">INTERNAL ID</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeRec.id}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CODE</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeRec.code}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">TYPE</span>
            <span className="text-xs font-bold text-sky-800 uppercase">{activeRec.type}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">TAX PERCENTAGE</span>
            <span className="text-xs font-bold text-emerald-700">{activeRec.taxPercentage || 0}%</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{subName}</span>
          </div>
          <div className="flex flex-col space-y-0.5 md:col-span-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">DESCRIPTION</span>
            <span className="text-xs text-slate-800">{activeRec.description || "N/A"}</span>
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
          recordType="HSN / SAC Code"
          recordTitle={formik.values.code || (isEdit ? "Edit HSN/SAC Code" : "New HSN/SAC Code")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                CODE <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. 1001 / 9983"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                TYPE <span className="text-amber-600">*</span>
              </label>
              <select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value="HSN">HSN (Goods)</option>
                <option value="SAC">SAC (Services)</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">TAX PERCENTAGE (%)</label>
              <input
                type="number"
                name="taxPercentage"
                value={formik.values.taxPercentage}
                onChange={formik.handleChange}
                placeholder="18"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
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

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">DESCRIPTION</label>
              <input
                type="text"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Code Description"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
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
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">HSN / SAC Codes</h1>
        </div>
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
            <option value="All">All HSN / SAC Codes</option>
          </select>
        </div>

        {canCreate("hsnSac") && (
          <button
            onClick={handleAddRecord}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New HSN/SAC Code</span>
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
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {rawRecords.length}</span>
      </div>

      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">CODE</th>
              <th className="px-3 py-2 border-r border-slate-300">TYPE</th>
              <th className="px-3 py-2 border-r border-slate-300">DESCRIPTION</th>
              <th className="px-3 py-2 border-r border-slate-300">TAX %</th>
              <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">Loading HSN/SAC codes...</td></tr>
            ) : rawRecords.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">No records found.</td></tr>
            ) : (
              rawRecords.map((row: any, idx: number) => {
                const subName = row.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(row.subsidiary_id))?.subsidiary_name || "N/A";
                return (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{row.code}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-sky-800 uppercase">{row.type || "HSN"}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200">{row.description || "N/A"}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-emerald-700">{row.taxPercentage || 0}%</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{subName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("hsnSac") && (
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
        title="Delete HSN/SAC Code"
        message="Are you sure you want to delete this HSN/SAC code?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default HSNSACComp;