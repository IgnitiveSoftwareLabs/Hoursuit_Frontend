import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Inventory as StockIcon,
  Warning as LowStockIcon,
  CurrencyRupee as ValueIcon,
  CheckCircle as HealthyIcon,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetStockRegisterQuery,
  useGetStockRegisterStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

interface StockData {
  id: number;
  warehouseName: string;
  stackName: string;
  customerName: string;
  commodityName: string;
  currentStock: number;
  availableBags: number;
  capacity: number;
  availableCapacity: number;
  occupancyPercentage: number;
  totalValue: number;
  lastMovementDate: string;
  status: "healthy" | "low" | "critical" | "empty";
  weightUnit: string;
  originalWeight: number;
  originalWeightUnit: string;
}

const StockRegisterReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: "",
    customerId: "",
    commodityId: "",
    status: "",
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

  // API calls for stock register data and statistics
  const { data: reportData, isLoading: loading } = useGetStockRegisterQuery({
    warehouseId: filters.warehouseId || undefined,
    customerId: filters.customerId || undefined,
    commodityId: filters.commodityId || undefined,
    status: filters.status || undefined,
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: statsData } = useGetStockRegisterStatsQuery({
    warehouseId: filters.warehouseId || undefined,
    customerId: filters.customerId || undefined,
    commodityId: filters.commodityId || undefined,
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
  });

  const stats = statsData?.result;
  const statCards: StatCardData[] = [
    {
      title: "Total Stacks",
      value: stats?.totalStacks || 0,
      trend: (stats?.stacksTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.stacksTrendValue || "0",
      icon: <StockIcon />,
      color: "primary",
      subtitle: "Active stacks",
    },
    {
      title: "Total Stock",
      value: stats?.totalStock || 0,
      unit: stats?.weightUnit || "",
      trend: (stats?.stockTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.stockTrendValue || "0%",
      icon: <HealthyIcon />,
      color: "success",
      subtitle: "Across all warehouses",
    },
    {
      title: "Low Stock Alerts",
      value: stats?.lowStockAlerts || 0,
      trend: (stats?.lowStockTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.lowStockTrendValue || "0",
      icon: <LowStockIcon />,
      color: "warning",
      subtitle: "Requires attention",
    },
    {
      title: "Total Stock Value",
      value: stats?.totalStockValue || 0,
      unit: stats?.currency || "₹",
      trend:
        (stats?.totalStockValueTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.totalStockValueTrendValue || "0%",
      icon: <ValueIcon />,
      color: "info",
      subtitle: "Total inventory value",
    },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "healthy", label: "Healthy" },
    { value: "low", label: "Low Stock" },
    { value: "critical", label: "Critical" },
    { value: "empty", label: "Empty" },
  ];

  const getStatusChip = (status: string) => {
    const statusConfig = {
      healthy: { color: "success" as const, label: "Healthy" },
      low: { color: "warning" as const, label: "Low Stock" },
      critical: { color: "error" as const, label: "Critical" },
      empty: { color: "default" as const, label: "Empty" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "default" as const,
      label: status,
    };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns = [
    { id: "warehouseName", label: "Warehouse", sortable: true, minWidth: 150 },
    { id: "stackName", label: "Stack", sortable: true, minWidth: 80 },
    { id: "customerName", label: "Customer", sortable: true, minWidth: 150 },
    { id: "commodityName", label: "Commodity", sortable: true, minWidth: 120 },
    {
      id: "currentStock",
      label: "Current Stock (Quintals)",
      sortable: true,
      minWidth: 160,
      align: "right" as const,
    },
    {
      id: "availableBags",
      label: "Available Bags",
      sortable: true,
      minWidth: 130,
      align: "right" as const,
    },
    {
      id: "capacity",
      label: "Capacity (Quintals)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
    },
    {
      id: "availableCapacity",
      label: "Available Capacity (Quintals)",
      sortable: true,
      minWidth: 180,
      align: "right" as const,
    },
    {
      id: "occupancyPercentage",
      label: "Occupancy %",
      sortable: true,
      minWidth: 120,
      align: "right" as const,
      format: (value: string) => `${parseFloat(value).toFixed(1)}%`,
    },
    {
      id: "status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      format: (value: string) => getStatusChip(value),
    },
    {
      id: "lastMovementDate",
      label: "Last Movement",
      sortable: true,
      minWidth: 130,
    },
    {
      id: "totalValue",
      label: "Total Value (₹)",
      sortable: true,
      minWidth: 130,
      align: "right" as const,
    },
  ];

  const data = reportData?.result || [];
  const totalCount = reportData?.pagination?.total || 0;

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // API will automatically refetch when filters change
  };

  const handleExportPDF = () => {
    console.log("Exporting stock register in PDF format");
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = async () => {
    try {
      console.log("Exporting stock register in Excel format");

      const exportData = {
        reportType: "stock-register",
        format: "excel" as const,
        filters: {
          warehouseId: filters.warehouseId || undefined,
          customerId: filters.customerId || undefined,
          commodityId: filters.commodityId || undefined,
          status: filters.status || undefined,
          dateFrom: formatDateForAPI(filters.dateFrom),
          dateTo: formatDateForAPI(filters.dateTo),
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
      let filename = `stock-register-${
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

      console.log("Stock register Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting stock register to Excel:", error);
      // You might want to show a toast notification here
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
    console.log("View stock details:", row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log("Edit stock:", row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log("Delete stock entry:", row);
    // TODO: Implement delete functionality
  };

  const criticalStocks = data.filter((item) => item.status === "critical");
  const lowStocks = data.filter((item) => item.status === "low");

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h4" gutterBottom>
          Stock Register Report
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Complete inventory tracking with real-time stock levels, capacity
          utilization, and stock alerts
        </Typography>

        {(criticalStocks.length > 0 || lowStocks.length > 0) && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            {criticalStocks.length > 0 && (
              <Box sx={{ flex: "1 1 400px", minWidth: 400 }}>
                <Alert severity="error">
                  <AlertTitle>Critical Stock Alert</AlertTitle>
                  {criticalStocks.length} stack(s) have critically low stock
                  levels requiring immediate attention.
                </Alert>
              </Box>
            )}
            {lowStocks.length > 0 && (
              <Box sx={{ flex: "1 1 400px", minWidth: 400 }}>
                <Alert severity="warning">
                  <AlertTitle>Low Stock Warning</AlertTitle>
                  {lowStocks.length} stack(s) have low stock levels and may need
                  restocking soon.
                </Alert>
              </Box>
            )}
          </Box>
        )}

        <StatCards stats={statCards} />

        <Card>
          <CardContent>
            <ReportFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              showDateRange={true}
              showWarehouse={true}
              showCustomer={true}
              showCommodity={true}
              showStatus={true}
              statusOptions={statusOptions}
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
              emptyMessage="No stock data available for the selected filters"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default StockRegisterReport;
