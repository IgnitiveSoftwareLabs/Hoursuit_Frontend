import React, { useEffect, useMemo, useCallback, memo, useRef, useState, Suspense, lazy } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Checkbox,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete, Print, Add } from '@mui/icons-material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useAppSelector, useAppDispatch } from '../Hooks/Reduxhook/hooks';
import { appendGatePass, setGatePass, setGatePassPage, setGatePassTotalPages, setDeleteGatePasss } from '../Redux/GatePassSlice';
import { fetchGatePasses, deleteGatePass } from '../Services/Admin/GatePassApiService/index';
import toast from 'react-hot-toast';
import GatePassForm from '../components/Dialog/GatePassForm';
import ConfirmationDialog from '../components/Dialog/ConfirmationDialog';
import { usePermissions } from '../Hooks/usePermissions';

// Lazy load heavy components
const GatePassPDF = lazy(() => import('../components/Print/GatePassPdf'));

// Types
interface TabPanelProps {
  index: number;
  value: number;
  status: string;
  gatePasses: GatePassItem[];
  selectedGatePasses: number[];
  onCheckboxChange: (id: number, clientId: number, CommodityId: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSelectAll: (filteredGatePasses: GatePassItem[]) => void;
  fetchMoreGatePasses: (status: string) => Promise<void>;
}

interface GatePassItem {
  id: number;
  clientId: number;
  CommodityId: number;
  name: string;
  mobile_number: string;
  date: string;
  no_of_bags: number;
  weight: number;
  weightUnit: string;
  deposit_delivery: 'deposit' | 'delivery';
  status: 'Pending' | 'Success' | 'Partial';
  customer?: { name: string };
  warehouse?: { name: string };
  godown?: { name: string };
  stack?: { name: string };
  commodity?: { name: string };
}

interface GatePassRowProps {
  item: GatePassItem;
  index: number;
  selectedGatePasses: number[];
  onCheckboxChange: (id: number, clientId: number, CommodityId: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Constants
const TAB_LABELS = ['All', 'Pending', 'Success', 'Partial'] as const;
// Status mappings (commented out as not currently used)
// const STATUS_MAP: Record<string, string> = {
//   'Pending': 'pending',
//   'Approved': 'approved',
//   'Rejected': 'rejected',
// };

const TABLE_HEADERS = [
  'Sr. No.',
  'Customer',
  'Driver Name',
  'Driver Mob.No.',
  'Date',
  'Warehouse',
  'Godown',
  'Stack',
  'Commodity',
  'No. of Bags',
  'Weight',
  'Deposit/Delivery',
  'Status',
  'Actions'
];

// Helper functions
const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
  switch (status) {
    case 'Success': return 'success';
    case 'Partial': return 'warning';
    default: return 'default';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Custom hooks
const useGatePassData = () => {
  const gatePasses = useAppSelector((state: any) => state.gatePass.value);
  const currentPage = useAppSelector((state: any) => state.gatePass.curGatePassPage);
  const totalPages = useAppSelector((state: any) => state.gatePass.totalPages);
  
  return { gatePasses, currentPage, totalPages };
};

const useGatePassOperations = () => {
  const dispatch = useAppDispatch();
  const { currentPage, totalPages } = useGatePassData();

  const fetchMoreGatePasses = useCallback(async (_status: string) => {
    if (currentPage >= totalPages) return;

    const nextPage = currentPage + 1;
    try {
      const response = await fetchGatePasses(nextPage);
      if (response.success && response.result && response.pagination) {
        dispatch(appendGatePass(response.result));
        dispatch(setGatePassPage(nextPage));
        dispatch(setGatePassTotalPages(response.pagination.totalPages));
      }
    } catch (error) {
      console.error('Failed to fetch more gate passes:', error);
      toast.error('Failed to load more gate passes');
    }
  }, [currentPage, totalPages, dispatch]);

  const fetchGatePass = useCallback(async (_status?: string) => {
    try {
      const res = await fetchGatePasses(1);
      if (res.success) {
        dispatch(setGatePass(res.result));
        dispatch(setGatePassPage(1));
        dispatch(setGatePassTotalPages(res.pagination.totalPages));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch gate passes:', error);
      toast.error('Failed to fetch gate passes');
      return false;
    }
  }, [dispatch]);

  return { fetchMoreGatePasses, fetchGatePass };
};

const useInfiniteScroll = (fetchMore: () => Promise<void> | void) => {
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          console.log("🚀 Reached sentinel, fetching more...");
          setIsLoadingMore(true);
          Promise.resolve(fetchMore()).finally(() => {
            setIsLoadingMore(false);
          });
        }
      },
      { root: null, threshold: 0.1 }
    );

    observer.observe(observerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, isLoadingMore]); // Removed observerRef.current from dependencies

  return observerRef;
};

const useGatePassSelection = (gatePasses: GatePassItem[]) => {
  const [selectedGatePasses, setSelectedGatePasses] = useState<number[]>([]);

  const handleCheckboxChange = useCallback((id: number, clientId: number, CommodityId: number) => {
    setSelectedGatePasses((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      const firstSelectedGatePass = gatePasses?.find((item: any) => item.id === prev[0]);
      if (
        prev.length === 0 ||
        (firstSelectedGatePass?.clientId === clientId && firstSelectedGatePass?.CommodityId === CommodityId)
      ) {
        return [...prev, id];
      }

      toast.error('You can only select gate passes for the same customer and commodity.');
      return prev;
    });
  }, [gatePasses]);

  const handleSelectAll = useCallback((filteredGatePasses: GatePassItem[]) => {
    const validPendingDeposits = filteredGatePasses.filter(
      (item: any) => item.status !== 'Success' && item.deposit_delivery === 'deposit'
    );

    if (validPendingDeposits.every((item: any) => selectedGatePasses.includes(item.id))) {
      setSelectedGatePasses([]);
      return;
    }

    if (validPendingDeposits.length === 0) return;

    const clientId = validPendingDeposits[0].clientId;
    const CommodityId = validPendingDeposits[0].CommodityId;

    const matchingGroup = validPendingDeposits.filter(
      (item: any) => item.clientId === clientId && item.CommodityId === CommodityId
    );

    const isSelectionConflict = selectedGatePasses.some((id) => {
      const selected = gatePasses?.find((item: any) => item.id === id);
      return (
        selected?.clientId !== clientId ||
        selected?.CommodityId !== CommodityId ||
        selected?.deposit_delivery !== 'deposit'
      );
    });

    if (isSelectionConflict) {
      toast.error('You can only select gate passes for the same customer, commodity, and type (deposit only).');
      return;
    }

    setSelectedGatePasses(matchingGroup.map((item: any) => item.id));
  }, [selectedGatePasses, gatePasses]);

  const clearSelection = useCallback(() => {
    setSelectedGatePasses([]);
  }, []);

  return {
    selectedGatePasses,
    setSelectedGatePasses,
    handleCheckboxChange,
    handleSelectAll,
    clearSelection
  };
};

// Memoized Components
const TabPanel: React.FC<TabPanelProps> = memo(({ 
  value, 
  index, 
  status, 
  gatePasses, 
  selectedGatePasses, 
  onCheckboxChange, 
  onEdit, 
  onDelete, 
  onSelectAll,
  fetchMoreGatePasses
}) => {
  const observerRef = useInfiniteScroll(() => fetchMoreGatePasses(status));
  const filteredGatePasses = useMemo(() => {
    if (status === 'All') return gatePasses;
    return gatePasses.filter((item: any) => item.status === status);
  }, [gatePasses, status]);

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gate-pass-tabpanel-${index}`}
      aria-labelledby={`gate-pass-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Card 
            variant="outlined" 
            sx={{ 
              boxShadow: 'none', 
              backgroundColor: 'transparent', 
              border: 'none', 
              padding: 0 
            }}
          >
            <TableContainer
              component={Paper}
              sx={{ padding: 0, overflowY: 'auto' }}
            >
              <Table stickyHeader>
                <TableHeader
                  filteredGatePasses={filteredGatePasses}
                  selectedGatePasses={selectedGatePasses}
                  onSelectAll={() => onSelectAll(filteredGatePasses)}
                />
                <TableBody>
                  {filteredGatePasses.map((item: any, index: number) => (
                    <GatePassRow
                      key={item.id}
                      item={item}
                      index={index}
                      selectedGatePasses={selectedGatePasses}
                      onCheckboxChange={onCheckboxChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </TableBody>
              </Table>
              <div ref={observerRef} style={{ height: '20px', background: 'transparent', width: '100%' }} />
            </TableContainer>
          </Card>
        </Box>
      )}
    </div>
  );
});

const GatePassRow: React.FC<GatePassRowProps> = memo(({ 
  item, 
  index, 
  selectedGatePasses, 
  onCheckboxChange, 
  onEdit, 
  onDelete 
}) => {
  const handleCheckboxChange = useCallback(() => {
    onCheckboxChange(item.id, item.clientId, item.CommodityId);
  }, [item.id, item.clientId, item.CommodityId, onCheckboxChange]);

  const handleEdit = useCallback(() => {
    onEdit(item.id);
  }, [item.id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const isSelected = selectedGatePasses.includes(item.id);
  const isDisabled = item.status === 'Success' || item.deposit_delivery !== 'deposit';

  return (
    <TableRow
      sx={{
        '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.action.hover },
        '&:hover': { backgroundColor: (theme) => theme.palette.action.selected },
      }}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          disabled={isDisabled}
        />
      </TableCell>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{item?.customer?.name || 'Unknown'}</TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.mobile_number}</TableCell>
      <TableCell>{formatDate(item.date)}</TableCell>
      <TableCell>{item?.warehouse?.name}</TableCell>
      <TableCell>{item?.godown?.name || 'Unknown'}</TableCell>
      <TableCell>{item?.stack?.name || 'Unknown'}</TableCell>
      <TableCell>{item?.commodity?.name || 'Unknown'}</TableCell>
      <TableCell>{item.no_of_bags}</TableCell>
      <TableCell>{item.weight} {item.weightUnit}</TableCell>
      <TableCell>{capitalizeFirstLetter(item.deposit_delivery)}</TableCell>
      <TableCell>
        <Chip
          label={item.status}
          color={getStatusColor(item.status)}
        />
      </TableCell>
      <TableCell>
        <ActionButtons
          item={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </TableCell>
    </TableRow>
  );
});

const ActionButtons = memo(({ item, onEdit, onDelete }: {
  item: GatePassItem;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { canUpdate, canDelete } = usePermissions();
  
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {canUpdate('gatepass') && item.status === 'Pending' && (
        <IconButton color="primary" onClick={onEdit} sx={{ color: '#6560F0' }}>
          <Edit />
        </IconButton>
      )}
      {canDelete('gatepass') && item.status === 'Pending' && (
        <IconButton sx={{ color: '#F44336' }} onClick={onDelete}>
          <Delete />
        </IconButton>
      )}
      <Suspense fallback={<CircularProgress size={20} />}>
        <PDFDownloadLink 
          document={<GatePassPDF data={item} />} 
          fileName={`Gate_pass_${item.id}.pdf`}
        >
          {({ loading }) => (
            <IconButton color="primary" disabled={loading}>
              <Print />
            </IconButton>
          )}
        </PDFDownloadLink>
      </Suspense>
    </Box>
  );
});

const TableHeader = memo(({ 
  filteredGatePasses, 
  selectedGatePasses, 
  onSelectAll 
}: {
  filteredGatePasses: GatePassItem[];
  selectedGatePasses: number[];
  onSelectAll: () => void;
}) => {
  const validPendingDeposits = useMemo(() => 
    filteredGatePasses.filter(
      (item: any) => item.status !== 'Success' && item.deposit_delivery === 'deposit'
    ), [filteredGatePasses]
  );

  const isAllSelected = useMemo(() => 
    validPendingDeposits.length > 0 && 
    validPendingDeposits.every((item: any) => selectedGatePasses.includes(item.id)),
    [validPendingDeposits, selectedGatePasses]
  );

  const isDisabled = useMemo(() => 
    filteredGatePasses.every(
      (item: any) => item.status === 'Success' || item.deposit_delivery !== 'deposit'
    ), [filteredGatePasses]
  );

  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ textTransform: 'uppercase' }}>
          <Checkbox
            checked={isAllSelected}
            onChange={onSelectAll}
            disabled={isDisabled}
          />
        </TableCell>
        {TABLE_HEADERS.map((header) => (
          <TableCell key={header} sx={{ textTransform: 'uppercase' }}>
            {header}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
});

const LoadingSpinner = memo(() => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <CircularProgress />
  </Box>
));

const ActionToolbar = memo(({ 
  selectedCount, 
  onAddGatePass, 
  onCreateDepositor 
}: {
  selectedCount: number;
  onAddGatePass: () => void;
  onCreateDepositor: () => void;
}) => {
  const { canCreate } = usePermissions();
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Gate Passes
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {canCreate('gatepass') && (
          <Button
            variant="contained"
            color="primary"
            onClick={onAddGatePass}
            sx={{ textTransform: 'none' }}
          >
            <Add sx={{ mr: 1 }} /> Add Gate Pass
          </Button>
        )}
        {selectedCount > 0 && canCreate('deposit') && (
          <Button
            variant="contained"
            color="secondary"
            onClick={onCreateDepositor}
            sx={{ textTransform: 'none' }}
          >
            Create WHR
          </Button>
        )}
      </Box>
    </Box>
  );
});

// Main Component
const GatePassComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [mainTabValue, setMainTabValue] = useState(0); // 0 = Inward, 1 = Outward
const [subTabValue, setSubTabValue] = useState(0); // 0 = All, 1 = Pending, 2 = Success, 3 = Partial

  const { gatePasses } = useGatePassData();
  const { fetchMoreGatePasses, fetchGatePass } = useGatePassOperations();
  const dispatch = useAppDispatch();
  const {
    selectedGatePasses,
    setSelectedGatePasses,
    handleCheckboxChange,
    handleSelectAll,
    clearSelection
  } = useGatePassSelection(gatePasses);

  // State
  const [tabValue] = useState(0);
  const [gateLoading, setGateLoading] = useState<boolean>(true);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editGatePassId, setEditGatePassId] = useState<number | null>(null);
  const [isDepositorFormOpen, setDepositorFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteGatePassId, setDeleteGatePassId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Event handlers (commented out unused handler)
  // const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
  //   setTabValue(newValue);
  //   clearSelection();
  // }, [clearSelection]);
  const handleMainTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
    setSubTabValue(0); // Reset sub-tab to "All" when switching main tabs
    clearSelection();
  }, [clearSelection]);
  
  const handleSubTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
    clearSelection();
  }, [clearSelection]);
  const filteredGatePasses = useMemo(() => {
    const deliveryType = mainTabValue === 0 ? 'deposit' : 'delivery'; // Inward = deposit, Outward = delivery
    const status = TAB_LABELS[subTabValue]; // Sub-tab status

    let filtered = gatePasses.filter((item: any) => item.deposit_delivery === deliveryType);

    if (status !== 'All') {
      filtered = filtered.filter((item: any) => item.status === status);
    }

    return filtered;
  }, [gatePasses, mainTabValue, subTabValue]);
  const handleAddGatePass = useCallback(() => {
    if (!canCreate('gatepass')) {
      toast.error('You do not have permission to create gate passes');
      return;
    }
    setOpen(true);
    setIsEdit(false);
  }, [canCreate]);

  const handleEdit = useCallback((id: number) => {
    if (!canUpdate('gatepass')) {
      toast.error('You do not have permission to edit gate passes');
      return;
    }
    setEditGatePassId(id);
    setIsEdit(true);
    setOpen(true);
  }, [canUpdate]);

  const handleDeleteClick = useCallback((id: number) => {
    if (!canDelete('gatepass')) {
      toast.error('You do not have permission to delete gate passes');
      return;
    }
    setDeleteGatePassId(id);
    setDeleteDialogOpen(true);
  }, [canDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteGatePassId === null) return;

    setIsDeleting(true);
    try {
      await deleteGatePass(deleteGatePassId);
      
      // Update Redux state by removing the deleted gate pass
      dispatch(setDeleteGatePasss(deleteGatePassId));
      
      toast.success('Gate pass deleted successfully');
      
      // Clear selection if the deleted item was selected
      setSelectedGatePasses(prev => prev.filter(id => id !== deleteGatePassId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete gate pass');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteGatePassId(null);
    }
  }, [deleteGatePassId, dispatch, setSelectedGatePasses]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteGatePassId(null);
  }, []);

  const handleCreateDepositor = useCallback(() => {
    if (!canCreate('deposit')) {
      toast.error('You do not have permission to create WHR');
      return;
    }
    if (selectedGatePasses.length === 0) {
      toast.error('Please select at least one gate pass.');
      return;
    }
    setDepositorFormOpen(true);
  }, [selectedGatePasses.length, canCreate]);

  // Effects
  useEffect(() => {
    const initializeData = async () => {
      setGateLoading(true);
      await fetchGatePass(TAB_LABELS[tabValue]);
      setGateLoading(false);
    };

    initializeData();
  }, [fetchGatePass, tabValue]);

  // Check read permission
  if (!canRead('gatepass')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view gate passes.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render loading state
  if (gateLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <ActionToolbar
        selectedCount={selectedGatePasses.length}
        onAddGatePass={handleAddGatePass}
        onCreateDepositor={handleCreateDepositor}
      />

      {/* Main Tabs */}
    <Tabs value={mainTabValue} onChange={handleMainTabChange} aria-label="main gate pass tabs">
      <Tab label="Inward Gate Pass" />
      <Tab label="Outward Gate Pass" />
    </Tabs>

    {/* Sub-Tabs */}
    <Tabs value={subTabValue} onChange={handleSubTabChange} aria-label="sub gate pass tabs">
      {TAB_LABELS.map((label, _index) => (
        <Tab key={label} label={label} />
      ))}
    </Tabs>

    <TabPanel
      value={subTabValue}
      index={subTabValue}
      status={TAB_LABELS[subTabValue]}
      gatePasses={filteredGatePasses}
      selectedGatePasses={selectedGatePasses}
      onCheckboxChange={handleCheckboxChange}
      onEdit={handleEdit}
      onDelete={handleDeleteClick}
      onSelectAll={handleSelectAll}
      fetchMoreGatePasses={fetchMoreGatePasses}
    />

     
        <GatePassForm
          open={isOpen}
          isEdit={isEdit}
          editGatePassId={editGatePassId}
          gatePasses={gatePasses}
          setOpen={setOpen}
          setIsEdit={setIsEdit}
          setEditGatePassId={setEditGatePassId}
          setDepositorFormOpen={setDepositorFormOpen}
          selectedGatePasses={selectedGatePasses}
          setSelectedGatePasses={setSelectedGatePasses}
          fetchGatePass={fetchGatePass}
          isDepositorFormOpen={isDepositorFormOpen}
        />

        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Gate Pass"
          message="Are you sure you want to delete this gate pass? This action cannot be undone."
          variant="delete"
          loading={isDeleting}
        />
   
    </Box>
  );
};

export default GatePassComp;