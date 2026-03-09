import requests

URL = "https://dqptchwkulrzcpofuafk.supabase.co/rest/v1/adjudicaciones"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcHRjaHdrdWxyemNwb2Z1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk1MDcsImV4cCI6MjA4ODU3NTUwN30.IeNQhPV8JkzU69uPb6Smfao_goqUeiOCqdmhg8Cdqm4"

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def clear_table():
    print("Borrando adjudicaciones antiguas...")
    # Se debe usar un filtro en la URL para borrar todo, ej: id=gt.0 si id es serial positivo
    res = requests.delete(URL + "?id=gt.0", headers=HEADERS)
    if res.status_code in (200, 204):
        print("Tabla limpiada con éxito!")
    else:
        print(f"Error borrando tabla: {res.status_code} - {res.text}")

if __name__ == "__main__":
    clear_table()
