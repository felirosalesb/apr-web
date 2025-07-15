import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import LoginIcon from '@mui/icons-material/Login';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navItems = [
        { name: 'Home', path: '/', icon: <HomeIcon /> },
        { name: 'Clientes', path: '/clientes', icon: <GroupIcon /> },
        { name: 'Login', path: '/login', icon: <LoginIcon /> },
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Toolbar />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.name} disablePadding>
                        <ListItemButton component={Link} to={item.path} sx={{ textAlign: 'center' }}>
                            {item.icon}
                            <ListItemText primary={item.name} sx={{ ml: 1 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    // Lógica para determinar el color de la Navbar
    let backgroundColor;
    let elevation;
    if (location.pathname === '/') {
        // En la página de inicio, es semitransparente
        backgroundColor = 'rgba(255, 255, 255, 0.15)';
        elevation = 0;
    } else if (location.pathname === '/clientes') {
        // En la página de clientes, es un color oscuro
        backgroundColor = 'primary.dark';
        elevation = 4;
    } else {
        // Para todas las demás páginas (login, etc.), es el color principal
        backgroundColor = 'primary.main';
        elevation = 4;
    }

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
                    {navItems.map((item) => (
                        <Button
                            key={item.name}
                            color="inherit"
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            sx={{
                                mx: 1,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                },
                            }}
                        >
                            {item.name}
                        </Button>
                    ))}
                </Box>
            </Toolbar>

            <nav>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, backgroundColor: 'primary.main', color: 'white' },
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
        </AppBar>
    );
}

export default Navbar;