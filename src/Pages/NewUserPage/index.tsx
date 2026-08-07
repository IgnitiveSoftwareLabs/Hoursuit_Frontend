import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Add, Visibility, Edit, Delete, Warning } from "@mui/icons-material";
import Layout from "../../components/Layout";
import DynamicTable from "../../components/Tables";
import { useAppSelector, useAppDispatch } from "../../Hooks/Reduxhook/hooks";
import { setNewUsers, setDeleteNewUserss, setUpdateNewUserss } from "../../Redux/UsersSlice";
import { getAllUsersApi, deleteNewUserApi } from "../../Services/UserApiSerice";
import toast from "react-hot-toast";
import NewUserDialog from "./NewUserDialog";
import EditUserDialog from "./EditUserDialog";
import PermissionsDialog from "../../components/Dialog/PermissionDialog";
import { usePermissions } from "../../Hooks/usePermissions";

const NewUserPage: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const dispatch = useAppDispatch();
  

  // Check read permission for users
  if (!canRead('NewUser')) {
    return (
      <Layout>
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view users
          </Typography>
        </Box>
      </Layout>
    );
  }

  const users = useAppSelector((state) => state?.newUsers?.value);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: any;
  }>({
    open: false,
    user: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: any;
  }>({
    open: false,
    user: null,
  });
  const [permissionsDialog, setPermissionsDialog] = useState<{
    open: boolean;
    permissions: any[];
    userName: string;
  }>({
    open: false,
    permissions: [],
    userName: "",
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsersApi();
        if (response.success) {
          dispatch(setNewUsers(response.result || []));
        } else {
          toast.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, [dispatch]);

  const handleViewPermissions = (user: any) => {
    setPermissionsDialog({
      open: true,
      permissions: user.permissions || [],
      userName: `${user.FirstName} ${user.LastName}`,
    });
  };

  const handleEditUser = (user: any) => {
    if (!canUpdate('NewUser')) {
      toast.error('Access denied: Insufficient permissions to edit users');
      return;
    }

    setEditDialog({
      open: true,
      user: user,
    });
  };

  const handleDeleteUser = (user: any) => {
    if (!canDelete('NewUser')) {
      toast.error('Access denied: Insufficient permissions to delete users');
      return;
    }

    setDeleteDialog({
      open: true,
      user: user,
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.user) return;

    if (!canDelete('NewUser')) {
      toast.error('Access denied: Insufficient permissions to delete users');
      return;
    }
    
    try {
      const response = await deleteNewUserApi(deleteDialog.user.id, {});
      if (response.success) {
        dispatch(setDeleteNewUserss(deleteDialog.user.id));
        toast.success("User deleted successfully");
        setDeleteDialog({ open: false, user: null });
      } else {
        toast.error(response.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    { key: "FirstName", label: "First Name" },
    { key: "LastName", label: "Last Name" },
    { key: "Email", label: "Email" },
    { key: "Phone", label: "Phone" },
    { key: "Type", label: "Type" },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (
        <Chip 
          label={row.isActive ? "Active" : "Inactive"}
          size="small"
          color={row.isActive ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip 
            label={`${row.permissions?.length || 0} permissions`}
            size="small"
            color={row.permissions?.length > 0 ? "primary" : "default"}
            variant="outlined"
          />
          {row.permissions?.length > 0 && (
            <IconButton
              size="small"
              onClick={() => handleViewPermissions(row)}
              sx={{ ml: 1 }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (row: any) =>
        new Date(row.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      render: (row: any) =>
        new Date(row.updatedAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {row.Type !== "superadmin" && (
            <>
              {canUpdate('NewUser') && (
                <IconButton
                  size="small"
                  onClick={() => handleEditUser(row)}
                  color="primary"
                  title="Edit User"
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}
              {canDelete('NewUser') && (
                <IconButton
                  size="small"
                  onClick={() => handleDeleteUser(row)}
                  color="error"
                  title="Delete User"
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Box>
      ),
    }
  ];

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleUserAdded = () => {
    // Refresh users list after adding new user
    const fetchUsers = async () => {
      try {
        const response = await getAllUsersApi();
        if (response.success) {
          dispatch(setNewUsers(response.result || []));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  };

  const handlePermissionsDialogClose = () => {
    setPermissionsDialog({
      open: false,
      permissions: [],
      userName: "",
    });
  };

  const handleEditDialogClose = () => {
    setEditDialog({
      open: false,
      user: null,
    });
  };

  const handleUserUpdated = (updatedUser: any) => {
    dispatch(setUpdateNewUserss(updatedUser));
    setEditDialog({ open: false, user: null });
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialog({
      open: false,
      user: null,
    });
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h3" gutterBottom>
            Users Management
          </Typography>
          {canCreate('NewUser') && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                if (!canCreate('NewUser')) {
                  toast.error('Access denied: Insufficient permissions to create users');
                  return;
                }
                setIsDialogOpen(true);
              }}
              sx={{ textTransform: "none" }}
            >
              <Add sx={{ mr: 1 }} /> Add New User
            </Button>
          )}
        </Box>

        <DynamicTable
          columns={columns}
          data={users}
          getRowId={(row) => row.id}
        />

        <NewUserDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          onSuccess={handleUserAdded}
        />

        <PermissionsDialog
          open={permissionsDialog.open}
          onClose={handlePermissionsDialogClose}
          permissions={permissionsDialog.permissions}
          userName={permissionsDialog.userName}
        />

        <EditUserDialog
          open={editDialog.open}
          onClose={handleEditDialogClose}
          user={editDialog.user}
          onSuccess={handleUserUpdated}
        />

        {/* Simple Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={handleDeleteDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Warning color="warning" />
              Confirm Delete
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the user <strong>{deleteDialog.user ? `${deleteDialog.user.FirstName} ${deleteDialog.user.LastName}` : ""}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone. The user will be permanently removed from the system.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose} color="inherit" sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              variant="contained"
              color="error"
              sx={{ textTransform: "none" }}
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default NewUserPage;