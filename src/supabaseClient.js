
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqwowrtqckaifnrgjlda.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxd293cnRxY2thaWZucmdqbGRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIxMDQ1NywiZXhwIjoyMDYzNzg2NDU3fQ.Ia0q9rb9324jn393gEZaXFEGEN0JbKT8iHYqNItvr7E';

// Verifica que las variables de entorno estén cargadas
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Las variables de entorno de Supabase no están configuradas.');
    console.error('Asegúrate de tener un archivo .env en la raíz de tu proyecto con REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);