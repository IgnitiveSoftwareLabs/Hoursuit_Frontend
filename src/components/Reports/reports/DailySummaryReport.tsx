import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import {
  Warehouse,
  TrendingUp,
  People,
  LocalShipping,
  Refresh,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetDailySummaryQuery,
  useGetDailySummaryStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

const DailySummaryReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: "",
    customerId: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    ...filters,
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
    page: page + 1, // API expects 1-based page
    limit: rowsPerPage,
  };

  // API calls
  const {
    data: summaryResponse,
    isLoading: loading,
    refetch: refetchSummary,
  } = useGetDailySummaryQuery(apiFilters);

  const { data: statsResponse, refetch: refetchStats } =
    useGetDailySummaryStatsQuery({
      dateFrom: formatDateForAPI(filters.dateFrom),
      dateTo: formatDateForAPI(filters.dateTo),
    });

  const data = summaryResponse?.result || [];
  const totalCount = summaryResponse?.pagination?.total || 0;
  const stats = statsResponse?.result;

  // Get weight units from backend
  const transactionWeightUnit = stats?.weightUnit || "quintals";
  const stockWeightUnit = stats?.stockWeightUnit || "quintals";

  const statCards: StatCardData[] = [
    {
      title: "Total Inward",
      value: stats?.totalInward || 0,
      unit: transactionWeightUnit,
      trend: stats?.trends?.inwardTrend || "neutral",
      trendValue: stats?.trends?.inwardTrendValue || "0%",
      icon: <TrendingUp />,
      color: "success",
      subtitle: "Selected period",
    },
    {
      title: "Total Outward",
      value: stats?.totalOutward || 0,
      unit: transactionWeightUnit,
      trend: stats?.trends?.outwardTrend || "neutral",
      trendValue: stats?.trends?.outwardTrendValue || "0%",
      icon: <LocalShipping />,
      color: "primary",
      subtitle: "Selected period",
    },
    {
      title: "Current Stock",
      value: stats?.currentStock || 0,
      unit: stockWeightUnit,
      trend: stats?.trends?.stockTrend || "neutral",
      trendValue: stats?.trends?.stockTrendValue || "0%",
      icon: <Warehouse />,
      color: "info",
      subtitle: "Across all warehouses",
    },
    {
      title: "Active Customers",
      value: stats?.activeCustomers || 0,
      trend: stats?.trends?.customerTrend || "neutral",
      trendValue: stats?.trends?.customerTrendValue || "0",
      icon: <People />,
      color: "secondary",
      subtitle: "Selected period",
    },
  ];

  const columns = [
    {
      id: "date",
      key: "date",
      label: "Date",
      sortable: true,
      type: "date" as const,
    },
    {
      id: "warehouseName",
      key: "warehouseName",
      label: "Warehouse",
      sortable: true,
      type: "text" as const,
    },
    {
      id: "totalInward",
      key: "totalInward",
      label: `Daily Inward (${transactionWeightUnit})`,
      sortable: true,
      type: "number" as const,
    },
    {
      id: "totalOutward",
      key: "totalOutward",
      label: `Daily Outward (${transactionWeightUnit})`,
      sortable: true,
      type: "number" as const,
    },
    {
      id: "totalStock",
      key: "totalStock",
      label: `Stock as of Date (${stockWeightUnit})`,
      sortable: true,
      type: "number" as const,
    },
    {
      id: "occupancyPercentage",
      key: "occupancyPercentage",
      label: "Occupancy % (as of Date)",
      sortable: true,
      type: "percentage" as const,
    },
    {
      id: "activeCustomers",
      key: "activeCustomers",
      label: "Daily Customers",
      sortable: true,
      type: "number" as const,
    },
    {
      id: "totalTransactions",
      key: "totalTransactions",
      label: "Daily Transactions",
      sortable: true,
      type: "number" as const,
    },
    // {
    //   id: "revenue",
    //   key: "revenue",
    //   label: "Daily Revenue (₹)",
    //   sortable: true,
    //   type: "currency" as const,
    // },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // API will automatically refetch when filters change
    refetchSummary();
    refetchStats();
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchStats();
  };

  const handleExportPDF = () => {
    console.log("Exporting daily summary in PDF format");
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = async () => {
    try {
      console.log("Exporting daily summary in Excel format");

      const exportData = {
        reportType: "daily-summary",
        format: "excel",
        filters: {
          dateFrom: formatDateForAPI(filters.dateFrom),
          dateTo: formatDateForAPI(filters.dateTo),
          warehouseId: filters.warehouseId || undefined,
          customerId: filters.customerId || undefined,
        },
      };

      // Use apiInstance for the request with responseType 'blob' for file download
      const response = await apiInstance.post("/reports/export", exportData, {
        responseType: "blob", // Important: tells axios to expect binary data
      });

      // Get the blob data from response
      const blob = response.data;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `daily-summary-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Excel export completed successfully:", filename);
    } catch (error: any) {
      console.error("Export error:", error);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (row: any) => {
    console.log("View action for:", row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log("Edit action for:", row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log("Delete action for:", row);
    // TODO: Implement delete functionality
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h4" gutterBottom>
          Daily Summary Report
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Date-wise analysis of warehouse operations showing daily transactions,
          stock positions as of each date, and occupancy levels
        </Typography>

        <StatCards stats={statCards} />

        <Card>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Daily Summary Data
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>

            <ReportFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              // onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              showDateRange={true}
              showWarehouse={true}
              showCustomer={false}
              showCommodity={false}
              showStatus={false}
              isLoading={loading}
            />

            <ReportTable
              columns={columns}
              data={data}
              isLoading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              // onView={handleView}
              // onEdit={handleEdit}
              // onDelete={handleDelete}
              showActions={false}
              emptyMessage="No daily summary data available for the selected filters"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default DailySummaryReport;
