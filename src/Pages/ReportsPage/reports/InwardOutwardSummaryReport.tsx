import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CallReceived as InwardIcon,
  CallMade as OutwardIcon,
  SwapHoriz as TransferIcon,
  Assessment as SummaryIcon,
} from '@mui/icons-material';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import StatCards from '../components/StatCards';
import type { StatCardData } from '../components/StatCards';
import { useGetMovementReportQuery, useGetMovementStatsQuery } from '../services/reportsApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`movement-tabpanel-${index}`}
      aria-labelledby={`movement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const InwardOutwardSummaryReport: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: '',
    customerId: '',
    commodityId: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Prepare API query parameters
  const queryParams = {
    ...filters,
    dateFrom: filters.dateFrom?.toISOString().split('T')[0],
    dateTo: filters.dateTo?.toISOString().split('T')[0],
    type: (tabValue === 0 ? 'inward' : tabValue === 1 ? 'outward' : 'all') as 'inward' | 'outward' | 'all',
    page: page + 1,
    limit: rowsPerPage,
  };

  // API calls
  const { data: movementData, isLoading } = useGetMovementReportQuery(queryParams);
  const { data: statsData } = useGetMovementStatsQuery({
    dateFrom: filters.dateFrom?.toISOString().split('T')[0],
    dateTo: filters.dateTo?.toISOString().split('T')[0],
    warehouseId: filters.warehouseId,
  });

  const movements = movementData?.result || [];
  const stats = statsData?.result;

  // Data comes from RTK Query

  const statCards: StatCardData[] = [
    {
      title: 'Total Inward',
      value: stats?.totalInward || 0,
      unit: 'MT',
      trend: 'neutral',
      trendValue: stats?.totalInward ? `${stats.totalInward} MT` : '0 MT',
      icon: <InwardIcon />,
      color: 'success',
      subtitle: 'This period',
    },
    {
      title: 'Total Outward',
      value: stats?.totalOutward || 0,
      unit: 'MT',
      trend: 'neutral',
      trendValue: stats?.totalOutward ? `${stats.totalOutward} MT` : '0 MT',
      icon: <OutwardIcon />,
      color: 'primary',
      subtitle: 'This period',
    },
    {
      title: 'Net Movement',
      value: stats?.netMovement || 0,
      unit: 'MT',
      trend: (stats?.netMovement || 0) >= 0 ? 'up' : 'down',
      trendValue: `${Math.abs(stats?.netMovement || 0)} MT`,
      icon: <TransferIcon />,
      color: 'info',
      subtitle: 'Inward - Outward',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      trend: 'neutral',
      trendValue: `${stats?.totalTransactions || 0} transactions`,
      icon: <SummaryIcon />,
      color: 'secondary',
      subtitle: 'This period',
    },
  ];

  const columns = [
    { id: 'date', label: 'Date', sortable: true, minWidth: 100 },
    { id: 'gatePassNo', label: 'Gate Pass No', sortable: true, minWidth: 120 },
    { id: 'customerName', label: 'Customer', sortable: true, minWidth: 150 },
    { id: 'commodityName', label: 'Commodity', sortable: true, minWidth: 120 },
    { id: 'warehouseName', label: 'Warehouse', sortable: true, minWidth: 150 },
    { id: 'stackNo', label: 'Stack', sortable: true, minWidth: 80 },
    { id: 'quantity', label: 'Quantity (MT)', sortable: true, minWidth: 120, align: 'right' as const },
    { id: 'rate', label: 'Rate (₹/MT)', sortable: true, minWidth: 120, align: 'right' as const },
    { id: 'value', label: 'Value (₹)', sortable: true, minWidth: 120, align: 'right' as const },
    { id: 'vehicleNo', label: 'Vehicle No', sortable: false, minWidth: 120 },
    { id: 'movementStatus', label: 'Status', sortable: true, minWidth: 100 },
  ];

  // Data fetching handled by RTK Query

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // RTK Query will automatically refetch when filters change
  };

  const handleExportPDF = () => {
    const type = tabValue === 0 ? 'inward' : 'outward';
    console.log(`Exporting ${type} summary in PDF format`);
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = () => {
    const type = tabValue === 0 ? 'inward' : 'outward';
    console.log(`Exporting ${type} summary in Excel format`);
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
    console.log('View movement details:', row);
    // TODO: Implement view functionality
  };

  const handleEdit = (row: any) => {
    console.log('Edit movement:', row);
    // TODO: Implement edit functionality
  };

  const handleDelete = (row: any) => {
    console.log('Delete movement:', row);
    // TODO: Implement delete functionality
  };

  const getCurrentData = () => {
    return movements;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inward/Outward Summary Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Detailed tracking of all inward and outward movements with commodity-wise breakdown
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
            showCustomer={true}
            showCommodity={true}
            showStatus={false}
            isLoading={isLoading}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="movement tabs">
              <Tab
                label="Inward Movements"
                icon={<InwardIcon />}
                iconPosition="start"
                id="movement-tab-0"
                aria-controls="movement-tabpanel-0"
              />
              <Tab
                label="Outward Movements"
                icon={<OutwardIcon />}
                iconPosition="start"
                id="movement-tab-1"
                aria-controls="movement-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <ReportTable
              columns={columns}
              data={getCurrentData()}
              isLoading={isLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={movementData?.pagination?.total || 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
              emptyMessage="No inward movements found for the selected filters"
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ReportTable
              columns={columns}
              data={getCurrentData()}
              isLoading={isLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={movementData?.pagination?.total || 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
              emptyMessage="No outward movements found for the selected filters"
            />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InwardOutwardSummaryReport;
