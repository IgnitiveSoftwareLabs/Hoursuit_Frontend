import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFetchWarehousesQuery } from '../../../RTK/services/warehouseApi';
import { useGetCustomersQuery } from '../../../RTK/services/customerApi';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';

interface FilterOption {
  value: string;
  label: string;
}

interface ReportFiltersProps {
  filters: {
    dateFrom: Date | null;
    dateTo: Date | null;
    warehouseId?: string;
    customerId?: string;
    commodityId?: string;
    status?: string;
    [key: string]: any;
  };
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  showDateRange?: boolean;
  showWarehouse?: boolean;
  showCustomer?: boolean;
  showCommodity?: boolean;
  showStatus?: boolean;
  statusOptions?: FilterOption[];
  customFilters?: React.ReactNode;
  isLoading?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onExportPDF,
  onExportExcel,
  showDateRange = true,
  showWarehouse = false,
  showCustomer = false,
  showCommodity = false,
  showStatus = false,
  statusOptions = [],
  customFilters,
  isLoading = false,
}) => {
  const handleFilterChange = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  // Fetch dynamic data from APIs
  const { data: warehousesData, isLoading: warehousesLoading } = useFetchWarehousesQuery({ 
    page: 1, 
    limit: 100, 
    search: '' 
  });
  
  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery({ 
    page: 1,
    search: '',
    option: true,
  });

  // Transform API data to dropdown options
  const warehouseOptions: FilterOption[] = [
    { value: '', label: 'All Warehouses' },
    ...(warehousesData?.result || []).map((warehouse: any) => ({
      value: warehouse.id.toString(),
      label: warehouse.name || `Warehouse ${warehouse.id}`,
    })),
  ];

  const customerOptions: FilterOption[] = [
    { value: '', label: 'All Customers' },
    ...(customersData?.result || []).map((customer: any) => ({
      value: customer.id.toString(),
      label: customer.name || `${customer.FirstName} ${customer.LastName}`,
    })),
  ];

  // TODO: Add commodity API once available
  const commodityOptions: FilterOption[] = [
    { value: '', label: 'All Commodities' },
    // Will be populated from commodity API
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters & Export Options
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Date Range Filters */}
            {showDateRange && (
              <>
                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                  <DatePicker
                    label="From Date"
                    value={filters.dateFrom}
                    onChange={(newValue) => handleFilterChange('dateFrom', newValue)}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: TextField,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                  <DatePicker
                    label="To Date"
                    value={filters.dateTo}
                    onChange={(newValue) => handleFilterChange('dateTo', newValue)}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: TextField,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Box>
              </>
            )}

            {/* Warehouse Filter */}
            {showWarehouse && (
              <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={filters.warehouseId || ''}
                    label="Warehouse"
                    onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                    disabled={warehousesLoading}
                  >
                    {warehousesLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Loading warehouses...
                      </MenuItem>
                    ) : (
                      warehouseOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Customer Filter */}
            {showCustomer && (
              <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={filters.customerId || ''}
                    label="Customer"
                    onChange={(e) => handleFilterChange('customerId', e.target.value)}
                    disabled={customersLoading}
                  >
                    {customersLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Loading customers...
                      </MenuItem>
                    ) : (
                      customerOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Commodity Filter */}
            {showCommodity && (
              <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Commodity</InputLabel>
                  <Select
                    value={filters.commodityId || ''}
                    label="Commodity"
                    onChange={(e) => handleFilterChange('commodityId', e.target.value)}
                  >
                    {commodityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Status Filter */}
            {showStatus && (
              <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Custom Filters */}
            {customFilters && (
              <Box sx={{ width: '100%' }}>
                {customFilters}
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={16} /> : <SearchIcon />}
              onClick={onApplyFilters}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </Button>

            <Stack direction="row" spacing={1}>
              {onExportPDF && (
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={onExportPDF}
                  disabled={isLoading}
                  size="small"
                >
                  Export PDF
                </Button>
              )}
              {onExportExcel && (
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={onExportExcel}
                  disabled={isLoading}
                  size="small"
                >
                  Export Excel
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default ReportFilters;
