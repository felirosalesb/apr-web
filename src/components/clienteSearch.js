// src/components/ClienteSearch.js
import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; // Importa un ícono de búsqueda

function ClienteSearch({ onSearch }) {
    const [medidorId, setMedidorId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (medidorId.trim()) {
            onSearch(medidorId.trim());
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Columna en móvil, fila en escritorio
                gap: 2, // Espaciado entre elementos
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <TextField
                label="ID del Medidor"
                variant="outlined"
                value={medidorId}
                onChange={(e) => setMedidorId(e.target.value)}
                fullWidth={false} // Para no ocupar todo el ancho en desktop
                sx={{ minWidth: { sm: '250px' } }} // Ancho mínimo en pantallas medianas
            />
            <Button
                type="submit"
                variant="contained" // Botón con fondo
                size="large" // Botón más grande
                endIcon={<SearchIcon />} // Ícono al final del botón
                sx={{
                    py: 1.5, // Padding vertical
                    px: 3, // Padding horizontal
                    fontSize: '1rem', // Tamaño de fuente
                    bgcolor: 'primary.main', // Color de tema primario
                    '&:hover': {
                        bgcolor: 'primary.dark', // Color más oscuro al pasar el ratón
                    },
                    width: { xs: '100%', sm: 'auto' } // Ancho completo en móvil, auto en desktop
                }}
            >
                Buscar Consumo
            </Button>
        </Box>
    );
}

export default ClienteSearch;