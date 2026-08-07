import React, { useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  Receipt as WHRIcon,
  Scale as WeightIcon,
  LocalShipping as DeliveryIcon,
  AccountBalance as ValueIcon,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetWHRReportQuery,
  useGetWHRStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

const WHRReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    customerId: "",
    commodityId: "",
    warehouseId: "",
    deliveryStatus: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to format date properly (avoiding timezone issues)
  const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Prepare API query parameters
  const queryParams = {
    dateFrom: filters.dateFrom?.toISOString().split("T")[0],
    dateTo: filters.dateTo?.toISOString().split("T")[0],
    customerId: filters.customerId || undefined,
    commodityId: filters.commodityId || undefined,
    warehouseId: filters.warehouseId || undefined,
    deliveryStatus: (filters.deliveryStatus || "") as
      | ""
      | "fully_delivered"
      | "partially_delivered"
      | "pending_delivery",
    page: page + 1,
    limit: rowsPerPage,
  };

  // API calls with refetch capability
  const {
    data: whrData,
    isLoading,
    refetch: refetchWHRData,
  } = useGetWHRReportQuery(queryParams);

  const { data: statsData, refetch: refetchStatsData } = useGetWHRStatsQuery({
    dateFrom: filters.dateFrom?.toISOString().split("T")[0],
    dateTo: filters.dateTo?.toISOString().split("T")[0],
    customerId: filters.customerId || undefined,
    commodityId: filters.commodityId || undefined,
    warehouseId: filters.warehouseId || undefined,
    deliveryStatus: (filters.deliveryStatus || "") as
      | ""
      | "fully_delivered"
      | "partially_delivered"
      | "pending_delivery",
  });

  const whrs = whrData?.result || [];
  const stats = statsData?.result;

  const statCards: StatCardData[] = [
    {
      title: "Total WHRs",
      value: stats?.totalWHRs || 0,
      trend:
        (stats?.trends?.whrTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.trends?.whrTrendValue || "0%",
      icon: <WHRIcon />,
      color: "primary",
      subtitle: "This period",
    },
    {
      title: "Deposited Weight",
      value: stats?.totalDepositedWeight || 0,
      unit: "Qtl",
      trend:
        (stats?.trends?.depositWeightTrend as "up" | "down" | "neutral") ||
        "neutral",
      trendValue: stats?.trends?.depositWeightTrendValue || "0%",
      icon: <WeightIcon />,
      color: "success",
      subtitle: "Total weight deposited",
    },
    {
      title: "Delivery Efficiency",
      value: stats?.deliveryEfficiency || 0,
      unit: "%",
      trend:
        (stats?.trends?.deliveryTrend as "up" | "down" | "neutral") ||
        "neutral",
      trendValue: stats?.trends?.deliveryTrendValue || "0%",
      icon: <DeliveryIcon />,
      color: "info",
      subtitle: "Delivery completion rate",
    },
    {
      title: "Total WHR Value",
      value: stats?.totalWHRValue || 0,
      unit: "₹",
      trend:
        (stats?.trends?.valueTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.trends?.valueTrendValue || "0%",
      icon: <ValueIcon />,
      color: "warning",
      subtitle: "Total commodity value",
    },
  ];

  const columns = [
    { id: "receiptNumber", label: "Receipt No", sortable: true, minWidth: 120 },
    { id: "depositDate", label: "Deposit Date", sortable: true, minWidth: 120 },
    { id: "customerName", label: "Customer", sortable: true, minWidth: 150 },
    { id: "commodityName", label: "Commodity", sortable: true, minWidth: 120 },
    { id: "warehouseName", label: "Warehouse", sortable: true, minWidth: 120 },
    { id: "stackName", label: "Stack", sortable: true, minWidth: 100 },
    {
      id: "numberOfBags",
      label: "Bags",
      sortable: true,
      minWidth: 80,
      align: "center" as const,
    },
    {
      id: "weight",
      label: "Weight (Qtl)",
      sortable: true,
      minWidth: 120,
      align: "right" as const,
      format: (value: string | number) =>
        `${parseFloat(value?.toString() || "0").toLocaleString()} Qtl`,
    },
    {
      id: "remainingWeight",
      label: "Remaining (Qtl)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: string | number) =>
        `${parseFloat(value?.toString() || "0").toLocaleString()} Qtl`,
    },
    {
      id: "deliveredWeight",
      label: "Delivered (Qtl)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: string | number) =>
        `${parseFloat(value?.toString() || "0").toLocaleString()} Qtl`,
    },
    {
      id: "totalValue",
      label: "Value (₹)",
      sortable: true,
      minWidth: 120,
      align: "right" as const,
      format: (value: string | number) =>
        `₹${parseFloat(value?.toString() || "0").toLocaleString()}`,
    },
    {
      id: "rentAmount",
      label: "Rent (₹)",
      sortable: true,
      minWidth: 100,
      align: "right" as const,
      format: (value: string | number) =>
        `₹${parseFloat(value?.toString() || "0").toLocaleString()}`,
    },
    {
      id: "deliveryStatus",
      label: "Status",
      sortable: true,
      minWidth: 140,
      format: (value: string) => {
        const statusColors = {
          fully_delivered: "#4caf50",
          partially_delivered: "#ff9800",
          pending_delivery: "#f44336",
        };
        const statusLabels = {
          fully_delivered: "Fully Delivered",
          partially_delivered: "Partially Delivered",
          pending_delivery: "Pending Delivery",
        };
        return (
          <span
            style={{
              color: statusColors[value as keyof typeof statusColors] || "#666",
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {statusLabels[value as keyof typeof statusLabels] || value}
          </span>
        );
      },
    },
    {
      id: "totalGatePasses",
      label: "Gate Passes",
      sortable: true,
      minWidth: 110,
      align: "center" as const,
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // RTK Query will automatically refetch when filters change
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refetch both WHR data and stats
      await Promise.all([refetchWHRData(), refetchStatsData()]);
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      console.log("Exporting WHR report in Excel format");

      const exportData = {
        reportType: "whr-report",
        format: "excel",
        filters: {
          dateFrom: formatDateForAPI(filters.dateFrom),
          dateTo: formatDateForAPI(filters.dateTo),
          customerId: filters.customerId || undefined,
          commodityId: filters.commodityId || undefined,
          warehouseId: filters.warehouseId || undefined,
          deliveryStatus: filters.deliveryStatus || undefined,
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
      let filename = `whr-report-${
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

      console.log("Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
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
    console.log("View WHR details:", row);
    // TODO: Implement view functionality - could open WHR details modal
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h4" gutterBottom>
          WHR Report (Request Depositor Report)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive overview of Warehouse Receipt (WHR) deposits with
          delivery status, weight management, and inventory tracking
        </Typography>

        <StatCards stats={statCards} />

        <Card>
          <CardContent>
            <ReportFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onRefresh={handleRefresh}
              onExportExcel={handleExportExcel}
              showDateRange={true}
              showCustomer={true}
              showWarehouse={true}
              showCommodity={true}
              showStatus={true}
              statusOptions={[
                { value: "", label: "All Status" },
                { value: "fully_delivered", label: "Fully Delivered" },
                { value: "partially_delivered", label: "Partially Delivered" },
                { value: "pending_delivery", label: "Pending Delivery" },
              ]}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
            />

            <ReportTable
              columns={columns}
              data={whrs}
              isLoading={isLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={whrData?.pagination?.total || 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onView={handleView}
              showActions={true}
              emptyMessage="No WHRs found for the selected filters"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default WHRReport;
