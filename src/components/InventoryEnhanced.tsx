import React, { useState, useEffect, useMemo } from 'react';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  LocationCity as LocationIcon,
  AccountBalanceWallet as WalletIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../Hooks/usePermissions';
import {
  useGetInventoryQuery,
  type InventoryQueryParams,
} from '../RTK/services/inventoryApi';
import { useGetCitiesQuery } from '../RTK/services/cityApi';
import { useGetItemsQuery } from '../RTK/services/itemApi';

const EnhancedInventory: React.FC = () => {
  const { canRead } = usePermissions();

  // Filter and pagination states
  const [filters, setFilters] = useState<InventoryQueryParams>({
    page: 1,
    limit: 25,
    search: '',
    warehouseId: '',
    sortBy: 'updatedAt',
    sortOrder: 'DESC',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [selectedPresetView, setSelectedPresetView] = useState<string>('all');
  const [showZeroBalances, setShowZeroBalances] = useState<boolean>(true);
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  // RTK Query hooks
  const {
    data: inventoryData,
    isLoading,
    isFetching,
    refetch,
  } = useGetInventoryQuery(filters, {
    skip: !canRead('inventory'),
  });

  const { data: citiesData } = useGetCitiesQuery();
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });

  const rawCities = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray(citiesData?.result)) return citiesData.result;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    return [];
  }, [citiesData]);

  const rawItems = useMemo(() => {
    if (Array.isArray(itemsData)) return itemsData;
    if (Array.isArray(itemsData?.result)) return itemsData.result;
    if (Array.isArray(itemsData?.data)) return itemsData.data;
    return [];
  }, [itemsData]);

  // Handle search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm.trim(),
        page: 1,
      }));
    }, 400);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleFilterChange = (key: keyof InventoryQueryParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      search: '',
      warehouseId: '',
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
    setSearchTerm('');
    setSelectedLocationFilter('all');
    setSelectedPresetView('all');
    setShowZeroBalances(true);
  };

  const handleSort = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: newOrder,
    }));
  };

  const rawInventoryList: any[] = inventoryData?.result?.inventory || [];
  const pagination = inventoryData?.result?.pagination || {
    totalItems: rawInventoryList.length,
    totalPages: 1,
    currentPage: 1,
    pageSize: 25,
  };
  const stats = inventoryData?.result?.stats || {
    totalQty: 0,
    totalValue: 0,
    totalItems: 0,
    locationBreakdown: [],
  };

  // Helper to extract location name from item or warehouse record
  const getLocationName = (item: any): string => {
    if (item?.item?.location?.city_name) return item.item.location.city_name;
    if (item?.location) return item.location;
    if (item?.warehouse?.location) return item.warehouse.location;
    if (item?.warehouse?.name) return item.warehouse.name;
    return 'Main Location';
  };

  // Client-side filtering for preset views and location
  const displayedInventory = useMemo(() => {
    return rawInventoryList.filter((inv: any) => {
      const locName = getLocationName(inv).toLowerCase();
      if (selectedLocationFilter !== 'all') {
        if (!locName.includes(selectedLocationFilter.toLowerCase())) return false;
      }

      const qty = Number(inv.qty || 0);
      if (!showZeroBalances && qty <= 0) {
        return false;
      }

      if (selectedPresetView === 'in_stock' && qty <= 0) {
        return false;
      }
      if (selectedPresetView === 'aging' && Number(inv.inventory_age || 0) < 60) {
        return false;
      }
      if (selectedPresetView === 'high_value' && Number(inv.amount || 0) < 10000) {
        return false;
      }

      return true;
    });
  }, [rawInventoryList, selectedLocationFilter, showZeroBalances, selectedPresetView]);

  // Aggregate stats from displayed list or server
  const aggregateQty = useMemo(() => {
    return displayedInventory.reduce((acc, curr) => acc + Number(curr.qty || 0), 0);
  }, [displayedInventory]);

  const aggregateVal = useMemo(() => {
    return displayedInventory.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [displayedInventory]);

  const uniqueLocationsCount = useMemo(() => {
    const set = new Set(displayedInventory.map((i) => getLocationName(i)));
    return set.size;
  }, [displayedInventory]);

  const handleExportCSV = () => {
    if (displayedInventory.length === 0) {
      toast.error('No inventory records to export');
      return;
    }
    const headers = [
      'Internal ID',
      'Item Code',
      'Item Name',
      'Location',
      'UOM',
      'On Hand Qty',
      'Valuation Rate (INR)',
      'Total Value (INR)',
      'Stock Age (Days)',
      'Last Updated',
    ];
    const rows = displayedInventory.map((inv: any) => [
      inv.id,
      `"${inv.item?.item_code || `ITM-${inv.item_id || inv.id}`}"`,
      `"${inv.item?.item_name || 'N/A'}"`,
      `"${getLocationName(inv)}"`,
      `"${inv.uom?.uom_name || inv.item?.uom?.uom_name || 'UNIT'}"`,
      Number(inv.qty || 0),
      Number(inv.rate || 0).toFixed(2),
      Number(inv.amount || 0).toFixed(2),
      inv.inventory_age ?? 0,
      new Date(inv.updatedAt || inv.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Inventory_Balances_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory balances exported as CSV');
  };

  if (!canRead('inventory')) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-rose-600 font-medium">
        Access Denied: Insufficient permissions to view inventory balances.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800 pb-12">
      {/* ── NETSUITE TOP TITLE & BREADCRUMB BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Lists &gt; Inventory &gt; Inventory Balances
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <div className="w-3.5 h-3.5 bg-sky-700 rounded-xs"></div>
            <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">
              Current Inventory Balances
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          <button
            onClick={() => refetch()}
            className="hover:underline flex items-center space-x-1"
            title="Refresh Inventory"
          >
            <RefreshIcon className={`!w-3.5 !h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="hover:underline flex items-center space-x-1"
          >
            <FilterIcon className="!w-3.5 !h-3.5" />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'Filters'}</span>
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={handleExportCSV} className="hover:underline flex items-center space-x-1">
            <DownloadIcon className="!w-3.5 !h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── NETSUITE KPI SUMMARY METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Total On-Hand Qty */}
        <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL ON-HAND QTY
            </div>
            <div className="text-lg font-bold font-mono text-sky-900 mt-0.5">
              {isLoading ? '...' : Number(stats.totalQty || aggregateQty).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Across all locations</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-700">
            <InventoryIcon className="!w-4 !h-4" />
          </div>
        </div>

        {/* Metric 2: Total Inventory Value */}
        <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL INVENTORY VALUE
            </div>
            <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
              {isLoading ? '...' : `₹${Number(stats.totalValue || aggregateVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Weighted landed valuation</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
            <WalletIcon className="!w-4 !h-4" />
          </div>
        </div>

        {/* Metric 3: Total Tracked Items */}
        <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              TRACKED ITEMS
            </div>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {isLoading ? '...' : (pagination.totalItems || displayedInventory.length).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Active item records</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
            <CategoryIcon className="!w-4 !h-4" />
          </div>
        </div>

        {/* Metric 4: Active Locations */}
        <div className="bg-white border border-slate-300 rounded-xs p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE LOCATIONS
            </div>
            <div className="text-lg font-bold font-mono text-indigo-900 mt-0.5">
              {isLoading ? '...' : uniqueLocationsCount || rawCities.length || 1}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Stock locations</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700">
            <LocationIcon className="!w-4 !h-4" />
          </div>
        </div>
      </div>

      {/* ── NETSUITE VIEW & QUICK FILTER RIBBON ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f8fafc] border border-slate-300 p-2 rounded-xs shadow-2xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Preset View Selector */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW:</span>
            <select
              value={selectedPresetView}
              onChange={(e) => setSelectedPresetView(e.target.value)}
              className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Inventory Balances</option>
              <option value="in_stock">In-Stock Items (Qty &gt; 0)</option>
              <option value="high_value">High Value Items (&gt; ₹10,000)</option>
              <option value="aging">Aging Stock (&gt; 60 Days)</option>
            </select>
          </div>

          {/* Quick Location Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">LOCATION:</span>
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Locations</option>
              {rawCities.map((c: any) => (
                <option key={c.id} value={c.city_name || c.name}>
                  {c.city_name || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search item code, name, location..."
              className="h-7 w-56 sm:w-64 pl-7 pr-6 text-xs bg-white border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 font-sans"
            />
            <SearchIcon className="!w-3.5 !h-3.5 text-slate-400 absolute left-2 top-2" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <ClearIcon className="!w-3.5 !h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <label className="inline-flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showZeroBalances}
              onChange={(e) => setShowZeroBalances(e.target.checked)}
              className="w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500"
            />
            <span className="uppercase text-[10px] font-semibold text-slate-700">
              SHOW ZERO BALANCES
            </span>
          </label>

          <button
            onClick={() => window.print()}
            title="Print List"
            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-slate-200 rounded transition-colors flex items-center space-x-1 font-semibold text-[11px]"
          >
            <PrintIcon className="!w-3.5 !h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ── COLLAPSIBLE FILTERS PANEL ── */}
      {showAdvancedFilters && (
        <div className="border border-slate-300 rounded-xs bg-white overflow-hidden shadow-2xs">
          <div className="w-full bg-[#e5eff5] px-3 py-1.5 flex items-center justify-between text-xs font-bold text-[#244b5a] select-none border-b border-slate-300">
            <div className="flex items-center space-x-1.5">
              <FilterIcon className="!w-3.5 !h-3.5 text-sky-700" />
              <span className="uppercase tracking-wider text-[11px]">ADVANCED FILTERS &amp; SORTING</span>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <ArrowUpIcon className="!w-4 !h-4" />
            </button>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                FILTER BY LOCATION
              </label>
              <select
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All Locations</option>
                {rawCities.map((c: any) => (
                  <option key={c.id} value={c.city_name || c.name}>
                    {c.city_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                PRESET VIEW
              </label>
              <select
                value={selectedPresetView}
                onChange={(e) => setSelectedPresetView(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All Inventory Balances</option>
                <option value="in_stock">In-Stock Items Only</option>
                <option value="high_value">High Value Items (&gt; ₹10,000)</option>
                <option value="aging">Aging Stock (&gt; 60 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                SORT FIELD
              </label>
              <select
                value={filters.sortBy || 'updatedAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="id">Internal ID</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                SORT DIRECTION
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleFilterChange('sortOrder', 'ASC')}
                  className={`flex-1 h-7 text-xs font-semibold rounded-xs border ${filters.sortOrder === 'ASC' ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                  ASC
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('sortOrder', 'DESC')}
                  className={`flex-1 h-7 text-xs font-semibold rounded-xs border ${filters.sortOrder === 'DESC' ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                  DESC
                </button>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end space-x-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xs text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NETSUITE ENTERPRISE DATAGRID TABLE ── */}
      <div className="bg-white border border-slate-300 rounded-xs overflow-x-auto shadow-2xs">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-slate-500 font-medium">
            <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Loading current inventory balances...</div>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] uppercase text-[10px] tracking-wider font-bold select-none">
                <th className="p-2 border-r border-slate-300 w-12 text-center">#</th>
                <th className="p-2 border-r border-slate-300 min-w-[120px]">
                  <button
                    onClick={() => handleSort('item')}
                    className="flex items-center space-x-1 uppercase text-[#244b5a] font-bold hover:underline"
                  >
                    <span>ITEM CODE</span>
                    <SortIcon className="!w-3 !h-3 opacity-70" />
                  </button>
                </th>
                <th className="p-2 border-r border-slate-300 min-w-[200px]">ITEM NAME</th>
                <th className="p-2 border-r border-slate-300 min-w-[140px]">
                  <div className="flex items-center space-x-1">
                    <LocationIcon className="!w-3 !h-3 text-sky-700" />
                    <span>LOCATION</span>
                  </div>
                </th>
                <th className="p-2 border-r border-slate-300 w-20 text-center">UOM</th>
                <th className="p-2 border-r border-slate-300 min-w-[110px] text-right">
                  <button
                    onClick={() => handleSort('qty')}
                    className="flex items-center justify-end w-full space-x-1 uppercase text-[#244b5a] font-bold hover:underline"
                  >
                    <span>ON-HAND QTY</span>
                    <SortIcon className="!w-3 !h-3 opacity-70" />
                  </button>
                </th>
                <th className="p-2 border-r border-slate-300 min-w-[100px] text-right">
                  <button
                    onClick={() => handleSort('rate')}
                    className="flex items-center justify-end w-full space-x-1 uppercase text-[#244b5a] font-bold hover:underline"
                  >
                    <span>RATE (₹)</span>
                    <SortIcon className="!w-3 !h-3 opacity-70" />
                  </button>
                </th>
                <th className="p-2 border-r border-slate-300 min-w-[130px] text-right">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center justify-end w-full space-x-1 uppercase text-[#244b5a] font-bold hover:underline"
                  >
                    <span>TOTAL VALUE (₹)</span>
                    <SortIcon className="!w-3 !h-3 opacity-70" />
                  </button>
                </th>
                <th className="p-2 border-r border-slate-300 w-24 text-center">AGE (DAYS)</th>
                <th className="p-2 border-r border-slate-300 min-w-[110px] text-center">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center justify-center w-full space-x-1 uppercase text-[#244b5a] font-bold hover:underline"
                  >
                    <span>LAST UPDATED</span>
                    <SortIcon className="!w-3 !h-3 opacity-70" />
                  </button>
                </th>
                <th className="p-2 text-center w-20">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayedInventory.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 text-xs">
                    <div className="font-semibold text-slate-700 mb-1">
                      No inventory records found
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Try clearing filters or adjusting your search term.
                    </div>
                  </td>
                </tr>
              ) : (
                displayedInventory.map((inv: any, idx: number) => {
                  const itemCode =
                    inv.item?.item_code || `ITM-${inv.item_id || inv.id}`;
                  const itemName = inv.item?.item_name || 'N/A';
                  const itemDesc = inv.item?.item_desc || inv.item?.purchase_desc || '';
                  const locationName = getLocationName(inv);
                  const uomName =
                    inv.uom?.uom_name || inv.item?.uom?.uom_name || 'UNIT';
                  const qtyNum = Number(inv.qty || 0);
                  const rateNum = Number(inv.rate || 0);
                  const amountNum = Number(inv.amount || (qtyNum * rateNum));
                  const ageDays = Number(inv.inventory_age ?? 0);

                  const ageBadgeColor =
                    ageDays > 90
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : ageDays > 60
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200';

                  const qtyColor =
                    qtyNum <= 0
                      ? 'text-rose-600 font-bold bg-rose-50/40'
                      : 'text-sky-900 font-bold bg-sky-50/30';

                  return (
                    <tr
                      key={inv.id || idx}
                      className="border-b border-slate-200 hover:bg-[#f4f8fb] transition-colors"
                    >
                      {/* # Index */}
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500">
                        {((filters.page || 1) - 1) * (filters.limit || 25) + idx + 1}
                      </td>

                      {/* Item Code */}
                      <td className="p-2 border-r border-slate-200 font-mono font-semibold text-sky-700">
                        <button
                          onClick={() => setSelectedItemDetail(inv)}
                          className="hover:underline text-left"
                          title="View Item Stock Details"
                        >
                          {itemCode}
                        </button>
                      </td>

                      {/* Item Name */}
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                        <div>{itemName}</div>
                        {itemDesc && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            {itemDesc}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                        <span className="inline-flex items-center space-x-1">
                          <LocationIcon className="!w-3 !h-3 text-slate-400" />
                          <span>{locationName}</span>
                        </span>
                      </td>

                      {/* UOM */}
                      <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-[11px]">
                        {uomName}
                      </td>

                      {/* On-Hand Qty */}
                      <td
                        className={`p-2 border-r border-slate-200 text-right font-mono ${qtyColor}`}
                      >
                        {qtyNum.toLocaleString()}
                      </td>

                      {/* Rate (₹) */}
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                        ₹{rateNum.toFixed(2)}
                      </td>

                      {/* Total Value (₹) */}
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                        ₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Age (Days) */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-xs border text-[10px] font-mono font-semibold ${ageBadgeColor}`}
                        >
                          {ageDays} d
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {new Date(inv.updatedAt || inv.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => setSelectedItemDetail(inv)}
                          className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xs text-[11px] font-semibold transition-colors flex items-center justify-center space-x-0.5 mx-auto"
                        >
                          <ViewIcon className="!w-3 !h-3 text-sky-700" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── NETSUITE PAGINATION & FOOTER RIBBON ── */}
      <div className="bg-slate-100 border border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs rounded-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">
              RECORDS PER PAGE:
            </span>
            <select
              value={filters.limit || 25}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              className="h-6 bg-white border border-slate-300 rounded-xs px-1.5 text-xs font-medium focus:outline-none focus:border-sky-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span className="text-slate-300">|</span>

          <span className="font-semibold text-slate-700 uppercase text-[10px]">
            SHOWING {displayedInventory.length} OF {pagination.totalItems || displayedInventory.length} RECORDS
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={(filters.page || 1) <= 1}
            onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold rounded-xs text-xs"
          >
            &laquo; Previous
          </button>

          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white border border-slate-300 rounded-xs text-slate-800">
            Page {filters.page || 1} of {pagination.totalPages || 1}
          </span>

          <button
            type="button"
            disabled={(filters.page || 1) >= (pagination.totalPages || 1)}
            onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold rounded-xs text-xs"
          >
            Next &raquo;
          </button>
        </div>
      </div>

      {/* ── NETSUITE ITEM DETAIL MODAL ── */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#e5eff5] px-4 py-2.5 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InventoryIcon className="!w-4 !h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-[#1e2d3d] uppercase tracking-tight">
                  Inventory Stock Details — {selectedItemDetail.item?.item_code || `ITM-${selectedItemDetail.item_id}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-500 hover:text-slate-700 p-0.5 rounded"
              >
                <CloseIcon className="!w-4 !h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Primary Stock Information Section */}
              <div className="border border-slate-200 rounded-xs overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[#244b5a] uppercase text-[10px] tracking-wider border-b border-slate-200">
                  Primary Stock Information
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Item Name
                    </span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {selectedItemDetail.item?.item_name || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Location
                    </span>
                    <span className="font-semibold text-sky-800 text-xs">
                      {getLocationName(selectedItemDetail)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      UOM
                    </span>
                    <span className="font-mono text-slate-800 text-xs">
                      {selectedItemDetail.uom?.uom_name || selectedItemDetail.item?.uom?.uom_name || 'UNIT'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      On-Hand Quantity
                    </span>
                    <span className="font-mono font-bold text-sky-900 text-sm">
                      {Number(selectedItemDetail.qty || 0).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Valuation Rate
                    </span>
                    <span className="font-mono text-slate-800 text-xs">
                      ₹{Number(selectedItemDetail.rate || 0).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Total Stock Valuation
                    </span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      ₹{Number(selectedItemDetail.amount || (Number(selectedItemDetail.qty || 0) * Number(selectedItemDetail.rate || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accounting & GL Information */}
              <div className="border border-slate-200 rounded-xs overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[#244b5a] uppercase text-[10px] tracking-wider border-b border-slate-200">
                  Accounting &amp; GL Classification
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Asset Account
                    </span>
                    <span className="text-slate-800 font-medium">
                      {selectedItemDetail.item?.asset_account?.account_name || '1100 - Inventory Asset'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      COGS Account
                    </span>
                    <span className="text-slate-800 font-medium">
                      {selectedItemDetail.item?.cogs_account?.account_name || '5000 - Cost of Goods Sold'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Income Account
                    </span>
                    <span className="text-slate-800 font-medium">
                      {selectedItemDetail.item?.income_account?.account_name || '4000 - Sales Revenue'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Expense Account
                    </span>
                    <span className="text-slate-800 font-medium">
                      {selectedItemDetail.item?.expense_account?.account_name || '6000 - General Operating Expense'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifecycle & Dates */}
              <div className="border border-slate-200 rounded-xs p-3 bg-slate-50 flex justify-between items-center text-slate-600">
                <div>
                  <span className="font-semibold uppercase text-[10px] text-slate-500 block">
                    Stock Age
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedItemDetail.inventory_age ?? 0} days
                  </span>
                </div>
                <div>
                  <span className="font-semibold uppercase text-[10px] text-slate-500 block">
                    Last Received / Updated
                  </span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedItemDetail.updatedAt || selectedItemDetail.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xs text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInventory;
