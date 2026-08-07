// Updated frontend code (DailySummaryReport.tsx)
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import {
  Warehouse,
  TrendingUp,
  People,
  LocalShipping,
  AttachMoney,
} from '@mui/icons-material';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import StatCards from '../components/StatCards';
import type { StatCardData } from '../components/StatCards';
import { useGetDailySummaryQuery, useGetDailySummaryStatsQuery } from '../services/reportsApi';

const DailySummaryReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: '',
    customerId: '',
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Prepare API filters
  const apiFilters = {
    ...filters,
    dateFrom: filters.dateFrom?.toISOString().split('T')[0],
    dateTo: filters.dateTo?.toISOString().split('T')[0],
    page: page + 1, // API expects 1-based page
    limit: rowsPerPage,
  };

  // API calls
  const { 
    data: summaryResponse, 
    isLoading: loading 
  } = useGetDailySummaryQuery(apiFilters);

  const { 
    data: statsResponse 
  } = useGetDailySummaryStatsQuery({
    dateFrom: filters.dateFrom?.toISOString().split('T')[0],
    dateTo: filters.dateTo?.toISOString().split('T')[0],
  });

  const data = summaryResponse?.result || [];
  const totalCount = summaryResponse?.pagination?.total || 0;
  const stats = statsResponse?.result;

  const statCards: StatCardData[] = [
    {
      title: 'Total Inward',
      value: stats?.totalInward || 0,
      unit: 'Quintals',
      trend: stats?.trends?.inwardTrend || 'neutral',
      trendValue: stats?.trends?.inwardTrendValue || '0%',
      icon: <TrendingUp />,
      color: 'success',
      subtitle: 'Selected period',
    },
    {
      title: 'Total Outward',
      value: stats?.totalOutward || 0,
      unit: 'Quintals',
      trend: stats?.trends?.outwardTrend || 'neutral',
      trendValue: stats?.trends?.outwardTrendValue || '0%',
      icon: <LocalShipping />,
      color: 'primary',
      subtitle: 'Selected period',
    },
    {
      title: 'Current Stock',
      value: stats?.currentStock || 0,
      unit: 'Quintals',
      trend: stats?.trends?.stockTrend || 'neutral',
      trendValue: stats?.trends?.stockTrendValue || '0%',
      icon: <Warehouse />,
      color: 'info',
      subtitle: 'Across all warehouses',
    },
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      unit: '₹',
      trend: stats?.trends?.revenueTrend || 'neutral',
      trendValue: stats?.trends?.revenueTrendValue || '0%',
      icon: <AttachMoney />,
      color: 'warning',
      subtitle: 'From invoices in period',
    },
    {
      title: 'Active Customers',
      value: stats?.activeCustomers || 0,
      trend: stats?.trends?.customerTrend || 'neutral',
      trendValue: stats?.trends?.customerTrendValue || '0',
      icon: <People />,
      color: 'secondary',
      subtitle: 'Selected period',
    },
  ];

  const columns = [
    { id: 'date', key: 'date', label: 'Date', sortable: true, type: 'date' as const },
    { id: 'warehouseName', key: 'warehouseName', label: 'Warehouse', sortable: true, type: 'text' as const },
    { id: 'totalInward', key: 'totalInward', label: 'Inward (Quintals)', sortable: true, type: 'number' as const },
    { id: 'totalOutward', key: 'totalOutward', label: 'Outward (Quintals)', sortable: true, type: 'number' as const },
    { id: 'totalStock', key: 'totalStock', label: 'Stock (Quintals)', sortable: true, type: 'number' as const },
    { id: 'occupancyPercentage', key: 'occupancyPercentage', label: 'Occupancy %', sortable: true, type: 'percentage' as const },
    { id: 'activeCustomers', key: 'activeCustomers', label: 'Customers', sortable: true, type: 'number' as const },
    { id: 'totalTransactions', key: 'totalTransactions', label: 'Transactions', sortable: true, type: 'number' as const },
    { id: 'dailyRevenue', key: 'dailyRevenue', label: 'Revenue (₹)', sortable: true, type: 'currency' as const },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // API will automatically refetch when filters change
  };

  const handleExportPDF = () => {
    console.log('Exporting daily summary in PDF format');
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = () => {
    console.log('Exporting daily summary in Excel format');
    // TODO: Implement Excel export functionality
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (row: any) => {
    console.log('View action for:', row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log('Edit action for:', row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log('Delete action for:', row);
    // TODO: Implement delete functionality
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Daily Summary Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive daily overview of warehouse operations, stock levels, and business metrics
      </Typography>

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
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            emptyMessage="No daily summary data available for the selected filters"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default DailySummaryReport;