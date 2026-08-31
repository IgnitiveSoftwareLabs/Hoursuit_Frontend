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
  useCreateCityMutation,
  useDeleteCityMutation,
  useGetCitiesQuery,
  useUpdateCityMutation,
} from "../RTK/services/cityApi";
import { useGetStatesQuery } from "../RTK/services/stateApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface CityType {
  id?: number;
  city_name: string;
  state_code_id: number | string;
}

const CityComp: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCityId, setDeleteCityId] = useState<number | null>(null);

  const { data: citiesData, isLoading: isCitiesLoading } = useGetCitiesQuery();
  const { data: statesData } = useGetStatesQuery();

  const [createCity, { isLoading: isCreating }] = useCreateCityMutation();
  const [updateCity, { isLoading: isUpdating }] = useUpdateCityMutation();
  const [deleteCity] = useDeleteCityMutation();

  const rawCities = Array.isArray(citiesData?.result)
    ? citiesData.result
    : Array.isArray(citiesData?.data)
    ? citiesData.data
    : Array.isArray(citiesData)
    ? citiesData
    : [];

  const rawStates = Array.isArray(statesData?.result)
    ? statesData.result
    : Array.isArray(statesData?.data)
    ? statesData.data
    : Array.isArray(statesData)
    ? statesData
    : [];

  const formik = useFormik<CityType>({
    initialValues: {
      city_name: "",
      state_code_id: "",
    },
    validationSchema: Yup.object({
      city_name: Yup.string()
        .min(2, "City Name must be at least 2 characters")
        .max(100, "City Name must be at most 100 characters")
        .required("City Name is required"),
      state_code_id: Yup.number()
        .positive("Please select a valid state")
        .required("State is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          city_name: values.city_name,
          state_code_id: Number(values.state_code_id),
        };

        if (isEdit && editCityId) {
          if (!canUpdate("city")) {
            toast.error("You do not have permission to update cities");
            return;
          }
          const response = await updateCity({ id: editCityId, payload }).unwrap();
          toast.success(response.message || "City updated successfully");
        } else {
          if (!canCreate("city")) {
            toast.error("You do not have permission to create cities");
            return;
          }
          const response = await createCity(payload).unwrap();
          toast.success(response.message || "City created successfully");
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
      setSelectedCityId(idNum);

      if (urlAction === "edit") {
        const ct = rawCities.find((c: any) => c.id === idNum);
        if (ct) {
          setSelectedCity(ct);
          formik.setValues({
            city_name: ct.city_name || ct.name || "",
            state_code_id: ct.state_code_id || ct.state?.id || "",
          });
          setEditCityId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const ctFallback = rawCities.find((c: any) => c.id === idNum);
        if (ctFallback) {
          setSelectedCity(ctFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditCityId(null);
        setSelectedCity(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedCityId(null);
    }
  }, [searchParams, rawCities.length]);

  const handleView = (id: number) => {
    setSelectedCityId(id);
    const ct = rawCities.find((c: any) => c.id === id);
    if (ct) setSelectedCity(ct);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("city")) {
      toast.error("You do not have permission to edit cities");
      return;
    }
    setSelectedCityId(id);
    const ct = rawCities.find((c: any) => c.id === id);
    if (ct) {
      setSelectedCity(ct);
      formik.setValues({
        city_name: ct.city_name || ct.name || "",
        state_code_id: ct.state_code_id || ct.state?.id || "",
      });
      setEditCityId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("city")) {
      toast.error("You do not have permission to delete cities");
      return;
    }
    try {
      const response = await deleteCity(id).unwrap();
      toast.success(response.message || "City deleted successfully");
      setDeleteCityId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete city");
    }
  };

  const handleAddCity = () => {
    if (!canCreate("city")) {
      toast.error("You do not have permission to create cities");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditCityId(null);
    setSelectedCity(null);
    setSelectedCityId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawCities.length === 0) {
      toast.error("No cities to export");
      return;
    }
    const headers = ["Internal ID", "City Name", "State Name"];
    const rows = rawCities.map((c: any) => [
      c.id,
      `"${c.city_name || c.name || ""}"`,
      `"${c.state?.state_name || c.state?.name || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cities_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Cities List exported as CSV");
  };

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const activeCity = selectedCity || rawCities.find((c: any) => c.id === selectedCityId);

    if (!activeCity) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>City record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Cities List
          </button>
        </div>
      );
    }

    const stateName = activeCity.state?.state_name || activeCity.state?.name || rawStates.find((st: any) => String(st.id) === String(activeCity.state_code_id))?.state_name || "N/A";

    return (
      <RecordPageLayout
        recordType="City Master"
        subtitle={`${activeCity.city_name || activeCity.name}`}
        mode="view"
        onEdit={() => handleEdit(activeCity.id)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">INTERNAL ID</span>
            <span className="text-xs font-mono font-bold text-slate-900">{activeCity.id}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">CITY NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeCity.city_name || activeCity.name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">STATE</span>
            <span className="text-xs font-semibold text-slate-800">{stateName}</span>
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
          recordType="City Master"
          recordTitle={formik.values.city_name || (isEdit ? "Edit City Record" : "New City Record")}
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
                CITY NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="city_name"
                value={formik.values.city_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="City Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                STATE <span className="text-amber-600">*</span>
              </label>
              <select
                name="state_code_id"
                value={formik.values.state_code_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select State --</option>
                {rawStates.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.state_name || st.name} ({st.state_code || st.code})
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
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Cities</h1>
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
            <option value="All Cities">All Cities</option>
          </select>
        </div>

        {canCreate("city") && (
          <button
            onClick={handleAddCity}
            className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New City</span>
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
        <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {rawCities.length}</span>
      </div>

      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">CITY NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">STATE</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isCitiesLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">Loading cities...</td></tr>
            ) : rawCities.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No city records found.</td></tr>
            ) : (
              rawCities.map((row: any, idx: number) => {
                const stName = row.state?.state_name || row.state?.name || rawStates.find((st: any) => String(st.id) === String(row.state_code_id))?.state_name || "N/A";
                return (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEdit(row.id)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(row.id)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.city_name || row.name}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-slate-800">{stName}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("city") && (
                        <button onClick={() => { setDeleteCityId(row.id); setDeleteDialogOpen(true); }} className="text-red-600 hover:underline font-semibold text-[11px]">
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
        title="Delete City"
        message="Are you sure you want to delete this city master record?"
        onConfirm={() => deleteCityId && handleDelete(deleteCityId)}
        onClose={() => { setDeleteDialogOpen(false); setDeleteCityId(null); }}
      />
    </div>
  );
};

export default CityComp;