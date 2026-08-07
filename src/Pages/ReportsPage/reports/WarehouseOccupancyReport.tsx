import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  Warehouse as WarehouseIcon,
  PieChart as OccupancyIcon,
  TrendingUp as UtilizationIcon,
  People as CustomersIcon,
} from '@mui/icons-material';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import StatCards from '../components/StatCards';
import type { StatCardData } from '../components/StatCards';
import { useGetWarehouseOccupancyQuery } from '../../../api/reportsApi';

interface WarehouseOccupancyData {
  id: number;
  warehouseName: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  occupancyPercentage: number;
  activeStacks: number;
  totalStacks: number;
  activeCustomers: number;
  utilizationEfficiency: number;
  lastUpdated: string;
  status: 'optimal' | 'high' | 'critical' | 'underutilized';
}

const WarehouseOccupancyReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: '',
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // API call for warehouse occupancy data
  const { data: reportData, isLoading: loading, error } = useGetWarehouseOccupancyQuery({
    ...filters,
    page: page + 1,
    limit: rowsPerPage,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  });

  const data = reportData?.warehouses || [];
  const totalCount = reportData?.totalCount || 0;
  const stats = reportData?.stats;



  const statCards: StatCardData[] = [
    {
      title: 'Total Warehouses',
      value: stats?.totalWarehouses || 0,
      trend: stats?.warehousesTrend || 'neutral',
      trendValue: stats?.warehousesTrendValue || '0',
      icon: <WarehouseIcon />,
      color: 'primary',
      subtitle: 'Active warehouses',
    },
    {
      title: 'Average Occupancy',
      value: stats?.averageOccupancy || 0,
      unit: '%',
      trend: stats?.occupancyTrend || 'neutral',
      trendValue: stats?.occupancyTrendValue || '0%',
      icon: <OccupancyIcon />,
      color: 'success',
      subtitle: 'Across all warehouses',
    },
    {
      title: 'Utilization Efficiency',
      value: stats?.utilizationEfficiency || 0,
      unit: '%',
      trend: stats?.utilizationTrend || 'neutral',
      trendValue: stats?.utilizationTrendValue || '0%',
      icon: <UtilizationIcon />,
      color: 'info',
      subtitle: 'Overall efficiency',
    },
    {
      title: 'Active Customers',
      value: stats?.activeCustomers || 0,
      trend: stats?.customersTrend || 'neutral',
      trendValue: stats?.customersTrendValue || '0',
      icon: <CustomersIcon />,
      color: 'secondary',
      subtitle: 'Across all locations',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'success';
      case 'high': return 'warning';
      case 'critical': return 'error';
      case 'underutilized': return 'info';
      default: return 'default';
    }
  };

  const getOccupancyBar = (percentage: number, status: string) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
        <Box sx={{ width: '100%', mr: 1 }}>
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
    { id: 'warehouseName', label: 'Warehouse', sortable: true, minWidth: 150 },
    { id: 'location', label: 'Location', sortable: true, minWidth: 100 },
    { id: 'totalCapacity', label: 'Total Capacity (MT)', sortable: true, minWidth: 140, align: 'right' as const },
    { id: 'occupiedCapacity', label: 'Occupied (MT)', sortable: true, minWidth: 120, align: 'right' as const },
    { id: 'availableCapacity', label: 'Available (MT)', sortable: true, minWidth: 120, align: 'right' as const },
    { 
      id: 'occupancyPercentage', 
      label: 'Occupancy', 
      sortable: true, 
      minWidth: 150,
      format: (value: number) => {
        const row = data.find(d => d.occupancyPercentage === value);
        return getOccupancyBar(value, row?.status || 'optimal');
      }
    },
    { 
      id: 'activeStacks', 
      label: 'Active Stacks', 
      sortable: true, 
      minWidth: 120,
      format: (value: number) => {
        const row = data.find(d => d.activeStacks === value);
        return `${value}/${row?.totalStacks || 0}`;
      }
    },
    { id: 'activeCustomers', label: 'Customers', sortable: true, minWidth: 100, align: 'center' as const },
    { 
      id: 'utilizationEfficiency', 
      label: 'Efficiency %', 
      sortable: true, 
      minWidth: 120, 
      align: 'right' as const,
      format: (value: number) => `${value}%`
    },
    { 
      id: 'status', 
      label: 'Status', 
      sortable: true, 
      minWidth: 120,
      format: (value: string) => (
        <Typography
          variant="body2"
          sx={{
            color: `${getStatusColor(value)}.main`,
            fontWeight: 'medium',
            textTransform: 'capitalize',
          }}
        >
          {value}
        </Typography>
      )
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
    console.log('Exporting warehouse occupancy in PDF format');
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = () => {
    console.log('Exporting warehouse occupancy in Excel format');
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
    console.log('View warehouse details:', row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log('Edit warehouse settings:', row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log('Delete warehouse:', row);
    // TODO: Implement delete functionality
  };

  // Calculate summary metrics
  const totalCapacity = data.reduce((sum, item) => sum + item.totalCapacity, 0);
  const totalOccupied = data.reduce((sum, item) => sum + item.occupiedCapacity, 0);
  const overallOccupancy = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Warehouse Occupancy Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Real-time warehouse capacity utilization, space availability, and efficiency metrics
      </Typography>

      <StatCards stats={statCards} />

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Capacity
              </Typography>
              <Typography variant="h4" color="primary.main">
                {totalCapacity.toLocaleString('en-IN')} MT
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Occupied Space
              </Typography>
              <Typography variant="h4" color="warning.main">
                {totalOccupied.toLocaleString('en-IN')} MT
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Occupancy
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallOccupancy}
                  color={overallOccupancy > 90 ? 'error' : overallOccupancy > 70 ? 'warning' : 'success'}
                  sx={{ flexGrow: 1, height: 10, borderRadius: 1, mr: 2 }}
                />
                <Typography variant="h5" color="success.main">
                  {overallOccupancy.toFixed(1)}%
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
            showDateRange={false}
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
            emptyMessage="No warehouse occupancy data available"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default WarehouseOccupancyReport;
