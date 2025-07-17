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
    FormControl, // Para envolver TextField en el modal de edición
    InputLabel,
    OutlinedInput,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

import { supabase } from '../supabaseClient';

// Estilo para el contenido de los modales
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

function CustomerManagement() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);

    // Estados para el modal de historial
    const [openHistoryModal, setOpenHistoryModal] = useState(false);
    const [currentClientHistory, setCurrentClientHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // NUEVOS Estados para el modal de edición
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editingReading, setEditingReading] = useState(null); // Contiene la lectura que se está editando
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(false); // Para mostrar un mensaje de éxito

    // useEffect para cargar los clientes al montar el componente
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: supabaseError } = await supabase
                    .from('datos medidor')
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

    // useEffect para la lógica de búsqueda y filtrado
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

    // Función para ver el historial de lecturas de un cliente
    const handleViewHistory = async (clientId) => {
        setHistoryLoading(true);
        setHistoryError(null);
        setCurrentClientHistory(null);
        setOpenHistoryModal(true);

        try {
            const { data, error: supabaseError } = await supabase
                .from('datos medidor')
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

    // Función para cerrar el modal de historial
    const handleCloseHistoryModal = () => {
        setOpenHistoryModal(false);
        setCurrentClientHistory(null);
        setHistoryError(null);
    };

    // NUEVA Función para abrir el modal de edición
    const handleOpenEditModal = (lectura) => {
        setEditingReading({ ...lectura }); // Copia la lectura para evitar mutaciones directas
        setEditError(null);
        setEditSuccess(false);
        setOpenEditModal(true);
    };

    // NUEVA Función para cerrar el modal de edición
    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setEditingReading(null);
        setEditError(null);
        setEditSuccess(false);
    };

    // NUEVA Función para manejar cambios en los campos del modal de edición
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingReading(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0 // Asegura que sean números
        }));
    };

    // NUEVA Función para guardar la lectura editada
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
                    lectura: editingReading.lectura,
                    consumo: editingReading.consumo
                })
                .eq('id_lectura', editingReading.id_lectura);

            if (supabaseError) {
                throw supabaseError;
            }

            setEditSuccess(true);
            // Actualizar el historial en el modal principal (sin recargar todo el historial)
            setCurrentClientHistory(prev => {
                if (!prev) return null;
                const updatedLecturas = prev.lecturas.map(lectura =>
                    lectura.id_lectura === editingReading.id_lectura ? editingReading : lectura
                );
                return { ...prev, lecturas: updatedLecturas };
            });

            // Opcional: Cerrar el modal después de un breve tiempo o permitir que el usuario lo cierre
            setTimeout(() => {
                handleCloseEditModal();
            }, 1500); // Cierra después de 1.5 segundos

        } catch (err) {
            console.error('Error saving edited reading:', err);
            setEditError(`Error al guardar: ${err.message || 'Error desconocido'}`);
        } finally {
            setEditLoading(false);
        }
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
                            <Table aria-label="tabla de clientes">
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
                                                        aria-label="ver historial"
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

            {/* Modal para mostrar el historial de lecturas */}
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

                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Lecturas:
                                </Typography>
                                {currentClientHistory.lecturas && currentClientHistory.lecturas.length > 0 ? (
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Lectura</TableCell>
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
                                                                onClick={() => handleOpenEditModal(lectura)} // Llama a la nueva función
                                                                aria-label="editar lectura"
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

            {/* NUEVO Modal para editar una lectura específica */}
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
                                <TextField
                                    label="Lectura Actual"
                                    name="lectura"
                                    type="number"
                                    fullWidth
                                    value={editingReading.lectura}
                                    onChange={handleEditInputChange}
                                    variant="outlined"
                                />
                                <TextField
                                    label="Consumo (m³)"
                                    name="consumo"
                                    type="number"
                                    fullWidth
                                    value={editingReading.consumo}
                                    onChange={handleEditInputChange}
                                    variant="outlined"
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
