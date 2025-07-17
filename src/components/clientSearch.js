import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Container,
    Paper,
    Alert,
    CircularProgress,
    Divider,
    CssBaseline,
    Grid, // Usaremos Grid para un diseño de tarjetas
    Fade, // Importamos el componente Fade para la animación
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function ClientSearch() {
    const [clientId, setClientId] = useState('');
    const [consumptionData, setConsumptionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        setError('');
        setConsumptionData(null);
        setLoading(true);

        if (!clientId.trim()) {
            setError('Por favor, introduce tu ID de medidor.');
            setLoading(false);
            return;
        }

        try {
            const { data, error: supabaseError } = await supabase
                .from('datos_medidor')
                .select(`
                    id_medidor,
                    nombre_cliente,
                    direccion,
                    lecturas (
                        id_lectura,
                        mes,
                        anio,
                        lectura,
                        consumo
                    )
                `)
                .eq('id_medidor', parseInt(clientId));

            if (supabaseError) {
                throw supabaseError;
            }

            if (data && data.length > 0) {
                const sortedLecturas = data[0].lecturas.sort((a, b) => {
                    if (a.anio === b.anio) {
                        return a.mes - b.mes;
                    }
                    return a.anio - b.anio;
                });
                setConsumptionData({ ...data[0], lecturas: sortedLecturas });
            } else {
                setError('ID de medidor no encontrado. Por favor, verifica el ID.');
            }

        } catch (err) {
            console.error('Error al buscar consumo:', err);
            setError(`Ocurrió un error al buscar el consumo: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: consumptionData?.lecturas.map(l => `${l.mes}/${l.anio}`) || [],
        datasets: [
            {
                label: 'Consumo (m³)',
                data: consumptionData?.lecturas.map(l => l.consumo) || [],
                backgroundColor: 'rgba(25, 118, 210, 0.8)', // Usamos un color más sólido de la paleta primaria
                borderColor: 'primary.dark',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'white', // Aseguramos que la leyenda sea visible en un fondo oscuro
                }
            },
            title: {
                display: true,
                text: 'Historial de Consumo Mensual',
                color: 'white',
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: 'white',
                bodyColor: 'white'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Consumo (m³)',
                    color: 'white',
                },
                ticks: {
                    color: 'white',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.2)', // Líneas de la cuadrícula más tenues
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Período',
                    color: 'white',
                },
                ticks: {
                    color: 'white',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.2)',
                }
            },
        },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/image2.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: { xs: 8, sm: 10 },
            }}
        >
            <CssBaseline />
            <Container maxWidth="md">
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        alignItems: 'center',
                        borderRadius: 3, // Esquinas más redondeadas
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fondo semitransparente
                        backdropFilter: 'blur(5px)', // Efecto de cristal esmerilado (frosted glass)
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Consulta de Consumo de Clientes
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                        Por favor, introduce tu ID de medidor para ver la información de tu consumo de agua.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 400 }}>
                        <TextField
                            label="ID de Medidor"
                            variant="outlined"
                            fullWidth
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            error={!!error}
                            helperText={error}
                            disabled={loading}
                            type="number"
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSearch}
                            disabled={loading || !clientId.trim()}
                            sx={{ px: 4 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
                        </Button>
                    </Box>

                    {consumptionData && (
                        <Fade in={!!consumptionData} timeout={1000}>
                            <Box sx={{ mt: 4, width: '100%' }}>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
                                    Información del Medidor y Consumo
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body1">
                                                <strong>ID Medidor:</strong> {consumptionData.id_medidor}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body1">
                                                <strong>Nombre Cliente:</strong> {consumptionData.nombre_cliente}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Dirección:</strong> {consumptionData.direccion}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    {consumptionData.lecturas && consumptionData.lecturas.length > 0 ? (
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Historial de Consumo:
                                            </Typography>
                                            <Box sx={{ my: 3 }}>
                                                <Bar data={chartData} options={chartOptions} />
                                            </Box>

                                            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                                                Detalle de Lecturas:
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {consumptionData.lecturas.map((lectura, index) => (
                                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                                            <Typography variant="body2">
                                                                <strong>Período:</strong> {lectura.mes} / {lectura.anio}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Lectura :</strong> {lectura.lectura}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Consumo:</strong> {lectura.consumo} m³
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    ) : (
                                        <Alert severity="info" sx={{ mt: 2 }}>No se encontraron lecturas para este medidor.</Alert>
                                    )}
                                </Paper>
                            </Box>
                        </Fade>
                    )}

                    {error && !consumptionData && !loading && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
                            {error}
                        </Alert>
                    )}
                </Paper>
            </Container>

        </Box>
    );
}

export default ClientSearch;