import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from "@mui/material";
import {
  Warehouse as WarehouseIcon,
  PieChart as OccupancyIcon,
  TrendingUp as UtilizationIcon,
  People as CustomersIcon,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetWarehouseOccupancyQuery,
  useGetWarehouseOccupancyStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

interface WarehouseOccupancyData {
  id: number;
  warehouseName: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  currentStock: number;
  occupancyPercentage: number;
  utilizationEfficiency: number;
  activeStacks: number;
  totalStacks: number;
  activeCustomers: number;
  totalStockValue: number;
  capacityUnit: string;
  lastUpdated: string;
  status: "optimal" | "high" | "critical" | "underutilized";
}

const WarehouseOccupancyReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: "",
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

  // API calls for warehouse occupancy data and statistics
  const { data: reportData, isLoading: loading } =
    useGetWarehouseOccupancyQuery({
      warehouseId: filters.warehouseId || undefined,
      dateFrom: formatDateForAPI(filters.dateFrom),
      dateTo: formatDateForAPI(filters.dateTo),
      page: page + 1,
      limit: rowsPerPage,
    });

  const { data: statsData } = useGetWarehouseOccupancyStatsQuery({
    warehouseId: filters.warehouseId || undefined,
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
  });

  const data = reportData?.result || [];
  const totalCount = reportData?.pagination?.total || 0;
  const stats = statsData?.result;

  const statCards: StatCardData[] = [
    {
      title: "Total Warehouses",
      value: stats?.totalWarehouses || 0,
      trend: (stats?.warehousesTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.warehousesTrendValue || "0",
      icon: <WarehouseIcon />,
      color: "primary",
      subtitle: "Active warehouses",
    },
    {
      title: "Average Occupancy",
      value: stats?.averageOccupancy || 0,
      unit: "%",
      trend: (stats?.occupancyTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.occupancyTrendValue || "0%",
      icon: <OccupancyIcon />,
      color: "success",
      subtitle: "Across all warehouses",
    },
    {
      title: "Utilization Efficiency",
      value: stats?.utilizationEfficiency || 0,
      unit: "%",
      trend:
        (stats?.utilizationTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.utilizationTrendValue || "0%",
      icon: <UtilizationIcon />,
      color: "info",
      subtitle: "Overall efficiency",
    },
    {
      title: "Total Capacity",
      value: stats?.totalCapacity || 0,
      unit: stats?.capacityUnit || "quintals",
      trend: (stats?.customersTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.customersTrendValue || "0",
      icon: <CustomersIcon />,
      color: "secondary",
      subtitle: "Total storage capacity",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "success";
      case "high":
        return "warning";
      case "critical":
        return "error";
      case "underutilized":
        return "info";
      default:
        return "default";
    }
  };

  const getOccupancyBar = (percentage: number, status: string) => {
    return (
      <Box sx={{ display: "flex", alignItems: "center", minWidth: 120 }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={getStatusColor(status) as any}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">
            {percentage.toFixed(1)}%
          </Typography>
        </Box>
      </Box>
    );
  };

  const columns = [
    { id: "warehouseName", label: "Warehouse", sortable: true, minWidth: 150 },
    { id: "location", label: "Location", sortable: true, minWidth: 100 },
    {
      id: "totalCapacity",
      label: "Total Capacity (Quintals)",
      sortable: true,
      minWidth: 180,
      align: "right" as const,
    },
    {
      id: "occupiedCapacity",
      label: "Occupied (Quintals)",
      sortable: true,
      minWidth: 160,
      align: "right" as const,
    },
    {
      id: "availableCapacity",
      label: "Available (Quintals)",
      sortable: true,
      minWidth: 160,
      align: "right" as const,
    },
    {
      id: "currentStock",
      label: "Current Stock (Quintals)",
      sortable: true,
      minWidth: 180,
      align: "right" as const,
    },
    {
      id: "occupancyPercentage",
      label: "Occupancy",
      sortable: true,
      minWidth: 150,
      format: (value: number) => {
        const row = data.find(
          (d) => d.occupancyPercentage === parseFloat(value.toString())
        );
        return getOccupancyBar(
          parseFloat(value.toString()),
          row?.status || "optimal"
        );
      },
    },
    {
      id: "activeStacks",
      label: "Active Stacks",
      sortable: true,
      minWidth: 120,
      format: (value: number) => {
        const row = data.find((d) => d.activeStacks === value);
        return `${value}/${row?.totalStacks || 0}`;
      },
    },
    {
      id: "activeCustomers",
      label: "Customers",
      sortable: true,
      minWidth: 100,
      align: "center" as const,
    },
    {
      id: "utilizationEfficiency",
      label: "Efficiency %",
      sortable: true,
      minWidth: 120,
      align: "right" as const,
      format: (value: string) => `${parseFloat(value).toFixed(1)}%`,
    },
    {
      id: "totalStockValue",
      label: "Stock Value (₹)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
    },
    {
      id: "status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      format: (value: string) => (
        <Typography
          variant="body2"
          sx={{
            color: `${getStatusColor(value)}.main`,
            fontWeight: "medium",
            textTransform: "capitalize",
          }}
        >
          {value}
        </Typography>
      ),
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // API will automatically refetch when filters change
  };

  const handleExportPDF = () => {
    console.log("Exporting warehouse occupancy in PDF format");
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = async () => {
    try {
      console.log("Exporting warehouse occupancy in Excel format");

      const exportData = {
        reportType: "warehouse-occupancy",
        format: "excel" as const,
        filters: {
          warehouseId: filters.warehouseId || undefined,
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
      let filename = `warehouse-occupancy-${
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

      console.log("Warehouse occupancy Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting warehouse occupancy to Excel:", error);
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
    console.log("View warehouse details:", row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log("Edit warehouse settings:", row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log("Delete warehouse:", row);
    // TODO: Implement delete functionality
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h4" gutterBottom>
          Warehouse Occupancy Report
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Real-time warehouse capacity utilization, space availability, and
          efficiency metrics
        </Typography>

        <StatCards stats={statCards} />

        {/* Summary Cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Capacity
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {(stats?.totalCapacity || 0).toLocaleString("en-IN")}{" "}
                  {stats?.capacityUnit || "Quintals"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Occupancy
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {(stats?.averageOccupancy || 0).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 300 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Utilization Efficiency
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats?.utilizationEfficiency || 0}
                    color={
                      (stats?.utilizationEfficiency || 0) > 90
                        ? "error"
                        : (stats?.utilizationEfficiency || 0) > 70
                        ? "warning"
                        : "success"
                    }
                    sx={{ flexGrow: 1, height: 10, borderRadius: 1, mr: 2 }}
                  />
                  <Typography variant="h5" color="success.main">
                    {(stats?.utilizationEfficiency || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

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
             
              showActions={false}
              emptyMessage="No warehouse occupancy data available"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default WarehouseOccupancyReport;
