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
  useCreateStateMutation,
  useDeleteStateMutation,
  useGetStatesQuery,
  useUpdateStateMutation,
} from "../RTK/services/stateApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface StateType {
  id?: number;
  state_name: string;
  state_code: string;
}

const StateComp: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editStateId, setEditStateId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStateId, setDeleteStateId] = useState<number | null>(null);

  const { data: statesData, isLoading: isStatesLoading } = useGetStatesQuery();
  const [createState, { isLoading: isCreating }] = useCreateStateMutation();
  const [updateState, { isLoading: isUpdating }] = useUpdateStateMutation();
  const [deleteState] = useDeleteStateMutation();

  const rawStates = Array.isArray(statesData?.result)
    ? statesData.result
    : Array.isArray(statesData?.data)
    ? statesData.data
    : Array.isArray(statesData)
    ? statesData
    : [];

  const formik = useFormik<StateType>({
    initialValues: {
      state_name: "",
      state_code: "",
    },
    validationSchema: Yup.object({
      state_name: Yup.string()
        .min(2, "State Name must be at least 2 characters")
        .max(100, "State Name must be at most 100 characters")
        .required("State Name is required"),
      state_code: Yup.string()
        .min(1, "State Code must be at least 1 character")
        .max(10, "State Code must be at most 10 characters")
        .required("State Code is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          state_name: values.state_name,
          state_code: values.state_code.toUpperCase(),
        };

        if (isEdit && editStateId) {
          if (!canUpdate("state")) {
            toast.error("You do not have permission to update states");
            return;
          }
          const response = await updateState({ id: editStateId, payload }).unwrap();
          toast.success(response.message || "State updated successfully");
        } else {
          if (!canCreate("state")) {
            toast.error("You do not have permission to create states");
            return;
          }
          const response = await createState(payload).unwrap();
          toast.success(response.message || "State created successfully");
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
      setSelectedStateId(idNum);

      if (urlAction === "edit") {
        const st = rawStates.find((s: any) => s.id === idNum);
        if (st) {
          setSelectedState(st);
          formik.setValues({
            state_name: st.state_name || st.name || "",
            state_code: st.state_code || st.code || "",
          });
          setEditStateId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const stFallback = rawStates.find((s: any) => s.id === idNum);
        if (stFallback) {
          setSelectedState(stFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditStateId(null);
        setSelectedState(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedStateId(null);
    }
  }, [searchParams, rawStates.length]);

  const handleView = (id: number) => {
    setSelectedStateId(id);
    const st = rawStates.find((s: any) => s.id === id);
    if (st) setSelectedState(st);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("state")) {
      toast.error("You do not have permission to edit states");
      return;
    }
    setSelectedStateId(id);
    const st = rawStates.find((s: any) => s.id === id);
    if (st) {
      setSelectedState(st);
      formik.setValues({
        state_name: st.state_name || st.name || "",
        state_code: st.state_code || st.code || "",
      });
      setEditStateId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("state")) {
      toast.error("You do not have permission to delete states");
      return;
    }
    try {
      const response = await deleteState(id).unwrap();
      toast.success(response.message || "State deleted successfully");
      setDeleteStateId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete state");
    }
  };

  const handleAddState = () => {
    if (!canCreate("state")) {
      toast.error("You do not have permission to create states");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditStateId(null);
    setSelectedState(null);
    setSelectedStateId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawStates.length === 0) {
      toast.error("No states to export");
      return;
    }
    const headers = ["Internal ID", "State Code", "State Name"];
    const rows = rawStates.map((s: any) => [
      s.id,
      `"${s.state_code || s.code || ""}"`,
      `"${s.state_name || s.name || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `States_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("States List exported as CSV");
  };

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const activeState = selectedState || rawStates.find((s: any) => s.id === selectedStateId);

    if (!activeState) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>State record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to States List
          </button>
        </div>
      );
    }

    return (
      <RecordPageLayout
        recordType="State Master"
        subtitle={`${activeState.state_code || activeState.code} - ${activeState.state_name || activeState.name}`}
        mode="view"
        onEdit={() => handleEdit(activeState.id)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">INTERNAL ID</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeState.id}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">STATE CODE</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeState.state_code || activeState.code}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">STATE NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeState.state_name || activeState.name}</span>
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
          recordType="State Master"
          recordTitle={formik.values.state_name || (isEdit ? "Edit State Record" : "New State Record")}
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
                STATE CODE <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="state_code"
                value={formik.values.state_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. DL / MH / KA"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 uppercase font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                STATE NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="state_name"
                value={formik.values.state_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="State Name"
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
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">States</h1>
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
            <option value="All States">All States</option>
          </select>
        </div>

        {canCreate("state") && (
          <button
            onClick={handleAddState}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New State</span>
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
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {rawStates.length}</span>
      </div>

      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">STATE CODE</th>
              <th className="px-3 py-2 border-r border-slate-300">STATE NAME</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isStatesLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">Loading states...</td></tr>
            ) : rawStates.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No state records found.</td></tr>
            ) : (
              rawStates.map((row: any, idx: number) => (
                <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                    <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{row.state_code || row.code}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.state_name || row.name}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap">
                    {canDelete("state") && (
                      <button onClick={() => { setDeleteStateId(row.id); setDeleteDialogOpen(true); }} className="text-red-600 hover:underline font-semibold text-[11px]">
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
        title="Delete State"
        message="Are you sure you want to delete this state master record?"
        onConfirm={() => deleteStateId && handleDelete(deleteStateId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteStateId(null); }}
      />
    </div>
  );
};

export default StateComp;