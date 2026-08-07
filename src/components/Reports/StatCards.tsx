import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

export interface StatCardData {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

interface StatCardsProps {
  stats: StatCardData[];
}

// Premium gradient palettes for each color
const colorMap: Record<string, { gradient: string; iconBg: string; iconColor: string; accentLight: string }> = {
  primary: {
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(37, 99, 235, 0.08)',
  },
  secondary: {
    gradient: 'linear-gradient(135deg, #334155 0%, #64748B 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(100, 116, 139, 0.08)',
  },
  success: {
    gradient: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(5, 150, 105, 0.08)',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(217, 119, 6, 0.08)',
  },
  error: {
    gradient: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(220, 38, 38, 0.08)',
  },
  info: {
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    iconBg: 'rgba(255,255,255,0.18)',
    iconColor: '#ffffff',
    accentLight: 'rgba(59, 130, 246, 0.08)',
  },
};

const trendColors = {
  up: '#10B981',
  down: '#EF4444',
  neutral: '#94A3B8',
};

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    const sx = { fontSize: '14px' };
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ ...sx, color: trendColors.up }} />;
      case 'down':
        return <TrendingDown sx={{ ...sx, color: trendColors.down }} />;
      case 'neutral':
        return <TrendingFlat sx={{ ...sx, color: trendColors.neutral }} />;
      default:
        return null;
    }
  };

  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number') {
      const formatted = value.toLocaleString('en-IN');
      return unit ? `${formatted}` : formatted;
    }
    return unit ? `${value}` : value;
  };

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {stats.map((stat, index) => {
        const colors = colorMap[stat.color || 'primary'];
        return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              elevation={0}
              sx={{
                background: colors.gradient,
                borderRadius: '14px',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                },
                // Decorative background circles
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-30px',
                  right: '30px',
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              <CardContent sx={{ p: '22px 24px !important', position: 'relative', zIndex: 1 }}>
                {/* Top: Icon + Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      backgroundColor: colors.iconBg,
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.iconColor,
                      '& .MuiSvgIcon-root': {
                        fontSize: '22px',
                      },
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      textAlign: 'right',
                      lineHeight: 1.3,
                      maxWidth: '120px',
                    }}
                  >
                    {stat.title}
                  </Typography>
                </Box>

                {/* Value */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {formatValue(stat.value)}
                  </Typography>
                  {stat.unit && (
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {stat.unit}
                    </Typography>
                  )}
                </Box>

                {/* Bottom Row: Trend + Subtitle */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    pt: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {stat.trend && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.3,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(4px)',
                        px: 0.75,
                        py: 0.3,
                        borderRadius: '6px',
                      }}
                    >
                      {getTrendIcon(stat.trend)}
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                        }}
                      >
                        {stat.trendValue}
                      </Typography>
                    </Box>
                  )}
                  {stat.subtitle && (
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 500,
                      }}
                    >
                      {stat.subtitle}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatCards;
