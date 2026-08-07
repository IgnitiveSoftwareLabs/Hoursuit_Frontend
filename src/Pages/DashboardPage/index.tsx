import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  People,
  Warehouse,
  AttachMoney,
  Assignment,
  Warning,
  Business,
  LocalShipping,
  Refresh,
  RestartAlt,
  TrendingUp,
  CalendarToday,
  BarChart as BarChartIcon,
  ShowChart,
  PieChartOutline,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useTheme } from "@mui/material/styles";
import Layout from "../../components/Layout/index";
import StatCards from "../../components/Reports/StatCards";
import type { StatCardData } from "../../components/Reports/StatCards";
import {
  useGetKPIDataQuery,
  useGetRecentActivitiesQuery,
  useGetWarehouseOverviewQuery,
  useGetLowStockAlertsQuery,
  useGetChartDataQuery,
  useGetWarehouseOptionsQuery,
  type DashboardFilters,
} from "../../RTK/services/dashboardApi";

// ── Premium card style ──
const cardSx = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8ECF1',
  borderRadius: '14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    borderColor: '#D1D9E6',
  },
};

const sectionTitleSx = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1E293B',
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
};

const chartColors = {
  primary: '#2563EB',
  secondary: '#64748B',
  success: '#059669',
  error: '#DC2626',
  info: '#3B82F6',
  warning: '#D97706',
  purple: '#7C3AED',
  teal: '#0D9488',
};

const Dashboard: React.FC = () => {

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
  const {
    data: chartData,
    isLoading: chartLoading,
    refetch: refetchCharts,
  } = useGetChartDataQuery(apiFilters);
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useGetRecentActivitiesQuery({ limit: 5 });
  const {
    data: warehouseData,
    isLoading: warehouseLoading,
    refetch: refetchWarehouse,
  } = useGetWarehouseOverviewQuery();
  const {
    data: lowStockData,
    isLoading: lowStockLoading,
    refetch: refetchLowStock,
  } = useGetLowStockAlertsQuery({ limit: 5 });
  const { data: warehouseOptions } = useGetWarehouseOptionsQuery();

  const kpi = kpiData?.result;
  const chartInfo = chartData?.result;
  const activities = activitiesData?.result || [];
  const warehouses = warehouseData?.result || [];
  const lowStockAlerts = lowStockData?.result || [];
  const warehouseList = warehouseOptions?.result || [];

  // Handle filter changes
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

  // Create stat cards from KPI data
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
      subtitle: `${kpi?.totalStockValue?.weight || 0} ${kpi?.totalStockValue?.weightUnit || "MT"
        } total`,
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "gatepass":
        return <LocalShipping />;
      case "invoice":
        return <AttachMoney />;
      default:
        return <Assignment />;
    }
  };


  // Empty state illustration
  const EmptyStateBox = ({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 7,
          px: 3,
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          {icon || <TrendingUp sx={{ fontSize: 28, color: '#6366F1' }} />}
        </Box>
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#1E293B',
            mb: 0.5,
            textAlign: 'center'
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '13px',
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    );
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        {/* ── Page Header + Filters ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              Dashboard
            </Typography>
            <Typography
              sx={{
                fontSize: '13.5px',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 500,
              }}
            >
              <CalendarToday sx={{ fontSize: 14 }} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>

          {/* Inline Filters */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <FormControl
                size="small"
                sx={{
                  minWidth: 155,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    height: '38px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#94A3B8' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1.5px' },
                  },
                  '& .MuiInputLabel-root': { fontSize: '12px', color: '#94A3B8' },
                }}
              >
                <InputLabel shrink>Warehouse</InputLabel>
                <Select
                  value={filters.warehouseId}
                  label="Warehouse"
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  sx={{ "& .MuiSelect-select": { py: 1 } }}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {warehouseList.map((warehouse) => (
                    <MenuItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                    >
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="From"
                value={fromDate}
                onChange={(newValue: Dayjs | null) => setFromDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      minWidth: 135,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        height: '38px',
                        '& fieldset': { borderColor: '#E2E8F0' },
                      },
                      '& .MuiInputLabel-root': { fontSize: '12px' },
                    },
                  },
                }}
              />
              <DatePicker
                label="To"
                value={toDate}
                onChange={(newValue: Dayjs | null) => setToDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      minWidth: 135,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        height: '38px',
                        '& fieldset': { borderColor: '#E2E8F0' },
                      },
                      '& .MuiInputLabel-root': { fontSize: '12px' },
                    },
                  },
                }}
              />

              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Reset filters">
                  <IconButton
                    size="small"
                    onClick={handleDateRangeReset}
                    sx={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      width: 38,
                      height: 38,
                      backgroundColor: '#FFFFFF',
                      color: '#64748B',
                      '&:hover': {
                        backgroundColor: '#F1F5F9',
                        borderColor: '#3B82F6',
                        color: '#3B82F6',
                      },
                    }}
                  >
                    <RestartAlt sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh data">
                  <IconButton
                    size="small"
                    onClick={handleRefresh}
                    sx={{
                      borderRadius: '10px',
                      width: 38,
                      height: 38,
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                      '&:hover': {
                        backgroundColor: '#1D4ED8',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                      },
                    }}
                  >
                    <Refresh sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </LocalizationProvider>
        </Box>

        {/* ── KPI Cards ── */}
        <StatCards stats={statCards} />

        {/* ── Charts Section ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Revenue Chart */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ShowChart sx={{ fontSize: 18, color: '#2563EB' }} />
                    </Box>
                    <Typography sx={sectionTitleSx}>
                      Revenue Performance
                    </Typography>
                  </Box>
                  <Chip
                    label="Last 6 Months"
                    size="small"
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748B',
                      height: '26px',
                    }}
                  />
                </Box>

                {chartLoading ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '60%', height: 3, borderRadius: 2, '& .MuiLinearProgress-bar': { backgroundColor: '#2563EB' } }} />
                  </Box>
                ) : chartInfo?.revenueChart?.length > 0 &&
                  chartInfo.revenueChart.some(
                    (item) => item.month && item.revenue !== undefined
                  ) ? (
                  <Box sx={{ height: 300, width: "100%" }}>
                    <LineChart
                      xAxis={[
                        {
                          id: "months",
                          data: chartInfo.revenueChart
                            .filter(
                              (item) =>
                                item.month &&
                                item.revenue !== undefined &&
                                item.revenue !== null
                            )
                            .map((item) => item.month || "Unknown"),
                          scaleType: "point",
                        },
                      ]}
                      series={[
                        {
                          id: "revenue",
                          label: "Revenue (₹)",
                          data: chartInfo.revenueChart
                            .filter(
                              (item) =>
                                item.month &&
                                item.revenue !== undefined &&
                                item.revenue !== null
                            )
                            .map((item) => Number(item.revenue) || 0),
                          color: chartColors.primary,
                          area: true,
                        },
                      ]}
                      height={300}
                      margin={{ left: 80, right: 20, top: 20, bottom: 60 }}
                      legend={{ hidden: true } as any}
                    />
                  </Box>
                ) : (
                  <EmptyStateBox
                    title="Revenue analysis unavailable"
                    subtitle="Financial transactions for this period will appear here."
                    icon={<ShowChart sx={{ fontSize: 28, color: '#6366F1' }} />}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction Chart */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BarChartIcon sx={{ fontSize: 18, color: '#059669' }} />
                    </Box>
                    <Typography sx={sectionTitleSx}>
                      Inventory Velocity
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: chartColors.success }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Inward</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: chartColors.error }} />
                      <Typography sx={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Outward</Typography>
                    </Box>
                  </Stack>
                </Box>

                {chartLoading ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress sx={{ width: '60%', height: 3, borderRadius: 2 }} />
                  </Box>
                ) : chartInfo?.transactionChart?.length > 0 &&
                  chartInfo.transactionChart.some(
                    (item) =>
                      item.date &&
                      item.inward !== undefined &&
                      item.outward !== undefined
                  ) ? (
                  <Box sx={{ height: 300, width: "100%" }}>
                    <BarChart
                      xAxis={[
                        {
                          id: "dates",
                          data: chartInfo.transactionChart
                            .filter(
                              (item) =>
                                item.date &&
                                item.inward !== undefined &&
                                item.outward !== undefined
                            )
                            .map((item) => {
                              try {
                                return new Date(item.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                );
                              } catch {
                                return "Invalid Date";
                              }
                            }),
                          scaleType: "band",
                        },
                      ]}
                      series={[
                        {
                          id: "inward",
                          label: "Inward (Qtl)",
                          data: chartInfo.transactionChart
                            .filter(
                              (item) =>
                                item.date &&
                                item.inward !== undefined &&
                                item.outward !== undefined
                            )
                            .map((item) => Number(item.inward) || 0),
                          color: chartColors.success,
                        },
                        {
                          id: "outward",
                          label: "Outward (Qtl)",
                          data: chartInfo.transactionChart
                            .filter(
                              (item) =>
                                item.date &&
                                item.inward !== undefined &&
                                item.outward !== undefined
                            )
                            .map((item) => Number(item.outward) || 0),
                          color: chartColors.error,
                        },
                      ]}
                      height={300}
                      margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
                      legend={{ hidden: true } as any}
                    />
                  </Box>
                ) : (
                  <EmptyStateBox
                    title="Inventory activity unavailable"
                    subtitle="Transaction velocity per day will be visualized here."
                    icon={<BarChartIcon sx={{ fontSize: 28, color: '#6366F1' }} />}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Commodity Distribution */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PieChartOutline sx={{ fontSize: 18, color: '#D97706' }} />
                  </Box>
                  <Typography sx={sectionTitleSx}>
                    Commodity Allocation
                  </Typography>
                </Box>

                {chartLoading ? (
                  <LinearProgress sx={{ borderRadius: 4, height: 3 }} />
                ) : chartInfo?.commodityChart?.length > 0 &&
                  chartInfo.commodityChart.some(
                    (item) =>
                      item.name && item.value !== undefined && item.value > 0
                  ) ? (
                  <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Box sx={{ height: 340, width: "100%", display: 'flex', justifyContent: 'center' }}>
                        <PieChart
                          series={[
                            {
                              id: "commodities",
                              data: chartInfo.commodityChart
                                .filter(
                                  (commodity) =>
                                    commodity.name &&
                                    commodity.value !== undefined &&
                                    commodity.value !== null &&
                                    commodity.value > 0
                                )
                                .slice(0, 8)
                                .map((commodity, index) => ({
                                  id: index,
                                  value: Number(commodity.value) || 0,
                                  label: commodity.name || "Unknown",
                                  color: [
                                    chartColors.primary,
                                    chartColors.success,
                                    chartColors.info,
                                    chartColors.warning,
                                    chartColors.purple,
                                    chartColors.teal,
                                    chartColors.secondary,
                                    '#90a4ae',
                                  ][index % 8],
                                })),
                              innerRadius: 80,
                              outerRadius: 140,
                              paddingAngle: 3,
                              cornerRadius: 6,
                              highlightScope: { fade: 'global', highlighted: 'item' },
                            },
                          ]}
                          height={340}
                          width={340}
                          legend={{ hidden: true } as any}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#64748B',
                          mb: 2,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Inventory Breakdown
                      </Typography>
                      <Grid container spacing={1.5}>
                        {chartInfo.commodityChart
                          .slice(0, 8)
                          .map((commodity, index) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={index}>
                              <Box
                                sx={{
                                  p: 2,
                                  border: '1px solid #F1F5F9',
                                  borderRadius: '12px',
                                  backgroundColor: '#FAFBFC',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: '#F1F5F9',
                                    borderColor: '#E2E8F0',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "3px",
                                      backgroundColor: [
                                        chartColors.primary,
                                        chartColors.success,
                                        chartColors.info,
                                        chartColors.warning,
                                        chartColors.purple,
                                        chartColors.teal,
                                        chartColors.secondary,
                                        '#90a4ae',
                                      ][index % 8],
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: '#1E293B',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {commodity.name}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                  <Typography sx={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                                    {commodity.value.toLocaleString("en-IN")}{" "}
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>
                                      {commodity.weightUnit || "Qtl"}
                                    </span>
                                  </Typography>
                                  <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                                    {commodity.customers} clients
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <EmptyStateBox
                    title="Commodity data unavailable"
                    subtitle="Stock distribution by commodity will be visualized here."
                    icon={<PieChartOutline sx={{ fontSize: 28, color: '#6366F1' }} />}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Activity + Alerts Grid ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Recent Activities */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Assignment sx={{ fontSize: 18, color: '#7C3AED' }} />
                  </Box>
                  <Typography sx={sectionTitleSx}>
                    Activity Log
                  </Typography>
                </Box>
                {activitiesLoading ? (
                  <LinearProgress sx={{ borderRadius: 4, height: 3 }} />
                ) : activities.length > 0 ? (
                  <List disablePadding>
                    {activities.slice(0, 6).map((activity) => (
                      <ListItem
                        key={activity.id}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: '10px',
                          mb: 1,
                          transition: 'all 0.2s ease',
                          backgroundColor: '#FAFBFC',
                          border: '1px solid #F1F5F9',
                          '&:hover': {
                            backgroundColor: '#F1F5F9',
                            borderColor: '#E2E8F0',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 44,
                          }}
                        >
                          <Box sx={{
                            p: 0.8,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& .MuiSvgIcon-root': { fontSize: '18px' },
                          }}>
                            {getActivityIcon(activity.type)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: '#1E293B' }}>
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.3 }}>
                              <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>
                                {activity.description}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#CBD5E1', mt: 0.25, fontWeight: 500 }}>
                                {new Date(activity.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={activity.status}
                          size="small"
                          sx={{
                            fontSize: '10px',
                            fontWeight: 700,
                            height: '22px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            ...(activity.status === "completed" || activity.status === "Success"
                              ? {
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                              }
                              : {
                                backgroundColor: '#FFFBEB',
                                color: '#D97706',
                              }),
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <EmptyStateBox
                    title="No recent activity"
                    subtitle="System actions will be logged here."
                    icon={<Assignment sx={{ fontSize: 28, color: '#6366F1' }} />}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alerts */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Warning sx={{ fontSize: 18, color: '#DC2626' }} />
                  </Box>
                  <Typography sx={sectionTitleSx}>
                    Stock Alerts
                  </Typography>
                </Box>
                {lowStockLoading ? (
                  <LinearProgress sx={{ borderRadius: 4, height: 3 }} />
                ) : lowStockAlerts.length > 0 ? (
                  <List disablePadding>
                    {lowStockAlerts.map((alert) => (
                      <ListItem
                        key={alert.id}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: '10px',
                          mb: 1,
                          backgroundColor: alert.severity === 'critical' ? '#FEF2F2' : '#FAFBFC',
                          border: '1px solid',
                          borderColor: alert.severity === 'critical' ? '#FECACA' : '#F1F5F9',
                          '&:hover': {
                            backgroundColor: alert.severity === 'critical' ? '#FEE2E2' : '#F1F5F9',
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 44,
                            '& .MuiSvgIcon-root': { fontSize: '22px' },
                          }}
                        >
                          <Warning
                            sx={{
                              color:
                                alert.severity === 'critical'
                                  ? '#DC2626'
                                  : alert.severity === 'high'
                                    ? '#D97706'
                                    : '#3B82F6',
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>
                              {alert.commodityName}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.3 }}>
                              <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                {alert.customerName}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: alert.severity === 'critical' ? '#DC2626' : '#64748B', mt: 0.25, fontWeight: 700 }}>
                                Stock: {alert.currentStock} {alert.unit}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={alert.severity.toUpperCase()}
                          size="small"
                          sx={{
                            fontSize: '10px',
                            fontWeight: 800,
                            height: '22px',
                            borderRadius: '6px',
                            letterSpacing: '0.03em',
                            backgroundColor: alert.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                            color: alert.severity === 'critical' ? '#DC2626' : '#92400E',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: '#F0FDF4',
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: '13px',
                      '& .MuiAlert-icon': { color: '#059669' },
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    All inventory levels are healthy. No alerts found.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Warehouse Overview */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Warehouse sx={{ fontSize: 18, color: '#2563EB' }} />
                  </Box>
                  <Typography sx={sectionTitleSx}>
                    Warehouse Infrastructure
                  </Typography>
                </Box>
                {warehouseLoading ? (
                  <LinearProgress sx={{ borderRadius: 4, height: 3 }} />
                ) : (
                  <Grid container spacing={2.5}>
                    {warehouses.map((warehouse) => (
                      <Grid size={{ xs: 12, md: 4 }} key={warehouse.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            border: '1px solid #F1F5F9',
                            borderRadius: '14px',
                            backgroundColor: '#FAFBFC',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: '#DBEAFE',
                              backgroundColor: '#FFFFFF',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 2.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                              }}
                            >
                              <Warehouse sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  lineHeight: 1.2,
                                }}
                              >
                                {warehouse.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  color: '#94A3B8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mt: 0.3,
                                  fontWeight: 500,
                                }}
                              >
                                <Business sx={{ fontSize: 13 }} />
                                {warehouse.location}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Occupancy Bar */}
                          <Box sx={{ mb: 2.5 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.75,
                              }}
                            >
                              <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                                Utilization
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  color:
                                    warehouse.occupancyPercentage > 90
                                      ? '#DC2626'
                                      : warehouse.occupancyPercentage > 70
                                        ? '#D97706'
                                        : '#059669',
                                }}
                              >
                                {warehouse.occupancyPercentage.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={warehouse.occupancyPercentage}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#F1F5F9',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background:
                                    warehouse.occupancyPercentage > 90
                                      ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                                      : warehouse.occupancyPercentage > 70
                                        ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                                        : 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                                },
                              }}
                            />
                          </Box>

                          {/* Stats Row */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 1.5,
                              pt: 2,
                              borderTop: '1px solid #F1F5F9',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontSize: '10px', color: '#94A3B8', mb: 0.3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Capacity
                              </Typography>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                                {warehouse.totalCapacity.toLocaleString()} {warehouse.capacityUnit || "MT"}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '10px', color: '#94A3B8', mb: 0.3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Occupied
                              </Typography>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                                {warehouse.occupiedCapacity.toLocaleString()} {warehouse.capacityUnit || "MT"}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '10px', color: '#94A3B8', mb: 0.3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Stacks
                              </Typography>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                                {warehouse.totalStacks}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '10px', color: '#94A3B8', mb: 0.3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Clients
                              </Typography>
                              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                                {warehouse.activeCustomers}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </Layout>
  );
};

export default Dashboard;