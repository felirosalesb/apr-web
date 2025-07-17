// src/components/CustomerManagement.js
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
    Divider,
    FormControl,
    InputLabel,
    OutlinedInput,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

import { supabase } from '../supabaseClient';

// Chart.js and react-chartjs-2 imports for charts
import { Bar } from 'react-chartjs-2'; // Changed from Line to Bar
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement, // Changed from PointElement and LineElement to BarElement
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement, // Changed from PointElement and LineElement to BarElement
    Title,
    Tooltip,
    Legend
);

// Style for modal content
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600, md: 700 }, // Responsive width
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '90vh',
    overflowY: 'auto'
};

function CustomerManagement() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);

    // States for history modal
    const [openHistoryModal, setOpenHistoryModal] = useState(false);
    const [currentClientHistory, setCurrentClientHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // States for edit modal
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editingReading, setEditingReading] = useState(null); // Contains the reading being edited
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(false); // To show a success message

    // useEffect to load clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: supabaseError } = await supabase
                    .from('datos_medidor')
                    .select('id_medidor, nombre_cliente, direccion, sector');

                if (supabaseError) {
                    throw supabaseError;
                }

                setClients(data);
                setFilteredClients(data);
            } catch (err) {
                console.error('Error fetching clients:', err.message);
                setError('Error al cargar la lista de clientes: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // useEffect for search and filter logic
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredClients(clients);
        } else {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const results = clients.filter(client =>
                client.id_medidor.toString().includes(lowerCaseSearchTerm) ||
                client.nombre_cliente.toLowerCase().includes(lowerCaseSearchTerm) ||
                client.direccion.toLowerCase().includes(lowerCaseSearchTerm) ||
                (client.sector && client.sector.toLowerCase().includes(lowerCaseSearchTerm))
            );
            setFilteredClients(results);
        }
    }, [searchTerm, clients]);

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // Function to view client reading history
    const handleViewHistory = async (clientId) => {
        setHistoryLoading(true);
        setHistoryError(null);
        setCurrentClientHistory(null);
        setOpenHistoryModal(true);

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

    // Function to close history modal
    const handleCloseHistoryModal = () => {
        setOpenHistoryModal(false);
        setCurrentClientHistory(null);
        setHistoryError(null);
    };

    // Function to open edit modal
    const handleOpenEditModal = (lectura) => {
        setEditingReading({ ...lectura }); // Copy reading to avoid direct mutations
        setEditError(null);
        setEditSuccess(false);
        setOpenEditModal(true);
    };

    // Function to close edit modal
    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setEditingReading(null);
        setEditError(null);
        setEditSuccess(false);
    };

    // Function to handle changes in edit modal fields
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        // Only allow editing of 'lectura_actual' field
        if (name === 'lectura') {
            setEditingReading(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0 // Ensure they are numbers
            }));
        }
    };

    // Function to save edited reading
    const handleSaveEditedReading = async () => {
        if (!editingReading || !editingReading.id_lectura) {
            setEditError('No hay lectura para guardar.');
            return;
        }

        setEditLoading(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            const { error: supabaseError } = await supabase
                .from('lecturas')
                .update({
                    // Only update lectura_actual
                    lectura: editingReading.lectura
                    // Consumption will be recalculated in the database if you have a trigger,
                    // or you would need to recalculate it here if not
                })
                .eq('id_lectura', editingReading.id_lectura);

            if (supabaseError) {
                throw supabaseError;
            }

            setEditSuccess(true);
            // Update history in the main modal (without reloading entire history)
            setCurrentClientHistory(prev => {
                if (!prev) return null;
                const updatedLecturas = prev.lecturas.map(lectura =>
                    lectura.id_lectura === editingReading.id_lectura ? editingReading : lectura
                );
                return { ...prev, lecturas: updatedLecturas };
            });

            // Optional: Close modal after a short time or allow user to close it
            setTimeout(() => {
                handleCloseEditModal();
            }, 1500); // Closes after 1.5 seconds

        } catch (err) {
            console.error('Error saving edited reading:', err);
            setEditError(`Error al guardar: ${err.message || 'Error desconocido'}`);
        } finally {
            setEditLoading(false);
        }
    };

    // Prepare data for history chart
    const historyChartData = {
        labels: currentClientHistory?.lecturas.map(l => `${l.mes}/${l.anio}`) || [],
        datasets: [
            {
                label: 'Consumo (m³)',
                data: currentClientHistory?.lecturas.map(l => l.consumo) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Color for bars
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1, // Border width for bars
            },
        ],
    };

    // Options for history chart
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
                        Gestión de Clientes
                    </Typography>

                    <Box sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
                        <TextField
                            label="Buscar por ID, Nombre, Dirección o Sector"
                            variant="outlined"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 3, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <Table aria-label="client table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>ID Medidor</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Nombre Cliente</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Dirección</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => (
                                            <TableRow key={client.id_medidor}>
                                                <TableCell>{client.id_medidor}</TableCell>
                                                <TableCell>{client.nombre_cliente}</TableCell>
                                                <TableCell>{client.direccion}</TableCell>
                                                <TableCell>{client.sector}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleViewHistory(client.id_medidor)}
                                                        aria-label="view history"
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                No se encontraron clientes.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>

            {/* Modal to display reading history */}
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
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
                        <Typography id="transition-modal-title" variant="h5" component="h2" gutterBottom>
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

                                {/* Consumption Chart in History */}
                                {currentClientHistory.lecturas && currentClientHistory.lecturas.length > 0 && (
                                    <Box sx={{ my: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Gráfico de Consumo:
                                        </Typography>
                                        <Bar data={historyChartData} options={historyChartOptions} /> {/* Changed to Bar */}
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
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {currentClientHistory.lecturas.map((lectura) => (
                                                    <TableRow key={lectura.id_lectura}>
                                                        <TableCell>{lectura.mes}/{lectura.anio}</TableCell>
                                                        <TableCell>{lectura.lectura}</TableCell>
                                                        <TableCell>{lectura.consumo}</TableCell>
                                                        <TableCell align="right">
                                                            <IconButton
                                                                color="secondary"
                                                                onClick={() => handleOpenEditModal(lectura)}
                                                                aria-label="edit reading"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </TableCell>
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

            {/* Modal to edit a specific reading */}
            <Modal
                aria-labelledby="edit-reading-modal-title"
                aria-describedby="edit-reading-modal-description"
                open={openEditModal}
                onClose={handleCloseEditModal}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={openEditModal}>
                    <Box sx={modalStyle}>
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseEditModal}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography id="edit-reading-modal-title" variant="h5" component="h2" gutterBottom>
                            Editar Lectura
                        </Typography>

                        {editLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
                                <CircularProgress />
                            </Box>
                        ) : editError ? (
                            <Alert severity="error" sx={{ mt: 2 }}>{editError}</Alert>
                        ) : editSuccess ? (
                            <Alert severity="success" sx={{ mt: 2 }}>Lectura actualizada correctamente.</Alert>
                        ) : editingReading && (
                            <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="subtitle1">
                                    Período: {editingReading.mes}/{editingReading.anio} (ID: {editingReading.id_lectura})
                                </Typography>
                                {/* Current Reading (editable) */}
                                <TextField
                                    label="Lectura"
                                    name="lectura"
                                    type="number"
                                    fullWidth
                                    value={editingReading.lectura}
                                    onChange={handleEditInputChange} // Allows changes only in 'lectura_actual'
                                    variant="outlined"
                                />
                                {/* Consumption (for display only, not editable) */}
                                <TextField
                                    label="Consumo (m³)"
                                    name="consumo"
                                    type="number"
                                    fullWidth
                                    value={editingReading.consumo}
                                    variant="outlined"
                                    InputProps={{
                                        readOnly: true, // Make this field read-only
                                    }}
                                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)' } }} // Ensures text doesn't look gray
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCloseEditModal}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveEditedReading}
                                        disabled={editLoading}
                                    >
                                        Guardar Cambios
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
}

export default CustomerManagement;
