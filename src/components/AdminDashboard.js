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
    const [user, setUser] = useState(null); // Para mostrar el email del usuario logueado
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserDataAndStats = async () => {
            setLoadingStats(true);
            setErrorStats(null);
            try {
                // Obtener datos del usuario logueado de la sesión actual
                const { data: { user: loggedInUser } } = await supabase.auth.getUser();
                if (loggedInUser) {
                    setUser(loggedInUser);
                }

                // --- Simulación de obtención de estadísticas ---
                // En un caso real, harías consultas a tus tablas de Supabase para obtener estos números.
                // Ejemplo:
                // const { count: totalClientsCount, error: clientError } = await supabase.from('datos_medidor').select('*', { count: 'exact' });
                // if (clientError) throw clientError;
                // const { data: pendingPaymentsData, error: paymentsError } = await supabase.from('pagos').select('*').eq('estado', 'pendiente');
                // if (paymentsError) throw paymentsError;

                await new Promise(resolve => setTimeout(resolve, 1000)); // Simula tiempo de carga

                setStats({
                    totalClients: 1500, // Datos de ejemplo
                    pendingPayments: 250,
                    recentLecturas: 500
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error.message);
                setErrorStats('Error al cargar los datos del panel.');
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
                backgroundImage: 'url("/images/image3.jpg")', // O la que prefieras para el admin
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
                    {user && (
                        <Typography variant="h6" component="h2" align="center" sx={{ mb: 3 }}>
                            Hola, {user.email}!
                        </Typography>
                    )}

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
