// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// *** ¡IMPORTANTE! Reemplaza estos valores con tus propias claves de Supabase. ***
// Puedes encontrarlos en el panel de control de tu proyecto Supabase:
// Project Settings (el icono de engranaje) -> API
// - "URL del Proyecto" es tu `supabaseUrl`
// - "Clave Pública (anon)" es tu `supabaseAnonKey`
const supabaseUrl = 'https://aqwowrtqckaifnrgjlda.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxd293cnRxY2thaWZucmdqbGRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIxMDQ1NywiZXhwIjoyMDYzNzg2NDU3fQ.Ia0q9rb9324jn393gEZaXFEGEN0JbKT8iHYqNItvr7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);