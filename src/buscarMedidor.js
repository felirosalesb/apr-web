// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import { Container, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import ClienteSearch from './components/clienteSearch';
import ConsumoChart from './components/consumoChart';
import EditLectureModal from './components/EditLectureModal';

function Dashboard() {
    const [currentMedidorId, setCurrentMedidorId] = useState(null);
    const [consumoData, setConsumoData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clienteNombre, setClienteNombre] = useState(null);
    const [clienteDireccion, setClienteDireccion] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState(null);

    const fetchConsumoData = async (medidorId) => {
        setLoading(true);
        setError(null);
        setConsumoData([]);
        setClienteNombre(null);
        setClienteDireccion(null);

        try {
            // 1. Obtener datos del medidor (nombre y dirección)
            const { data: medidorDatos, error: medidorError } = await supabase
                .from('datos medidor')
                .select('nombre_cliente, direccion')
                .eq('id_medidor', medidorId)
                .single();

            if (medidorError) {
                if (medidorError.code === 'PGRST116') {
                    throw new Error(`No se encontró ningún medidor con ID: ${medidorId}.`);
                }
                throw medidorError;
            }
            setClienteNombre(medidorDatos.nombre_cliente);
            setClienteDireccion(medidorDatos.direccion);

            // 2. Obtener datos de lecturas para el medidor
            // AHORA: Seleccionamos 'lectura' (renombrada de lectura_actual) y 'consumo' directamente de la DB
            const { data: lecturasData, error: lecturasError } = await supabase
                .from('lecturas')
                .select('id_lectura, mes, anio, lectura, consumo, id_medidor') // <-- 'lectura' y 'consumo'
                .eq('id_medidor', medidorId)
                .order('anio', { ascending: true })
                .order('mes', { ascending: true });

            if (lecturasError) {
                throw lecturasError;
            }

            // AHORA: Ya no necesitamos calcular el consumo aquí, lo traemos de la DB.
            const processedData = lecturasData.map((item) => {
                const fechaFicticia = new Date(item.anio, item.mes - 1, 1);
                const periodoEtiqueta = fechaFicticia.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });

                // Aseguramos que consumo sea un número (puede venir como texto de la DB si es 'text')
                const consumoValue = parseFloat(item.consumo); // Convertir a número
                const lecturaValue = parseFloat(item.lectura); // Convertir a número

                return {
                    id_lectura: item.id_lectura,
                    id_medidor: item.id_medidor,
                    periodo: periodoEtiqueta,
                    consumo_m3: isNaN(consumoValue) ? 0 : consumoValue, // Usar el consumo de la DB
                    lectura: isNaN(lecturaValue) ? 0 : lecturaValue,   // Usar la lectura de la DB
                    mes: item.mes,
                    anio: item.anio
                };
            });

            setConsumoData(processedData);

        } catch (err) {
            console.error('Error al obtener datos:', err.message);
            setError(`Error al cargar los datos: ${err.message}.`);
            setConsumoData([]);
            setClienteNombre(null);
            setClienteDireccion(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentMedidorId) {
            fetchConsumoData(currentMedidorId);
        } else {
            setConsumoData([]);
            setClienteNombre(null);
            setClienteDireccion(null);
        }
    }, [currentMedidorId]);

    const handleSearch = (medidorId) => {
        setCurrentMedidorId(medidorId);
    };

    const handleEditClick = (lecture) => {
        setSelectedLecture(lecture);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedLecture(null);
    };

    const handleLectureUpdated = (updatedLectureId) => {
        console.log(`Lectura con ID ${updatedLectureId} actualizada. Refrescando todos los datos...`);
        // No necesitamos un setTimeout si el consumo se trae directo de la DB
        // y la actualización se refleja inmediatamente al refetch.
        fetchConsumoData(currentMedidorId);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Dashboard de Consumo de Agua
            </Typography>

            <Box sx={{ my: 3 }}>
                <ClienteSearch onSearch={handleSearch} />
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>Cargando datos de consumo...</Typography>
                </Box>
            )}
            {error && (
                <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            )}

            {currentMedidorId && !loading && !error && (
                <>
                    {clienteNombre && (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                {clienteNombre}
                            </Typography>
                            {clienteDireccion && (
                                <Typography variant="subtitle1" color="text.secondary">
                                    {clienteDireccion}
                                </Typography>
                            )}
                        </Box>
                    )}
                    <ConsumoChart
                        data={consumoData}
                        clienteId={currentMedidorId}
                        clienteNombre={clienteNombre}
                        onEditClick={handleEditClick}
                    />
                </>
            )}

            {!currentMedidorId && !loading && !error && (
                <Typography variant="h6" align="center" color="text.secondary" sx={{ my: 4 }}>
                    Ingresa un ID de medidor para visualizar su consumo.
                </Typography>
            )}

            {selectedLecture && (
                <EditLectureModal
                    open={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    lectureData={selectedLecture}
                    onLectureUpdated={handleLectureUpdated}
                />
            )}
        </Container>
    );
}

export default Dashboard;