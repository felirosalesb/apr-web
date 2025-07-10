// src/components/SectorConsumption.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid,
    Card, CardContent, List, ListItem, ListItemText, Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

function SectorConsumption() {
    const [sectorData, setSectorData] = useState({}); // Almacenará datos agrupados por sector
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSectorConsumptions = async () => {
        setLoading(true);
        setError(null);
        setSectorData({});

        try {
            // 1. Obtener todas las lecturas (id_medidor, mes, anio, consumo)
            const { data: lecturas, error: lecturasError } = await supabase
                .from('lecturas')
                .select('id_medidor, mes, anio, consumo'); // <-- Traemos 'consumo' y 'mes', 'anio' de la DB

            if (lecturasError) {
                throw lecturasError;
            }

            // 2. Obtener los datos de los medidores (para el sector)
            const { data: medidores, error: medidoresError } = await supabase
                .from('datos medidor')
                .select('id_medidor, sector'); // <-- Necesitamos el 'sector'

            if (medidoresError) {
                throw medidoresError;
            }

            // Crear un mapa de id_medidor a sector para fácil acceso
            const medidorSectorMap = new Map();
            medidores.forEach(m => {
                medidorSectorMap.set(m.id_medidor, m.sector);
            });

            // Agrupar y sumar consumos por sector
            const groupedConsumptions = {};

            lecturas.forEach(lectura => {
                const sector = medidorSectorMap.get(lectura.id_medidor);
                if (sector) {
                    const consumoValue = parseFloat(lectura.consumo); // Asegurarse de que es un número
                    if (!isNaN(consumoValue)) {
                        if (!groupedConsumptions[sector]) {
                            groupedConsumptions[sector] = { totalConsumo: 0, meses: {} };
                        }

                        // Agrupar por mes/año para el detalle, si se necesita más tarde
                        // Usamos el formato YYYY-MM para facilitar la ordenación
                        const periodoKey = `<span class="math-inline">\{lectura\.anio\}\-</span>{String(lectura.mes).padStart(2, '0')}`;
                        if (!groupedConsumptions[sector].meses[periodoKey]) {
                            groupedConsumptions[sector].meses[periodoKey] = 0;
                        }
                        groupedConsumptions[sector].meses[periodoKey] += consumoValue;

                        // Suma total para el sector
                        groupedConsumptions[sector].totalConsumo += consumoValue;
                    }
                }
            });

            setSectorData(groupedConsumptions);

        } catch (err) {
            console.error('Error al obtener datos de sectores:', err.message);
            setError(`Error al cargar los datos de los sectores: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSectorConsumptions();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2, mt: 2 }}>Cargando datos de consumo por sector...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    const sectors = Object.keys(sectorData);
    if (sectors.length === 0) {
        return <Alert severity="info" sx={{ my: 2 }}>No se encontraron datos de consumo por sector.</Alert>;
    }

    return (
        // eslint-disable-next-line react/jsx-no-undef
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Consumo Total por Sector
            </Typography>

            <Grid container spacing={4} sx={{ mt: 3 }}>
                {sectors.map(sectorName => (
                    <Grid item xs={12} md={6} lg={4} key={sectorName}>
                        <Card elevation={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                        Sector: {sectorName}
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <WaterDropIcon color="info" sx={{ mr: 1, fontSize: 30 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Consumo Total: <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>{sectorData[sectorName].totalConsumo.toFixed(2)} m³</Box>
                                    </Typography>
                                </Box>

                                {/* Opcional: Mostrar desglose por meses si es relevante */}
                                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'medium' }}>
                                    Consumo Mensual (últimos):
                                </Typography>
                                <List dense>
                                    {Object.entries(sectorData[sectorName].meses)
                                        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Ordena por la clave YYYY-MM
                                        .slice(-3) // Mostrar solo los últimos 3 meses
                                        .reverse() // Para que el más reciente esté arriba
                                        .map(([periodoKey, consumo]) => {
                                            const [anio, mes] = periodoKey.split('-').map(Number);
                                            const displayDate = new Date(anio, mes - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
                                            return (
                                                <ListItem key={periodoKey} disablePadding>
                                                    <ListItemText
                                                        primary={`${displayDate}:`}
                                                        secondary={`${consumo.toFixed(2)} m³`}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default SectorConsumption;