// src/components/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

function ProtectedRoute({ allowedRoles }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Almacena el rol del usuario en el estado local
                setUser({ ...user, role: user.user_metadata?.role });
            }
            setLoading(false);
        };

        checkUser();

        // Escuchar cambios en el estado de autenticación de Supabase en tiempo real
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({ ...session.user, role: session.user.user_metadata?.role });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            // Limpiar el listener al desmontar el componente
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        // Muestra un spinner de carga mientras se verifica el usuario
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si no hay usuario autenticado, redirige al login
    if (!user) {
        navigate('/login');
        return null; // No renderiza nada mientras redirige
    }

    // Si hay usuario pero su rol no está permitido, redirige o muestra un error
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        navigate('/'); // Redirige a la página de inicio o a una página de "Acceso Denegado"
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" color="error">Acceso Denegado</Typography>
                <Typography variant="body1">No tienes permisos para acceder a esta página.</Typography>
                <Button variant="contained" onClick={() => navigate('/')}>Volver al Inicio</Button>
            </Box>
        );
    }

    // Si el usuario está autenticado y tiene el rol correcto, renderiza las rutas hijas
    return <Outlet />;
}

export default ProtectedRoute;
