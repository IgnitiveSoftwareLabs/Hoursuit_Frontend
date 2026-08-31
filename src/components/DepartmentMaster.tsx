import React, { useState } from "react";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "../RTK/services/departmentApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

const DepartmentMasterComp: React.FC = () => {
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: departmentData, isLoading } = useGetDepartmentsQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const departments = Array.isArray(departmentData?.result) ? departmentData.result : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];

  const formik = useFormik({
    initialValues: {
      department_name: "",
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      department_name: Yup.string().required("Department name is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          department_name: values.department_name,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          const res = await updateDepartment({ id: editId, payload }).unwrap();
          toast.success(res.message || "Department updated successfully");
        } else {
          const res = await createDepartment(payload).unwrap();
          toast.success(res.message || "Department created successfully");
        }
        formik.resetForm();
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
      } catch (err: any) {
        toast.error(err?.data?.message || err?.message || "Operation failed");
      }
    },
  });

  const handleEdit = (record: any) => {
    setIsEdit(true);
    setEditId(record.id);
    formik.setValues({
      department_name: record.department_name || "",
      subsidiary_id: record.subsidiary_id || "",
      isActive: record.isActive ?? true,
    });
    setViewMode("form");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await deleteDepartment(id).unwrap();
      toast.success(res.message || "Department deleted successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete department");
    }
  };

  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800 p-4">
      <div className="flex items-center justify-between border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-emerald-600 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d]">Department Master</h1>
        </div>
        {viewMode === "list" ? (
          <button
            onClick={() => {
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
              setViewMode("form");
            }}
            className="h-8 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs transition-colors flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>New Department</span>
          </button>
        ) : (
          <button
            onClick={() => setViewMode("list")}
            className="h-8 px-3 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-xs transition-colors"
          >
            Back to List
          </button>
        )}
      </div>

      {viewMode === "form" ? (
        <form onSubmit={formik.handleSubmit} className="bg-white border border-slate-300 p-4 rounded-xs max-w-lg space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase">
              DEPARTMENT NAME <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              name="department_name"
              value={formik.values.department_name}
              onChange={formik.handleChange}
              placeholder="e.g. Sales / Operations"
              className="h-8 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
            />
            {formik.touched.department_name && formik.errors.department_name && (
              <span className="text-[10px] text-red-500">{formik.errors.department_name}</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase">SUBSIDIARY</label>
            <select
              name="subsidiary_id"
              value={formik.values.subsidiary_id}
              onChange={formik.handleChange}
              className="h-8 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Select Subsidiary --</option>
              {subsidiaries.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.subsidiary_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="h-8 px-4 bg-[#0070d2] text-white text-xs font-semibold rounded-xs"
            >
              {isEdit ? "Update Department" : "Save Department"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="h-8 px-4 bg-slate-200 text-slate-700 text-xs font-semibold rounded-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-300 rounded-xs overflow-x-auto">
          {isLoading ? (
            <div className="p-4 text-xs text-slate-500">Loading departments...</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                  <th className="p-2 border-r border-slate-200">ID</th>
                  <th className="p-2 border-r border-slate-200">DEPARTMENT NAME</th>
                  <th className="p-2 border-r border-slate-200">SUBSIDIARY</th>
                  <th className="p-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept: any) => (
                    <tr key={dept.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200">{dept.id}</td>
                      <td className="p-2 border-r border-slate-200 font-medium">{dept.department_name}</td>
                      <td className="p-2 border-r border-slate-200">
                        {dept.subsidiary?.subsidiary_name || "—"}
                      </td>
                      <td className="p-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="text-sky-600 hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="text-red-600 hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentMasterComp;
