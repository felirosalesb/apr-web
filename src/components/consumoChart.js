// src/components/ConsumoChart.js
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function ConsumoChart({ data, clienteId, clienteNombre, onEditClick }) {
    if (!data || data.length === 0) {
        return (
            <Alert severity="info" sx={{ my: 2 }}>
                No hay datos de consumo disponibles para el medidor{' '}
                <strong>{clienteId}</strong>
                {clienteNombre && ` (${clienteNombre})`}. Por favor, verifica el ID.
            </Alert>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const consumoItem = payload.find(p => p.dataKey === 'consumo_m3');
            // Accedemos a 'lectura' del objeto de datos original en el payload
            const lecturaValue = payload[0].payload.lectura;

            return (
                <Box sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Período: {label}
                    </Typography>
                    {consumoItem && (
                        <Typography variant="body2" sx={{ color: consumoItem.color }}>
                            Consumo: {consumoItem.value.toFixed(2)} m³
                        </Typography>
                    )}
                    {lecturaValue !== undefined && ( // Usa lecturaValue
                        <Typography variant="body2" sx={{ color: '#4CAF50' }}>
                            Lectur: {lecturaValue}
                        </Typography>
                    )}
                </Box>
            );
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', p: 0, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, mt: 3 }}>
            <Typography variant="h5" component="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Consumo de Agua - Medidor: {clienteId} {clienteNombre && `(${clienteNombre})`}
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="periodo"
                        tick={{ fill: '#616161', fontSize: 12 }}
                        angle={-30} textAnchor="end" height={60}
                    />
                    <YAxis
                        label={{ value: 'Consumo (m³)', angle: -90, position: 'insideLeft', fill: '#616161' }}
                        tick={{ fill: '#616161', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 14, color: '#424242' }} iconType="circle" />
                    <Bar
                        dataKey="consumo_m3" // Ya es el valor de la DB
                        fill="#1976d2"
                        name="Consumo (m³)"
                        barSize={30}
                        radius={[5, 5, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>

            <Typography variant="h6" component="h4" sx={{ mt: 4, mb: 2, textAlign: 'center', color: 'text.primary' }}>
                Detalle de Lecturas
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table size="small" aria-label="lecturas table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Consumo (m³)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Lectura</TableCell> {/* Etiqueta de la columna */}
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id_lectura}>
                                <TableCell>{row.periodo}</TableCell>
                                <TableCell align="right">{row.consumo_m3.toFixed(2)}</TableCell>
                                <TableCell align="right">{row.lectura}</TableCell> {/* Acceso a la columna renombrada */}
                                <TableCell align="center">
                                    <IconButton
                                        aria-label="edit"
                                        size="small"
                                        onClick={() => onEditClick(row)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ConsumoChart;