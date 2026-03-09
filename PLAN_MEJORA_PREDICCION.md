# Plan de Mejora del Motor Predictivo — Adjudicaciones Canarias

## Hallazgos clave del análisis de los 4 PDFs

### Datos crudos extraídos

| Dato | 2024-25 | 2025-26 | Variación |
|------|---------|---------|-----------|
| Vacantes Filosofía (Anexo II) | 218 | 111 | **-49%** |
| Páginas PDF adjudicaciones | 3.316 | 2.571 | -22% |
| Col 55 Filosofía: participantes | ~350+ | 199 | ~-43% |
| Col 55 Filosofía: obtienen destino | ~170+ | 89 | ~-48% |
| Col 55 Filosofía: NO obtienen | ~180+ | 110 | — |
| Último orden real col 55 Filo | 168+ | 220 | — |

### El campo ÁMBITO existe y es explotable

En el colectivo 55 (Integrantes de listas de empleo), cada docente tiene en la columna **ÁMBITO** las islas que seleccionó. Distribución real para Filosofía 2025:

| Ámbito | Docentes | % |
|--------|----------|---|
| Solo TF | 56 | 28% |
| Solo GC | 44 | 22% |
| Regional (todas) | ~36 | 18% |
| Solo GO | 11 | 5.5% |
| Solo LZ | 11 | 5.5% |
| Solo LP | 7 | 3.5% |
| GC,TF | 5 | 2.5% |
| Solo FU | 4 | 2% |
| Multi-isla (otros) | ~25 | 12.5% |

**Conclusión**: el 50% de los interinos se limita a UNA sola isla (TF o GC). Esto hace que las islas menores tengan cortes de lista mucho más altos en proporción.

### Formato del campo ÁMBITO por año

- **2024**: `1GC 2TF 3FU 4LZ 5LP 6GO` (con orden de preferencia numerado) o `Regional` o `TF`
- **2025**: `GC,FU,TF` (separado por comas, sin orden) o `Regional` o `TF`

Ambos son parseables. El de 2024 incluso nos da el orden de preferencia, que es más rico.

---

## Los 3 bugs del modelo actual

### Bug 1: Mezcla colectivos 42 (FP) con interinos
El campo `orden` de un FP y un interino son escalas distintas. FP#17 ≠ Interino#17. El algoritmo actual los mezcla al calcular `maxOrden` y probabilidades.

**Fix**: Filtrar por `tipo_participante` — solo usar registros de colectivos 46-55 para predicciones de interinos.

### Bug 2: Probabilidad por isla ignora la demanda
El modelo actual usa `orderCut` por isla (último orden que obtuvo plaza ahí). Pero si el usuario está en el puesto 90 y el último que obtuvo plaza en TF estaba en el 138, el modelo da ~60% a ambos aunque sus situaciones son radicalmente distintas.

**Fix**: Usar el campo ÁMBITO para simular la cascada real.

### Bug 3: No distingue entre vacantes disponibles y plazas adjudicadas
El número de plazas adjudicadas no es lo mismo que las vacantes iniciales. Muchas vacantes las consumen colectivos anteriores (42-FP, 50-53 comisiones).

**Fix**: Restar las plazas consumidas por colectivos prioritarios antes de calcular las disponibles para col 55.

---

## Datos necesarios para el modelo mejorado

### Lo que YA tienes (y funciona)
- ✅ Adjudicaciones 2025-26 extraídas y en Supabase
- ✅ Campo `orden` corregido (sin el 0 final)
- ✅ Campo `tipo_participante` para separar FP de interinos
- ✅ Campo `colectivo` (50, 55, etc.)
- ✅ Campo `isla` del destino asignado
- ✅ Campo `obtiene_destino`

### Lo que FALTA extraer del PDF de adjudicaciones 2025
- ❌ **`ambito_islas`**: las islas que cada docente del col 55 seleccionó (campo ÁMBITO)
- ❌ Actualmente solo se captura `ambito_preferente` (la isla preferida), NO la lista completa

### Lo que aportan los nuevos PDFs

| PDF | Para qué sirve | Prioridad |
|-----|----------------|-----------|
| `2025_anexo_ii_vacantes_defini_secundaria.pdf` | Vacantes INICIALES por centro/especialidad. Permite calcular cuántas plazas había ANTES de adjudicar | **ALTA** |
| `2024_anexo_I-adjudicacion...pdf` | Comparar cortes de lista entre años. Verificar tendencias | MEDIA |
| `2024_anexo_II_vacantes_iniciales...pdf` | Comparar vacantes entre años para ver tendencia | MEDIA |

---

## Nuevo algoritmo de predicción

### Paso 1: Separar datos por colectivo

```
Para una especialidad dada:
  FP = registros donde tipo_participante contiene "42,"
  Interinos_comision = registros donde tipo_participante contiene "50," o "51," o "52," o "53,"
  Interinos_lista = registros donde tipo_participante contiene "55,"
  
  Plazas consumidas antes de col 55 = FP.con_destino + Interinos_comision.con_destino
  Plazas disponibles para col 55 = Vacantes_iniciales - Plazas_consumidas_antes
```

### Paso 2: Simular la cascada del colectivo 55

Con el campo `ambito_islas` podemos simular exactamente lo que hace la Consejería:

```
Para cada docente del col 55, en orden de lista (1, 2, 3...):
  Si el docente pidió isla X y hay vacantes en isla X → asignar
  Si pidió varias islas → asignar a la primera con vacantes
  Si no quedan vacantes en ninguna de sus islas → "No obtiene"
  
Resultado: para cada posición de lista, sabemos si obtiene y en qué isla
```

### Paso 3: Predicción para el usuario

```
Input: mi_orden=90, mi_especialidad="201 - Filosofía", mis_islas=["TF", "GC"]

1. Contar cuántos docentes con orden < 90 también pidieron TF → N_competidores_TF
2. Contar vacantes disponibles para col 55 en TF → V_TF
3. Si N_competidores_TF < V_TF → SAFE para TF
4. Si N_competidores_TF ≈ V_TF → WARNING
5. Si N_competidores_TF >> V_TF → los sobrantes van a sus otras islas, liberando las tuyas

Probabilidad_TF = max(0, min(99, (V_TF - N_competidores_TF) / V_TF * 100))
```

### Paso 4: Status global

```
Si obtendría plaza en AL MENOS una isla seleccionada → SAFE
Si está en zona frontera (±10% del corte) → WARNING  
Si supera el corte en TODAS las islas seleccionadas → DANGER
```

---

## Cambios necesarios en el parser

El parser actual (`parse_adjudicaciones.py`) necesita capturar el campo `ambito_islas`. Ejemplo de regex:

```python
# Después de extraer el nombre, buscar el patrón de ÁMBITO
# Formato 2025: GC,TF,LP o Regional o TF
ambito_islas_match = re.search(
    r'(?:' + re.escape(nombre_raw) + r'.*?)\s+'
    r'((?:(?:TF|GC|LP|FU|LZ|GO|HI)(?:,(?:TF|GC|LP|FU|LZ|GO|HI))*)|Regional)',
    entry
)
ambito_islas = ambito_islas_match.group(1) if ambito_islas_match else ''

# Si no se detecta y no es col 55 → probablemente Regional implícito
if not ambito_islas and '55, Integrantes' in tipo:
    ambito_islas = 'Regional'
```

### Nueva columna en la tabla Supabase

```sql
ALTER TABLE adjudicaciones ADD COLUMN ambito_islas TEXT;
```

---

## Cambios en la tabla de vacantes (nueva tabla)

```sql
CREATE TABLE vacantes_iniciales (
    id SERIAL PRIMARY KEY,
    curso TEXT,  -- '2025-26'
    especialidad TEXT,
    cod_centro TEXT,
    centro TEXT,
    isla TEXT,  -- derivada del código de centro
    plantilla INTEGER,
    ocupadas INTEGER,
    vacantes INTEGER
);
```

Esto permite calcular: `SELECT isla, SUM(vacantes) FROM vacantes_iniciales WHERE especialidad='201' GROUP BY isla`

---

## Resumen de acciones priorizadas

### Sprint 1 (hoy): Arreglar predicción con datos existentes
1. En `App.jsx`: filtrar por tipo_participante para separar FP de interinos
2. Calcular corte real solo con interinos
3. Mostrar plazas FP como dato informativo separado

### Sprint 2 (próxima sesión): Extraer ÁMBITO
1. Actualizar `parse_adjudicaciones.py` para capturar `ambito_islas`
2. Añadir columna `ambito_islas` a Supabase
3. Re-extraer el PDF completo y re-subir

### Sprint 3: Incorporar vacantes
1. Crear parser para el Anexo II de vacantes
2. Crear tabla `vacantes_iniciales` en Supabase
3. Calcular vacantes disponibles para col 55 por isla

### Sprint 4: Simulación de cascada
1. Implementar simulador que usa ámbitos + vacantes
2. Para cada posición de lista, calcular probabilidad real
3. Mostrar "docentes por encima de ti que compiten por tus mismas islas"

---

## Dato revelador para la UI

Con los datos actuales podemos mostrar algo que NINGUNA otra herramienta muestra:

> "De los 89 interinos que eligieron TF en Filosofía, solo 56 estaban por delante del puesto 90.  
> TF tenía 47 vacantes para interinos.  
> 56 competidores > 47 vacantes = **9 docentes por delante de ti se quedaron sin TF**.  
> Pero muchos de ellos tenían GC como segunda opción, así que las vacantes de GC también se reducen."

Esto es el tipo de transparencia que convertiría la web en imprescindible.
