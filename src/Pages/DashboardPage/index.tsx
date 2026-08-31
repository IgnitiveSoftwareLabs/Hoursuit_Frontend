import React, { useState } from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  People,
  Warehouse,
  AttachMoney,
  Assignment,
  Refresh,
  RestartAlt,
  ShowChart,
  KeyboardArrowDown,
  DragIndicator,
  ShoppingCart,
  Receipt,
  Inventory,
  Article,
  Warning,
  Assessment,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/index";
import StatCards, { type StatCardData } from "../../components/Reports/StatCards";
import {
  useGetKPIDataQuery,
  useGetRecentActivitiesQuery,
  useGetWarehouseOverviewQuery,
  useGetLowStockAlertsQuery,
  useGetChartDataQuery,
  useGetWarehouseOptionsQuery,
  type DashboardFilters,
} from "../../RTK/services/dashboardApi";

// ── Reusable NetSuite Portlet Container ──
function NetSuitePortlet({
  title,
  children,
  actionText,
  onActionClick,
}: {
  title: string;
  children: React.ReactNode;
  actionText?: string;
  onActionClick?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white border border-slate-300 rounded-xs shadow-2xs mb-4 overflow-hidden">
      {/* Portlet Header Bar */}
      <div className="bg-[#f8fafc] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between select-none">
        <div className="flex items-center space-x-1.5">
          <DragIndicator className="!w-4 !h-4 text-slate-400 cursor-grab" titleAccess="Drag portlet" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          {actionText && (
            <button
              onClick={onActionClick}
              className="text-sky-700 hover:underline font-semibold"
            >
              {actionText}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <KeyboardArrowDown className={`!w-4 !h-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Portlet Body */}
      {!isCollapsed && <div className="p-3">{children}</div>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    warehouseId: "all",
    period: "30",
  });
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  // Prepare API filters
  const apiFilters: DashboardFilters = {
    ...filters,
    fromDate: fromDate?.format("YYYY-MM-DD"),
    toDate: toDate?.format("YYYY-MM-DD"),
  };

  // API calls with filters
  const { data: kpiData, refetch: refetchKPI } = useGetKPIDataQuery(apiFilters);
  const { data: chartData, isLoading: chartLoading, refetch: refetchCharts } = useGetChartDataQuery(apiFilters);
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useGetRecentActivitiesQuery({ limit: 5 });
  const { data: warehouseData, refetch: refetchWarehouse } = useGetWarehouseOverviewQuery();
  const { data: lowStockData, refetch: refetchLowStock } = useGetLowStockAlertsQuery({ limit: 5 });
  const { data: warehouseOptions } = useGetWarehouseOptionsQuery();

  const kpi = kpiData?.result;
  const chartInfo = chartData?.result;
  const activities = activitiesData?.result || [];
  const warehouses = warehouseData?.result || [];
  const lowStockAlerts = lowStockData?.result || [];
  const warehouseList = warehouseOptions?.result || [];

  const handleWarehouseChange = (warehouseId: string) => {
    setFilters((prev) => ({ ...prev, warehouseId }));
  };

  const handleRefresh = () => {
    refetchKPI();
    refetchCharts();
    refetchActivities();
    refetchWarehouse();
    refetchLowStock();
  };

  const handleDateRangeReset = () => {
    setFromDate(null);
    setToDate(null);
    setFilters((prev) => ({ ...prev, period: "30" }));
  };

  // Stat cards from KPI data
  const statCards: StatCardData[] = [
    {
      title: "Total Customers",
      value: kpi?.totalCustomers?.value || 0,
      trend: kpi?.totalCustomers?.trend || "neutral",
      trendValue: `${kpi?.totalCustomers?.change?.toFixed(1) || 0}%`,
      icon: <People />,
      color: "primary",
      subtitle: "Active customers",
    },
    {
      title: "Stock Value",
      value: kpi?.totalStockValue?.value || 0,
      unit: "₹",
      trend: kpi?.totalStockValue?.trend || "neutral",
      trendValue: `${kpi?.totalStockValue?.change?.toFixed(1) || 0}%`,
      icon: <Warehouse />,
      color: "success",
      subtitle: `${kpi?.totalStockValue?.weight || 0} ${kpi?.totalStockValue?.weightUnit || "MT"} total`,
    },
    {
      title: "Monthly Revenue",
      value: kpi?.monthlyRevenue?.value || 0,
      unit: "₹",
      trend: kpi?.monthlyRevenue?.trend || "neutral",
      trendValue: `${kpi?.monthlyRevenue?.change?.toFixed(1) || 0}%`,
      icon: <AttachMoney />,
      color: "info",
      subtitle: "This month",
    },
    {
      title: "Recent Transactions",
      value: kpi?.recentTransactions?.value || 0,
      trend: kpi?.recentTransactions?.trend || "neutral",
      trendValue: `${kpi?.recentTransactions?.change?.toFixed(1) || 0}%`,
      icon: <Assignment />,
      color: "warning",
      subtitle: "Last 30 days",
    },
  ];

  return (
    <Layout>
      <div className="w-full space-y-4 font-sans text-slate-800">
        {/* ── NETSUITE HOME TITLE BAR & CONTROLS ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-300 pb-2">
          {/* Left Title */}
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d3d] tracking-tight">Home</h1>
            <p className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Right NetSuite Customization Controls */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden lg:flex items-center space-x-3 text-sky-700 font-semibold border-r border-slate-300 pr-3">
              <button onClick={() => alert("Portlet date settings opened.")} className="hover:underline flex items-center space-x-0.5">
                <span>Viewing: Portlet date settings</span>
                <KeyboardArrowDown className="!w-3 !h-3" />
              </button>
              <button onClick={() => alert("Personalize Dashboard Portlets...")} className="hover:underline flex items-center space-x-0.5">
                <span>Personalize</span>
                <KeyboardArrowDown className="!w-3 !h-3" />
              </button>
              <button onClick={() => alert("Layout Options...")} className="hover:underline flex items-center space-x-0.5">
                <span>Layout</span>
                <KeyboardArrowDown className="!w-3 !h-3" />
              </button>
            </div>

            {/* Warehouse & Date Filters */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="flex items-center space-x-2 flex-wrap">
                <FormControl size="small" className="min-w-[140px] bg-white">
                  <InputLabel shrink className="!text-[11px]">Warehouse</InputLabel>
                  <Select
                    value={filters.warehouseId}
                    label="Warehouse"
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    className="!h-7 !text-xs"
                  >
                    <MenuItem value="all">All Locations</MenuItem>
                    {warehouseList.map((wh) => (
                      <MenuItem key={wh.id} value={wh.id.toString()}>
                        {wh.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="From"
                  value={fromDate}
                  onChange={(val: any) => setFromDate(val ? dayjs(val) : null)}
                  slotProps={{
                    textField: {
                      size: "small",
                      className: "min-w-[120px] bg-white",
                      sx: { "& .MuiInputBase-root": { height: 28, fontSize: 12 } },
                    },
                  }}
                />

                <DatePicker
                  label="To"
                  value={toDate}
                  onChange={(val: any) => setToDate(val ? dayjs(val) : null)}
                  slotProps={{
                    textField: {
                      size: "small",
                      className: "min-w-[120px] bg-white",
                      sx: { "& .MuiInputBase-root": { height: 28, fontSize: 12 } },
                    },
                  }}
                />


                <Tooltip title="Reset Filters">
                  <IconButton onClick={handleDateRangeReset} size="small" className="!w-7 !h-7 bg-white border border-slate-300">
                    <RestartAlt className="!w-4 !h-4 text-slate-600" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh Dashboard Data">
                  <IconButton onClick={handleRefresh} size="small" className="!w-7 !h-7 bg-sky-600 hover:bg-sky-700 text-white">
                    <Refresh className="!w-4 !h-4" />
                  </IconButton>
                </Tooltip>
              </div>
            </LocalizationProvider>
          </div>
        </div>

        {/* ── NETSUITE PORTLET GRID (2-COLUMN CONTAINER) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* LEFT COLUMN (8 COLS ON DESKTOP) */}
          <div className="lg:col-span-8 space-y-4">

            {/* PORTLET 1: NAVIGATION SHORTCUT GROUP */}
            <NetSuitePortlet title="Navigation Shortcut Group">
              <div className="border-b border-slate-200 pb-2 mb-3 flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <span>≡</span>
                  <span>Quick Access</span>
                </span>
              </div>

              {/* Shortcut Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Reports Group */}
                <div className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                    <Assessment className="!w-5 !h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-800 mb-1">Reports</h3>
                    <div className="flex flex-col space-y-0.5 text-xs text-sky-700">
                      <button onClick={() => navigate("/reports/daily-summary")} className="text-left hover:underline">
                        Trial Balance
                      </button>
                      <button onClick={() => navigate("/reports/inward-outward")} className="text-left hover:underline">
                        Income Statement
                      </button>
                      <button onClick={() => navigate("/reports/stock-register")} className="text-left hover:underline">
                        Balance Sheet
                      </button>
                      <button onClick={() => navigate("/reports/warehouse-occupancy")} className="text-left hover:underline">
                        Stock Register
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sales Group */}
                <div className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                    <ShoppingCart className="!w-5 !h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-800 mb-1">Sales</h3>
                    <div className="flex flex-col space-y-0.5 text-xs text-sky-700">
                      <button onClick={() => navigate("/sales-order")} className="text-left hover:underline">
                        Estimates
                      </button>
                      <button onClick={() => navigate("/sales-order")} className="text-left hover:underline">
                        Sales Orders
                      </button>
                      <button onClick={() => navigate("/invoice")} className="text-left hover:underline">
                        Invoices
                      </button>
                      <button onClick={() => navigate("/delivery-challan")} className="text-left hover:underline">
                        Delivery Challans
                      </button>
                    </div>
                  </div>
                </div>

                {/* Purchases Group */}
                <div className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                    <Receipt className="!w-5 !h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-800 mb-1">Purchases</h3>
                    <div className="flex flex-col space-y-0.5 text-xs text-sky-700">
                      <button onClick={() => navigate("/purchase-order")} className="text-left hover:underline">
                        Purchase Orders
                      </button>
                      <button onClick={() => navigate("/grn")} className="text-left hover:underline">
                        Goods Receipts (GRN)
                      </button>
                      <button onClick={() => navigate("/purchase-invoice")} className="text-left hover:underline">
                        Purchase Bills
                      </button>
                      <button onClick={() => navigate("/purchase-payment")} className="text-left hover:underline">
                        Payments
                      </button>
                    </div>
                  </div>
                </div>

                {/* Warehouse Group */}
                <div className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                    <Inventory className="!w-5 !h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-800 mb-1">Warehouse</h3>
                    <div className="flex flex-col space-y-0.5 text-xs text-sky-700">
                      <button onClick={() => navigate("/inventory")} className="text-left hover:underline">
                        Inventory Master
                      </button>
                      <button onClick={() => navigate("/warehouses")} className="text-left hover:underline">
                        Warehouses
                      </button>
                      <button onClick={() => navigate("/whr")} className="text-left hover:underline">
                        Warehouse Receipts
                      </button>
                      <button onClick={() => navigate("/gatepass")} className="text-left hover:underline">
                        Gate Pass
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </NetSuitePortlet>

            {/* PORTLET 2: KEY PERFORMANCE INDICATORS (KPIs) */}
            <NetSuitePortlet title="Key Performance Indicators (KPIs)">
              <StatCards stats={statCards} />
            </NetSuitePortlet>

            {/* PORTLET 3: ANALYTICS PORTLET (CHARTS) */}
            <NetSuitePortlet title="Analytics Portlet">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <ShowChart className="!w-4 !h-4 text-sky-600" />
                        <span>Revenue Performance</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                        Last 6 Months
                      </span>
                    </div>

                    {chartLoading ? (
                      <LinearProgress className="my-10" />
                    ) : chartInfo?.revenueChart?.length ? (
                      <div className="h-56 w-full">
                        <LineChart
                          xAxis={[
                            {
                              id: "m",
                              data: chartInfo.revenueChart.map((i) => i.month || ""),
                              scaleType: "point",
                            },
                          ]}
                          series={[
                            {
                              id: "rev",
                              label: "Revenue (₹)",
                              data: chartInfo.revenueChart.map((i) => Number(i.revenue) || 0),
                              color: "#2563eb",
                              area: true,
                            },
                          ]}
                          height={220}
                          margin={{ left: 60, right: 10, top: 10, bottom: 40 }}
                        />
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        Revenue analysis portlet ready. Transactions will populate performance metrics.
                      </div>
                    )}
                  </div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <BarChartIcon className="!w-4 !h-4 text-emerald-600" />
                        <span>Inventory Velocity</span>
                      </span>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Inward</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span>Outward</span>
                        </span>
                      </div>
                    </div>

                    {chartLoading ? (
                      <LinearProgress className="my-10" />
                    ) : chartInfo?.transactionChart?.length ? (
                      <div className="h-56 w-full">
                        <BarChart
                          xAxis={[
                            {
                              id: "d",
                              data: chartInfo.transactionChart.map((i) => i.date || ""),
                              scaleType: "band",
                            },
                          ]}
                          series={[
                            { id: "in", label: "Inward", data: chartInfo.transactionChart.map((i) => Number(i.inward) || 0), color: "#059669" },
                            { id: "out", label: "Outward", data: chartInfo.transactionChart.map((i) => Number(i.outward) || 0), color: "#dc2626" },
                          ]}
                          height={220}
                          margin={{ left: 50, right: 10, top: 10, bottom: 40 }}
                        />
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        Inventory velocity analysis ready. Inward/Outward movements will render here.
                      </div>
                    )}
                  </div>
                </Grid>
              </Grid>
            </NetSuitePortlet>

            {/* Analytics Portlet End */}
          </div>


          {/* RIGHT COLUMN (4 COLS ON DESKTOP) */}
          <div className="lg:col-span-4 space-y-4">

            {/* PORTLET 5: REMINDERS & ALERTS */}
            <NetSuitePortlet title="Reminders" actionText="View All">
              <div className="space-y-2">
                {lowStockAlerts.length === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>All inventory levels and warehouse documents are up to date.</span>
                  </div>
                ) : (
                  lowStockAlerts.map((item: any, idx: number) => (
                    <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Warning className="!w-4 !h-4 text-amber-600" />
                        <div>
                          <div className="font-semibold text-slate-800">{item.item_name || "Low Stock Item"}</div>
                          <div className="text-[10px] text-slate-500">Qty: {item.current_stock || 0} (Min: {item.min_stock || 10})</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    </div>
                  ))
                )}
              </div>
            </NetSuitePortlet>

            {/* PORTLET 6: RECENT SYSTEM ACTIVITIES */}
            <NetSuitePortlet title="Recent System Activities">
              <div className="divide-y divide-slate-100 text-xs">
                {activities.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 italic">No recent system activity recorded.</div>
                ) : (
                  activities.map((act: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Article className="!w-4 !h-4 text-sky-600" />
                        <div>
                          <div className="font-semibold text-slate-800">{act.description || act.title || "System Activity"}</div>
                          <div className="text-[10px] text-slate-400">{act.timestamp || act.createdAt || "Just now"}</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {act.status || "Completed"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </NetSuitePortlet>

            {/* PORTLET 7: WAREHOUSE OCCUPANCY SUMMARY */}
            <NetSuitePortlet title="Warehouse Occupancy Overview">
              <div className="space-y-3">
                {warehouses.slice(0, 3).map((wh: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{wh.warehouseName}</span>
                      <span>{wh.occupancyPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(wh.occupancyPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Capacity: {wh.totalCapacity?.toLocaleString()} MT</span>
                      <span>Occupied: {wh.occupiedCapacity?.toLocaleString()} MT</span>
                    </div>
                  </div>
                ))}
              </div>
            </NetSuitePortlet>

          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;