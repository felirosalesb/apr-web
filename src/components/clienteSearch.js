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
    CssBaseline
} from '@mui/material';
import { supabase } from '../supabaseClient';
// Importaciones de Chart.js y react-chartjs-2
// Cambiamos 'Line' a 'Bar'
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement, // Cambiamos 'LineElement' por 'BarElement'
    Title,
    Tooltip,
    Legend,
} from 'chart.js';


// Registrar los componentes necesarios de Chart.js
// Cambiamos 'LineElement' por 'BarElement'
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
                .from('datos medidor')
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
                // Colores para las barras
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Historial de Consumo Mensual',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Consumo (m³)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Período',
                },
            },
        },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/images2.jpg")',
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
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
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
                        <Box sx={{ mt: 4, width: '100%' }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
                                Información del Medidor y Consumo
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Typography variant="body1">
                                    <strong>ID Medidor:</strong> {consumptionData.id_medidor}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Nombre Cliente:</strong> {consumptionData.nombre_cliente}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Dirección:</strong> {consumptionData.direccion}
                                </Typography>

                                {consumptionData.lecturas && consumptionData.lecturas.length > 0 ? (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Historial de Consumo:
                                        </Typography>
                                        <Box sx={{ my: 3 }}>
                                            {/* CAMBIAMOS Line por Bar */}
                                            <Bar data={chartData} options={chartOptions} />
                                        </Box>

                                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                                            Detalle de Lecturas:
                                        </Typography>
                                        {consumptionData.lecturas.map((lectura, index) => (
                                            <Box key={index} sx={{ mb: 2, borderBottom: '1px dashed #eee', pb: 1 }}>
                                                <Typography variant="body1">
                                                    <strong>Período:</strong> {lectura.mes}/{lectura.anio}
                                                </Typography>
                                                <Typography variant="body1">
                                                    <strong>Lectura Actual:</strong> {lectura.lectura_actual}
                                                </Typography>
                                                <Typography variant="body1">
                                                    <strong>Consumo:</strong> {lectura.consumo} m³
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Alert severity="info" sx={{ mt: 2 }}>No se encontraron lecturas para este medidor.</Alert>
                                )}
                            </Paper>
                        </Box>
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