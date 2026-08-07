import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  CircularProgress,
  Skeleton,
  Button,
  ButtonGroup,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../Hooks/usePermissions';
import {
  useGetInventoryQuery,
  useGetWarehousesQuery,
  useGetClientsQuery,
  useGetCommoditiesQuery,
  useLazyGetGodownsQuery,
  useLazyGetStacksQuery,
  type InventoryQueryParams,
} from '../RTK/services/inventoryApi';

const EnhancedInventory: React.FC = () => {
  const { canRead, canUpdate } = usePermissions();

  // Filter and pagination states
  const [filters, setFilters] = useState<InventoryQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    warehouseId: '',
    clientId: '',
    commodityId: '',
    godownId: '',
    stackId: '',
    sortBy: 'id',
    sortOrder: 'DESC',
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // RTK Query hooks
  const { 
    data: inventoryData, 
    isLoading, 
    error, 
    refetch 
  } = useGetInventoryQuery(filters, {
    skip: !canRead('inventory'),
  });

  const { data: warehouses = [] } = useGetWarehousesQuery(undefined, {
    skip: !canRead('inventory'),
  });
  
  const { data: clients = [] } = useGetClientsQuery(undefined, {
    skip: !canRead('inventory'),
  });
  
  const { data: commodities = [] } = useGetCommoditiesQuery(undefined, {
    skip: !canRead('inventory'),
  });

  const [getGodowns, { data: godowns = [] }] = useLazyGetGodownsQuery();
  const [getStacks, { data: stacks = [] }] = useLazyGetStacksQuery();

  // Handle search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ 
        ...prev, 
        search: searchTerm, 
        page: 1 
      }));
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Load godowns when warehouse changes
  useEffect(() => {
    if (filters.warehouseId) {
      getGodowns({ warehouseId: filters.warehouseId });
      // Clear godown and stack when warehouse changes
      if (filters.godownId) {
        setFilters(prev => ({ ...prev, godownId: '', stackId: '' }));
      }
    }
  }, [filters.warehouseId, getGodowns]);

  // Load stacks when godown changes
  useEffect(() => {
    if (filters.godownId) {
      getStacks({ godownId: filters.godownId });
      // Clear stack when godown changes
      if (filters.stackId) {
        setFilters(prev => ({ ...prev, stackId: '' }));
      }
    }
  }, [filters.godownId, getStacks]);

  const handleFilterChange = (key: keyof InventoryQueryParams, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      page: 1 // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      warehouseId: '',
      clientId: '',
      commodityId: '',
      godownId: '',
      stackId: '',
      sortBy: 'id',
      sortOrder: 'DESC',
    });
    setSearchTerm('');
  };

  const handleSort = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setFilters(prev => ({ 
      ...prev, 
      sortBy: field, 
      sortOrder: newOrder 
    }));
  };

  // Access control check
  if (!canRead('inventory')) {
    return (
      <Alert severity="error">
        Access denied: Insufficient permissions to view inventory
      </Alert>
    );
  }

  if (error) {
    toast.error('Failed to fetch inventory data');
  }

  const inventory = inventoryData?.result?.inventory || [];
  const pagination = inventoryData?.result?.pagination || {};
  const stats = inventoryData?.result?.stats || {
    totalWeight: 0,
    totalValue: 0,
    totalBags: 0,
    locationBreakdown: []
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Enhanced Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={`${pagination.totalItems || 0} Items`} 
            color="primary" 
            variant="outlined" 
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Total Weight</Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : `${stats.totalWeight?.toFixed(2)} Q`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Total Value</Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : `₹${Number(stats.totalValue).toLocaleString()}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Total Bags</Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : stats.totalBags?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Locations</Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : stats.locationBreakdown.length}
              </Typography>
             
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Search & Filter Inventory</Typography>
            <Box>
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant={showAdvancedFilters ? 'contained' : 'outlined'}
                size="small"
              >
                Advanced Filters
              </Button>
              <Button
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {/* Basic Search */}
          <Grid container spacing={2} sx={{ mb: showAdvancedFilters ? 2 : 0 }}>
            <Grid size={{xs:12,sm:6,md:6}}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client, commodity, location..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{xs:12,sm:6,md:3}}>
              <FormControl fullWidth>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                  label="Page Size"
                >
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={25}>25 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                  <MenuItem value={100}>100 per page</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12,sm:6,md:3}}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="weight">Weight</MenuItem>
                  <MenuItem value="quantity">Quantity</MenuItem>
                  <MenuItem value="createdAt">Date Created</MenuItem>
                  <MenuItem value="updatedAt">Last Updated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Grid container spacing={2}>
              <Grid size={{xs:12,sm:6,md:3}}>
                <FormControl fullWidth>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={filters.warehouseId}
                    onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                    label="Warehouse"
                  >
                    <MenuItem value="">All Warehouses</MenuItem>
                    {warehouses.map((warehouse: any) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs:12,sm:6,md:3}}>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={filters.clientId}
                    onChange={(e) => handleFilterChange('clientId', e.target.value)}
                    label="Client"
                  >
                    <MenuItem value="">All Clients</MenuItem>
                    {clients.map((client: any) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs:12,sm:6,md:3}}>
                <FormControl fullWidth>
                  <InputLabel>Commodity</InputLabel>
                  <Select
                    value={filters.commodityId}
                    onChange={(e) => handleFilterChange('commodityId', e.target.value)}
                    label="Commodity"
                  >
                    <MenuItem value="">All Commodities</MenuItem>
                    {commodities.map((commodity: any) => (
                      <MenuItem key={commodity.id} value={commodity.id}>
                        {commodity.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs:12,sm:6,md:3}}>
                <FormControl fullWidth>
                  <InputLabel>Godown</InputLabel>
                  <Select
                    value={filters.godownId}
                    onChange={(e) => handleFilterChange('godownId', e.target.value)}
                    label="Godown"
                    disabled={!filters.warehouseId}
                  >
                    <MenuItem value="">All Godowns</MenuItem>
                    {godowns.map((godown: any) => (
                      <MenuItem key={godown.id} value={godown.id}>
                        {godown.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs:12,sm:6,md:3}}>
                <FormControl fullWidth>
                  <InputLabel>Stack</InputLabel>
                  <Select
                    value={filters.stackId}
                    onChange={(e) => handleFilterChange('stackId', e.target.value)}
                    label="Stack"
                    disabled={!filters.godownId}
                  >
                    <MenuItem value="">All Stacks</MenuItem>
                    {stacks.map((stack: any) => (
                      <MenuItem key={stack.id} value={stack.id}>
                        {stack.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{xs:12,sm:6,md:3}}>
                <ButtonGroup variant="outlined" fullWidth>
                  <Button
                    onClick={() => handleFilterChange('sortOrder', 'ASC')}
                    variant={filters.sortOrder === 'ASC' ? 'contained' : 'outlined'}
                  >
                    Ascending
                  </Button>
                  <Button
                    onClick={() => handleFilterChange('sortOrder', 'DESC')}
                    variant={filters.sortOrder === 'DESC' ? 'contained' : 'outlined'}
                  >
                    Descending
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      {stats.locationBreakdown.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Inventory by Warehouse</Typography>
            {isLoading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Grid size={{xs:12,sm:6,md:4}} key={index}>
                    <Skeleton height={80} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {stats.locationBreakdown.map((location: any, index: number) => (
                  <Grid size={{xs:12,sm:6,md:4}} key={index}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      backgroundColor: 'background.default'
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {location.warehouseName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.itemCount} items • {parseFloat(location.totalWeight || '0').toFixed(2)} quintals • {location.totalBags} bags
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Sr. No.</TableCell>
                <TableCell>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={() => handleSort('client')}
                    size="small"
                  >
                    Client Name
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={() => handleSort('commodity')}
                    size="small"
                  >
                    Commodity
                  </Button>
                </TableCell>
                <TableCell>Location</TableCell>
                <TableCell>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={() => handleSort('weight')}
                    size="small"
                  >
                    Weight
                  </Button>
                </TableCell>
                <TableCell>Total Cost</TableCell>
                <TableCell>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={() => handleSort('quantity')}
                    size="small"
                  >
                    Bags
                  </Button>
                </TableCell>
                <TableCell>Available Bags</TableCell>
                <TableCell>
                  <Button
                    startIcon={<SortIcon />}
                    onClick={() => handleSort('updatedAt')}
                    size="small"
                  >
                    Last Updated
                  </Button>
                </TableCell>
               
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: filters.limit || 10 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton width={30} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                   
                  </TableRow>
                ))
              ) : inventory.length > 0 ? (
                inventory.map((item: any, index: number) => (
                  <TableRow key={item.id}>
                    <TableCell>{((filters.page || 1) - 1) * (filters.limit || 10) + index + 1}</TableCell>
                    <TableCell>{item.client?.name || 'N/A'}</TableCell>
                    <TableCell>{item.commodity?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.warehouse?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.godown?.name || 'N/A'} → {item.stack?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{item.measurment_or_weight} Q</TableCell>
                    <TableCell>₹{Number(item.total_cost_of_goods).toLocaleString()}</TableCell>
                    <TableCell>{item.details_of_number_of_bags_sacks}</TableCell>
                    <TableCell>{item.available_bags_count || item.details_of_number_of_bags_sacks}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                   
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No inventory items found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Object.values(filters).some(v => v && v !== 1 && v !== 10 && v !== 'id' && v !== 'DESC')
                          ? 'Try adjusting your search or filter criteria' 
                          : 'No inventory data available'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Controls */}
        {pagination.totalItems > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2 
          }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} entries
            </Typography>
            
            <Pagination
              count={pagination.totalPages || 1}
              page={filters.page || 1}
              onChange={(_, page) => handleFilterChange('page', page)}
              variant="outlined"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default EnhancedInventory;
