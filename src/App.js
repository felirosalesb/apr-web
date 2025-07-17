import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './Login';
import ClientSearch from './components/clientSearch'; // Tu componente de búsqueda de clientes
import { supabase } from './supabaseClient'; // Tu cliente de Supabase

// --- Importar los nuevos componentes administrativos ---
import ProtectedRoute from './components/ProtectedRoute'; // El componente que creamos en el Paso 3
import AdminDashboard from './components/AdminDashboard'; // El componente que creamos en el Paso 4
import CustomerManagement from './components/CustomerManagement'; // Crear en Paso 7
import Reports from './components/Reports'; // Crear en Paso 7
import { Box, CircularProgress, Typography, Button } from '@mui/material'; // Importaciones necesarias para ProtectedRoute

// Componente Layout para la estructura general (Navbar + contenido de la ruta)
function Layout({ user, onLogout }) {
  return (
    <>
      <Navbar user={user} onLogout={onLogout} /> {/* Pasa el usuario y la función de logout a Navbar */}
      <Outlet /> {/* Aquí se renderiza el contenido de la ruta anidada */}
    </>
  );
}

function AppWrapper() {
  const [user, setUser] = useState(null); // Estado para el usuario autenticado (incluye el rol)

  // Efecto para escuchar cambios en el estado de autenticación de Supabase
  useEffect(() => {
    // Escuchar cambios en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Si hay una sesión, guarda el usuario y su rol en el estado
        setUser({ ...session.user, role: session.user.user_metadata?.role });
      } else {
        // Si no hay sesión, el usuario no está logueado
        setUser(null);
      }
    });

    // También, obtener la sesión actual al cargar la aplicación
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ ...user, role: user.user_metadata?.role });
      }
    };
    getSession();

    // Limpiar el listener al desmontar el componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Función para manejar el éxito del login desde el componente Login
  const handleLoginSuccess = (userData) => {
    setUser(userData); // Actualiza el estado del usuario en App.js
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    } else {
      setUser(null); // Limpia el estado del usuario al cerrar sesión
      // Redirigir a la página de inicio o login después de cerrar sesión
      // La redirección se maneja internamente por React Router al cambiar el estado del usuario
    }
  };

  return (
    <Router>
      <Routes>
        {/* Ruta principal que incluye el Layout (Navbar) */}
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          {/* Rutas Públicas (accesibles para todos) */}
          <Route index element={<Home />} />
          <Route path="clientes" element={<ClientSearch />} />
          <Route path="login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

          {/* Rutas Protegidas para el Personal Administrativo */}
          {/* Estas rutas solo serán accesibles si el usuario tiene los roles 'office_staff' o 'admin' */}
          <Route path="admin" element={<ProtectedRoute allowedRoles={['office_staff', 'admin']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clientes" element={<CustomerManagement />} />
            <Route path="informes" element={<Reports />} />
            {/* Puedes añadir más rutas administrativas aquí */}
          </Route>

          {/* Ruta para cualquier otra URL no definida (opcional) */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default AppWrapper;
