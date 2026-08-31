import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "@mui/material";
import { Add, Search, List as ListIcon, GetApp, Print } from "@mui/icons-material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import Layout from "../../components/Layout";
import InfiniteScrollAutocomplete from "../../Common/InfiniteScroll";
import { useAppDispatch, useAppSelector } from "../../Hooks/Reduxhook/hooks";
import {
  setLoading,
  setCreating,
  setError,
  setVouchers,
  addVoucher,
  setSelectedVoucher,
  setPagination,
  updateFilters,
  clearError,
} from "../../Redux/VoucherSlice";
import {
  createVoucherApi,
  getVouchersApi,
  getVoucherByIdApi,
} from "../../Services/Admin/VoucherApiservice";
import { useLazyGetCustomersQuery } from "../../RTK/services/customerApi";
import { usePermissions } from "../../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "../../components/Layout/RecordPageLayout";
import ConfirmationDialog from "../../components/Dialog/ConfirmationDialog";

const VoucherPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canCreate, canRead } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const { vouchers, isLoading, isCreating, error, pagination, filters, selectedVoucher } = useAppSelector((state) => state.voucher);

  // View Modes: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [singleVoucherDetails, setSingleVoucherDetails] = useState<any | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, hasMore: true });

  const [getCustomers] = useLazyGetCustomersQuery();

  const paymentModes = [
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "neft", label: "NEFT" },
    { value: "imps", label: "IMPS" },
    { value: "upi", label: "UPI" },
  ];

  const voucherValidationSchema = Yup.object({
    customerId: Yup.number().required("Customer is required"),
    transactionAmount: Yup.number()
      .required("Transaction amount is required")
      .positive("Amount must be greater than 0"),
    paymentMode: Yup.string().required("Payment mode is required"),
    voucherDate: Yup.date().required("Voucher date is required"),
    chequeNumber: Yup.string().when("paymentMode", {
      is: "cheque",
      then: (schema) => schema.required("Cheque number is required for cheque payments"),
      otherwise: (schema) => schema.notRequired(),
    }),
    chequeDate: Yup.date().when("paymentMode", {
      is: "cheque",
      then: (schema) => schema.required("Cheque date is required for cheque payments"),
      otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when("paymentMode", {
      is: "cheque",
      then: (schema) => schema.required("Bank name is required for cheque payments"),
      otherwise: (schema) => schema.notRequired(),
    }),
    upiId: Yup.string().when("paymentMode", {
      is: "upi",
      then: (schema) => schema.required("UPI ID is required for UPI payments"),
      otherwise: (schema) => schema.notRequired(),
    }),
    remarks: Yup.string(),
  });

  const voucherInitialValues = {
    customerId: null,
    transactionAmount: "",
    paymentMode: "cash",
    voucherDate: dayjs().format("YYYY-MM-DD"),
    chequeNumber: "",
    chequeDate: dayjs().format("YYYY-MM-DD"),
    bankName: "",
    upiId: "",
    remarks: "",
  };

  const fetchCustomers = useCallback(
    async (page: number, _limit: number, search: string, append: boolean) => {
      try {
        const result = await getCustomers({ page, search: search || "" });
        const data = result.data;
        const newOptions = data?.result || [];
        if (append) {
          setCustomerOptions((prev) => [...prev, ...newOptions]);
        } else {
          setCustomerOptions(newOptions);
        }
        setCustomerPagination({
          page,
          hasMore: page < (data?.pagination?.totalPages || 1),
        });
      } catch (error) {
        toast.error("Failed to fetch customers");
      }
    },
    [getCustomers]
  );

  const fetchVouchers = useCallback(
    async (params: any = {}) => {
      if (!canRead("voucher")) return;
      try {
        dispatch(setLoading(true));
        dispatch(clearError());
        const response = await getVouchersApi({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
          ...params,
        });

        if (response.success) {
          dispatch(setVouchers(response.result));
          dispatch(setPagination(response.pagination));
        } else {
          dispatch(setError(response.message || "Failed to fetch vouchers"));
        }
      } catch (error: any) {
        dispatch(setError(error.message || "An error occurred while fetching vouchers"));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, pagination.page, pagination.limit, filters, canRead]
  );

  useEffect(() => {
    fetchVouchers();
    fetchCustomers(1, 20, "", false);
  }, []);

  // Fetch single voucher details by ID
  const fetchSingleVoucher = async (id: number) => {
    try {
      setIsSingleLoading(true);
      const response = await getVoucherByIdApi(id);
      if (response.success) {
        setSingleVoucherDetails(response.result);
      } else {
        toast.error(response.message || "Failed to load voucher details");
      }
    } catch (err: any) {
      toast.error("Error loading voucher record");
    } finally {
      setIsSingleLoading(false);
    }
  };

  // URL search parameter page routing
  useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlId) {
      const idNum = Number(urlId);
      setSelectedVoucherId(idNum);

      if (urlAction === "view") {
        fetchSingleVoucher(idNum);
        setViewMode("view");
      } else {
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
    } else {
      setViewMode("list");
      setSelectedVoucherId(null);
    }
  }, [searchParams]);

  const handleView = (id: number) => {
    setSelectedVoucherId(id);
    fetchSingleVoucher(id);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleCreateSubmit = async (values: any, { resetForm }: any) => {
    if (!canCreate("voucher")) {
      toast.error("You do not have permission to create vouchers");
      return;
    }
    try {
      dispatch(setCreating(true));
      const voucherData = {
        customer_id: values.customerId,
        transaction_amount: Number(values.transactionAmount),
        payment_mode: values.paymentMode,
        voucher_date: dayjs(values.voucherDate).format("YYYY-MM-DD"),
        cheque_number: values.paymentMode === "cheque" ? values.chequeNumber : undefined,
        cheque_date: values.paymentMode === "cheque" ? dayjs(values.chequeDate).format("YYYY-MM-DD") : undefined,
        bank_name: values.paymentMode === "cheque" ? values.bankName : undefined,
        upi_id: values.paymentMode === "upi" ? values.upiId : undefined,
        remarks: values.remarks || undefined,
      };

      const response = await createVoucherApi(voucherData);
      if (response.success) {
        toast.success("Voucher created successfully!");
        dispatch(addVoucher(response.result));
        resetForm();
        setViewMode("list");
        setSearchParams({});
        fetchVouchers();
      } else {
        toast.error(response.message || "Failed to create voucher");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while creating voucher");
    } finally {
      dispatch(setCreating(false));
    }
  };

  const handleExportCSV = () => {
    if (vouchers.length === 0) {
      toast.error("No vouchers to export");
      return;
    }
    const headers = ["Voucher No", "Customer", "Amount", "Payment Mode", "Voucher Date"];
    const rows = vouchers.map((v: any) => [
      `"${v.voucher_number || `VCH-${v.id}`}"`,
      `"${v.customer?.customer_name || v.customer?.name || "N/A"}"`,
      v.transaction_amount || 0,
      `"${v.payment_mode || ""}"`,
      v.voucher_date ? new Date(v.voucher_date).toLocaleDateString() : "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `General_Ledger_Vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vouchers exported as CSV");
  };

  if (!canRead("voucher")) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-600 text-xs font-semibold">
          Access Denied: Insufficient permissions to view vouchers.
        </div>
      </Layout>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET VOUCHER BY ID API) ──
  if (viewMode === "view") {
    const activeVoucher = singleVoucherDetails || vouchers.find((v: any) => v.id === selectedVoucherId);

    if (isSingleLoading && !activeVoucher) {
      return (
        <Layout>
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            <CircularProgress size={24} className="mb-2" />
            <div>Loading voucher record from API...</div>
          </div>
        </Layout>
      );
    }

    if (!activeVoucher) {
      return (
        <Layout>
          <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
            <div>Voucher record unavailable.</div>
            <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
              Back to Vouchers List
            </button>
          </div>
        </Layout>
      );
    }

    const customerName = activeVoucher.customer?.customer_name || activeVoucher.customer?.name || "N/A";

    return (
      <Layout>
        <RecordPageLayout
          recordType="General Ledger Voucher"
          subtitle={`${activeVoucher.voucher_number || `VCH-${activeVoucher.id}`}`}
          mode="view"
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">VOUCHER NUMBER</span>
              <span className="text-xs font-mono font-bold text-slate-900">{activeVoucher.voucher_number || `VCH-${activeVoucher.id}`}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">CUSTOMER</span>
              <span className="text-xs font-bold text-slate-900">{customerName}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">TRANSACTION AMOUNT</span>
              <span className="text-xs font-mono font-bold text-emerald-700">₹{activeVoucher.transaction_amount}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">PAYMENT MODE</span>
              <span className="text-xs font-semibold text-sky-800 uppercase">{activeVoucher.payment_mode}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">VOUCHER DATE</span>
              <span className="text-xs font-mono text-slate-800">
                {activeVoucher.voucher_date ? new Date(activeVoucher.voucher_date).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </RecordSection>

          {(activeVoucher.cheque_number || activeVoucher.bank_name || activeVoucher.upi_id || activeVoucher.remarks) && (
            <RecordSection title="Transaction Details & Remarks" defaultOpen={true}>
              {activeVoucher.cheque_number && (
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">CHEQUE NUMBER</span>
                  <span className="text-xs font-mono text-slate-800">{activeVoucher.cheque_number}</span>
                </div>
              )}
              {activeVoucher.bank_name && (
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">BANK NAME</span>
                  <span className="text-xs text-slate-800">{activeVoucher.bank_name}</span>
                </div>
              )}
              {activeVoucher.upi_id && (
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">UPI ID</span>
                  <span className="text-xs font-mono text-slate-800">{activeVoucher.upi_id}</span>
                </div>
              )}
              {activeVoucher.remarks && (
                <div className="flex flex-col space-y-0.5 md:col-span-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">REMARKS</span>
                  <span className="text-xs text-slate-800">{activeVoucher.remarks}</span>
                </div>
              )}
            </RecordSection>
          )}
        </RecordPageLayout>
      </Layout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE ──
  if (viewMode === "form") {
    return (
      <Layout>
        <Formik
          initialValues={voucherInitialValues}
          validationSchema={voucherValidationSchema}
          onSubmit={handleCreateSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <RecordPageLayout
                recordType="General Ledger Voucher"
                recordTitle="New Payment Voucher"
                mode="edit"
                onSave={() => handleSubmit()}
                onCancel={() => { setViewMode("list"); setSearchParams({}); }}
                onListClick={() => { setViewMode("list"); setSearchParams({}); }}
                isSaving={isCreating}
              >
                <RecordSection title="Primary Voucher Information" defaultOpen={true}>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      CUSTOMER <span className="text-amber-600">*</span>
                    </label>
                    <InfiniteScrollAutocomplete
                      options={customerOptions}
                      labelKey="customer_name"
                      valueKey="id"
                      value={values.customerId}
                      onChange={(selected: any) => setFieldValue("customerId", selected?.id || null)}
                      onSearch={(search) => fetchCustomers(1, 20, search, false)}
                      onLoadMore={() => {
                        if (customerPagination.hasMore) {
                          fetchCustomers(customerPagination.page + 1, 20, "", true);
                        }
                      }}
                      hasMore={customerPagination.hasMore}
                      placeholder="Search Customer..."
                    />
                    {touched.customerId && errors.customerId && (
                      <span className="text-[10px] text-red-600 font-semibold">{errors.customerId as string}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      TRANSACTION AMOUNT <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="transactionAmount"
                      value={values.transactionAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="0.00"
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      PAYMENT MODE <span className="text-amber-600">*</span>
                    </label>
                    <select
                      name="paymentMode"
                      value={values.paymentMode}
                      onChange={handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    >
                      {paymentModes.map((pm) => (
                        <option key={pm.value} value={pm.value}>
                          {pm.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      VOUCHER DATE <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="voucherDate"
                      value={values.voucherDate}
                      onChange={handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </RecordSection>

                {values.paymentMode === "cheque" && (
                  <RecordSection title="Cheque Details" defaultOpen={true}>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CHEQUE NUMBER</label>
                      <input
                        type="text"
                        name="chequeNumber"
                        value={values.chequeNumber}
                        onChange={handleChange}
                        placeholder="Cheque No"
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">BANK NAME</label>
                      <input
                        type="text"
                        name="bankName"
                        value={values.bankName}
                        onChange={handleChange}
                        placeholder="Bank Name"
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CHEQUE DATE</label>
                      <input
                        type="date"
                        name="chequeDate"
                        value={values.chequeDate}
                        onChange={handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                      />
                    </div>
                  </RecordSection>
                )}

                {values.paymentMode === "upi" && (
                  <RecordSection title="UPI Details" defaultOpen={true}>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={values.upiId}
                        onChange={handleChange}
                        placeholder="user@upi"
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                      />
                    </div>
                  </RecordSection>
                )}

                <RecordSection title="Remarks" defaultOpen={true}>
                  <div className="flex flex-col space-y-1 md:col-span-3">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">REMARKS</label>
                    <input
                      type="text"
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      placeholder="Additional notes"
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                    />
                  </div>
                </RecordSection>
              </RecordPageLayout>
            </form>
          )}
        </Formik>
      </Layout>
    );
  }

  // ── RENDER 3: NETSUITE LIST VIEW ──
  return (
    <Layout>
      <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-600 rounded-xs"></div>
            <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">General Ledger Vouchers</h1>
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
              <option value="All">All Vouchers</option>
            </select>
          </div>

          {canCreate("voucher") && (
            <button
              onClick={() => {
                setViewMode("form");
                setSearchParams({ action: "new" });
              }}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New Voucher</span>
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
          <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {vouchers.length}</span>
        </div>

        <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
              <tr>
                <th className="px-3 py-2 border-r border-slate-300 w-24">VIEW</th>
                <th className="px-3 py-2 border-r border-slate-300">VOUCHER NO</th>
                <th className="px-3 py-2 border-r border-slate-300">CUSTOMER</th>
                <th className="px-3 py-2 border-r border-slate-300">AMOUNT</th>
                <th className="px-3 py-2 border-r border-slate-300">PAYMENT MODE</th>
                <th className="px-3 py-2 border-r border-slate-300">VOUCHER DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Loading vouchers...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No vouchers found.</td></tr>
              ) : (
                vouchers.map((row: any, idx: number) => {
                  const custName = row.customer?.customer_name || row.customer?.name || "N/A";
                  return (
                    <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                        <button onClick={() => handleView(row.id)} className="hover:underline">View</button>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{row.voucher_number || `VCH-${row.id}`}</td>
                      <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{custName}</td>
                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-bold text-emerald-700">₹{row.transaction_amount}</td>
                      <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-sky-800 uppercase">{row.payment_mode}</td>
                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-600">
                        {row.voucher_date ? new Date(row.voucher_date).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default VoucherPage;
