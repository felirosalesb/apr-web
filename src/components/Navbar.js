// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) { // Recibe 'user' y 'onLogout' desde App.js
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Ítems de navegación públicos (siempre visibles)
    const publicNavItems = [
        { name: 'Home', path: '/', icon: <HomeIcon /> },
        { name: 'Clientes', path: '/clientes', icon: <GroupIcon /> },
    ];

    // Ítems de navegación administrativos (visibles solo para roles específicos)
    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { name: 'Gestión Clientes', path: '/admin/clientes', icon: <PeopleIcon /> },
        { name: 'Informes', path: '/admin/informes', icon: <AssessmentIcon /> },
    ];

    // Lógica para el color de la Navbar basada en la ruta actual
    let backgroundColor;
    let elevation;
    if (location.pathname === '/') {
        backgroundColor = 'rgba(255, 255, 255, 0.15)'; // Semitransparente en Home
        elevation = 0;
    } else if (location.pathname.startsWith('/admin')) {
        backgroundColor = 'primary.dark'; // Color oscuro en rutas admin
        elevation = 4;
    } else {
        backgroundColor = 'primary.main'; // Color principal en otras rutas
        elevation = 4;
    }

    // Determina si el usuario tiene un rol administrativo
    const isAdmin = user && (user.role === 'office_staff' || user.role === 'admin');

    return (
        <AppBar
            position="fixed"
            elevation={elevation}
            sx={{
                backgroundColor: backgroundColor,
                color: 'white',
                transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1 }}
                >
                    Mi Aplicación
                </Typography>

                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {/* Ítems de navegación públicos */}
                    {publicNavItems.map((item) => (
                        <Button
                            key={item.name}
                            color="inherit"
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            sx={{ mx: 1, textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}
                        >
                            {item.name}
                        </Button>
                    ))}

                    {/* Ítems de navegación administrativos (condicional) */}
                    {isAdmin && (
                        <>
                            {adminNavItems.map((item) => (
                                <Button
                                    key={item.name}
                                    color="inherit"
                                    component={Link}
                                    to={item.path}
                                    startIcon={item.icon}
                                    sx={{ mx: 1, textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}
                                >
                                    {item.name}
                                </Button>
                            ))}
                            {/* Botón de Cerrar Sesión (condicional) */}
                            <Button
                                color="inherit"
                                startIcon={<LogoutIcon />}
                                onClick={onLogout}
                                sx={{ mx: 1, textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}
                            >
                                Cerrar Sesión
                            </Button>
                        </>
                    )}

                    {/* Botón de Login (condicional) */}
                    {!user && (
                        <Button
                            color="inherit"
                            component={Link}
                            to="/login"
                            startIcon={<LoginIcon />}
                            sx={{ mx: 1, textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}
                        >
                            Login
                        </Button>
                    )}
                </Box>
            </Toolbar>

            <nav>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, backgroundColor: 'primary.main', color: 'white' },
                    }}
                >
                    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
                        <Toolbar />
                        <Typography variant="h6" sx={{ my: 2 }}>Menú</Typography>
                        <List>
                            {/* Ítems públicos en el Drawer */}
                            {publicNavItems.map((item) => (
                                <ListItem key={item.name} disablePadding>
                                    <ListItemButton component={Link} to={item.path} sx={{ textAlign: 'center' }}>
                                        {item.icon}<ListItemText primary={item.name} sx={{ ml: 1 }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}

                            {/* Ítems administrativos en el Drawer (condicional) */}
                            {isAdmin && (
                                <>
                                    {adminNavItems.map((item) => (
                                        <ListItem key={item.name} disablePadding>
                                            <ListItemButton component={Link} to={item.path} sx={{ textAlign: 'center' }}>
                                                {item.icon}<ListItemText primary={item.name} sx={{ ml: 1 }} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                    {/* Botón de Cerrar Sesión en el Drawer (condicional) */}
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={onLogout} sx={{ textAlign: 'center' }}>
                                            <LogoutIcon /><ListItemText primary="Cerrar Sesión" sx={{ ml: 1 }} />
                                        </ListItemButton>
                                    </ListItem>
                                </>
                            )}

                            {/* Botón de Login en el Drawer (condicional) */}
                            {!user && (
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to="/login" sx={{ textAlign: 'center' }}>
                                        <LoginIcon /><ListItemText primary="Login" sx={{ ml: 1 }} />
                                    </ListItemButton>
                                </ListItem>
                            )}
                        </List>
                    </Box>
                </Drawer>
            </nav>
        </AppBar>
    );
}

export default Navbar;
