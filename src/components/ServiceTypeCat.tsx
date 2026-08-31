import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateServiceTypeMutation,
  useDeleteServiceTypeMutation,
  useGetServiceTypesQuery,
  useGetSingleServiceTypeQuery,
  useUpdateServiceTypeMutation,
} from "../RTK/services/serviceTypeApi";
import { useGetServiceCategoriesQuery } from "../RTK/services/serviceCategoryApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface ServiceTypeType {
  id?: number;
  service_name: string;
  uom_id: number | string;
  service_category_id?: number | string | null;
  subsidiary_id?: number | string | null;
  isActive?: boolean;
}

const ServiceTypeComp: React.FC = () => {
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

  const { data: serviceTypesData, isLoading } = useGetServiceTypesQuery();
  const { data: singleRecordData, isLoading: isSingleLoading } = useGetSingleServiceTypeQuery(selectedId!, {
    skip: !selectedId || viewMode !== "view",
  });
  const { data: categoriesData } = useGetServiceCategoriesQuery();
  const { data: uomData } = useGetUOMsQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createServiceType, { isLoading: isCreating }] = useCreateServiceTypeMutation();
  const [updateServiceType, { isLoading: isUpdating }] = useUpdateServiceTypeMutation();
  const [deleteServiceType] = useDeleteServiceTypeMutation();

  const rawRecords = Array.isArray(serviceTypesData?.result)
    ? serviceTypesData.result
    : Array.isArray(serviceTypesData?.data)
    ? serviceTypesData.data
    : Array.isArray(serviceTypesData)
    ? serviceTypesData
    : [];

  const categories = Array.isArray(categoriesData?.result) ? categoriesData.result : [];
  const uomList = Array.isArray(uomData?.result) ? uomData.result : [];
  const rawSubsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];

  const formik = useFormik<ServiceTypeType>({
    initialValues: {
      service_name: "",
      uom_id: "",
      service_category_id: "",
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      service_name: Yup.string()
        .min(2, "Service Name must be at least 2 characters")
        .max(200, "Service Name must be at most 200 characters")
        .required("Service Name is required"),
      uom_id: Yup.number().required("Select UOM"),
      service_category_id: Yup.mixed().optional().nullable(),
      subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          service_name: values.service_name,
          uom_id: Number(values.uom_id),
          service_category_id: values.service_category_id ? Number(values.service_category_id) : null,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("servicetype")) {
            toast.error("You do not have permission to update service types");
            return;
          }
          const response = await updateServiceType({ id: editId, payload }).unwrap();
          toast.success(response.message || "Service Type updated successfully");
        } else {
          if (!canCreate("servicetype")) {
            toast.error("You do not have permission to create service types");
            return;
          }
          const response = await createServiceType(payload).unwrap();
          toast.success(response.message || "Service Type created successfully");
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
            service_name: rec.service_name || rec.name || "",
            uom_id: rec.uom_id || rec.uom?.id || "",
            service_category_id: rec.service_category_id || rec.serviceCategory?.id || "",
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
    if (!canUpdate("servicetype")) {
      toast.error("You do not have permission to edit service types");
      return;
    }
    setSelectedId(id);
    const rec = rawRecords.find((r: any) => r.id === id);
    if (rec) {
      setSelectedRecord(rec);
      formik.setValues({
        service_name: rec.service_name || rec.name || "",
        uom_id: rec.uom_id || rec.uom?.id || "",
        service_category_id: rec.service_category_id || rec.serviceCategory?.id || "",
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
    if (!canDelete("servicetype")) {
      toast.error("You do not have permission to delete service types");
      return;
    }
    try {
      const response = await deleteServiceType(id).unwrap();
      toast.success(response.message || "Service Type deleted successfully");
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleAddRecord = () => {
    if (!canCreate("servicetype")) {
      toast.error("You do not have permission to create service types");
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
    const headers = ["Internal ID", "Service Name", "Category", "UOM", "Subsidiary", "Status"];
    const rows = rawRecords.map((r: any) => [
      r.id,
      `"${r.service_name || r.name || ""}"`,
      `"${r.serviceCategory?.category_name || "N/A"}"`,
      `"${r.uom?.uom_name || r.uom?.name || "N/A"}"`,
      `"${r.subsidiary?.subsidiary_name || "N/A"}"`,
      r.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Service_Types_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Service Types exported as CSV");
  };

  if (!canRead("servicetype")) {
    return (
      <div className="p-6 bg-white rounded border border-slate-200 text-xs text-slate-600">
        You do not have permission to view Service Types.
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
          <div>Loading service type details from API...</div>
        </div>
      );
    }

    if (!activeRec) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Service type record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to List
          </button>
        </div>
      );
    }

    const catName = activeRec.serviceCategory?.category_name || categories.find((c: any) => String(c.id) === String(activeRec.service_category_id))?.category_name || "N/A";
    const uomName = activeRec.uom?.uom_name || activeRec.uom?.name || uomList.find((u: any) => String(u.id) === String(activeRec.uom_id))?.uom_name || "N/A";
    const subName = activeRec.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeRec.subsidiary_id))?.subsidiary_name || "N/A";

    return (
      <RecordPageLayout
        recordType="Service Type"
        subtitle={`${activeRec.service_name || activeRec.name}`}
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
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SERVICE NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeRec.service_name || activeRec.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SERVICE CATEGORY</span>
            <span className="text-xs font-semibold text-slate-800">{catName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">UOM</span>
            <span className="text-xs font-semibold text-slate-800">{uomName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{subName}</span>
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
          recordType="Service Type"
          recordTitle={formik.values.service_name || (isEdit ? "Edit Service Type" : "New Service Type")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                SERVICE NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="service_name"
                value={formik.values.service_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Service Type Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">SERVICE CATEGORY</label>
              <select
                name="service_category_id"
                value={formik.values.service_category_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                UOM <span className="text-amber-600">*</span>
              </label>
              <select
                name="uom_id"
                value={formik.values.uom_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select UOM --</option>
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.uom_name || u.name}
                  </option>
                ))}
              </select>
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
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Service Types</h1>
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
            <option value="All">All Service Types</option>
          </select>
        </div>

        {canCreate("servicetype") && (
          <button
            onClick={handleAddRecord}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New Service Type</span>
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
              <th className="px-3 py-2 border-r border-slate-300">SERVICE NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">CATEGORY</th>
              <th className="px-3 py-2 border-r border-slate-300">UOM</th>
              <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 italic">Loading service types...</td></tr>
            ) : rawRecords.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 italic">No records found.</td></tr>
            ) : (
              rawRecords.map((row: any, idx: number) => {
                const catName = row.serviceCategory?.category_name || categories.find((c: any) => String(c.id) === String(row.service_category_id))?.category_name || "N/A";
                const uomName = row.uom?.uom_name || row.uom?.name || uomList.find((u: any) => String(u.id) === String(row.uom_id))?.uom_name || "N/A";
                const subName = row.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(row.subsidiary_id))?.subsidiary_name || "N/A";

                return (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.service_name || row.name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200">{catName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200">{uomName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-700">{subName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("servicetype") && (
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
        title="Delete Service Type"
        message="Are you sure you want to delete this service type?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
      />
    </div>
  );
};

export default ServiceTypeComp;