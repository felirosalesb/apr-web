// src/Login.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

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
    CssBaseline
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Autenticación segura con Supabase Auth (email y contraseña)
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                throw authError; // Maneja errores de credenciales inválidas, etc.
            }

            if (data.user) {
                // Obtener el rol del usuario de los metadatos (establecido en Supabase Dashboard)
                const userRole = data.user.user_metadata?.role;

                // Verificar si el usuario tiene un rol permitido para el personal de oficina
                if (userRole === 'office_staff' || userRole === 'admin') { // Define tus roles aquí
                    console.log('Admin user logged in:', data.user);
                    // Llama al callback para actualizar el estado del usuario en App.js
                    onLoginSuccess({
                        id: data.user.id,
                        email: data.user.email,
                        role: userRole,
                    });
                    // Redirige al panel de administración
                    navigate('/admin/dashboard');
                } else {
                    // Si el usuario no tiene el rol correcto, cierra la sesión y muestra un error
                    await supabase.auth.signOut();
                    throw new Error('Acceso denegado: No tienes permisos de personal de oficina.');
                }
            } else {
                throw new Error('Credenciales incorrectas.'); // Fallback, no debería ocurrir si authError es nulo
            }

        } catch (err) {
            console.error('Login error:', err.message);
            setError(err.message || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: 'url("/images/image3.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: { xs: 8, sm: 10 }
            }}
        >
            <CssBaseline />
            <Container component="main" maxWidth="xs">
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
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
