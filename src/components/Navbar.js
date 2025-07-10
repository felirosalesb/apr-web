import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navItems = [
        { name: 'Home' },
        { name: 'Clientes' },
        { name: 'Login' },
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
                Menú
            </Typography>
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

    return (
        <AppBar
            position="fixed" // La barra de navegación siempre estará fija en la parte superior
            elevation={isHomePage ? 0 : 4} // Sin sombra en Home, con sombra en otras páginas
            sx={{
                backgroundColor: isHomePage ? 'rgba(0, 0, 0, 0.4)' : 'primary.main', // Fondo semi-transparente en Home, color primario en otras
                color: 'white', // El color del texto/iconos siempre será blanco para que se vea sobre el fondo oscuro/transparente
                transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // Transición suave para el cambio de color y sombra
                zIndex: (theme) => theme.zIndex.drawer + 1, // Asegura que la Navbar esté por encima de otros elementos (como el Drawer)
            }}
        >
            <Toolbar>
                {/* Botón de menú hamburguesa para pantallas pequeñas */}
                <IconButton
                    color="inherit" // Hereda el color 'white' del AppBar
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>




                {/* Botones de navegación para escritorio */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {navItems.map((item) => (
                        <Button

                            key={item.name}
                            color="inherit" // Hereda el color 'white' del AppBar
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            sx={{
                                mx: 1,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Un poco más claro al pasar el mouse
                                },
                            }}
                        >
                            {item.name}
                        </Button>
                    ))}
                </Box>
            </Toolbar>

            {/* Drawer (menú lateral) para móviles */}
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
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, backgroundColor: 'primary.main', color: 'white' }, // Fondo del Drawer y texto
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
        </AppBar>
    );
}

export default Navbar;