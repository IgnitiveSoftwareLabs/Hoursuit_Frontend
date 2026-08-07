import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import NavbarBreadcrumbs from '../components/NavbarBreadcrumbs';




interface CompanyInfoProps {
  companyName: string;
  fields?: {
      label: string;value: string 
}[];
  title?: string;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({
  companyName,
  fields = [],
  title 
}) => {
console.log('CompanyInfo rendered with:', { companyName, fields, title });
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box>
    <Typography variant="h3" sx={{ mb: 1 }}>
    {title}
    </Typography>
    <NavbarBreadcrumbs />
  </Box>
      </Box>

      <Box sx={{ borderRadius: 2 }}>
        <Card variant="outlined" sx={{ mb: 3, p: 0 }}>
          <div style={{ position: 'relative' }}>
            <img src="/Group34926.png" alt="Company Banner" style={{ maxWidth: '100%', width: '100%' }} />
          </div>

          <CardContent sx={{ mt: 5, px: 5 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {companyName}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {fields.map((field, index) => (
                <Grid size={{xs:12,sm:4,md:4}} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                    
                    <Box>
                      <Typography variant="body1" color="text.secondary" component="div">
                        {field.label}
                      </Typography>
                      <Typography
  variant="body1"
  dangerouslySetInnerHTML={{ __html: field.value || 'N/A' }}
/>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CompanyInfo;
