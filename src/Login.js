// src/Login.js (Este archivo ahora usa tu tabla 'usuarios' directamente)
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
    Paper
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person'; // Ícono para el nombre de usuario
import LockIcon from '@mui/icons-material/Lock';   // Ícono para la contraseña

function Login({ onLoginSuccess }) {
    // Cambiamos 'email' por 'username'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Ya no necesitamos 'message' porque no hay registro directo aquí

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // **IMPORTANTE: Esta consulta hace una comparación directa de la contraseña.**
            // **Esto es INSEGURO para producción si las contraseñas no están hasheadas en la DB.**
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
                // Si 'data' tiene un valor, significa que se encontró un usuario con esas credenciales
                console.log('User logged in from custom table:', data);
                // Llamamos al callback con los datos del usuario para que App.js sepa que ha iniciado sesión
                // Pasamos un objeto que simula la estructura de usuario de Supabase Auth para mantener compatibilidad
                onLoginSuccess({
                    id: data.id,
                    user_name: data.user_name,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    run: data.run
                    // Puedes añadir más campos si los necesitas en el estado global
                });
            } else {
                // Si la consulta no retorna datos pero tampoco un error específico, significa credenciales incorrectas.
                throw new Error('Nombre de usuario o contraseña incorrectos.');
            }

        } catch (err) {
            console.error('Login error:', err.message);
            setError(err.message || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    // **NOTA: Eliminamos la función handleSignUp de este componente**
    // Si quisieras un registro manual, necesitarías:
    // 1. Una forma de hashear la contraseña en el frontend (inseguro y no recomendado)
    // 2. Insertar los datos en tu tabla 'usuarios'
    // Es mucho más seguro y sencillo usar Supabase Auth para el registro.

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                    Iniciar Sesión
                </Typography>

                <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Nombre de Usuario" // Cambiado de "Correo Electrónico"
                        type="text" // Cambiado de "email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: (
                                <PersonIcon sx={{ mr: 1, color: 'action.active' }} /> // Ícono de persona
                            ),
                        }}
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: (
                                <LockIcon sx={{ mr: 1, color: 'action.active' }} />
                            ),
                        }}
                    />

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, py: 1.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>

                    {/* Eliminamos el botón de Registrarse de este componente,
                        ya que el registro directo en esta tabla no es seguro sin hashing.
                        Podrías tener un proceso de registro diferente o manual.
                    */}
                    {/* <Button variant="outlined" ... >Registrarse</Button> */}
                </Box>
            </Paper>
        </Container>
    );
}

export default Login;