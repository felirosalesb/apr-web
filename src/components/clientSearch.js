// src/components/ClientSearch.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    CssBaseline,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    InputAdornment,
    IconButton,
    Modal,
    Fade,
    Backdrop,
    List, ListItem, ListItemText,
    Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt'; // Icono para la boleta
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icono para ver historial

import { supabase } from '../supabaseClient';

// Importaciones de Chart.js y react-chartjs-2 para gráficos
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

// Registrar componentes necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Estilo para el contenido del modal (reutilizado de CustomerManagement)
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600, md: 700 }, // Ancho responsivo
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '90vh',
    overflowY: 'auto'
};

function ClientSearch() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false); // Inicia en false, carga al buscar
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searched, setSearched] = useState(false); // Para indicar si se ha realizado una búsqueda

    // Estados para el modal de la boleta
    const [openBillModal, setOpenBillModal] = useState(false);
    const [currentBillDetails, setCurrentBillDetails] = useState(null);

    // Estados para el modal de historial de lecturas (con gráfico)
    const [openHistoryModal, setOpenHistoryModal] = useState(false);
    const [currentClientHistory, setCurrentClientHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);


    // Función para generar una boleta
    // Esta función buscará la última lectura para el ID de cliente y luego calculará la boleta.
    const handleGenerateBill = async (clientId, clientInfo) => {
        setLoading(true); // Usar el loading principal para la generación de boleta también
        setError(null);
        setCurrentBillDetails(null);

        try {
            // Obtener la última lectura para el ID de cliente dado
            const { data: lecturasData, error: lecturasError } = await supabase
                .from('lecturas')
                .select('mes, anio, lectura, consumo')
                .eq('id_medidor', clientId)
                .order('anio', { ascending: false })
                .order('mes', { ascending: false })
                .limit(1); // Obtener solo la última lectura

            if (lecturasError) throw lecturasError;

            if (lecturasData && lecturasData.length > 0) {
                const latestLectura = lecturasData[0];
                const cargoFijo = 3550; // $3.550 CLP
                const valorPorM3 = 550; // $550 CLP por m3 de consumo

                const consumo = latestLectura.consumo || 0;
                const cargoConsumo = consumo * valorPorM3;
                const total = cargoFijo + cargoConsumo;

                setCurrentBillDetails({
                    clientInfo: clientInfo,
                    lectura: latestLectura,
                    cargoFijo: cargoFijo,
                    cargoConsumo: cargoConsumo,
                    total: total
                });
                setOpenBillModal(true);
            } else {
                setError('No se encontraron lecturas para este cliente.');
            }
        } catch (err) {
            console.error('Error al generar boleta:', err.message);
            setError(`Error al generar la boleta: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Función para cerrar el modal de la boleta
    const handleCloseBillModal = () => {
        setOpenBillModal(false);
        setCurrentBillDetails(null);
    };

    // Función para ver el historial de lecturas (con gráfico)
    const handleViewHistory = async (clientId) => {
        setHistoryLoading(true);
        setHistoryError(null);
        setCurrentClientHistory(null);
        setOpenHistoryModal(true); // Abrir el modal de historial

        try {
            const { data, error: supabaseError } = await supabase
                .from('datos_medidor')
                .select(`
                    id_medidor,
                    nombre_cliente,
                    direccion,
                    sector,
                    lecturas (
                        id_lectura,
                        mes,
                        anio,
                        lectura,
                        consumo
                    )
                `)
                .eq('id_medidor', clientId)
                .single();

            if (supabaseError) {
                throw supabaseError;
            }

            if (data) {
                // Ordenar las lecturas por año y mes para el gráfico
                const sortedLecturas = data.lecturas.sort((a, b) => {
                    if (a.anio === b.anio) {
                        return a.mes - b.mes;
                    }
                    return a.anio - b.anio;
                });
                setCurrentClientHistory({ ...data, lecturas: sortedLecturas });
            } else {
                setHistoryError('No se encontró información para este cliente.');
            }

        } catch (err) {
            console.error('Error fetching client history:', err);
            setHistoryError(`Error al cargar el historial: ${err.message || 'Error desconocido'}`);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Función para cerrar el modal de historial
    const handleCloseHistoryModal = () => {
        setOpenHistoryModal(false);
        setCurrentClientHistory(null);
        setHistoryError(null);
    };


    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setClients([]); // Limpiar resultados anteriores
        setSearched(true); // Marcar que se ha intentado una búsqueda

        if (searchTerm.trim() === '') {
            setError('Por favor, introduce el ID del medidor para buscar.');
            setLoading(false);
            return;
        }

        // Asegurarse de que el término de búsqueda sea un número para el ID
        const clientId = parseInt(searchTerm, 10);
        if (isNaN(clientId)) {
            setError('Por favor, introduce un ID de medidor válido (solo números).');
            setLoading(false);
            return;
        }

        try {
            const { data, error: supabaseError } = await supabase
                .from('datos_medidor')
                .select('id_medidor, nombre_cliente, direccion, sector')
                .eq('id_medidor', clientId); // Buscar SOLO por id_medidor

            if (supabaseError) {
                throw supabaseError;
            }

            setClients(data);
        } catch (err) {
            console.error('Error fetching clients:', err.message);
            setError('Error al buscar clientes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setClients([]); // Limpiar resultados al borrar la búsqueda
        setSearched(false); // Reiniciar el estado de búsqueda
        setError(null);
    };

    // Definir valorPorM3 aquí para que sea accesible en el JSX del modal
    const valorPorM3 = 550;

    // Datos y opciones para el gráfico de historial de consumo (Bar Chart)
    const historyChartData = {
        labels: currentClientHistory?.lecturas.map(l => `${l.mes}/${l.anio}`) || [],
        datasets: [
            {
                label: 'Consumo (m³)',
                data: currentClientHistory?.lecturas.map(l => l.consumo) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Color para las barras
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1, // Ancho del borde para las barras
            },
        ],
    };

    // Opciones para el gráfico de historial
    const historyChartOptions = {
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
                    <Typography component="h1" variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
                        Búsqueda de Clientes
                    </Typography>

                    <Box sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
                        <TextField
                            label="Buscar por ID de Medidor" // Etiqueta actualizada
                            type="number" // Para asegurar que solo se ingresen números
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClearSearch} edge="end">
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleSearch}
                            disabled={loading}
                            sx={{ mt: 2, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
                        </Button>
                    </Box>

                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}

                    {searched && !loading && !error && clients.length === 0 && (
                        <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
                            No se encontraron clientes con el ID de medidor proporcionado.
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <CircularProgress />
                        </Box>
                    ) : clients.length > 0 && (
                        <TableContainer component={Paper} sx={{ mt: 3, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <Table aria-label="client search results table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>ID Medidor</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Nombre Cliente</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Dirección</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell> {/* Nueva columna para acciones */}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.id_medidor}>
                                            <TableCell>{client.id_medidor}</TableCell>
                                            <TableCell>{client.nombre_cliente}</TableCell>
                                            <TableCell>{client.direccion}</TableCell>
                                            <TableCell>{client.sector}</TableCell>
                                            <TableCell align="right">
                                                {/* Botón para generar boleta */}
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleGenerateBill(client.id_medidor, {
                                                        id_medidor: client.id_medidor,
                                                        nombre_cliente: client.nombre_cliente,
                                                        direccion: client.direccion,
                                                        sector: client.sector
                                                    })}
                                                    aria-label="generate bill"
                                                    sx={{ mr: 1 }} // Margen para separar los botones
                                                >
                                                    <ReceiptIcon />
                                                </IconButton>
                                                {/* Botón para ver historial (con gráfico) */}
                                                <IconButton
                                                    color="info" // Un color diferente para el historial
                                                    onClick={() => handleViewHistory(client.id_medidor)}
                                                    aria-label="view history"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>

            {/* Modal para la Generación de Boleta */}
            <Modal
                aria-labelledby="bill-modal-title"
                aria-describedby="bill-modal-description"
                open={openBillModal}
                onClose={handleCloseBillModal}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={openBillModal}>
                    <Box sx={modalStyle}>
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseBillModal}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography id="bill-modal-title" variant="h5" component="h2" gutterBottom>
                            Boleta de Consumo
                        </Typography>

                        {currentBillDetails && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Información del Cliente:
                                </Typography>
                                <List dense>
                                    <ListItem><ListItemText primary={`ID Medidor: ${currentBillDetails.clientInfo.id_medidor}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Nombre: ${currentBillDetails.clientInfo.nombre_cliente}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Dirección: ${currentBillDetails.clientInfo.direccion}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Sector: ${currentBillDetails.clientInfo.sector}`} /></ListItem>
                                </List>
                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Detalles de la Lectura:
                                </Typography>
                                <List dense>
                                    <ListItem><ListItemText primary={`Período: ${currentBillDetails.lectura.mes}/${currentBillDetails.lectura.anio}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Lectura Actual: ${currentBillDetails.lectura.lectura}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Consumo: ${currentBillDetails.lectura.consumo} m³`} /></ListItem>
                                </List>
                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Desglose de Cargos:
                                </Typography>
                                <List dense>
                                    <ListItem><ListItemText primary={`Cargo Fijo: $${currentBillDetails.cargoFijo.toLocaleString('es-CL')} CLP`} /></ListItem>
                                    <ListItem><ListItemText primary={`Cargo Consumo (${currentBillDetails.lectura.consumo} m³ @ $${valorPorM3.toLocaleString('es-CL')}): $${currentBillDetails.cargoConsumo.toLocaleString('es-CL')} CLP`} /></ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary={<Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2 }}>Total: ${currentBillDetails.total.toLocaleString('es-CL')} CLP</Typography>}
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button variant="contained" onClick={handleCloseBillModal}>
                                Cerrar
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            {/* Modal para el Historial de Lecturas (con Gráfico) */}
            <Modal
                aria-labelledby="history-modal-title"
                aria-describedby="history-modal-description"
                open={openHistoryModal}
                onClose={handleCloseHistoryModal}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={openHistoryModal}>
                    <Box sx={modalStyle}>
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseHistoryModal}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography id="history-modal-title" variant="h5" component="h2" gutterBottom>
                            Historial de Lecturas
                        </Typography>

                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                <CircularProgress />
                            </Box>
                        ) : historyError ? (
                            <Alert severity="error" sx={{ mt: 2 }}>{historyError}</Alert>
                        ) : currentClientHistory ? (
                            <Box>
                                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                    Información del Cliente:
                                </Typography>
                                <List dense>
                                    <ListItem><ListItemText primary={`ID Medidor: ${currentClientHistory.id_medidor}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Nombre: ${currentClientHistory.nombre_cliente}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Dirección: ${currentClientHistory.direccion}`} /></ListItem>
                                    <ListItem><ListItemText primary={`Sector: ${currentClientHistory.sector}`} /></ListItem>
                                </List>
                                <Divider sx={{ my: 2 }} />

                                {/* Gráfico de Consumo en Historial */}
                                {currentClientHistory.lecturas && currentClientHistory.lecturas.length > 0 && (
                                    <Box sx={{ my: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Gráfico de Consumo:
                                        </Typography>
                                        <Bar data={historyChartData} options={historyChartOptions} />
                                    </Box>
                                )}
                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Lecturas:
                                </Typography>
                                {currentClientHistory.lecturas && currentClientHistory.lecturas.length > 0 ? (
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Lectura Actual</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Consumo (m³)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {currentClientHistory.lecturas.map((lectura) => (
                                                    <TableRow key={lectura.id_lectura}>
                                                        <TableCell>{lectura.mes}/{lectura.anio}</TableCell>
                                                        <TableCell>{lectura.lectura}</TableCell>
                                                        <TableCell>{lectura.consumo}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Alert severity="info" sx={{ mt: 2 }}>No se encontraron lecturas para este cliente.</Alert>
                                )}
                            </Box>
                        ) : (
                            <Typography>Selecciona un cliente para ver su historial.</Typography>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
}

export default ClientSearch;
