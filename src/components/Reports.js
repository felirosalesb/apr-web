// src/components/Reports.js
import React from 'react';
import { Box, Typography, Container, Paper, CssBaseline } from '@mui/material';

function Reports() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/image3.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: { xs: 8, sm: 10 }
            }}
        >
            <CssBaseline />
            <Container maxWidth="lg">
                <Paper elevation={3} sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 3,
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Informes y Estadísticas
                    </Typography>
                    <Typography variant="body1" align="center">
                        Genera y visualiza informes detallados de consumo y gestión.
                    </Typography>
                    {/* Aquí irán los componentes para generar informes reales */}
                </Paper>
            </Container>
        </Box>
    );
}

export default Reports;
