import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useFetchWarehousesQuery,
  useFetchWarehouseByIdQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} from "../RTK/services/warehouseApi";
import CustomFileUpload from "../Common/CustomFileUpload";
import { BASE_URL } from "../utils/Base_Url";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface WarehouseFormValues {
  id?: number;
  name: string;
  location: string;
  licenseNumber: string;
  License_Number_validTill?: string;
  Utility_Certificate_validTill?: string;
  Fssai_Certificate_validTill?: string;
  License_Number?: File | null;
  Utility_Certificate?: File | null;
  Fssai_Certificate?: File | null;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Warehouse Name is required"),
  location: Yup.string().required("Location is required"),
  licenseNumber: Yup.string().required("License Number is required"),
});

const WareHouseComp: React.FC = () => {
  const { canCreate, canUpdate, canDelete, canRead } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: warehouseData, isLoading } = useFetchWarehousesQuery({ page: 1, limit: 100, search: "" });
  const { data: singleWarehouseData, isLoading: isSingleLoading } = useFetchWarehouseByIdQuery(selectedId!, {
    skip: !selectedId || viewMode !== "view",
  });

  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();

  const rawRecords = Array.isArray(warehouseData?.result)
    ? warehouseData.result
    : Array.isArray(warehouseData?.data)
    ? warehouseData.data
    : Array.isArray(warehouseData)
    ? warehouseData
    : [];

  const formik = useFormik<WarehouseFormValues>({
    initialValues: {
      name: "",
      location: "",
      licenseNumber: "",
      License_Number_validTill: "",
      Utility_Certificate_validTill: "",
      Fssai_Certificate_validTill: "",
      License_Number: null,
      Utility_Certificate: null,
      Fssai_Certificate: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("location", values.location);
        formData.append("licenseNumber", values.licenseNumber);

        if (values.License_Number) formData.append("License_Number", values.License_Number);
        if (values.License_Number_validTill) formData.append("License_Number_validTill", values.License_Number_validTill);

        if (values.Utility_Certificate) formData.append("Utility_Certificate", values.Utility_Certificate);
        if (values.Utility_Certificate_validTill) formData.append("Utility_Certificate_validTill", values.Utility_Certificate_validTill);

        if (values.Fssai_Certificate) formData.append("Fssai_Certificate", values.Fssai_Certificate);
        if (values.Fssai_Certificate_validTill) formData.append("Fssai_Certificate_validTill", values.Fssai_Certificate_validTill);

        if (isEdit && editId) {
          if (!canUpdate("warehouse")) {
            toast.error("You do not have permission to update warehouses");
            return;
          }
          await updateWarehouse({ id: editId, data: formData }).unwrap();
          toast.success("Warehouse updated successfully");
        } else {
          if (!canCreate("warehouse")) {
            toast.error("You do not have permission to create warehouses");
            return;
          }
          await createWarehouse(formData).unwrap();
          toast.success("Warehouse created successfully");
        }

        formik.resetForm();
        setViewMode("list");
        setIsEdit(false);
        setSearchParams({});
      } catch (error: any) {
        toast.error(error?.data?.message || error?.message || "Failed to save warehouse");
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
            name: rec.name || "",
            location: rec.location || "",
            licenseNumber: rec.licenseNumber || "",
            License_Number_validTill: rec.License_Number_validTill || "",
            Utility_Certificate_validTill: rec.Utility_Certificate_validTill || "",
            Fssai_Certificate_validTill: rec.Fssai_Certificate_validTill || "",
            License_Number: null,
            Utility_Certificate: null,
            Fssai_Certificate: null,
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
    if (!canUpdate("warehouse")) {
      toast.error("You do not have permission to edit warehouses");
      return;
    }
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) {
      setSelectedRecord(rec);
      formik.setValues({
        name: rec.name || "",
        location: rec.location || "",
        licenseNumber: rec.licenseNumber || "",
        License_Number_validTill: rec.License_Number_validTill || "",
        Utility_Certificate_validTill: rec.Utility_Certificate_validTill || "",
        Fssai_Certificate_validTill: rec.Fssai_Certificate_validTill || "",
        License_Number: null,
        Utility_Certificate: null,
        Fssai_Certificate: null,
      });
      setEditId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("warehouse")) {
      toast.error("You do not have permission to delete warehouses");
      return;
    }
    try {
      await deleteWarehouse(id).unwrap();
      toast.success("Warehouse deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete warehouse");
    }
  };

  const handleAddRecord = () => {
    if (!canCreate("warehouse")) {
      toast.error("You do not have permission to create warehouses");
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
    const headers = ["Internal ID", "Warehouse Name", "Location", "License Number"];
    const rows = rawRecords.map((r: any) => [
      r.id,
      `"${r.name || ""}"`,
      `"${r.location || ""}"`,
      `"${r.licenseNumber || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Warehouses_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Warehouses exported as CSV");
  };

  if (!canRead("warehouse")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view Warehouses.
      </div>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE WAREHOUSE BY ID API) ──
  if (viewMode === "view") {
    const activeRec =
      (singleWarehouseData?.result && typeof singleWarehouseData.result === "object" ? singleWarehouseData.result : null) ||
      (singleWarehouseData && typeof singleWarehouseData === "object" && !Array.isArray(singleWarehouseData) ? singleWarehouseData : null) ||
      selectedRecord ||
      rawRecords.find((r: any) => r.id === selectedId);

    if (isSingleLoading && !activeRec) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading warehouse details from API...</div>
        </div>
      );
    }

    if (!activeRec) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Warehouse record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Warehouses List
          </button>
        </div>
      );
    }

    return (
      <RecordPageLayout
        recordType="Warehouse"
        subtitle={`${activeRec.name}`}
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
            <span className="text-[10px] font-semibold text-slate-500 uppercase">WAREHOUSE NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeRec.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION</span>
            <span className="text-xs font-semibold text-slate-800">{activeRec.location}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">LICENSE NUMBER</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeRec.licenseNumber}</span>
          </div>
        </RecordSection>

        {activeRec.attachments && activeRec.attachments.length > 0 && (
          <RecordSection title="Certificates & Compliance Attachments" defaultOpen={true}>
            {activeRec.attachments.map((att: any) => (
              <div key={att.id} className="flex flex-col space-y-1 bg-slate-50 p-2 border border-slate-200 rounded-xs">
                <span className="text-[10px] font-bold text-slate-600 uppercase">{att.type?.replace(/_/g, " ")}</span>
                <span className="text-xs text-slate-800">{att.fileName}</span>
                {att.validTill && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Valid Till: {new Date(att.validTill).toLocaleDateString()}
                  </span>
                )}
                <a
                  href={`${BASE_URL}/${att.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-700 hover:underline pt-1"
                >
                  View / Download Document
                </a>
              </div>
            ))}
          </RecordSection>
        )}
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Warehouse"
          recordTitle={formik.values.name || (isEdit ? "Edit Warehouse Record" : "New Warehouse Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                WAREHOUSE NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Warehouse Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
              {formik.touched.name && formik.errors.name && (
                <span className="text-[10px] text-red-600 font-semibold">{formik.errors.name}</span>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                LOCATION <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Physical Location / Address"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
              {formik.touched.location && formik.errors.location && (
                <span className="text-[10px] text-red-600 font-semibold">{formik.errors.location}</span>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                LICENSE NUMBER <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formik.values.licenseNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="License Number"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
              />
              {formik.touched.licenseNumber && formik.errors.licenseNumber && (
                <span className="text-[10px] text-red-600 font-semibold">{formik.errors.licenseNumber}</span>
              )}
            </div>
          </RecordSection>

          <RecordSection title="Certificates & Compliance Attachments" defaultOpen={true}>
            <div className="flex flex-col space-y-2">
              <CustomFileUpload
                name="License_Number"
                label="License Certificate"
                accept="application/pdf,image/*"
                maxSize={10}
                onFileSelect={(files) => formik.setFieldValue("License_Number", files[0] || null)}
                value={formik.values.License_Number}
                showPreview
              />
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                <input
                  type="date"
                  name="License_Number_validTill"
                  value={formik.values.License_Number_validTill}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <CustomFileUpload
                name="Utility_Certificate"
                label="Utility Certificate"
                accept="application/pdf,image/*"
                maxSize={10}
                onFileSelect={(files) => formik.setFieldValue("Utility_Certificate", files[0] || null)}
                value={formik.values.Utility_Certificate}
                showPreview
              />
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                <input
                  type="date"
                  name="Utility_Certificate_validTill"
                  value={formik.values.Utility_Certificate_validTill}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <CustomFileUpload
                name="Fssai_Certificate"
                label="FSSAI Certificate"
                accept="application/pdf,image/*"
                maxSize={10}
                onFileSelect={(files) => formik.setFieldValue("Fssai_Certificate", files[0] || null)}
                value={formik.values.Fssai_Certificate}
                showPreview
              />
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Valid Till</label>
                <input
                  type="date"
                  name="Fssai_Certificate_validTill"
                  value={formik.values.Fssai_Certificate_validTill}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                />
              </div>
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
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Warehouses</h1>
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
            <option value="All">All Warehouses</option>
          </select>
        </div>

        {canCreate("warehouse") && (
          <button
            onClick={handleAddRecord}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New Warehouse</span>
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
              <th className="px-3 py-2 border-r border-slate-300">WAREHOUSE NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">LOCATION</th>
              <th className="px-3 py-2 border-r border-slate-300">LICENSE NUMBER</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Loading warehouses...</td></tr>
            ) : rawRecords.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No warehouses found.</td></tr>
            ) : (
              rawRecords.map((row: any, idx: number) => (
                <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                    <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.name}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{row.location}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-700">{row.licenseNumber}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap">
                    {canDelete("warehouse") && (
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
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse record?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default WareHouseComp;
