# backend/core/utils/scraper.py
import requests
from bs4 import BeautifulSoup
import re

def parse_unda_car(plate: str):
    clean_plate = plate.upper().replace(" ", "").strip()
    # Якщо номер короткий, немає сенсу навіть питати сайт
    if len(clean_plate) < 3:
        return None, "Номер занадто короткий"

    url = f"http://www.unda.com.ua/gosnomer-UA/{clean_plate}/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        # Unda іноді повертає 200 навіть якщо нічого не знайдено, але перевіримо статус
        if response.status_code != 200:
            return None, "Помилка доступу до бази номерів"

        soup = BeautifulSoup(response.content, 'lxml')

        data = {
            "license_plate": clean_plate,
            "brand_model": "",
            "year": None,
            "vin": "",
            "color": "",
            "type": "",
            "body": "",
            "fuel": "",
            "engine_volume": "",
            "weight": ""
        }

        # --- СТРАТЕГІЯ 1: Зелений блок (успішний пошук) ---
        alert_box = soup.find('div', class_='alert-success')
        
        if alert_box:
            alert_text = alert_box.get_text(strip=True)
            
            if "закреплен за" in alert_text:
                try:
                    parts = alert_text.split("закреплен за")[1].split("•")
                    
                    if len(parts) >= 1:
                        data['brand_model'] = parts[0].strip()
                    if len(parts) >= 2:
                        year_match = re.search(r'\d{4}', parts[1])
                        if year_match:
                            data['year'] = int(year_match.group(0))
                    if len(parts) >= 3:
                         possible_vin = parts[2].strip()
                         if len(possible_vin) > 8: 
                             data['vin'] = possible_vin
                except Exception as e:
                    print(f"Alert parsing error: {e}")

        # --- СТРАТЕГІЯ 2: Детальний список (dt/dd) ---
        all_dts = soup.find_all('dt')
        elements_to_check = []
        
        for dt in all_dts:
            dd = dt.find_next_sibling('dd')
            if dd:
                elements_to_check.append((dt.get_text(strip=True), dd.get_text(strip=True)))

        for key_raw, value in elements_to_check:
            key = key_raw.lower().replace(':', '').strip()
            
            if not data['brand_model'] and ("марка" in key and "модель" in key):
                 data['brand_model'] = value

            if not data['year'] and (("рік" in key or "год" in key) and ("випуску" in key)):
                try:
                    year_match = re.search(r'\d{4}', value)
                    if year_match: data['year'] = int(year_match.group(0))
                except: pass

            if not data['vin'] and ("vin" in key or "він" in key):
                data['vin'] = value

            # Додаткові поля
            if ("цвет" in key or "колір" in key): data['color'] = value
            elif ("тип" in key or "тіп" in key): data['type'] = value
            elif ("кузов" in key): data['body'] = value
            elif ("паливо" in key or "топливо" in key): data['fuel'] = value
            elif ("объем" in key or "об'єм" in key): data['engine_volume'] = value
            elif ("вес" in key or "вага" in key): data['weight'] = value

        # Очистка від сміття
        if data['brand_model'] and "Операция" in data['brand_model']:
             data['brand_model'] = ""

        # Перевірка результату
        if not data['brand_model'] and not data['vin']:
             return None, "Авто не знайдено в базі"

        return data, None

    except Exception as e:
        print(f"Scraping Error: {e}")
        return None, "Помилка сервера при обробці запиту"