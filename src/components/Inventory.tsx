import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
} from '@mui/material';


import { getinventoryapicall } from '../Services/Admin/Inventoryapiservice';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../Hooks/Reduxhook/hooks';
import { setInventory } from '../Redux/InventorySlice';
import { usePermissions } from '../Hooks/usePermissions';

const Inventory: React.FC = () => {
  const { canRead, canUpdate } = usePermissions();

  // Check read permission for inventory
  if (!canRead('inventory')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
          Access Denied: Insufficient permissions to view inventory
        </Typography>
      </Box>
    );
  }

  const inventoryList = useAppSelector((state: any) => state.inventory.value); // Assuming godown slice exists
  const dispatch = useAppDispatch();
  
  const fetchInventory = useCallback(async () => {
    if (!canRead('inventory')) {
      toast.error('Access denied: Insufficient permissions to fetch inventory');
      return;
    }
    
    try {
      const response: any = await getinventoryapicall();
      if (response.success) {
        dispatch(setInventory(response.result));
      }
    } catch (error: any) {
      console.log(error?.message, 'error message');
      toast.error('Failed to fetch inventory');
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);


  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                       <Typography variant="h3" sx={{ mb: 2 }}>Inventory</Typography>
       
      </Box>

      {/* Inventory Table */}
      <Card
        variant="outlined"
        sx={{
          boxShadow: 'none',
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
      <TableContainer component={Paper}>
        <Table stickyHeader>
        <TableHead>
  <TableRow>
    <TableCell>Sr. No.</TableCell>
    <TableCell>Client Name</TableCell>
    <TableCell>Commodity</TableCell>
    <TableCell>Weight</TableCell>
    <TableCell>Total Cost</TableCell>
    <TableCell>Bags</TableCell>
    <TableCell>Available Bags</TableCell>
    <TableCell>Last Updated</TableCell>
    <TableCell>Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {
    inventoryList?.map((item: any, index: number) => (
      <TableRow key={item.id}>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{item.client.name}</TableCell>
        <TableCell>{item.commodity.name}</TableCell>
        <TableCell>{item.measurment_or_weight} {item.weightUnit}</TableCell>
        <TableCell>{item.total_cost_of_goods}</TableCell>
        <TableCell>{item.details_of_number_of_bags_sacks}</TableCell>
        <TableCell>{item.available_bags_count}</TableCell>
        <TableCell>{new Date(item.last_updated).toLocaleString()}</TableCell>
        <TableCell>
          {canUpdate('inventory') ? (
            <Typography variant="body2" color="text.secondary">
              Actions available
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              No permissions
            </Typography>
          )}
        </TableCell>
      </TableRow>
    ))
  }
</TableBody>

        </Table>
      </TableContainer>
      </Card>
     
    </Box>
  );
};

export default Inventory;
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';


import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../Hooks/Reduxhook/hooks';
import { setInventory } from '../Redux/InventorySlice';
import { usePermissions } from '../Hooks/usePermissions';
import { 
  useGetInventoryQuery,
  useGetWarehousesQuery,
  useGetClientsQuery,
  type InventoryQueryParams
} from '../RTK/services/inventoryApi';

const Inventory: React.FC = () => {
  const { canRead, canUpdate } = usePermissions();

  // Check read permission for inventory
  if (!canRead('inventory')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
          Access Denied: Insufficient permissions to view inventory
        </Typography>
      </Box>
    );
  }

  const dispatch = useAppDispatch();
  
  // Filter states
  const [filters, setFilters] = useState<InventoryQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    warehouseId: '',
    clientId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

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
  // Extract data from RTK Query response
  const inventory = inventoryData?.result?.inventory || [];
  const pagination = inventoryData?.result?.pagination || {};
  const stats = inventoryData?.result?.stats || {
    totalWeight: 0,
    totalValue: 0,
    totalBags: 0,
    locationBreakdown: []
  };

  // Get unique values for filters
  const uniqueWarehouses = useMemo(() => {
    return warehouses.map((warehouse: any) => warehouse.name);
  }, [warehouses]);

  const uniqueClients = useMemo(() => {
    return clients.map((client: any) => client.name);
  }, [clients]);

  // Filter change handler
  const handleFilterChange = (key: keyof InventoryQueryParams, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      page: 1 // Reset to first page on filter change
    }));
  };

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

  // Update Redux store when inventory data changes
  useEffect(() => {
    if (inventory.length > 0) {
      dispatch(setInventory(inventory));
    }
  }, [inventory, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch inventory data');
    }
  }, [error]);
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

  // Update Redux store for compatibility
  useEffect(() => {
    if (inventory.length > 0) {
      dispatch(setInventory(inventory));
    }
  }, [inventory, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch inventory data');
    }
  }, [error]);


  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>Inventory Management</Typography>
        <Chip 
          label={`${pagination.totalItems || 0} Items`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      {/* Inventory Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Weight
              </Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : stats.totalWeight.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quintals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Value
              </Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : `₹${Number(stats.totalValue).toLocaleString()}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Inventory Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Bags
              </Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : stats.totalBags.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bags/Sacks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,sm:6,md:3}}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Locations
              </Typography>
              <Typography variant="h4">
                {isLoading ? <CircularProgress size={24} /> : stats.locationBreakdown.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warehouses • {uniqueClients.length} Clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search & Filter Inventory
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:12,md:4}}>
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
            
            <Grid size={{xs:12,md:4}}>
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
            
            <Grid size={{xs:12,md:4}}>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      {stats.locationBreakdown.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Inventory by Warehouse
            </Typography>
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
      )}      {/* Inventory Table */}
      <Card
        variant="outlined"
        sx={{
          boxShadow: 'none',
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
      <TableContainer component={Paper}>
        <Table stickyHeader>
        <TableHead>
  <TableRow>
    <TableCell>Sr. No.</TableCell>
    <TableCell>Client Name</TableCell>
    <TableCell>Commodity</TableCell>
    <TableCell>Location</TableCell>
    <TableCell>Weight</TableCell>
    <TableCell>Total Cost</TableCell>
    <TableCell>Bags</TableCell>
    <TableCell>Available Bags</TableCell>
    <TableCell>Last Updated</TableCell>
    <TableCell>Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {isLoading ? (
    // Loading skeleton rows
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
        <TableCell><Skeleton width={120} /></TableCell>
      </TableRow>
    ))
  ) : inventory?.length > 0 ? (
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
        <TableCell>{item.measurment_or_weight} {item.weightUnit}</TableCell>
        <TableCell>₹{item.total_cost_of_goods?.toLocaleString() || '0'}</TableCell>
        <TableCell>{item.details_of_number_of_bags_sacks}</TableCell>
        <TableCell>{item.available_bags_count}</TableCell>
        <TableCell>
          <Typography variant="body2">
            {new Date(item.last_updated).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(item.last_updated).toLocaleTimeString()}
          </Typography>
        </TableCell>
        <TableCell>
          {canUpdate('inventory') ? (
            <Typography variant="body2" color="primary">
              View Details
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              No permissions
            </Typography>
          )}
        </TableCell>
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
            {Object.values(filters).some(v => v && v !== 1 && v !== 10)
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Rows</InputLabel>
              <Select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                label="Rows"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            
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
        </Box>
      )}
      </Card>
     
    </Box>
  );
};

export default Inventory;
