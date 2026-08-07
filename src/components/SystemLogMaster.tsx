import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  ExpandMore,
  ExpandLess,
  Analytics,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// import Layout from "../../components/Layout";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import {
  useGetSystemLogsQuery,
  useGetSystemLogStatsQuery,
  useGetFilterOptionsQuery,
  useDeleteSystemLogMutation,
  useCleanupOldLogsMutation,
  useExportSystemLogsMutation,
  type SystemLogFilters,
} from "../RTK/services/systemLogApi";

const SystemLogComp: React.FC = () => {
  const { canRead, canDelete } = usePermissions();

  // State for filters and pagination
  const [filters, setFilters] = useState<SystemLogFilters>({
    page: 1,
    limit: 25,
    search: "",
    model_name: "",
    action_type: "",
    performed_by: undefined,
    status: "",
    date_from: "",
    date_to: "",
    sort_by: "createdAt",
    sort_order: "DESC",
  });

  // State for UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(365);
  const [statsDays, setStatsDays] = useState(30);

  // RTK Query hooks
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useGetSystemLogsQuery(filters);

  const { data: filterOptions } = useGetFilterOptionsQuery();
  const { data: statsData, refetch: refetchStats } = useGetSystemLogStatsQuery(
    { days: statsDays },
    { skip: !statsDialogOpen }
  );

  // Mutations
  const [deleteSystemLog] = useDeleteSystemLogMutation();
  const [cleanupOldLogs] = useCleanupOldLogsMutation();
  const [exportSystemLogs] = useExportSystemLogsMutation();

  // Check permissions
  if (!canRead("systemLog")) {
    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <Typography variant="h6" color="error">
              Access Denied: You do not have permission to view system logs.
            </Typography>
          </Box>
        </Box>
    );
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof SystemLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (event: unknown, newPage: number) => {
    handleFilterChange("page", newPage + 1);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFilterChange("limit", parseInt(event.target.value, 10));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      search: "",
      model_name: "",
      action_type: "",
      performed_by: undefined,
      status: "",
      date_from: "",
      date_to: "",
      sort_by: "createdAt",
      sort_order: "DESC",
    });
  };

  // View log details
  const viewLogDetails = (logId: number) => {
    setSelectedLogId(logId);
    setDetailDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (logId: number) => {
    if (!canDelete("systemLog")) {
      toast.error("You do not have permission to delete system logs");
      return;
    }

    try {
      await deleteSystemLog(logId).unwrap();
      toast.success("System log deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedLogId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete system log");
    }
  };

  // Handle cleanup
  const handleCleanup = async () => {
    try {
      const result = await cleanupOldLogs({ days: cleanupDays }).unwrap();
      toast.success(
        `Successfully cleaned up ${result.result.affected_rows} old logs`
      );
      setCleanupDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to cleanup old logs");
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const csvData = await exportSystemLogs(filters).unwrap();

      // Create and download CSV file
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-logs-${dayjs().format("YYYY-MM-DD")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("System logs exported successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to export system logs");
    }
  };

  // Get action type color
  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "warning";
      case "DELETE":
        return "error";
      default:
        return "default";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    return status === "SUCCESS" ? "success" : "error";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("MMM DD, YYYY HH:mm:ss");
  };

  // Format changed fields for table display
  const formatChangedFieldsForTable = (changedFields: any) => {
    if (!changedFields) return "";

    try {
      const fields =
        typeof changedFields === "string"
          ? JSON.parse(changedFields)
          : changedFields;

      const fieldNames = Object.keys(fields);
      if (fieldNames.length === 0) return "";

      if (fieldNames.length === 1) {
        return `${fieldNames[0]}`;
      } else if (fieldNames.length <= 3) {
        return fieldNames.join(", ");
      } else {
        return `${fieldNames.slice(0, 2).join(", ")} +${
          fieldNames.length - 2
        } more`;
      }
    } catch (error) {
      return "Changed fields";
    }
  };

  // Get selected log details
  const selectedLog = logsData?.result?.find((log) => log.id === selectedLogId);

  if (error) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">Error loading system logs</Typography>
        </Box>
    );
  }

  const logs = logsData?.result || [];
  const totalCount = logsData?.meta?.total || 0;
  const summary = logsData?.meta?.summary;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1">
              System Logs
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => setStatsDialogOpen(true)}
              >
                Statistics
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Summary Cards */}
          {summary && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Logs
                    </Typography>
                    <Typography variant="h5">{summary.total_logs}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Create Operations
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {summary.create_count}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Update Operations
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      {summary.update_count}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Delete Operations
                    </Typography>
                    <Typography variant="h5" color="error.main">
                      {summary.delete_count}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: showFilters ? 2 : 0,
                }}
              >
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    size="small"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    InputProps={{
                      startAdornment: (
                        <Search sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                    sx={{ minWidth: 300 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                    endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                  >
                    Filters
                  </Button>
                  <Button variant="text" onClick={resetFilters}>
                    Clear All
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {totalCount} logs found
                </Typography>
              </Box>

              <Collapse in={showFilters}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Model"
                      value={filters.model_name}
                      onChange={(e) =>
                        handleFilterChange("model_name", e.target.value)
                      }
                    >
                      <MenuItem value="">All Models</MenuItem>
                      {filterOptions?.result?.model_names?.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Action Type"
                      value={filters.action_type}
                      onChange={(e) =>
                        handleFilterChange("action_type", e.target.value)
                      }
                    >
                      <MenuItem value="">All Actions</MenuItem>
                      <MenuItem value="CREATE">Create</MenuItem>
                      <MenuItem value="UPDATE">Update</MenuItem>
                      <MenuItem value="DELETE">Delete</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="User"
                      value={filters.performed_by || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "performed_by",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    >
                      <MenuItem value="">All Users</MenuItem>
                      {filterOptions?.result?.users?.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Status"
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="SUCCESS">Success</MenuItem>
                      <MenuItem value="FAILED">Failed</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DatePicker
                      label="Date From"
                      value={
                        filters.date_from ? dayjs(filters.date_from) : null
                      }
                      onChange={(newValue) =>
                        handleFilterChange(
                          "date_from",
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                        )
                      }
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DatePicker
                      label="Date To"
                      value={filters.date_to ? dayjs(filters.date_to) : null}
                      onChange={(newValue) =>
                        handleFilterChange(
                          "date_to",
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                        )
                      }
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Sort By"
                      value={filters.sort_by}
                      onChange={(e) =>
                        handleFilterChange("sort_by", e.target.value)
                      }
                    >
                      <MenuItem value="createdAt">Date Created</MenuItem>
                      <MenuItem value="model_name">Model Name</MenuItem>
                      <MenuItem value="action_type">Action Type</MenuItem>
                      <MenuItem value="performed_by_name">User Name</MenuItem>
                      <MenuItem value="status">Status</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Sort Order"
                      value={filters.sort_order}
                      onChange={(e) =>
                        handleFilterChange("sort_order", e.target.value)
                      }
                    >
                      <MenuItem value="DESC">Newest First</MenuItem>
                      <MenuItem value="ASC">Oldest First</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          {/* System Logs Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Record ID</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Changed Fields</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No system logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{
                          backgroundColor:
                            log.status === "FAILED" ? "#ffebee" : undefined,
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {log.model_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.record_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action_type}
                            color={getActionTypeColor(log.action_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={formatChangedFieldsForTable(
                              log.changed_fields
                            )}
                          >
                            {log.action_type === "UPDATE"
                              ? formatChangedFieldsForTable(
                                  log.changed_fields
                                ) || "No changes tracked"
                              : log.action_type === "CREATE"
                              ? "New record"
                              : log.action_type === "DELETE"
                              ? "Record deleted"
                              : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {log.performed_by_name ||
                                `User ${log.performed_by}`}
                            </Typography>
                            {log.user_role && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {log.user_role}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={getStatusColor(log.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.execution_time
                              ? `${log.execution_time.toFixed(2)}ms`
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => viewLogDetails(log.id)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={filters.limit || 25}
              page={(filters.page || 1) - 1}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Card>
        </Box>

        {/* Log Details Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>System Log Details</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Timestamp
                    </Typography>
                    <Typography>{formatDate(selectedLog.createdAt)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography>{selectedLog.model_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Record ID
                    </Typography>
                    <Typography>{selectedLog.record_id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action
                    </Typography>
                    <Chip
                      label={selectedLog.action_type}
                      color={getActionTypeColor(selectedLog.action_type)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Performed By
                    </Typography>
                    <Typography>
                      {selectedLog.performed_by_name ||
                        `User ${selectedLog.performed_by}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedLog.status}
                      color={getStatusColor(selectedLog.status)}
                      size="small"
                    />
                  </Grid>
                  {selectedLog.ip_address && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        IP Address
                      </Typography>
                      <Typography>{selectedLog.ip_address}</Typography>
                    </Grid>
                  )}
                  {selectedLog.endpoint && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Endpoint
                      </Typography>
                      <Typography>{selectedLog.endpoint}</Typography>
                    </Grid>
                  )}
                </Grid>

                {selectedLog.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{selectedLog.description}</Typography>
                  </Box>
                )}

                {selectedLog.error_message && (
                  <Box>
                    <Typography variant="subtitle2" color="error">
                      Error Message
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "error.50" }}>
                      <Typography variant="body2" color="error">
                        {selectedLog.error_message}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {selectedLog.changed_fields && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Changed Fields
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      {(() => {
                        try {
                          // Parse the changed_fields if it's a string
                          const changedFields =
                            typeof selectedLog.changed_fields === "string"
                              ? JSON.parse(selectedLog.changed_fields)
                              : selectedLog.changed_fields;

                          return (
                            <Stack spacing={2}>
                              {Object.entries(changedFields).map(
                                ([fieldName, changes]: [string, any]) => (
                                  <Box key={fieldName}>
                                    <Typography
                                      fontWeight="medium"
                                      color="primary.main"
                                    >
                                      {fieldName}
                                    </Typography>
                                    <Grid
                                      container
                                      spacing={2}
                                      sx={{ mt: 0.5 }}
                                    >
                                      <Grid size={{ xs: 6 }}>
                                        <Box
                                          sx={{
                                            p: 1.5,
                                            bgcolor: "#ffebee",
                                            borderRadius: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            Previous Value
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ wordBreak: "break-word" }}
                                          >
                                            {changes.old === null ? (
                                              <em style={{ color: "#666" }}>
                                                null
                                              </em>
                                            ) : changes.old === "" ? (
                                              <em style={{ color: "#666" }}>
                                                empty
                                              </em>
                                            ) : (
                                              String(changes.old)
                                            )}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid size={{ xs: 6 }}>
                                        <Box
                                          sx={{
                                            p: 1.5,
                                            bgcolor: "#e8f5e8",
                                            borderRadius: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            New Value
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ wordBreak: "break-word" }}
                                          >
                                            {changes.new === null ? (
                                              <em style={{ color: "#666" }}>
                                                null
                                              </em>
                                            ) : changes.new === "" ? (
                                              <em style={{ color: "#666" }}>
                                                empty
                                              </em>
                                            ) : (
                                              String(changes.new)
                                            )}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                )
                              )}
                            </Stack>
                          );
                        } catch (error) {
                          // Fallback to raw display if parsing fails
                          return (
                            <pre style={{ margin: 0, fontSize: "0.875rem" }}>
                              {typeof selectedLog.changed_fields === "string"
                                ? selectedLog.changed_fields
                                : JSON.stringify(
                                    selectedLog.changed_fields,
                                    null,
                                    2
                                  )}
                            </pre>
                          );
                        }
                      })()}
                    </Paper>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedLogId(null);
          }}
          onConfirm={() => selectedLogId && handleDelete(selectedLogId)}
          title="Delete System Log"
          message="Are you sure you want to delete this system log? This action cannot be undone."
          variant="delete"
        />

        {/* Cleanup Confirmation Dialog */}
        <Dialog
          open={cleanupDialogOpen}
          onClose={() => setCleanupDialogOpen(false)}
        >
          <DialogTitle>Cleanup Old Logs</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This will permanently delete system logs older than the specified
              number of days. This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Days to keep"
              value={cleanupDays}
              onChange={(e) => setCleanupDays(Number(e.target.value))}
              inputProps={{ min: 30, max: 3650 }}
              helperText="Minimum 30 days, maximum 3650 days (10 years)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCleanupDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCleanup}
              color="error"
              variant="contained"
              disabled={cleanupDays < 30}
            >
              Cleanup Logs
            </Button>
          </DialogActions>
        </Dialog>

        {/* Statistics Dialog */}
        <Dialog
          open={statsDialogOpen}
          onClose={() => setStatsDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">System Log Statistics</Typography>
              <TextField
                size="small"
                type="number"
                label="Days"
                value={statsDays}
                onChange={(e) => setStatsDays(Number(e.target.value))}
                onBlur={() => refetchStats()}
                inputProps={{ min: 1, max: 365 }}
                sx={{ width: 100 }}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            {statsData && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Action Distribution
                  </Typography>
                  <Stack spacing={1}>
                    {statsData.result.action_stats.map((stat) => (
                      <Box
                        key={stat.action_type}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography>{stat.action_type}</Typography>
                        <Typography fontWeight="bold">{stat.count}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Top Models
                  </Typography>
                  <Stack spacing={1}>
                    {statsData.result.model_stats.slice(0, 5).map((stat) => (
                      <Box
                        key={stat.model_name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography>{stat.model_name}</Typography>
                        <Typography fontWeight="bold">{stat.count}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Most Active Users
                  </Typography>
                  <Stack spacing={1}>
                    {statsData.result.user_stats.slice(0, 5).map((stat) => (
                      <Box
                        key={stat.performed_by}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography>{stat.performed_by_name}</Typography>
                        <Typography fontWeight="bold">{stat.count}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
    </LocalizationProvider>
  );
};

export default SystemLogComp;