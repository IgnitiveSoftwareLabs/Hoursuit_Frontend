import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Add, List as ListIcon, GetApp, Print, Shield } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import Layout from "../../components/Layout";
import { useAppSelector, useAppDispatch } from "../../Hooks/Reduxhook/hooks";
import { setNewUsers, setAddNewUserss, setUpdateNewUserss, setDeleteNewUserss } from "../../Redux/UsersSlice";
import { getAllUsersApi, getSingleUserApi, addNewUserApi, updateNewUserApi, deleteNewUserApi } from "../../Services/UserApiSerice";
import { useGetpermissionQuery } from "../../RTK/services/permissionApi";
import { usePermissions } from "../../Hooks/usePermissions";
import PermissionsDialog from "../../components/Dialog/PermissionDialog";
import RecordPageLayout, { RecordSection } from "../../components/Layout/RecordPageLayout";
import ConfirmationDialog from "../../components/Dialog/ConfirmationDialog";

interface NewUserFormValues {
  id?: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Password?: string;
  Type: string;
  permissionIds: number[];
  isActive: boolean;
}

const NewUserPage: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modes: 'list' | 'view' | 'form'
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [singleUserData, setSingleUserData] = useState<any | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const users = useAppSelector((state) => state?.newUsers?.value || []);
  const { data: permissionsData, isLoading: permissionsLoading } = useGetpermissionQuery();

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [permissionsDialog, setPermissionsDialog] = useState<{ open: boolean; permissions: any[]; userName: string }>({
    open: false,
    permissions: [],
    userName: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const rawPermissions = Array.isArray(permissionsData)
    ? permissionsData
    : Array.isArray((permissionsData as any)?.result)
    ? (permissionsData as any).result
    : [];

  const fetchUsers = async () => {
    try {
      const response = await getAllUsersApi();
      if (response.success) {
        dispatch(setNewUsers(response.result || []));
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [dispatch]);

  // Single GET API Call for user details
  const fetchSingleUser = async (id: number) => {
    try {
      setIsSingleLoading(true);
      const response = await getSingleUserApi(id);
      if (response.success) {
        setSingleUserData(response.result);
      } else {
        // Fallback to local array
        const local = users.find((u: any) => u.id === id);
        if (local) setSingleUserData(local);
      }
    } catch (err) {
      const local = users.find((u: any) => u.id === id);
      if (local) setSingleUserData(local);
    } finally {
      setIsSingleLoading(false);
    }
  };

  const formik = useFormik<NewUserFormValues>({
    initialValues: {
      FirstName: "",
      LastName: "",
      Email: "",
      Phone: "",
      Password: "",
      Type: "operator",
      permissionIds: [],
      isActive: true,
    },
    validationSchema: Yup.object({
      FirstName: Yup.string().required("First Name is required"),
      LastName: Yup.string().required("Last Name is required"),
      Email: Yup.string().email("Invalid email format").required("Email is required"),
      Phone: Yup.string().required("Phone is required"),
      Type: Yup.string().required("User Type is required"),
      Password: Yup.string().when("$isEdit", {
        is: false,
        then: (schema) => schema.min(6, "Password must be at least 6 characters").required("Password is required"),
        otherwise: (schema) => schema.optional(),
      }),
      permissionIds: Yup.array().min(1, "At least one permission is required"),
    }),
    onSubmit: async (values) => {
      try {
        setIsSaving(true);
        if (isEdit && editId) {
          if (!canUpdate("NewUser")) {
            toast.error("Access denied: Insufficient permissions to edit users");
            return;
          }
          const payload: any = {
            FirstName: values.FirstName,
            LastName: values.LastName,
            Email: values.Email,
            Phone: values.Phone,
            Type: values.Type,
            permissionIds: values.permissionIds,
            isActive: values.isActive,
          };
          if (values.Password) payload.Password = values.Password;

          const response = await updateNewUserApi(String(editId), payload);
          if (response.success) {
            dispatch(setUpdateNewUserss(response.result));
            toast.success("User updated successfully");
            formik.resetForm();
            setViewMode("list");
            setIsEdit(false);
            setSearchParams({});
            fetchUsers();
          } else {
            toast.error(response.message || "Failed to update user");
          }
        } else {
          if (!canCreate("NewUser")) {
            toast.error("Access denied: Insufficient permissions to create users");
            return;
          }
          const payload = {
            ...values,
            isActive: values.isActive,
          };
          const response = await addNewUserApi(payload);
          if (response.success) {
            dispatch(setAddNewUserss(response.result));
            toast.success("User created successfully");
            formik.resetForm();
            setViewMode("list");
            setIsEdit(false);
            setSearchParams({});
            fetchUsers();
          } else {
            toast.error(response.message || "Failed to create user");
          }
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Operation failed");
      } finally {
        setIsSaving(false);
      }
    },
  });

  // URL search parameter page routing
  useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlId) {
      const idNum = Number(urlId);
      setSelectedUserId(idNum);

      if (urlAction === "edit") {
        const u = users.find((item: any) => item.id === idNum);
        if (u) {
          setSingleUserData(u);
          formik.setValues({
            FirstName: u.FirstName || "",
            LastName: u.LastName || "",
            Email: u.Email || "",
            Phone: u.Phone || "",
            Password: "",
            Type: u.Type || "operator",
            permissionIds: u.permissions?.map((p: any) => p.id) || [],
            isActive: u.isActive ?? true,
          });
          setEditId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        fetchSingleUser(idNum);
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditId(null);
        setSingleUserData(null);
        formik.resetForm();
      }
    } else {
      setViewMode("list");
      setSelectedUserId(null);
    }
  }, [searchParams, users.length]);

  const handleViewUser = (user: any) => {
    setSelectedUserId(user.id);
    fetchSingleUser(user.id);
    setViewMode("view");
    setSearchParams({ id: String(user.id), action: "view" });
  };

  const handleEditUser = (user: any) => {
    if (!canUpdate("NewUser")) {
      toast.error("Access denied: Insufficient permissions to edit users");
      return;
    }
    setSelectedUserId(user.id);
    setSingleUserData(user);
    formik.setValues({
      FirstName: user.FirstName || "",
      LastName: user.LastName || "",
      Email: user.Email || "",
      Phone: user.Phone || "",
      Password: "",
      Type: user.Type || "operator",
      permissionIds: user.permissions?.map((p: any) => p.id) || [],
      isActive: user.isActive ?? true,
    });
    setEditId(user.id);
    setIsEdit(true);
    setViewMode("form");
    setSearchParams({ id: String(user.id), action: "edit" });
  };

  const handleDeleteUser = (user: any) => {
    if (!canDelete("NewUser")) {
      toast.error("Access denied: Insufficient permissions to delete users");
      return;
    }
    setDeleteDialog({ open: true, user: user });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.user) return;
    try {
      const response = await deleteNewUserApi(deleteDialog.user.id, {});
      if (response.success) {
        dispatch(setDeleteNewUserss(deleteDialog.user.id));
        toast.success("User deleted successfully");
        setDeleteDialog({ open: false, user: null });
        fetchUsers();
      } else {
        toast.error(response.message || "Failed to delete user");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleAddUser = () => {
    if (!canCreate("NewUser")) {
      toast.error("Access denied: Insufficient permissions to create users");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditId(null);
    setSingleUserData(null);
    setSelectedUserId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("No users to export");
      return;
    }
    const headers = ["Internal ID", "First Name", "Last Name", "Email", "Phone", "Type", "Status", "Permissions Count"];
    const rows = users.map((u: any) => [
      u.id,
      `"${u.FirstName || ""}"`,
      `"${u.LastName || ""}"`,
      `"${u.Email || ""}"`,
      `"${u.Phone || ""}"`,
      `"${u.Type || ""}"`,
      u.isActive ? "Active" : "Inactive",
      u.permissions?.length || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Users_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users list exported as CSV");
  };

  const togglePermission = (id: number) => {
    const current = formik.values.permissionIds || [];
    if (current.includes(id)) {
      formik.setFieldValue("permissionIds", current.filter((pId) => pId !== id));
    } else {
      formik.setFieldValue("permissionIds", [...current, id]);
    }
  };

  if (!canRead("NewUser")) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-600 text-xs font-semibold">
          Access Denied: Insufficient permissions to view users.
        </div>
      </Layout>
    );
  }

  // ── RENDER 1: NETSUITE READ-ONLY VIEW MODE (CALLS GET SINGLE USER API) ──
  if (viewMode === "view") {
    const activeUser = singleUserData || users.find((u: any) => u.id === selectedUserId);

    if (isSingleLoading && !activeUser) {
      return (
        <Layout>
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            <CircularProgress size={24} className="mb-2" />
            <div>Loading user details from API...</div>
          </div>
        </Layout>
      );
    }

    if (!activeUser) {
      return (
        <Layout>
          <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
            <div>User record unavailable.</div>
            <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
              Back to List
            </button>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <RecordPageLayout
          recordType="Employee / User"
          subtitle={`${activeUser.FirstName} ${activeUser.LastName}`}
          mode="view"
          onEdit={() => handleEditUser(activeUser)}
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        >
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">INTERNAL ID</span>
              <span className="text-xs font-mono font-bold text-slate-900">{activeUser.id}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">FULL NAME</span>
              <span className="text-xs font-bold text-slate-900">{activeUser.FirstName} {activeUser.LastName}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">EMAIL</span>
              <span className="text-xs font-mono text-slate-800">{activeUser.Email}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">PHONE</span>
              <span className="text-xs font-mono text-slate-800">{activeUser.Phone || "N/A"}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">ACCOUNT TYPE</span>
              <span className="text-xs font-bold text-sky-800 uppercase">{activeUser.Type}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
              <span className="text-xs font-semibold text-slate-800">{activeUser.isActive ? "Active" : "Inactive"}</span>
            </div>
          </RecordSection>

          <RecordSection title="Assigned System Permissions" defaultOpen={true}>
            {activeUser.permissions && activeUser.permissions.length > 0 ? (
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {activeUser.permissions.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="p-2 bg-slate-50 border border-slate-200 rounded-xs flex flex-col space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">{p.name || `${p.module} - ${p.action}`}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Module: {p.module} | Action: {p.action}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic md:col-span-3">No system permissions assigned to this user.</div>
            )}
          </RecordSection>
        </RecordPageLayout>
      </Layout>
    );
  }

  // ── RENDER 2: NETSUITE EDITABLE FORM MODE ──
  if (viewMode === "form") {
    return (
      <Layout>
        <form onSubmit={formik.handleSubmit}>
          <RecordPageLayout
            recordType="Employee / User"
            recordTitle={formik.values.FirstName ? `${formik.values.FirstName} ${formik.values.LastName}` : (isEdit ? "Edit User Record" : "New User Record")}
            mode="edit"
            onSave={() => formik.handleSubmit()}
            onCancel={() => { setViewMode("list"); setSearchParams({}); }}
            onListClick={() => { setViewMode("list"); setSearchParams({}); }}
            isSaving={isSaving}
          >
            <RecordSection title="Primary Information" defaultOpen={true}>
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  FIRST NAME <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  name="FirstName"
                  value={formik.values.FirstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="First Name"
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                />
                {formik.touched.FirstName && formik.errors.FirstName && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.FirstName}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  LAST NAME <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  name="LastName"
                  value={formik.values.LastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Last Name"
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                />
                {formik.touched.LastName && formik.errors.LastName && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.LastName}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  EMAIL <span className="text-amber-600">*</span>
                </label>
                <input
                  type="email"
                  name="Email"
                  value={formik.values.Email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="user@domain.com"
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                />
                {formik.touched.Email && formik.errors.Email && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.Email}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  PHONE <span className="text-amber-600">*</span>
                </label>
                <input
                  type="tel"
                  name="Phone"
                  value={formik.values.Phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Phone Number"
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                />
                {formik.touched.Phone && formik.errors.Phone && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.Phone}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  ACCOUNT TYPE <span className="text-amber-600">*</span>
                </label>
                <select
                  name="Type"
                  value={formik.values.Type}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold uppercase"
                >
                  <option value="manager">Manager</option>
                  <option value="operator">Operator</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  PASSWORD {!isEdit && <span className="text-amber-600">*</span>}
                </label>
                <input
                  type="password"
                  name="Password"
                  value={formik.values.Password || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={isEdit ? "Leave blank to keep unchanged" : "Password"}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                />
                {formik.touched.Password && formik.errors.Password && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.Password}</span>
                )}
              </div>
            </RecordSection>

            <RecordSection title="System Access Permissions" defaultOpen={true}>
              <div className="md:col-span-3 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Assign Module Permissions ({formik.values.permissionIds.length} selected)</span>
                  <div className="space-x-2 text-[11px] text-sky-700 font-semibold">
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue("permissionIds", rawPermissions.map((p: any) => p.id))}
                      className="hover:underline"
                    >
                      Select All
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue("permissionIds", [])}
                      className="hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {permissionsLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading system permissions...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-200 rounded-xs bg-slate-50">
                    {rawPermissions.map((perm: any) => {
                      const isChecked = formik.values.permissionIds.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start space-x-2 p-1.5 border rounded-xs cursor-pointer select-none transition-colors ${
                            isChecked ? "bg-sky-50 border-sky-300" : "bg-white border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5 w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-slate-800">{perm.name || `${perm.module} - ${perm.action}`}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{perm.module} ({perm.action})</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {formik.touched.permissionIds && formik.errors.permissionIds && (
                  <span className="text-[10px] text-red-600 font-semibold">{formik.errors.permissionIds as string}</span>
                )}
              </div>
            </RecordSection>
          </RecordPageLayout>
        </form>
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
            <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Employees / Users</h1>
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
              <option value="All">All System Users</option>
            </select>
          </div>

          {canCreate("NewUser") && (
            <button
              onClick={handleAddUser}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New User</span>
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
          <span className="font-bold text-slate-700 uppercase text-[11px]">TOTAL: {users.length}</span>
        </div>

        <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
              <tr>
                <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
                <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
                <th className="px-3 py-2 border-r border-slate-300">NAME</th>
                <th className="px-3 py-2 border-r border-slate-300">EMAIL</th>
                <th className="px-3 py-2 border-r border-slate-300">PHONE</th>
                <th className="px-3 py-2 border-r border-slate-300">TYPE</th>
                <th className="px-3 py-2 border-r border-slate-300">PERMISSIONS</th>
                <th className="px-3 py-2 border-r border-slate-300">STATUS</th>
                <th className="px-3 py-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {users.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-slate-400 italic">No users found.</td></tr>
              ) : (
                users.map((row: any, idx: number) => (
                  <tr key={row.id || idx} className={`hover:bg-amber-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button onClick={() => handleEditUser(row)} className="hover:underline mr-1">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleViewUser(row)} className="hover:underline ml-1">View</button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">{row.id}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{row.FirstName} {row.LastName}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-700">{row.Email}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-600">{row.Phone || "N/A"}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-sky-800 uppercase">{row.Type}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200">
                      <button
                        onClick={() => setPermissionsDialog({ open: true, permissions: row.permissions || [], userName: `${row.FirstName} ${row.LastName}` })}
                        className="text-sky-700 hover:underline font-semibold text-[11px] flex items-center space-x-1"
                      >
                        <Shield className="!w-3 !h-3 text-slate-500" />
                        <span>{row.permissions?.length || 0} permissions</span>
                      </button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold">
                      {row.isActive ? (
                        <span className="text-emerald-700">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.Type !== "superadmin" && canDelete("NewUser") && (
                        <button onClick={() => handleDeleteUser(row)} className="text-red-600 hover:underline font-semibold text-[11px]">
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

        <PermissionsDialog open={permissionsDialog.open} permissions={permissionsDialog.permissions} userName={permissionsDialog.userName} onClose={() => setPermissionsDialog({ open: false, permissions: [], userName: "" })} />
        <ConfirmationDialog open={deleteDialog.open} title="Delete User" message={`Are you sure you want to delete ${deleteDialog.user?.FirstName} ${deleteDialog.user?.LastName}?`} onConfirm={confirmDeleteUser} onClose={() => setDeleteDialog({ open: false, user: null })} />
      </div>
    </Layout>
  );
};

export default NewUserPage;