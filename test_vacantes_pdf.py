import pdfplumber

def read_sample():
    with pdfplumber.open("2025_anexo_ii_vacantes_defini_secundaria.pdf") as pdf:
        page = pdf.pages[0]
        words = page.extract_words()
        
        # group by 'top' coordinate (round to nearest int)
        lines = {}
        for w in words:
            top = round(w['top'])
            # allow small variations
            found_key = None
            for k in lines.keys():
                if abs(k - top) <= 2:
                    found_key = k
                    break
            if found_key is None:
                found_key = top
                lines[found_key] = []
            lines[found_key].append(w)
            
        # sort keys and print
        sorted_keys = sorted(lines.keys())
        print("--- RECONSTRUCTED LINES ---")
        for k in sorted_keys[:20]:
            line_words = sorted(lines[k], key=lambda x: x['x0'])
            print(" ".join(w['text'] for w in line_words))

if __name__ == "__main__":
    read_sample()
