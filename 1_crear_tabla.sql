-- Ejecuta este script SQL en el Editor SQL de tu proyecto Supabase (https://supabase.com/dashboard/project/dqptchwkulrzcpofuafk/sql/new)

CREATE TABLE IF NOT EXISTS public.adjudicaciones (
    id SERIAL PRIMARY KEY,
    orden INTEGER,
    nombre TEXT,
    tipo_participante TEXT,
    especialidad TEXT,
    obtiene_destino BOOLEAN,
    colectivo TEXT,
    cod_centro TEXT,
    centro TEXT,
    municipio TEXT,
    isla TEXT,
    ambito_preferente TEXT,
    tipo_comision TEXT,
    ambito_islas TEXT
);

-- Esto permite a cualquiera (incluido el script de Python y tu web) leer e insertar sin autenticación
-- (Ideal para este proyecto de carácter público inicial, luego puedes restringir los INSERT)
ALTER TABLE public.adjudicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y Escritura Publica"
ON public.adjudicaciones
FOR ALL
USING (true)
WITH CHECK (true);
