#!/usr/bin/env python3
"""Extractor de Adjudicaciones Definitivas - Consejería de Educación de Canarias"""
import pdfplumber, re, csv, gc

PDF_PATH = "C:/Users/rayco/Downloads/20250804_anexo_i-adjudicacion_defin_fp_interinos_secundaria.pdf"
OUT_PATH = "C:/Users/rayco/OneDrive/Documentos/adjudicaciones-canarias/adjudicaciones.csv"
LIMIT = None

def nombre_con_iniciales(nombre_completo):
    """RODRÍGUEZ DOMÍNGUEZ, RAYZA MARÍA → RAYZA MARÍA R. D.
       GUALDANI , MARCO FRANCESCO → MARCO FRANCESCO G."""
    nombre_completo = nombre_completo.strip()
    # Clean trailing island codes (edge case PROMECI: "HAMDI GC,FU")
    nombre_completo = re.sub(r'\s+(?:TF|GC|LZ|FU|LP|GO|HI)(?:,(?:TF|GC|LZ|FU|LP|GO|HI))*\s*$', '', nombre_completo)
    if ',' in nombre_completo:
        apellidos, nombre = nombre_completo.split(',', 1)
        apellidos = apellidos.strip()
        nombre = nombre.strip()
        # Generate initials from apellidos
        partes = [p for p in apellidos.split() if p and p.upper() not in ('DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL')]
        iniciales = ' '.join(f'{p[0].upper()}.' for p in partes if len(p) > 0)
        return f'{nombre} {iniciales}'.strip() if iniciales else nombre
    return nombre_completo

def parse_page(page, page_num):
    text = page.extract_text() or ''
    lines = text.strip().split('\n')
    tipo = ''
    especialidad = ''
    records = []
    for j, line in enumerate(lines):
        ls = line.strip()
        if j == 2 and not ls.startswith('ORDEN'):
            tipo = ls
        if j == 3 and not ls.startswith('ORDEN'):
            especialidad = ls
    content_lines = []
    for j, line in enumerate(lines):
        ls = line.strip()
        if any([ls.startswith('Anexo I'), ls.startswith('Curso 20'), ls.startswith('ORDEN DNI'), ls == tipo, ls == especialidad, re.match(r'^\d+$', ls) and int(ls) == page_num + 1]):
            continue
        content_lines.append(ls)
    block = '\n'.join(content_lines)
    entries = re.split(r'(?=^\d+\s+\*)', block, flags=re.MULTILINE)
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        m_orden = re.match(r'^(\d+)\s+', entry)
        if not m_orden:
            continue
        orden = m_orden.group(1)
        if orden.endswith('0') and len(orden) > 1:
            orden = orden[:-1]
        m_dni = re.search(r'(\*{2,4}\d+\*{1,2})', entry)
        dni = m_dni.group(1) if m_dni else ''
        nombre = ''
        if m_dni:
            after_dni = entry[m_dni.end():]
            m_name = re.match(r'\s+(.+?)\s*(?:Regional|Destino:|No obtiene)', after_dni, re.DOTALL)
            if m_name:
                nombre = ' '.join(m_name.group(1).split())
        cod_centro = centro = municipio = isla = colectivo = tipo_comision = ''
        obtiene_destino = not bool(re.search(r'No obtiene', entry))
        m_dest = re.search(r'Destino:\s*Obtuvo por el colectivo\s*(\d+)\s*-\s*(\d+)\s+(.+?)\((.+?)\s*,\s*(\w+)\)', entry)
        if m_dest:
            colectivo, cod_centro, centro, municipio, isla = m_dest.group(1), m_dest.group(2), m_dest.group(3).strip(), m_dest.group(4).strip(), m_dest.group(5).strip()
        else:
            m_dest = re.search(r'Destino:\s*(\d{8})\s+(.+?)\((.+?)\s*,\s*(\w+)\)', entry)
            if m_dest:
                cod_centro, centro, municipio, isla = m_dest.group(1), m_dest.group(2).strip(), m_dest.group(3).strip(), m_dest.group(4).strip()
        m_pref = re.search(r'Ámbito Pref\.:\s*\((\w+)\)', entry)
        ambito_pref = m_pref.group(1) if m_pref else ''
        m_com = re.search(r'Tipo comisión:\s*(.+?)(?:\n|$)', entry)
        tipo_comision = m_com.group(1).strip() if m_com else ''
        records.append({'orden': orden, 'nombre': nombre_con_iniciales(nombre), 'tipo_participante': tipo, 'especialidad': especialidad, 'obtiene_destino': 'Sí' if obtiene_destino else 'No', 'colectivo': colectivo, 'cod_centro': cod_centro, 'centro': centro, 'municipio': municipio, 'isla': isla, 'ambito_preferente': ambito_pref, 'tipo_comision': tipo_comision})
    return records

def main():
    pdf_probe = pdfplumber.open(PDF_PATH)
    total_pages = len(pdf_probe.pages)
    pdf_probe.close()
    pages_to_process = min(LIMIT, total_pages) if LIMIT else total_pages
    BATCH = 100
    print(f"PDF: {total_pages} paginas, procesando {pages_to_process}")
    all_records = []
    for start in range(0, pages_to_process, BATCH):
        end = min(start + BATCH, pages_to_process)
        pdf = pdfplumber.open(PDF_PATH)
        for i in range(start, end):
            all_records.extend(parse_page(pdf.pages[i], i))
        pdf.close()
        gc.collect()
        print(f"  {end}/{pages_to_process} pags ({len(all_records)} registros)")
    if all_records:
        with open(OUT_PATH, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=all_records[0].keys())
            writer.writeheader()
            writer.writerows(all_records)
    print(f"\n{len(all_records)} registros -> {OUT_PATH}")
    from collections import Counter
    con = sum(1 for r in all_records if r['obtiene_destino'] == 'Sí')
    sin = sum(1 for r in all_records if r['obtiene_destino'] == 'No')
    print(f"Con destino: {con} | Sin destino: {sin}")
    print(f"\nPor TIPO:")
    for t, c in Counter(r['tipo_participante'] for r in all_records).most_common():
        print(f"  {t}: {c}")
    print(f"\nPor ISLA:")
    for t, c in Counter(r['isla'] for r in all_records if r['isla']).most_common():
        print(f"  {t}: {c}")
    print(f"\nEspecialidades: {len(set(r['especialidad'] for r in all_records))}")
    print(f"\nMuestra FP:")
    for r in [x for x in all_records if '42' in x['tipo_participante']][:2]:
        print(f"  #{r['orden']} {r['nombre']} -> {r['centro']} ({r['municipio']}, {r['isla']})")
    print(f"Muestra Interinos:")
    for r in [x for x in all_records if '50' in x['tipo_participante'] and x['isla']][:2]:
        print(f"  #{r['orden']} {r['nombre']} -> {r['centro']} ({r['municipio']}, {r['isla']})")
    print(f"Muestra No obtiene:")
    for r in [x for x in all_records if x['obtiene_destino'] == 'No'][:2]:
        print(f"  #{r['orden']} {r['nombre']} | {r['especialidad']}")

if __name__ == "__main__":
    main()
