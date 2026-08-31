import React, { useState } from "react";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} from "../RTK/services/classApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

const ClassMasterComp: React.FC = () => {
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: classData, isLoading } = useGetClassesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();
  const [deleteClass] = useDeleteClassMutation();

  const classes = Array.isArray(classData?.result) ? classData.result : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];

  const formik = useFormik({
    initialValues: {
      class_name: "",
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      class_name: Yup.string().required("Class name is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          class_name: values.class_name,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          const res = await updateClass({ id: editId, payload }).unwrap();
          toast.success(res.message || "Class updated successfully");
        } else {
          const res = await createClass(payload).unwrap();
          toast.success(res.message || "Class created successfully");
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
      class_name: record.class_name || "",
      subsidiary_id: record.subsidiary_id || "",
      isActive: record.isActive ?? true,
    });
    setViewMode("form");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      const res = await deleteClass(id).unwrap();
      toast.success(res.message || "Class deleted successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete class");
    }
  };

  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800 p-4">
      <div className="flex items-center justify-between border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d]">Class Master</h1>
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
            <span>New Class</span>
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
              CLASS NAME <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              name="class_name"
              value={formik.values.class_name}
              onChange={formik.handleChange}
              placeholder="e.g. Technology"
              className="h-8 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
            />
            {formik.touched.class_name && formik.errors.class_name && (
              <span className="text-[10px] text-red-500">{formik.errors.class_name}</span>
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
              {isEdit ? "Update Class" : "Save Class"}
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
            <div className="p-4 text-xs text-slate-500">Loading classes...</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                  <th className="p-2 border-r border-slate-200">ID</th>
                  <th className="p-2 border-r border-slate-200">CLASS NAME</th>
                  <th className="p-2 border-r border-slate-200">SUBSIDIARY</th>
                  <th className="p-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No classes found.
                    </td>
                  </tr>
                ) : (
                  classes.map((cls: any) => (
                    <tr key={cls.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200">{cls.id}</td>
                      <td className="p-2 border-r border-slate-200 font-medium">{cls.class_name}</td>
                      <td className="p-2 border-r border-slate-200">
                        {cls.subsidiary?.subsidiary_name || "—"}
                      </td>
                      <td className="p-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="text-sky-600 hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
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

export default ClassMasterComp;
