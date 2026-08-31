import React, { useMemo, useState } from "react";
import { Add, Delete, Edit, List as ListIcon, Search, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import {
  useGetPaymentTermsQuery,
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation,
} from "../RTK/services/paymentTermApi";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

const TermMasterComp: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: paymentTermsData, refetch: refetchTerms, isLoading } = useGetPaymentTermsQuery();
  const [createPaymentTerm, { isLoading: isCreating }] = useCreatePaymentTermMutation();
  const [updatePaymentTerm, { isLoading: isUpdating }] = useUpdatePaymentTermMutation();
  const [deletePaymentTerm] = useDeletePaymentTermMutation();

  const paymentTerms = useMemo(() => {
    return Array.isArray(paymentTermsData?.result)
      ? paymentTermsData.result
      : Array.isArray((paymentTermsData as any)?.data)
      ? (paymentTermsData as any).data
      : Array.isArray(paymentTermsData)
      ? paymentTermsData
      : [];
  }, [paymentTermsData]);

  const formik = useFormik({
    initialValues: {
      name: "",
      term_type: "STANDARD" as "STANDARD" | "DATE_DRIVEN",
      days_till_net_due: 30,
      discount_percent: 0,
      days_till_discount_expires: 0,
      day_of_month_net_due: "",
      due_next_month_if_within_days: "",
      date_discount_percent: "",
      day_discount_expires: "",
      is_installment: false,
      is_preferred: false,
      isActive: true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Term name is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const payload = {
          ...values,
          days_till_net_due: values.term_type === "STANDARD" ? Number(values.days_till_net_due || 0) : null,
          discount_percent: values.term_type === "STANDARD" ? Number(values.discount_percent || 0) : null,
          days_till_discount_expires: values.term_type === "STANDARD" ? Number(values.days_till_discount_expires || 0) : null,
          day_of_month_net_due: values.term_type === "DATE_DRIVEN" ? Number(values.day_of_month_net_due || 0) : null,
          due_next_month_if_within_days: values.term_type === "DATE_DRIVEN" ? Number(values.due_next_month_if_within_days || 0) : null,
          date_discount_percent: values.term_type === "DATE_DRIVEN" ? Number(values.date_discount_percent || 0) : null,
          day_discount_expires: values.term_type === "DATE_DRIVEN" ? Number(values.day_discount_expires || 0) : null,
        };

        if (isEdit && editId) {
          await updatePaymentTerm({ id: editId, payload }).unwrap();
          toast.success("Payment Term updated successfully.");
        } else {
          await createPaymentTerm(payload).unwrap();
          toast.success("Payment Term created successfully.");
        }
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
        resetForm();
        refetchTerms();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to save Payment Term.");
      }
    },
  });

  const handleEdit = (id: number | string) => {
    const term = paymentTerms.find((t: any) => String(t.id) === String(id));
    if (!term) return;

    formik.setValues({
      name: term.name || "",
      term_type: (term.term_type as "STANDARD" | "DATE_DRIVEN") || "STANDARD",
      days_till_net_due: term.days_till_net_due ?? 30,
      discount_percent: term.discount_percent ?? 0,
      days_till_discount_expires: term.days_till_discount_expires ?? 0,
      day_of_month_net_due: term.day_of_month_net_due ?? "",
      due_next_month_if_within_days: term.due_next_month_if_within_days ?? "",
      date_discount_percent: term.date_discount_percent ?? "",
      day_discount_expires: term.day_discount_expires ?? "",
      is_installment: Boolean(term.is_installment),
      is_preferred: Boolean(term.is_preferred),
      isActive: term.isActive ?? true,
    });
    setEditId(id);
    setIsEdit(true);
    setViewMode("form");
  };

  const handleView = (id: number | string) => {
    const term = paymentTerms.find((t: any) => String(t.id) === String(id));
    if (term) {
      setSelectedTerm(term);
      setViewMode("view");
    }
  };

  const confirmDelete = async () => {
    if (!termToDelete) return;
    try {
      await deletePaymentTerm(termToDelete.id).unwrap();
      toast.success("Payment Term deleted successfully.");
      refetchTerms();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Payment Term.");
    } finally {
      setDeleteDialogOpen(false);
      setTermToDelete(null);
    }
  };

  const filteredTerms = paymentTerms.filter((t: any) => {
    if (!searchTerm.trim()) return true;
    return String(t.name || "").toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  if (viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const activeTerm = isView ? selectedTerm : formik.values;

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Term"
          subtitle={isView ? activeTerm.name : isEdit ? `Edit Term #${editId}` : "New Term"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={() => { if (selectedTerm) handleEdit(selectedTerm.id); }}
          onBack={() => setViewMode("list")}
          onCancel={() => setViewMode("list")}
          onListClick={() => setViewMode("list")}
          onSearchClick={() => setViewMode("list")}
          isSaving={isCreating || isUpdating}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-3">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    TERMS <span className="text-amber-600">*</span>
                  </label>
                  {isView ? (
                    <span className="text-xs font-bold text-slate-900">{activeTerm.name}</span>
                  ) : (
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter term name (e.g. Net 30)"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`h-7 text-xs bg-white border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                        formik.touched.name && formik.errors.name ? "border-red-500 bg-red-50" : "border-slate-300"
                      }`}
                    />
                  )}
                </div>

                {/* STANDARD RADIO & FIELDS */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="standard_type"
                      name="term_type"
                      value="STANDARD"
                      checked={formik.values.term_type === "STANDARD"}
                      onChange={() => formik.setFieldValue("term_type", "STANDARD")}
                      disabled={isView}
                    />
                    <label htmlFor="standard_type" className="text-xs font-bold uppercase text-slate-800 cursor-pointer">
                      STANDARD
                    </label>
                  </div>

                  <div className="pl-6 space-y-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">DAYS TILL NET DUE</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.days_till_net_due ?? "—"}</span>
                      ) : (
                        <input
                          type="number"
                          name="days_till_net_due"
                          disabled={formik.values.term_type !== "STANDARD"}
                          value={formik.values.days_till_net_due}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">% DISCOUNT</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.discount_percent ?? "0"}%</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          name="discount_percent"
                          disabled={formik.values.term_type !== "STANDARD"}
                          value={formik.values.discount_percent}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">DAYS TILL DISCOUNT EXPIRES</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.days_till_discount_expires ?? "0"}</span>
                      ) : (
                        <input
                          type="number"
                          name="days_till_discount_expires"
                          disabled={formik.values.term_type !== "STANDARD"}
                          value={formik.values.days_till_discount_expires}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2 border-b border-slate-200 pb-3">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_installment"
                      checked={isView ? Boolean(activeTerm.is_installment) : formik.values.is_installment}
                      onChange={formik.handleChange}
                      disabled={isView}
                    />
                    <span>INSTALLMENT</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_preferred"
                      checked={isView ? Boolean(activeTerm.is_preferred) : formik.values.is_preferred}
                      onChange={formik.handleChange}
                      disabled={isView}
                    />
                    <span>PREFERRED</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={isView ? Boolean(activeTerm.isActive) : formik.values.isActive}
                      onChange={formik.handleChange}
                      disabled={isView}
                    />
                    <span>ACTIVE</span>
                  </label>
                </div>

                {/* DATE DRIVEN RADIO & FIELDS */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="datedriven_type"
                      name="term_type"
                      value="DATE_DRIVEN"
                      checked={formik.values.term_type === "DATE_DRIVEN"}
                      onChange={() => formik.setFieldValue("term_type", "DATE_DRIVEN")}
                      disabled={isView}
                    />
                    <label htmlFor="datedriven_type" className="text-xs font-bold uppercase text-slate-800 cursor-pointer">
                      DATE DRIVEN
                    </label>
                  </div>

                  <div className="pl-6 space-y-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">DAY OF MONTH NET DUE</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.day_of_month_net_due ?? "—"}</span>
                      ) : (
                        <input
                          type="number"
                          name="day_of_month_net_due"
                          disabled={formik.values.term_type !== "DATE_DRIVEN"}
                          value={formik.values.day_of_month_net_due}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">DUE NEXT MONTH IF WITHIN DAYS</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.due_next_month_if_within_days ?? "—"}</span>
                      ) : (
                        <input
                          type="number"
                          name="due_next_month_if_within_days"
                          disabled={formik.values.term_type !== "DATE_DRIVEN"}
                          value={formik.values.due_next_month_if_within_days}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">% DISCOUNT</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.date_discount_percent ?? "—"}%</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          name="date_discount_percent"
                          disabled={formik.values.term_type !== "DATE_DRIVEN"}
                          value={formik.values.date_discount_percent}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase">DAY DISCOUNT EXPIRES</label>
                      {isView ? (
                        <span className="text-xs text-slate-900">{activeTerm.day_discount_expires ?? "—"}</span>
                      ) : (
                        <input
                          type="number"
                          name="day_discount_expires"
                          disabled={formik.values.term_type !== "DATE_DRIVEN"}
                          value={formik.values.day_discount_expires}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Payment Terms</h1>
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button onClick={() => setViewMode("list")} className="text-sky-700 hover:underline cursor-pointer flex items-center space-x-1">
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          {canCreate("vendor") && (
            <button
              type="button"
              onClick={() => {
                setViewMode("form");
                setIsEdit(false);
                setEditId(null);
                formik.resetForm();
              }}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Payment Term</span>
            </button>
          )}
        </div>

        <div className="w-64">
          <input
            type="text"
            placeholder="Search Terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded-xs focus:outline-none focus:border-sky-600"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-24 text-center">EDIT | VIEW</th>
              <th className="p-2 border-r border-slate-300 min-w-[150px]">TERM NAME</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">TYPE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right">NET DUE (DAYS)</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right">DISCOUNT %</th>
              <th className="p-2 border-r border-slate-300 w-24 text-center">STATUS</th>
              <th className="p-2 w-20 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTerms.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic font-medium">
                  No payment terms found.
                </td>
              </tr>
            ) : (
              filteredTerms.map((term: any) => (
                <tr key={term.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                    <button onClick={() => handleEdit(term.id)} className="text-sky-700 hover:underline cursor-pointer">
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleView(term.id)} className="text-sky-700 hover:underline cursor-pointer">
                      View
                    </button>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{term.name}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">{term.term_type}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">{term.days_till_net_due ?? "—"}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">{term.discount_percent ?? 0}%</td>
                  <td className="p-2 border-r border-slate-200 text-center">
                    <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${term.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {term.isActive !== false ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => {
                        setTermToDelete(term);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Payment Term"
        message="Are you sure you want to delete this payment term?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default TermMasterComp;
