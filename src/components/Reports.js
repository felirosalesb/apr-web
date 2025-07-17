// src/components/Reports.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    CssBaseline,
    Button,
    CircularProgress,
    Alert,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Modal, Fade, Backdrop,
    Divider
    , List, ListItem, ListItemText, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../supabaseClient';

// Importaciones de Chart.js y react-chartjs-2 para gráficos
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import * as XLSX from 'xlsx';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Estilo para el contenido del modal
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


function Reports() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);

    // Estados para los parámetros del informe
    const [reportType, setReportType] = useState(''); // 'individual', 'sector'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const predefinedSectors = ["La red", "El Paico", "El tranque"];
    const [sectors, setSectors] = useState(predefinedSectors);

    // Estados para el informe inicial (consumo por sectores)
    const [initialSectorReport, setInitialSectorReport] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [initialError, setInitialError] = useState(null);

    // NUEVOS Estados para el modal de exportación Excel
    const [openExcelModal, setOpenExcelModal] = useState(false);
    const [excelExportFilter, setExcelExportFilter] = useState(''); // 'all', 'sector', 'date'
    const [excelSelectedSector, setExcelSelectedSector] = useState('');
    const [excelStartDate, setExcelStartDate] = useState('');
    const [excelEndDate, setExcelEndDate] = useState('');
    const [excelLoading, setExcelLoading] = useState(false);
    const [excelError, setExcelError] = useState(null);


    // Efecto para cargar el informe inicial por sectores
    useEffect(() => {
        const fetchData = async () => {
            setInitialLoading(true);
            setInitialError(null);
            try {
                const { data: consumptionData, error: consumptionError } = await supabase
                    .from('datos_medidor')
                    .select(`
                        sector,
                        lecturas (
                            consumo
                        )
                    `);

                if (consumptionError) throw consumptionError;

                const consumptionBySector = {};
                consumptionData.forEach(client => {
                    const sector = client.sector;
                    if (predefinedSectors.includes(sector)) {
                        const totalConsumoCliente = client.lecturas.reduce((sum, lectura) => sum + lectura.consumo, 0);
                        consumptionBySector[sector] = (consumptionBySector[sector] || 0) + totalConsumoCliente;
                    }
                });

                const processedData = Object.entries(consumptionBySector).map(([sector, consumo]) => ({
                    sector,
                    consumo: parseFloat(consumo.toFixed(2))
                })).sort((a, b) => b.consumo - a.consumo);

                setInitialSectorReport({
                    title: 'Consumo Total por Sector',
                    summary: 'Resumen del consumo agregado por cada sector.',
                    details: processedData,
                });

            } catch (err) {
                console.error("Error fetching initial report data:", err.message);
                setInitialError("Error al cargar el informe inicial de sectores.");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    // Lógica para generar un informe (cuando el usuario lo solicita)
    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);

        if (!startDate || !endDate) {
            setError('Por favor, selecciona un rango de fechas.');
            setLoading(false);
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
            setLoading(false);
            return;
        }

        try {
            let data;
            let supabaseError;

            if (reportType === 'individual') {
                if (!selectedClientId) {
                    setError('Por favor, introduce el ID del cliente.');
                    setLoading(false);
                    return;
                }
                ({ data, error: supabaseError } = await supabase
                    .from('lecturas')
                    .select('id_lectura, mes, anio, lectura, consumo, datos_medidor (id_medidor, nombre_cliente, direccion, sector)')
                    .eq('id_medidor', selectedClientId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .order('anio', { ascending: true })
                    .order('mes', { ascending: true }));

                if (supabaseError) throw supabaseError;

                if (data && data.length > 0) {
                    const clientInfo = data[0].datos_medidor;
                    setReportData({
                        type: 'individual',
                        title: `Informe de Consumo para ${clientInfo.nombre_cliente} (ID: ${clientInfo.id_medidor})`,
                        range: `${startDate} al ${endDate}`,
                        details: data,
                        clientInfo: clientInfo,
                    });
                } else {
                    setReportData({
                        type: 'individual',
                        title: `Informe de Consumo para ID: ${selectedClientId}`,
                        range: `${startDate} al ${endDate}`,
                        summary: 'No se encontraron lecturas para este cliente en el período seleccionado.',
                        details: [],
                    });
                }

            } else if (reportType === 'sector') {
                if (!selectedSector) {
                    setError('Por favor, selecciona un sector.');
                    setLoading(false);
                    return;
                }
                const { data: lecturasData, error: lecturasError } = await supabase
                    .from('lecturas')
                    .select(`
                        mes,
                        anio,
                        consumo,
                        datos_medidor (id_medidor, sector)
                    `)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);

                if (lecturasError) throw lecturasError;

                const filteredBySector = lecturasData.filter(l => l.datos_medidor?.sector === selectedSector);

                const aggregatedConsumption = {};
                filteredBySector.forEach(l => {
                    const period = `${l.mes}/${l.anio}`;
                    aggregatedConsumption[period] = (aggregatedConsumption[period] || 0) + l.consumo;
                });

                const processedSectorData = Object.entries(aggregatedConsumption).map(([period, consumo]) => {
                    const [mes, anio] = period.split('/').map(Number);
                    return { mes, anio, consumo: parseFloat(consumo.toFixed(2)), period };
                }).sort((a, b) => {
                    if (a.anio === b.anio) return a.mes - b.mes;
                    return a.anio - b.anio;
                });

                setReportData({
                    type: 'sector',
                    title: `Informe de Consumo por Sector: ${selectedSector}`,
                    range: `${startDate} al ${endDate}`,
                    summary: `Consumo total en ${selectedSector}: ${processedSectorData.reduce((sum, item) => sum + item.consumo, 0).toFixed(2)} m³`,
                    details: processedSectorData,
                    sectorName: selectedSector,
                });

            } else {
                setError('Por favor, selecciona un tipo de informe.');
                setLoading(false);
                return;
            }

        } catch (err) {
            console.error('Error al generar informe:', err.message);
            setError(`Error al generar el informe: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Datos y opciones para el gráfico de consumo individual (Bar Chart)
    const individualChartData = reportData && reportData.type === 'individual' && reportData.details.length > 0 ? {
        labels: reportData.details.map(d => `${d.mes}/${d.anio}`),
        datasets: [
            {
                label: 'Consumo (m³)',
                data: reportData.details.map(d => d.consumo),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    } : null;

    const individualChartOptions = {
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

    // Datos y opciones para el gráfico de torta de consumo por sectores (Pie Chart)
    const pieChartData = initialSectorReport && initialSectorReport.details.length > 0 ? {
        labels: initialSectorReport.details.map(d => d.sector),
        datasets: [
            {
                label: 'Consumo Total (m³)',
                data: initialSectorReport.details.map(d => d.consumo),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                ],
                borderWidth: 1,
            },
        ],
    } : null;

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Consumo Total de Agua por Sector',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed + ' m³';
                        }
                        return label;
                    }
                }
            }
        },
    };

    // Datos y opciones para el gráfico de consumo por sector (Bar Chart)
    const sectorChartData = reportData && reportData.type === 'sector' && reportData.details.length > 0 ? {
        labels: reportData.details.map(d => d.period),
        datasets: [
            {
                label: `Consumo en ${reportData.sectorName} (m³)`,
                data: reportData.details.map(d => d.consumo),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            },
        ],
    } : null;

    const sectorChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Consumo Mensual en ${reportData?.sectorName || 'el Sector'}`,
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


    // Funciones para el modal de exportación Excel
    const handleOpenExcelModal = () => {
        setOpenExcelModal(true);
        setExcelExportFilter('');
        setExcelSelectedSector('');
        setExcelStartDate('');
        setExcelEndDate('');
        setExcelError(null);
    };

    const handleCloseExcelModal = () => {
        setOpenExcelModal(false);
    };

    const handleExportExcel = async () => {
        setExcelLoading(true);
        setExcelError(null);

        let dataToFetch = supabase.from('lecturas').select(`
            id_lectura,
            mes,
            anio,
            lectura,
            datos_medidor (id_medidor, nombre_cliente, direccion, sector)
        `);

        try {
            if (excelExportFilter === 'all') {
                // No se añade filtro adicional a la consulta base
            } else if (excelExportFilter === 'sector') {
                if (!excelSelectedSector) {
                    setExcelError('Por favor, selecciona un sector.');
                    setExcelLoading(false);
                    return;
                }
                dataToFetch = dataToFetch.eq('datos_medidor.sector', excelSelectedSector);

            } else if (excelExportFilter === 'date') {
                if (!excelStartDate || !excelEndDate) {
                    setExcelError('Por favor, selecciona un rango de fechas.');
                    setExcelLoading(false);
                    return;
                }
                if (new Date(excelStartDate) > new Date(excelEndDate)) {
                    setExcelError('La fecha de inicio no puede ser posterior a la fecha de fin.');
                    setExcelLoading(false);
                    return;
                }
                dataToFetch = dataToFetch.gte('created_at', excelStartDate).lte('created_at', excelEndDate);

            } else {
                setExcelError('Por favor, selecciona un filtro de exportación.');
                setExcelLoading(false);
                return;
            }

            const { data, error: supabaseError } = await dataToFetch;

            if (supabaseError) throw supabaseError;

            let dataToExport = data;

            if (dataToExport.length === 0) {
                setExcelError('No se encontraron datos para los filtros seleccionados.');
                setExcelLoading(false);
                return;
            }

            // Ordenar los datos en el lado del cliente
            dataToExport.sort((a, b) => {
                // Manejar casos donde datos_medidor es null
                const idA = a.datos_medidor?.id_medidor ?? Infinity; // Pone nulls al final
                const idB = b.datos_medidor?.id_medidor ?? Infinity; // Pone nulls al final

                if (idA !== idB) {
                    return idA - idB;
                }
                // Luego por Anio
                if (a.anio !== b.anio) {
                    return a.anio - b.anio;
                }
                // Luego por Mes
                return a.mes - b.mes;
            });

            // Formatear los datos en el orden especificado para Excel
            const formattedData = dataToExport.map(item => ({
                'Id_medidor': item.datos_medidor?.id_medidor || '', // Usar cadena vacía si es null
                'Nombre Cliente': item.datos_medidor?.nombre_cliente || '',
                'Sector': item.datos_medidor?.sector || '',
                'Dirección': item.datos_medidor?.direccion || '',
                'Lectura': item.lectura,
                'Mes': item.mes,
                'Anio': item.anio
            }));

            // Crear la hoja de cálculo
            const ws = XLSX.utils.json_to_sheet(formattedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Lecturas_Consumo");

            // Generar y descargar el archivo Excel
            const excelFileName = `informe_lecturas_${excelExportFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, excelFileName);

        } catch (err) {
            console.error("Error al exportar Excel:", err);
            setExcelError("Error al exportar Excel: " + err.message);
        } finally {
            setExcelLoading(false);
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
                        Generación de Informes
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                        Selecciona el tipo de informe y los parámetros para generar estadísticas.
                    </Typography>

                    {/* Sección de Informe Inicial (Consumo por Sectores) */}
                    <Paper elevation={1} sx={{ p: 3, mt: 2, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" gutterBottom align="center">
                            Consumo General por Sectores
                        </Typography>
                        {initialLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                <CircularProgress />
                            </Box>
                        ) : initialError ? (
                            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{initialError}</Alert>
                        ) : initialSectorReport && initialSectorReport.details.length > 0 ? (
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Pie data={pieChartData} options={pieChartOptions} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Detalles por Sector:
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ mt: 1 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Sector</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Consumo (m³)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {initialSectorReport.details.map((row) => (
                                                    <TableRow key={row.sector}>
                                                        <TableCell>{row.sector}</TableCell>
                                                        <TableCell align="right">{row.consumo}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        ) : (
                            <Alert severity="info">No se encontraron datos de consumo por sector.</Alert>
                        )}
                    </Paper>

                    <Divider sx={{ my: 4, width: '100%' }} />

                    {/* Sección de Generación de Informes Personalizados */}
                    <Typography component="h2" variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                        Generar Informe Personalizado
                    </Typography>
                    <Grid container spacing={2} sx={{ width: '100%', maxWidth: 700, mb: 4 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="report-type-label">Tipo de Informe</InputLabel>
                                <Select
                                    labelId="report-type-label"
                                    id="report-type-select"
                                    value={reportType}
                                    label="Tipo de Informe"
                                    onChange={(e) => {
                                        setReportType(e.target.value);
                                        setReportData(null); // Limpiar informe al cambiar tipo
                                        setError(null);
                                    }}
                                >
                                    <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                    <MenuItem value="individual">Consumo por Individuo</MenuItem>
                                    <MenuItem value="sector">Consumo por Sector</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Campos condicionales según el tipo de informe */}
                        {reportType === 'individual' && (
                            <Grid item xs={12}>
                                <TextField
                                    label="ID de Cliente"
                                    type="number"
                                    fullWidth
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    placeholder="Ej: 123"
                                />
                            </Grid>
                        )}

                        {reportType === 'sector' && (
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel id="sector-select-label">Sector</InputLabel>
                                    <Select
                                        labelId="sector-select-label"
                                        id="sector-select"
                                        value={selectedSector}
                                        label="Sector"
                                        onChange={(e) => setSelectedSector(e.target.value)}
                                    >
                                        <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                        {sectors.map((sectorName) => (
                                            <MenuItem key={sectorName} value={sectorName}>{sectorName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha de Inicio"
                                type="date"
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha de Fin"
                                type="date"
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleGenerateReport}
                                disabled={loading || !reportType || !startDate || !endDate || (reportType === 'individual' && !selectedClientId) || (reportType === 'sector' && !selectedSector)}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar Informe'}
                            </Button>
                        </Grid>
                    </Grid>

                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}

                    {reportData && (
                        <Paper elevation={1} sx={{ p: 3, mt: 3, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            <Typography variant="h6" gutterBottom>
                                {reportData.title}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Período: {reportData.range}
                            </Typography>

                            {reportData.summary && (
                                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Resumen: {reportData.summary}
                                </Typography>
                            )}

                            {/* Display individual report details */}
                            {reportData.type === 'individual' && reportData.details && reportData.details.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Información del Cliente:
                                    </Typography>
                                    <List dense sx={{ mb: 2 }}>
                                        <ListItem><ListItemText primary={`ID Medidor: ${reportData.clientInfo.id_medidor}`} /></ListItem>
                                        <ListItem><ListItemText primary={`Nombre: ${reportData.clientInfo.nombre_cliente}`} /></ListItem>
                                        <ListItem><ListItemText primary={`Dirección: ${reportData.clientInfo.direccion}`} /></ListItem>
                                        <ListItem><ListItemText primary={`Sector: ${reportData.clientInfo.sector}`} /></ListItem>
                                    </List>
                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" gutterBottom>
                                        Detalles de Lecturas:
                                    </Typography>
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
                                                {reportData.details.map((lectura) => (
                                                    <TableRow key={lectura.id_lectura}>
                                                        <TableCell>{lectura.mes}/{lectura.anio}</TableCell>
                                                        <TableCell>{lectura.lectura}</TableCell>
                                                        <TableCell>{lectura.consumo}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Individual Consumption Chart */}
                                    <Box sx={{ my: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Gráfico de Consumo:
                                        </Typography>
                                        <Bar data={individualChartData} options={individualChartOptions} />
                                    </Box>
                                </Box>
                            )}

                            {/* Display sector report details */}
                            {reportData.type === 'sector' && reportData.details && reportData.details.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Detalles de Consumo por Período en {reportData.sectorName}:
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Consumo (m³)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportData.details.map((item) => (
                                                    <TableRow key={item.period}>
                                                        <TableCell>{item.period}</TableCell>
                                                        <TableCell align="right">{item.consumo}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Sector Consumption Chart */}
                                    <Box sx={{ my: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Gráfico de Consumo Mensual por Sector:
                                        </Typography>
                                        <Bar data={sectorChartData} options={sectorChartOptions} />
                                    </Box>
                                </Box>
                            )}
                            {reportData.type === 'sector' && reportData.details.length === 0 && (
                                <Alert severity="info">No se encontraron lecturas para este sector en el período seleccionado.</Alert>
                            )}

                        </Paper>
                    )}

                    <Divider sx={{ my: 4, width: '100%' }} />

                    {/* Excel Export Section */}
                    <Typography component="h2" variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                        Exportar Informes a Excel
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleOpenExcelModal}
                        sx={{ py: 1.5, px: 4 }}
                    >
                        Exportar Informe (Excel)
                    </Button>

                    {/* Excel Export Modal */}
                    <Modal
                        aria-labelledby="excel-export-modal-title"
                        aria-describedby="excel-export-modal-description"
                        open={openExcelModal}
                        onClose={handleCloseExcelModal}
                        closeAfterTransition
                        slots={{ backdrop: Backdrop }}
                        slotProps={{
                            backdrop: {
                                timeout: 500,
                            },
                        }}
                    >
                        <Fade in={openExcelModal}>
                            <Box sx={modalStyle}>
                                <IconButton
                                    aria-label="close"
                                    onClick={handleCloseExcelModal}
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        top: 8,
                                        color: (theme) => theme.palette.grey[500],
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography id="excel-export-modal-title" variant="h5" component="h2" gutterBottom>
                                    Opciones de Exportación Excel
                                </Typography>

                                <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                                    <InputLabel id="excel-filter-label">Exportar por:</InputLabel>
                                    <Select
                                        labelId="excel-filter-label"
                                        id="excel-filter-select"
                                        value={excelExportFilter}
                                        label="Exportar por:"
                                        onChange={(e) => {
                                            setExcelExportFilter(e.target.value);
                                            setExcelSelectedSector('');
                                            setExcelStartDate('');
                                            setExcelEndDate('');
                                            setExcelError(null);
                                        }}
                                    >
                                        <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                        <MenuItem value="all">Todos los Clientes</MenuItem>
                                        <MenuItem value="sector">Por Sector</MenuItem>
                                        <MenuItem value="date">Por Rango de Fechas</MenuItem>
                                    </Select>
                                </FormControl>

                                {excelExportFilter === 'sector' && (
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel id="excel-sector-label">Sector a Exportar</InputLabel>
                                        <Select
                                            labelId="excel-sector-label"
                                            id="excel-sector-select"
                                            value={excelSelectedSector}
                                            label="Sector a Exportar"
                                            onChange={(e) => setExcelSelectedSector(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Seleccionar</em></MenuItem>
                                            {sectors.map((sectorName) => (
                                                <MenuItem key={sectorName} value={sectorName}>{sectorName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {excelExportFilter === 'date' && (
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Fecha de Inicio"
                                                type="date"
                                                fullWidth
                                                value={excelStartDate}
                                                onChange={(e) => setExcelStartDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Fecha de Fin"
                                                type="date"
                                                fullWidth
                                                value={excelEndDate}
                                                onChange={(e) => setExcelEndDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                )}

                                {excelError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{excelError}</Alert>}
                                {excelLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}

                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleExportExcel}
                                    disabled={excelLoading || !excelExportFilter || (excelExportFilter === 'sector' && !excelSelectedSector) || (excelExportFilter === 'date' && (!excelStartDate || !excelEndDate))}
                                    sx={{ mt: 3, py: 1.5 }}
                                >
                                    Generar Excel
                                </Button>
                            </Box>
                        </Fade>
                    </Modal>

                </Paper>
            </Container>
        </Box>
    );
}

export default Reports;
