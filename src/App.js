import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // Importa el nuevo Navbar
import Home from './components/Home';     // Importa el nuevo Home
import Login from './Login'; // Asegúrate de que esta ruta sea correcta para tu componente Login
// Importa tus otros componentes si los necesitas en rutas específicas
import ClientSearch from './components/clienteSearch'; // Ejemplo
import ClienteSearch from './components/clienteSearch';
// import SectorConsumo from './components/sectorConsumo'; // Ejemplo

function AppWrapper() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    console.log('User logged out');
  };

  return (
    <Router>
      <Navbar /> {/* Renderiza el Navbar en todas las páginas */}
      <Routes>
        <Route path="/" element={<Home />} /> {/* Ruta para el Home */}
        <Route path="/clientes" element={<ClienteSearch />} /> {/* Ejemplo de ruta para Clientes */}
        <Route path="/login" element={<Login />} /> {/* Ruta para Login */}
        {/* Agrega aquí tus otras rutas si es necesario */}
        {/* <Route path="/sector-consumo" element={<SectorConsumo />} /> */}
      </Routes>
    </Router>
  );
}

export default AppWrapper;