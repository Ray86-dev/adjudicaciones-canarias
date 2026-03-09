-- Ejecutar en Supabase: https://supabase.com/dashboard/project/dqptchwkulrzcpofuafk/sql/new

CREATE TABLE IF NOT EXISTS public.vacantes_iniciales (
    id SERIAL PRIMARY KEY,
    curso TEXT,  
    especialidad_cod TEXT,
    especialidad_nombre TEXT,
    cod_centro TEXT,
    centro TEXT,
    isla TEXT, 
    comp INTEGER,
    plantilla INTEGER,
    ocupadas INTEGER,
    vacantes INTEGER
);

-- Habilitar lectura global para el frontend
ALTER TABLE public.vacantes_iniciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y Escritura Publica Vacantes"
ON public.vacantes_iniciales
FOR ALL
USING (true)
WITH CHECK (true);
