// src/Login.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // Asegúrate de que esta ruta sea correcta

// Importaciones de Material-UI
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    CssBaseline // Importar CssBaseline para un reseteo de CSS básico
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person'; // Ícono para el nombre de usuario
import LockIcon from '@mui/icons-material/Lock';   // Ícono para la contraseña

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // **IMPORTANTE: Esta consulta hace una comparación directa de la contraseña.**
            // **Esto es INSEGURO para producción si las contraseñas no están hasheadas en la DB.**
            // **Considera usar Supabase Auth para autenticación segura en producción.**
            const { data, error } = await supabase
                .from('usuarios') // Consulta tu tabla 'usuarios'
                .select('user_name, nombre, apellido, run') // Selecciona los campos que necesites del usuario
                .eq('user_name', username) // Filtra por el nombre de usuario ingresado
                .eq('contrasena', password) // ¡Comparación directa e INSEGURA!
                .single(); // Espera un único resultado

            if (error) {
                // Supabase retorna error 'PGRST116' si no encuentra ninguna fila
                if (error.code === 'PGRST116') {
                    throw new Error('Nombre de usuario o contraseña incorrectos.');
                }
                throw error; // Otros errores de Supabase
            }

            if (data) {
                console.log('User logged in from custom table:', data);
                onLoginSuccess({
                    id: data.id,
                    user_name: data.user_name,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    run: data.run
                });
            } else {
                throw new Error('Nombre de usuario o contraseña incorrectos.');
            }

        } catch (err) {
            console.error('Login error:', err.message);
            setError(err.message || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Contenedor principal con la imagen de fondo
        <Box
            sx={{
                minHeight: '100vh', // Asegura que el fondo cubra toda la altura de la ventana
                backgroundImage: 'url("/images/image3.jpg")', // Ruta a tu imagen de fondo
                backgroundSize: 'cover', // Cubre todo el contenedor
                backgroundPosition: 'center', // Centra la imagen
                backgroundAttachment: 'fixed', // La imagen no se moverá al hacer scroll
                display: 'flex',
                flexDirection: 'column', // Para centrar el contenido verticalmente
                justifyContent: 'center', // Centra el contenido en el eje principal (vertical)
                alignItems: 'center', // Centra el contenido en el eje cruzado (horizontal)
                py: { xs: 8, sm: 10 } // Padding vertical para espacio
            }}
        >
            <CssBaseline /> {/* Resetea el CSS básico para evitar márgenes por defecto */}
            <Container component="main" maxWidth="xs">
                <Paper
                    elevation={3} // Sombra sutil
                    sx={{
                        p: 4, // Padding interno
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fondo blanco semitransparente
                        borderRadius: 3, // Esquinas más redondeadas
                        backdropFilter: 'blur(5px)', // Efecto de cristal esmerilado (frosted glass)
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Sombra más moderna
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                        Iniciar Sesión
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username" // Cambiado a 'username'
                            label="Nombre de Usuario"
                            name="username" // Cambiado a 'username'
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <LockIcon sx={{ mr: 1, color: 'action.active' }} />
                                ),
                            }}
                        />

                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default Login;
