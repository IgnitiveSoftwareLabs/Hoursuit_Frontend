import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Inventory as StockIcon,
  Warning as LowStockIcon,
  TrendingDown as CriticalIcon,
  CheckCircle as HealthyIcon,
} from '@mui/icons-material';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import StatCards from '../components/StatCards';
import type { StatCardData } from '../components/StatCards';
import { useGetStockRegisterQuery } from '../../../api/reportsApi';

interface StockData {
  id: number;
  warehouseName: string;
  stackNo: string;
  customerName: string;
  commodityName: string;
  grade: string;
  openingStock: number;
  inwardQuantity: number;
  outwardQuantity: number;
  currentStock: number;
  capacity: number;
  occupancyPercentage: number;
  lastMovementDate: string;
  status: 'healthy' | 'low' | 'critical' | 'empty';
  lotNumber: string;
  expiryDate?: string;
  storageRate: number;
  totalValue: number;
}

const StockRegisterReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: '',
    customerId: '',
    commodityId: '',
    status: '',
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // API call for stock register data
  const { data: reportData, isLoading: loading, error } = useGetStockRegisterQuery({
    ...filters,
    page: page + 1,
    limit: rowsPerPage,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  });



  const stats = reportData?.stats;
  const statCards: StatCardData[] = [
    {
      title: 'Total Stacks',
      value: stats?.totalStacks || 0,
      trend: stats?.stacksTrend || 'neutral',
      trendValue: stats?.stacksTrendValue || '0',
      icon: <StockIcon />,
      color: 'primary',
      subtitle: 'Active stacks',
    },
    {
      title: 'Total Stock',
      value: stats?.totalStock || 0,
      unit: 'MT',
      trend: stats?.stockTrend || 'neutral',
      trendValue: stats?.stockTrendValue || '0%',
      icon: <HealthyIcon />,
      color: 'success',
      subtitle: 'Across all warehouses',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockAlerts || 0,
      trend: stats?.lowStockTrend || 'neutral',
      trendValue: stats?.lowStockTrendValue || '0',
      icon: <LowStockIcon />,
      color: 'warning',
      subtitle: 'Requires attention',
    },
    {
      title: 'Critical Stock',
      value: stats?.criticalStock || 0,
      trend: stats?.criticalStockTrend || 'neutral',
      trendValue: stats?.criticalStockTrendValue || '0',
      icon: <CriticalIcon />,
      color: 'error',
      subtitle: 'Immediate action needed',
    },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'healthy', label: 'Healthy' },
    { value: 'low', label: 'Low Stock' },
    { value: 'critical', label: 'Critical' },
    { value: 'empty', label: 'Empty' },
  ];

  const getStatusChip = (status: string) => {
    const statusConfig = {
      healthy: { color: 'success' as const, label: 'Healthy' },
      low: { color: 'warning' as const, label: 'Low Stock' },
      critical: { color: 'error' as const, label: 'Critical' },
      empty: { color: 'default' as const, label: 'Empty' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default' as const, label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns = [
    { id: 'warehouseName', label: 'Warehouse', sortable: true, minWidth: 150 },
    { id: 'stackNo', label: 'Stack', sortable: true, minWidth: 80 },
    { id: 'customerName', label: 'Customer', sortable: true, minWidth: 150 },
    { id: 'commodityName', label: 'Commodity', sortable: true, minWidth: 120 },
    { id: 'grade', label: 'Grade', sortable: true, minWidth: 100 },
    { id: 'currentStock', label: 'Current Stock (MT)', sortable: true, minWidth: 140, align: 'right' as const },
    { id: 'capacity', label: 'Capacity (MT)', sortable: true, minWidth: 120, align: 'right' as const },
    { 
      id: 'occupancyPercentage', 
      label: 'Occupancy %', 
      sortable: true, 
      minWidth: 120, 
      align: 'right' as const,
      format: (value: number) => `${value.toFixed(1)}%`
    },
    { 
      id: 'status', 
      label: 'Status', 
      sortable: true, 
      minWidth: 120,
      format: (value: string) => getStatusChip(value)
    },
    { id: 'lastMovementDate', label: 'Last Movement', sortable: true, minWidth: 130 },
    { id: 'totalValue', label: 'Total Value (₹)', sortable: true, minWidth: 130, align: 'right' as const },
  ];

  const data = reportData?.stocks || [];
  const totalCount = reportData?.totalCount || 0;

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // API will automatically refetch when filters change
  };

  const handleExportPDF = () => {
    console.log('Exporting stock register in PDF format');
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = () => {
    console.log('Exporting stock register in Excel format');
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
    console.log('View stock details:', row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log('Edit stock:', row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log('Delete stock entry:', row);
    // TODO: Implement delete functionality
  };

  const criticalStocks = data.filter(item => item.status === 'critical');
  const lowStocks = data.filter(item => item.status === 'low');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stock Register Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Complete inventory tracking with real-time stock levels, capacity utilization, and stock alerts
      </Typography>

      {(criticalStocks.length > 0 || lowStocks.length > 0) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {criticalStocks.length > 0 && (
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Alert severity="error">
                <AlertTitle>Critical Stock Alert</AlertTitle>
                {criticalStocks.length} stack(s) have critically low stock levels requiring immediate attention.
              </Alert>
            </Box>
          )}
          {lowStocks.length > 0 && (
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Alert severity="warning">
                <AlertTitle>Low Stock Warning</AlertTitle>
                {lowStocks.length} stack(s) have low stock levels and may need restocking soon.
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
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            emptyMessage="No stock data available for the selected filters"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default StockRegisterReport;
