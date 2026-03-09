import csv
import requests
import time

URL = "https://dqptchwkulrzcpofuafk.supabase.co/rest/v1/vacantes_iniciales"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcHRjaHdrdWxyemNwb2Z1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk1MDcsImV4cCI6MjA4ODU3NTUwN30.IeNQhPV8JkzU69uPb6Smfao_goqUeiOCqdmhg8Cdqm4"

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def upload_to_supabase():
    print("Borrando vacantes antiguas...")
    res_del = requests.delete(URL + "?id=gt.0", headers=HEADERS)
    if res_del.status_code not in (200, 204):
        print(f"Error borrando tabla vacantes_iniciales, quizas aún no está creada: {res_del.text}")
        return

    with open('vacantes_iniciales.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        batch = []
        batch_size = 500
        count = 0
        
        for row in reader:
            try: comp = int(row['comp'])
            except: comp = 0
            try: plant = int(row['plant'])
            except: plant = 0
            try: ocup = int(row['ocup'])
            except: ocup = 0
            try: vac = int(row['vac'])
            except: vac = 0
                
            record = {
                "curso": row['curso'],
                "especialidad_cod": row['especialidad_cod'],
                "especialidad_nombre": row['especialidad_nombre'],
                "cod_centro": row['cod_centro'],
                "centro": row['centro'],
                "isla": row['isla'],
                "comp": comp,
                "plantilla": plant,
                "ocupadas": ocup,
                "vacantes": vac
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
                # Evitar throttling
                time.sleep(0.5)

        if batch:
            res = requests.post(URL, headers=HEADERS, json=batch)
            if res.status_code not in (200, 201):
                print("Error:", res.text)
            else:
                count += len(batch)
                print(f"Subidos {count} registros...")

    print("¡Subida completada!")

if __name__ == "__main__":
    upload_to_supabase()
