import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import {
  AccountBalance,
  TrendingUp,
  MonetizationOn,
  Warning,
  Refresh,
  FileDownload,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetDuePaymentsQuery,
  useGetDuePaymentStatsQuery,
  type DuePaymentData,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

const DuePaymentReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    customerId: "",
    status: "" as "" | "paid" | "partial" | "pending",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handler functions for table pagination
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper function to format date properly (avoiding timezone issues)
  const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Prepare API filters
  const apiFilters = {
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
    customerId: filters.customerId,
    paymentStatus: filters.status, // Map status to paymentStatus for API
    page: page + 1, // API expects 1-based page
    limit: rowsPerPage,
  };

  // API calls
  const {
    data: duePaymentResponse,
    isLoading: loading,
    refetch: refetchDuePayments,
  } = useGetDuePaymentsQuery(apiFilters);

  const { data: statsResponse, refetch: refetchStats } =
    useGetDuePaymentStatsQuery({
      dateFrom: formatDateForAPI(filters.dateFrom),
      dateTo: formatDateForAPI(filters.dateTo),
      customerId: filters.customerId || undefined,
      paymentStatus: filters.status || undefined,
    });

  const data = duePaymentResponse?.result || [];
  const totalCount = duePaymentResponse?.pagination?.total || 0;
  const stats = statsResponse?.result;

  // Get currency from backend with proper default
  const currency = stats?.currency || "₹";

  // Loading state for statistics
  const isStatsLoading = !statsResponse || !stats;

  const statCards: StatCardData[] = [
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      unit: "customers",
      trend: (stats?.customersTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.customersTrendValue || "0",
      icon: <AccountBalance />,
      color: "primary",
      subtitle: "With outstanding dues",
    },
    {
      title: "Total Outstanding",
      value: stats?.totalOutstanding || 0,
      unit: currency,
      trend: "neutral", // Outstanding going up is bad, so we don't show trend
      trendValue: "0%",
      icon: <MonetizationOn />,
      color: "warning",
      subtitle: "Amount pending",
    },
    {
      title: "Collection Efficiency",
      value: stats?.collectionEfficiency || 0,
      unit: "%",
      trend: (stats?.efficiencyTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.efficiencyTrendValue || "0%",
      icon: <TrendingUp />,
      color: "success",
      subtitle: "Payment vs Invoice ratio",
    },
    {
      title: "Overdue Amount",
      value: stats?.totalOverdue || 0,
      unit: currency,
      trend: "neutral", // Overdue going up is bad, so we don't show trend
      trendValue: "0%",
      icon: <Warning />,
      color: "error",
      subtitle: "30+ days overdue",
    },
  ];

  const columns = [
    {
      id: "customerId",
      label: "Customer ID",
      sortable: true,
    },
    {
      id: "customerName",
      label: "Customer Name",
      sortable: true,
      render: (row: DuePaymentData) => (
        <Typography variant="body2" fontWeight="medium">
          {row.customerName}
        </Typography>
      ),
    },
    {
      id: "customerEmail",
      label: "Email",
      sortable: true,
      render: (row: DuePaymentData) => (
        <Typography variant="body2">{row.customerEmail}</Typography>
      ),
    },
    {
      id: "customerPhone",
      label: "Phone",
      sortable: true,
      render: (row: DuePaymentData) => (
        <Typography variant="body2">{row.customerPhone}</Typography>
      ),
    },
    {
      id: "totalInvoiced",
      label: "Total Invoiced",
      sortable: true,
      align: "right" as const,
      render: (row: DuePaymentData) => (
        <Typography variant="body2">
          {currency}
          {parseFloat(row.totalInvoiced.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "totalPaid",
      label: "Total Paid",
      sortable: true,
      align: "right" as const,
      render: (row: DuePaymentData) => (
        <Typography variant="body2" color="success.main">
          {currency}
          {parseFloat(row.totalPaid.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "currentBalance",
      label: "Outstanding",
      sortable: true,
      align: "right" as const,
      render: (row: DuePaymentData) => (
        <Typography
          variant="body2"
          fontWeight="medium"
          color={
            parseFloat(row.currentBalance.toString()) > 0
              ? "error.main"
              : "success.main"
          }
        >
          {currency}
          {parseFloat(row.currentBalance.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "overdueAmount",
      label: "Overdue",
      sortable: true,
      align: "right" as const,
      render: (row: DuePaymentData) => (
        <Typography
          variant="body2"
          color={
            parseFloat(row.overdueAmount.toString()) > 0
              ? "error.main"
              : "inherit"
          }
        >
          {currency}
          {parseFloat(row.overdueAmount.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "paymentStatus",
      label: "Status",
      sortable: true,
      align: "center" as const,
      render: (row: DuePaymentData) => (
        <Chip
          label={
            row.paymentStatus.charAt(0).toUpperCase() +
            row.paymentStatus.slice(1)
          }
          color={
            row.paymentStatus === "paid"
              ? "success"
              : row.paymentStatus === "partial"
              ? "warning"
              : "error"
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: "lastPaymentDate",
      label: "Last Payment",
      sortable: true,
      render: (row: DuePaymentData) => (
        <Typography variant="body2">
          {row.lastPaymentDate
            ? new Date(row.lastPaymentDate).toLocaleDateString()
            : "No payments"}
        </Typography>
      ),
    },
    {
      id: "daysOverdue",
      label: "Days Overdue",
      sortable: true,
      align: "center" as const,
      render: (row: DuePaymentData) => (
        <Typography
          variant="body2"
          color={row.daysOverdue > 30 ? "error.main" : "inherit"}
        >
          {row.daysOverdue} days
        </Typography>
      ),
    },
  ];

  const handleRefresh = () => {
    refetchDuePayments();
    refetchStats();
  };

  const handleExport = async () => {
    try {
      const response = await apiInstance.post(
        "/reports/export",
        {
          reportType: "due-payment",
          format: "excel",
          filters: {
            dateFrom: formatDateForAPI(filters.dateFrom),
            dateTo: formatDateForAPI(filters.dateTo),
            customerId: filters.customerId || undefined,
            paymentStatus: filters.status || undefined,
          },
        },
        {
          responseType: "blob",
        }
      );

      // Create a blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `due-payment-report-${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Due Payment Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track outstanding payments, overdue amounts, and collection
              efficiency
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExport}
              disabled={loading}
            >
              Export Excel
            </Button>
          </Stack>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ mb: 3 }}>
          {isStatsLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography>Loading statistics...</Typography>
            </Box>
          ) : (
            <StatCards stats={statCards} />
          )}
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ReportFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={() => {}}
              showDateRange={true}
              showCustomer={true}
              showStatus={true}
              statusOptions={[
                { value: "", label: "All Status" },
                { value: "paid", label: "Paid" },
                { value: "partial", label: "Partial Payment" },
                { value: "pending", label: "Pending Payment" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <ReportTable
              data={data}
              columns={columns}
              isLoading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              emptyMessage="No due payment data found"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default DuePaymentReport;
