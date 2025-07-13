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
    Divider
} from '@mui/material';
import { supabase } from '../supabaseClient'; // Importa tu cliente de Supabase

// Importaciones de Chart.js y react-chartjs-2
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function ClientSearch() {
    const [clientId, setClientId] = useState(''); // Este será el id_medidor
    const [consumptionData, setConsumptionData] = useState(null); // Contendrá los datos del medidor y sus lecturas
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
                .from('datos medidor') // Corregido: sin espacio
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
                // Ordenar las lecturas por año y luego por mes para el gráfico
                const sortedLecturas = data[0].lecturas.sort((a, b) => {
                    if (a.anio === b.anio) {
                        return a.mes - b.mes;
                    }
                    return a.anio - b.anio;
                });
                setConsumptionData({ ...data[0], lecturas: sortedLecturas }); // Actualiza con lecturas ordenadas
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

    // Preparar los datos para el gráfico
    const chartData = {
        labels: consumptionData?.lecturas.map(l => `${l.mes}/${l.anio}`) || [],
        datasets: [
            {
                label: 'Consumo (m³)',
                data: consumptionData?.lecturas.map(l => l.consumo) || [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1, // Curva suave para la línea
                fill: true, // Rellena el área bajo la línea
            },
        ],
    };

    // Opciones del gráfico
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
        <Container maxWidth="md" sx={{ mt: { xs: 8, sm: 10 }, py: 4 }}>
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

                {/* Área de Visualización de Datos de Consumo */}
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

                            {/* Mostrar las lecturas y el gráfico si existen */}
                            {consumptionData.lecturas && consumptionData.lecturas.length > 0 ? (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Historial de Consumo:
                                    </Typography>
                                    {/* Gráfico de Consumo */}
                                    <Box sx={{ my: 3 }}>
                                        <Line data={chartData} options={chartOptions} />
                                    </Box>

                                    {/* Listado de Lecturas (opcional, puedes quitarlo si el gráfico es suficiente) */}
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

                {/* Mensajes de error si no hay datos de consumo pero hay un error */}
                {error && !consumptionData && !loading && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
                        {error}
                    </Alert>
                )}
            </Paper>
        </Container>
    );
}

export default ClientSearch;