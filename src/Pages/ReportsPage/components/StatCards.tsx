import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
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

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'down':
        return <TrendingDown sx={{ color: 'error.main' }} />;
      case 'neutral':
        return <TrendingFlat sx={{ color: 'warning.main' }} />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      case 'neutral':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number') {
      return `${value.toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`;
    }
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {stat.icon && (
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color || 'primary'}.main`,
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    {stat.title}
                  </Typography>
                  {stat.subtitle && (
                    <Typography color="text.secondary" variant="body2">
                      {stat.subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {formatValue(stat.value, stat.unit)}
              </Typography>
              
              {stat.trend && stat.trendValue && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getTrendIcon(stat.trend)}
                  <Typography
                    variant="body2"
                    sx={{ 
                      ml: 0.5, 
                      color: getTrendColor(stat.trend),
                      fontWeight: 'medium',
                    }}
                  >
                    {stat.trendValue}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;
