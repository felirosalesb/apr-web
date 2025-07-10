import React from 'react';
import { Box, Typography, Container, Card, CardContent } from '@mui/material';

function Home() {
    return (
        <Box>
            {/* Sección de la Imagen de Inicio (Hero Section) */}
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '600px', // Ajusta la altura según necesites
                    backgroundImage: 'url(/images/image1.jpg)', // Asegúrate de que esta imagen exista en public/images
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column', // Para centrar contenido verticalmente si lo añades
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white', // Color del texto superpuesto (si lo hay)
                    textAlign: 'center',
                    // Opcional: superposición oscura para que el texto blanco destaque
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Capa oscura semi-transparente
                    }
                }}
            >
                {/* Contenido superpuesto a la imagen (opcional) */}
                <Typography variant="h2" sx={{ zIndex: 1, mb: 2 }}>
                    Bienvenido a Mi Plataforma
                </Typography>
                <Typography variant="h5" sx={{ zIndex: 1 }}>
                    Descubre todas nuestras soluciones
                </Typography>
            </Box>

            {/* Sección de Cards de Información */}
            <Container sx={{ py: 6 }}> {/* Más padding vertical */}
                <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
                    Nuestros Servicios y Destacados
                </Typography>
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 4, // Espacio entre las tarjetas
                }}>
                    {/* Card 1 */}
                    <Card sx={{
                        maxWidth: 345,
                        minWidth: 280, // Asegura un ancho mínimo en pantallas pequeñas
                        flexGrow: 1, // Permite que la tarjeta crezca para ocupar espacio
                        boxShadow: 3, // Sombra sutil
                        '&:hover': {
                            boxShadow: 6, // Sombra más pronunciada al pasar el mouse
                            transform: 'translateY(-5px)', // Efecto de elevación
                            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        }
                    }}>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Servicio Premium
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ofrecemos soluciones innovadoras adaptadas a tus necesidades más exigentes.
                                Descubre cómo podemos potenciar tu negocio.
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Card 2 */}
                    <Card sx={{
                        maxWidth: 345,
                        minWidth: 280,
                        flexGrow: 1,
                        boxShadow: 3,
                        '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-5px)',
                            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        }
                    }}>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Atención Personalizada
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Nuestro equipo está siempre disponible para brindarte el soporte que necesitas,
                                con un trato cercano y profesional.
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Card 3 */}
                    <Card sx={{
                        maxWidth: 345,
                        minWidth: 280,
                        flexGrow: 1,
                        boxShadow: 3,
                        '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-5px)',
                            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        }
                    }}>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Tecnología Avanzada
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Utilizamos las últimas herramientas y metodologías para garantizar la máxima
                                eficiencia y seguridad en todos nuestros procesos.
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Puedes añadir más Cards aquí */}
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{
                backgroundColor: '#333', // Un color más oscuro para el footer
                color: 'white', // Texto blanco
                py: 4, // Más padding vertical
                textAlign: 'center',
                mt: 4, // Margen superior para separarlo del contenido
            }}>
                <Typography variant="body2">
                    © {new Date().getFullYear()} Mi Aplicación. Todos los derechos reservados.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    <a href="/politica-privacidad" style={{ color: 'white', textDecoration: 'none' }}>Política de Privacidad</a> |
                    <a href="/terminos-servicio" style={{ color: 'white', textDecoration: 'none', marginLeft: '10px' }}>Términos de Servicio</a>
                </Typography>
                {/* Aquí puedes añadir iconos de redes sociales, etc. */}
            </Box>
        </Box>
    );
}

export default Home;