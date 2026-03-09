import pdfplumber
import re
import csv
import sys

PDFS = [
    { "path": "2024_anexo_II_vacantes_iniciales_secundaria.pdf", "curso": "2024-25" },
    { "path": "2025_anexo_ii_vacantes_defini_secundaria.pdf", "curso": "2025-26" }
]
OUT_PATH = "vacantes_iniciales.csv"
CSV_ADJ = "adjudicaciones.csv"

def parse_vacantes():
    # Load island mappings from adjudicaciones.csv
    centro_isla = {}
    if True:
        try:
            with open(CSV_ADJ, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['cod_centro'] and row['isla']:
                        centro_isla[row['cod_centro']] = row['isla']
        except Exception as e:
            print(f"No se pudo cargar {CSV_ADJ} para mapped de islas: {e}")

    records = []
    
    # regexes
    re_specialty = re.compile(r'^(\d{3})\s+(.+)$')
    re_stats = re.compile(r'^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$')
    re_centro = re.compile(r'^(\d{8})\s+(.+)$')

    for file_info in PDFS:
        curso = file_info["curso"]
        filepath = file_info["path"]
        print(f"Procesando {filepath}...")
        
        current_specialty_code = ""
        current_specialty_name = ""
        
        try:
            with pdfplumber.open(filepath) as pdf:
                pending_stats = None
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text: continue
                    
                    lines = text.strip().split('\n')
                    for line in lines:
                        line = line.strip()
                        if not line: continue
                        if "Anexo II" in line or "Ordenado por" in line or "CENTRO" in line or "Vacantes" in line:
                            continue
                            
                        # specialty
                        if len(line.split(' ', 1)[0]) == 3 and line.split(' ', 1)[0].isdigit():
                            m_spec = re_specialty.match(line)
                            if m_spec:
                                current_specialty_code = m_spec.group(1)
                                current_specialty_name = m_spec.group(2)
                                pending_stats = None
                                continue
                        
                        # stats
                        m_stats = re_stats.match(line)
                        if m_stats:
                            pending_stats = {
                                'comp': int(m_stats.group(1)),
                                'plant': int(m_stats.group(2)),
                                'ocup': int(m_stats.group(3)),
                                'vac': int(m_stats.group(4))
                            }
                            continue
                            
                        # centro
                        m_centro = re_centro.match(line)
                        if m_centro and pending_stats:
                            cod_centro = m_centro.group(1)
                            centro = m_centro.group(2)
                            
                            isla = centro_isla.get(cod_centro, "")
                            # Fallback if island still empty logic
                            if not isla:
                                if cod_centro.startswith("35"): isla = "GC_FU_LZ_UNK"
                                elif cod_centro.startswith("38"): isla = "TF_LP_GO_HI_UNK"
                                
                            records.append({
                                'curso': curso,
                                'especialidad_cod': current_specialty_code,
                                'especialidad_nombre': current_specialty_name,
                                'cod_centro': cod_centro,
                                'centro': centro,
                                'isla': isla,
                                'comp': pending_stats['comp'],
                                'plant': pending_stats['plant'],
                                'ocup': pending_stats['ocup'],
                                'vac': pending_stats['vac']
                            })
                            pending_stats = None
        except Exception as e:
            print(f"Error procesando {filepath}: {e}")

    print(f"\nExtracted {len(records)} records in total.")
    if records:
        print("Writing CSV...")
        with open(OUT_PATH, 'w', newline='', encoding='utf-8-sig') as f:
            fieldnames = records[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)

if __name__ == "__main__":
    parse_vacantes()
