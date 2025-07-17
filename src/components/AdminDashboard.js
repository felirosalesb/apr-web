// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    CssBaseline
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [stats, setStats] = useState({ totalClients: 0, pendingPayments: 0, recentLecturas: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const getReadingDateWarning = () => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let targetDate = new Date(currentYear, currentMonth, 20);

        if (currentDay > 20) {
            targetDate = new Date(currentYear, currentMonth + 1, 20);
        }

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (currentDay >= 20 && currentDay <= 25) {
            return {
                message: '¡ATENCIÓN! 📅 Días de toma de estados de agua (del 20 al 25 de cada mes).',
                severity: 'warning'
            };
        } else if (diffDays > 0) {
            return {
                message: `📅 Quedan ${diffDays} días para la toma de estados de agua (día 20 de este mes).`,
                severity: 'info'
            };
        } else {
            return {
                message: '📅 La toma de estados de agua de este mes ya pasó. Próxima toma el día 20 del siguiente mes.',
                severity: 'info'
            };
        }
    };

    const readingWarning = getReadingDateWarning();

    useEffect(() => {
        const fetchUserDataAndStats = async () => {
            setLoadingStats(true);
            setErrorStats(null);
            try {
                const { data: { user: loggedInUser } } = await supabase.auth.getUser();
                if (loggedInUser) {
                    setUser(loggedInUser);
                }

                // --- Depuración: Obtención REAL de estadísticas de Supabase ---
                console.log("Intentando obtener el conteo de clientes...");
                const { count: totalClientsCount, error: clientCountError } = await supabase
                    .from('datos_medidor') // Asegúrate de que el nombre de la tabla sea EXACTO
                    .select('*', { count: 'exact' });

                if (clientCountError) {
                    console.error("Error de Supabase al obtener conteo de clientes:", clientCountError);
                    throw clientCountError;
                }

                console.log("Conteo de clientes obtenido:", totalClientsCount); // Muestra el conteo
                console.log("Datos de error de conteo (debería ser null si es exitoso):", clientCountError); // Muestra el error (si lo hay)


                await new Promise(resolve => setTimeout(resolve, 500));

                setStats(prev => ({
                    ...prev,
                    totalClients: totalClientsCount || 0,
                    pendingPayments: 250,
                    recentLecturas: 500
                }));

            } catch (error) {
                console.error('Error general en fetchUserDataAndStats:', error.message);
                setErrorStats('Error al cargar los datos del panel: ' + error.message);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchUserDataAndStats();
    }, []);

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
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 3,
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h4" gutterBottom align="center">
                        Bienvenido al Panel de Administración
                    </Typography>


                    <Alert severity={readingWarning.severity} sx={{ width: '100%', mb: 3 }}>
                        {readingWarning.message}
                    </Alert>

                    {loadingStats ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <CircularProgress />
                        </Box>
                    ) : errorStats ? (
                        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{errorStats}</Alert>
                    ) : (
                        <Grid container spacing={3} sx={{ mt: 2, width: '100%' }}>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" component="div">
                                            {stats.totalClients}
                                        </Typography>
                                        <Typography variant="body2">
                                            Clientes Registrados
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" component="div">
                                            {stats.pendingPayments}
                                        </Typography>
                                        <Typography variant="body2">
                                            Pagos Pendientes
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" component="div">
                                            {stats.recentLecturas}
                                        </Typography>
                                        <Typography variant="body2">
                                            Lecturas Recientes
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    <Box sx={{ mt: 4, width: '100%', textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Acciones Rápidas
                        </Typography>
                        <Grid container spacing={2} justifyContent="center">
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate('/admin/clientes')}
                                    sx={{ py: 1.5, px: 3 }}
                                >
                                    Gestionar Clientes
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate('/admin/informes')}
                                    sx={{ py: 1.5, px: 3 }}
                                >
                                    Ver Informes
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                </Paper>
            </Container>
        </Box>
    );
}

export default AdminDashboard;
