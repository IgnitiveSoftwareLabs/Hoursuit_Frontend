import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateTransportationModeMutation,
  useDeleteTransportationModeMutation,
  useGetTransportationModesQuery,
  useGetSingleTransportationModeQuery,
  useUpdateTransportationModeMutation,
} from "../RTK/services/transportationModeApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface TransportationModeType {
  id?: number;
  mode_name: string;
  isActive?: boolean;
  subsidiary_id?: number | string | null;
}

const TransportationModeComp: React.FC = () => {
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

  const { data: modesData, isLoading } = useGetTransportationModesQuery();
  const { data: singleRecordData, isLoading: isSingleLoading } = useGetSingleTransportationModeQuery(selectedId!, {
    skip: !selectedId || viewMode !== "view",
  });
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createTransportationMode, { isLoading: isCreating }] = useCreateTransportationModeMutation();
  const [updateTransportationMode, { isLoading: isUpdating }] = useUpdateTransportationModeMutation();
  const [deleteTransportationMode] = useDeleteTransportationModeMutation();

  const rawRecords = Array.isArray(modesData?.result)
    ? modesData.result
    : Array.isArray(modesData?.data)
    ? modesData.data
    : Array.isArray(modesData)
    ? modesData
    : [];

  const rawSubsidiaries = Array.isArray(subsidiariesData?.result)
    ? subsidiariesData.result
    : Array.isArray(subsidiariesData?.data)
    ? subsidiariesData.data
    : Array.isArray(subsidiariesData)
    ? subsidiariesData
    : [];

  const formik = useFormik<TransportationModeType>({
    initialValues: {
      mode_name: "",
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      mode_name: Yup.string()
        .min(2, "Mode Name must be at least 2 characters")
        .max(100, "Mode Name must be at most 100 characters")
        .required("Transportation Mode Name is required"),
      subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          mode_name: values.mode_name,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("transportationMode")) {
            toast.error("You do not have permission to update transportation modes");
            return;
          }
          const response = await updateTransportationMode({ id: editId, payload }).unwrap();
          toast.success(response.message || "Transportation Mode updated successfully");
        } else {
          if (!canCreate("transportationMode")) {
            toast.error("You do not have permission to create transportation modes");
            return;
          }
          const response = await createTransportationMode(payload).unwrap();
          toast.success(response.message || "Transportation Mode created successfully");
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
            mode_name: rec.mode_name || rec.name || "",
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
    if (!canUpdate("transportationMode")) {
      toast.error("You do not have permission to edit transportation modes");
      return;
    }
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) {
      setSelectedRecord(rec);
      formik.setValues({
        mode_name: rec.mode_name || rec.name || "",
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
    if (!canDelete("transportationMode")) {
      toast.error("You do not have permission to delete transportation modes");
      return;
    }
    try {
      const response = await deleteTransportationMode(id).unwrap();
      toast.success(response.message || "Transportation Mode deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete transportation mode");
    }
  };

  const handleAddRecord = () => {
    if (!canCreate("transportationMode")) {
      toast.error("You do not have permission to create transportation modes");
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
    const headers = ["Internal ID", "Transportation Mode", "Subsidiary", "Status"];
    const rows = rawRecords.map((r: any) => [
      r.id,
      `"${r.mode_name || r.name || ""}"`,
      `"${r.subsidiary?.subsidiary_name || "N/A"}"`,
      r.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transportation_Modes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transportation Modes exported as CSV");
  };

  if (!canRead("transportationMode")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view Transportation Modes.
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
          <div>Loading transportation mode details from API...</div>
        </div>
      );
    }

    if (!activeRec) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Transportation mode record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to List
          </button>
        </div>
      );
    }

    const subName = activeRec.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeRec.subsidiary_id))?.subsidiary_name || "N/A";

    return (
      <RecordPageLayout
        recordType="Transportation Mode"
        subtitle={`${activeRec.mode_name || activeRec.name}`}
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
            <span className="text-[10px] font-semibold text-slate-500 uppercase">MODE NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeRec.mode_name || activeRec.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{subName}</span>
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
          recordType="Transportation Mode"
          recordTitle={formik.values.mode_name || (isEdit ? "Edit Transportation Mode" : "New Transportation Mode")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                MODE NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="mode_name"
                value={formik.values.mode_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Transportation Mode Name (e.g. Road / Rail / Air)"
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
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Transportation Modes</h1>
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
            <option value="All">All Transportation Modes</option>
          </select>
        </div>

        {canCreate("transportationMode") && (
          <button
            onClick={handleAddRecord}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New Transportation Mode</span>
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
              <th className="px-3 py-2 border-r border-slate-300">MODE NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">Loading transportation modes...</td></tr>
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
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.mode_name || row.name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{subName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("transportationMode") && (
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
        title="Delete Transportation Mode"
        message="Are you sure you want to delete this transportation mode?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default TransportationModeComp;