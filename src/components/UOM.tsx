import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateUOMMutation,
  useDeleteUOMMutation,
  useGetUOMsQuery,
  useGetSingleUOMQuery,
  useUpdateUOMMutation,
} from "../RTK/services/uomApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface UOMType {
  id?: number;
  uom_name: string;
  subsidiary_id?: number | string | null;
  isActive?: boolean;
  allow_decimals?: boolean;
}

const UOMComp: React.FC = () => {
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

  const { data: uomData, isLoading } = useGetUOMsQuery();
  const { data: singleRecordData, isLoading: isSingleLoading } = useGetSingleUOMQuery(selectedId!, {
    skip: !selectedId || viewMode !== "view",
  });
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createUOM, { isLoading: isCreating }] = useCreateUOMMutation();
  const [updateUOM, { isLoading: isUpdating }] = useUpdateUOMMutation();
  const [deleteUOM] = useDeleteUOMMutation();

  const rawRecords = Array.isArray(uomData?.result)
    ? uomData.result
    : Array.isArray(uomData?.data)
      ? uomData.data
      : Array.isArray(uomData)
        ? uomData
        : [];

  const rawSubsidiaries = Array.isArray(subsidiariesData?.result)
    ? subsidiariesData.result
    : Array.isArray(subsidiariesData?.data)
      ? subsidiariesData.data
      : Array.isArray(subsidiariesData)
        ? subsidiariesData
        : [];

  const formik = useFormik<UOMType>({
    initialValues: {
      uom_name: "",
      subsidiary_id: "",
      isActive: true,
      allow_decimals: true,
    },
    validationSchema: Yup.object({
      uom_name: Yup.string()
        .min(1, "UOM Name must be at least 1 character")
        .max(100, "UOM Name must be at most 100 characters")
        .required("UOM Name is required"),
      subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          uom_name: values.uom_name,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
          allow_decimals: Boolean(values.allow_decimals),
        };

        if (isEdit && editId) {
          if (!canUpdate("uom")) {
            toast.error("You do not have permission to update UOMs");
            return;
          }
          const response = await updateUOM({ id: editId, payload }).unwrap();
          toast.success(response.message || "Unit of Measure updated successfully");
        } else {
          if (!canCreate("uom")) {
            toast.error("You do not have permission to create UOMs");
            return;
          }
          const response = await createUOM(payload).unwrap();
          toast.success(response.message || "Unit of Measure created successfully");
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
            uom_name: rec.uom_name || rec.name || "",
            subsidiary_id: rec.subsidiary_id || rec.subsidiary?.id || "",
            isActive: rec.isActive ?? true,
            allow_decimals: rec.allow_decimals ?? true,
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
    if (!canUpdate("uom")) {
      toast.error("You do not have permission to edit UOMs");
      return;
    }
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) {
      setSelectedRecord(rec);
      formik.setValues({
        uom_name: rec.uom_name || rec.name || "",
        subsidiary_id: rec.subsidiary_id || rec.subsidiary?.id || "",
        isActive: rec.isActive ?? true,
        allow_decimals: rec.allow_decimals ?? true,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("uom")) {
      toast.error("You do not have permission to delete UOMs");
      return;
    }
    try {
      const response = await deleteUOM(id).unwrap();
      toast.success(response.message || "Unit of Measure deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete UOM");
    }
  };

  const handleAddRecord = () => {
    if (!canCreate("uom")) {
      toast.error("You do not have permission to create UOMs");
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
    const headers = ["Internal ID", "UOM Name", "Subsidiary", "Status"];
    const rows = rawRecords.map((r: any) => [
      r.id,
      `"${r.uom_name || r.name || ""}"`,
      `"${r.subsidiary?.subsidiary_name || "N/A"}"`,
      r.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Units_Of_Measure_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Units of Measure exported as CSV");
  };

  if (!canRead("uom")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view Units of Measure.
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
          <div>Loading UOM details from API...</div>
        </div>
      );
    }

    if (!activeRec) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Unit of measure record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to List
          </button>
        </div>
      );
    }

    const subName = activeRec.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeRec.subsidiary_id))?.subsidiary_name || "N/A";

    return (
      <RecordPageLayout
        recordType="Unit of Measure (UOM)"
        subtitle={`${activeRec.uom_name || activeRec.name}`}
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
            <span className="text-[10px] font-semibold text-slate-500 uppercase">UOM NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeRec.uom_name || activeRec.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{subName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">ALLOW DECIMALS</span>
            <span className="text-xs font-semibold text-slate-800">{activeRec.allow_decimals !== false ? "Yes (Permits Decimals)" : "No (Whole Numbers Only)"}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
            <span className="text-xs font-semibold text-slate-800">{activeRec.isActive !== false ? "Active" : "Inactive"}</span>
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
          recordType="Unit of Measure (UOM)"
          recordTitle={formik.values.uom_name || (isEdit ? "Edit Unit of Measure" : "New Unit of Measure")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                UOM NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="uom_name"
                value={formik.values.uom_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Unit of Measure Name (e.g. Kg / Pcs / Ltr)"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
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

            <div className="flex items-center space-x-2 pt-2 col-span-full">
              <input
                type="checkbox"
                id="allow_decimals"
                name="allow_decimals"
                checked={formik.values.allow_decimals ?? true}
                onChange={formik.handleChange}
                className="h-4 w-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <label htmlFor="allow_decimals" className="text-xs font-medium text-slate-700 select-none">
                ALLOW DECIMALS <span className="text-slate-400 font-normal">(Permit fractional quantities like 1.5 Kg / Ltr. Uncheck for discrete units like Each, Pcs, Box.)</span>
              </label>
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
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Units of Measure (UOM)</h1>
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
            <option value="All">All Units of Measure</option>
          </select>
        </div>

        {canCreate("uom") && (
          <button
            onClick={handleAddRecord}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New UOM</span>
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
              <th className="px-3 py-2 border-r border-slate-300">UOM NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
              <th className="px-3 py-2 border-r border-slate-300">ALLOW DECIMAL</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">Loading units of measure...</td></tr>
            ) : rawRecords.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No records found.</td></tr>
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
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.uom_name || row.name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{subName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-xs">{row.allow_decimals !== false ? "Yes" : "No"}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("uom") && (
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
        title="Delete Unit of Measure"
        message="Are you sure you want to delete this unit of measure?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default UOMComp;
