// src/components/EditLectureModal.js
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Typography, Box, Alert, CircularProgress
} from '@mui/material';
import { supabase } from '../supabaseClient';

function EditLectureModal({ open, onClose, lectureData, onLectureUpdated }) {
    // Estado para el valor editable de la lectura
    const [currentLectura, setCurrentLectura] = useState(''); // <-- Renombrado
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (lectureData) {
            // Establece la lectura inicial si lectureData existe
            setCurrentLectura(lectureData.lectura !== undefined ? lectureData.lectura.toString() : ''); // <-- Usa lectureData.lectura
            setError(null);
            setSuccess(false);
        }
    }, [lectureData]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const newLectura = parseFloat(currentLectura); // <-- Renombrado

        if (isNaN(newLectura)) {
            setError('La lectura debe ser un número válido.');
            setLoading(false);
            return;
        }
        if (!lectureData || !lectureData.id_lectura) {
            setError('Error: No se pudo obtener el ID de la lectura para actualizar.');
            setLoading(false);
            return;
        }

        try {
            // Actualiza solo la columna 'lectura' en la tabla 'lecturas' de Supabase
            const { data, error: updateError } = await supabase
                .from('lecturas')
                .update({
                    lectura: newLectura // <-- 'lectura' en lugar de 'lectura_actual'
                    // El consumo no se edita aquí, se trae directamente de la DB
                })
                .eq('id_lectura', lectureData.id_lectura);

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            if (onLectureUpdated) {
                onLectureUpdated(lectureData.id_lectura);
            }
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (err) {
            console.error('Error al actualizar lectura:', err.message);
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!lectureData) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Editar Lectura ({lectureData.periodo})</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>Lectura actualizada con éxito!</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1">
                        **Medidor ID:** {lectureData.id_medidor}
                    </Typography>
                    <Typography variant="subtitle1">
                        **Período:** {lectureData.periodo}
                    </Typography>
                    {/* Muestra el consumo (ahora traído de la DB) */}
                    <TextField
                        label="Consumo (m³)"
                        value={lectureData.consumo_m3 !== undefined ? lectureData.consumo_m3.toFixed(2) : ''}
                        fullWidth
                        margin="normal"
                        disabled // Sigue deshabilitado, ya que se trae de la DB, no se edita aquí
                        helperText="Este valor se trae directamente de la base de datos."
                    />
                    {/* Campo editable para la Lectura */}
                    <TextField
                        label="Nueva Lectura" // <-- Etiqueta renombrada
                        type="number"
                        value={currentLectura} // <-- Usa currentLectura
                        onChange={(e) => setCurrentLectura(e.target.value)} // <-- Actualiza currentLectura
                        fullWidth
                        margin="normal"
                        disabled={loading}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} variant="contained" endIcon={loading && <CircularProgress size={20} color="inherit" />}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditLectureModal;