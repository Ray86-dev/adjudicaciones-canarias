import csv
import json
import requests
import time

URL = "https://dqptchwkulrzcpofuafk.supabase.co/rest/v1/adjudicaciones"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcHRjaHdrdWxyemNwb2Z1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk1MDcsImV4cCI6MjA4ODU3NTUwN30.IeNQhPV8JkzU69uPb6Smfao_goqUeiOCqdmhg8Cdqm4"

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def upload_to_supabase():
    with open('adjudicaciones.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        batch = []
        batch_size = 500
        count = 0
        
        for row in reader:
            # Parse numbers and booleans
            try:
                orden_val = int(row['orden']) if row['orden'] else None
            except:
                orden_val = None
                
            record = {
                "orden": orden_val,
                "nombre": row['nombre'],
                "tipo_participante": row['tipo_participante'],
                "especialidad": row['especialidad'],
                "obtiene_destino": True if row['obtiene_destino'] == 'Sí' else False,
                "colectivo": row['colectivo'],
                "cod_centro": row['cod_centro'],
                "centro": row['centro'],
                "municipio": row['municipio'],
                "isla": row['isla'],
                "ambito_preferente": row['ambito_preferente'],
                "tipo_comision": row['tipo_comision']
            }
            batch.append(record)
            
            if len(batch) >= batch_size:
                res = requests.post(URL, headers=HEADERS, json=batch)
                if res.status_code not in (200, 201):
                    print("Error:", res.text)
                else:
                    count += len(batch)
                    print(f"Subidos {count} registros...")
                batch = []
                time.sleep(0.5)

        # Upload remaining
        if batch:
            res = requests.post(URL, headers=HEADERS, json=batch)
            if res.status_code not in (200, 201):
                print("Error:", res.text)
            else:
                count += len(batch)
                print(f"Subidos {count} registros...")

    print("¡Subida completada o finalizada con errores!")

if __name__ == "__main__":
    upload_to_supabase()
