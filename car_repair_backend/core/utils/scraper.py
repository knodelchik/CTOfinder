import requests
from bs4 import BeautifulSoup
import re

def parse_unda_car(plate: str):
    clean_plate = plate.upper().replace(" ", "").strip()
    url = f"http://www.unda.com.ua/gosnomer-UA/{clean_plate}/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None, "Номер не знайдено або помилка сайту"

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

        # --- СТРАТЕГІЯ 1: Зелений блок (alert-success) ---
        # Це найнадійніше місце. Там зазвичай текст:
        # "... закреплен за TOYOTA HIGHLANDER • 2020 • 5TDD..."
        alert_box = soup.find('div', class_='alert-success')
        
        if alert_box:
            # Шукаємо всі жирні теги <b>, там зазвичай лежать дані
            b_tags = alert_box.find_all('b')
            
            # Фільтруємо теги, щоб прибрати "31 декабря 2025 года" (це дата актуальності бази)
            # Шукаємо той <b>, що містить назву авто (зазвичай він другий або третій, але краще за контентом)
            
            # Збираємо весь текст з блоку для аналізу
            alert_text = alert_box.get_text(strip=True)
            
            # Спробуємо розпарсити рядок "закреплен за [MODEL] • [YEAR] • [VIN]"
            if "закреплен за" in alert_text:
                try:
                    # Розбиваємо текст після фрази "закреплен за"
                    parts = alert_text.split("закреплен за")[1].split("•")
                    
                    if len(parts) >= 1:
                        data['brand_model'] = parts[0].strip()
                    if len(parts) >= 2:
                        # Шукаємо рік (4 цифри)
                        year_match = re.search(r'\d{4}', parts[1])
                        if year_match:
                            data['year'] = int(year_match.group(0))
                    if len(parts) >= 3:
                         # VIN часто йде третім
                         possible_vin = parts[2].strip()
                         # Перевірка, що це схоже на VIN (довге слово без пробілів)
                         if len(possible_vin) > 10: 
                             data['vin'] = possible_vin
                except Exception as e:
                    print(f"Alert parsing error: {e}")

        # --- СТРАТЕГІЯ 2: Детальний список (dt/dd) ---
        # Проходимо по сторінці, щоб знайти колір, паливо та інші деталі, 
        # або якщо Стратегія 1 не спрацювала повністю.
        
        # Шукаємо блоки <div class='font'>...</div> які містять dt/dd
        font_divs = soup.find_all('div', class_='font')
        
        # Також шукаємо просто всі dt на сторінці
        all_dts = soup.find_all('dt')
        
        # Об'єднуємо джерела для пошуку
        elements_to_check = []
        
        # Додаємо dt елементи
        for dt in all_dts:
            dd = dt.find_next_sibling('dd')
            if dd:
                elements_to_check.append((dt.get_text(strip=True), dd.get_text(strip=True)))

        for key_raw, value in elements_to_check:
            key = key_raw.lower().replace(':', '').strip()
            
            # Якщо ми ще не знайшли Марку (Стратегія 1 провалилась), шукаємо тут
            if not data['brand_model'] and ("марка" in key and "модель" in key):
                 data['brand_model'] = value

            if not data['year'] and (("рік" in key or "год" in key) and ("випуску" in key or "выпуска" in key)):
                try:
                    year_match = re.search(r'\d{4}', value)
                    if year_match: data['year'] = int(year_match.group(0))
                except: pass

            if not data['vin'] and ("vin" in key or "він" in key):
                data['vin'] = value

            # Додаткові поля, яких немає в зеленому блоці
            if ("цвет" in key or "колір" in key): 
                data['color'] = value
            elif ("тип" in key or "тіп" in key): 
                data['type'] = value
            elif ("кузов" in key): 
                data['body'] = value
            elif ("паливо" in key or "топливо" in key): 
                data['fuel'] = value
            elif ("объем" in key or "об'єм" in key): 
                data['engine_volume'] = value
            elif ("вес" in key or "вага" in key): 
                data['weight'] = value

        # Фінальна чистка даних
        if data['brand_model']:
             # Іноді туди потрапляє сміття, якщо парсинг пішов не так
             if "Операция" in data['brand_model']: 
                 data['brand_model'] = "Невідома модель" # Фолбек

        if not data['brand_model'] and not data['vin']:
             return None, "Дані про авто не знайдено."

        return data, None

    except Exception as e:
        print(f"Scraping Error: {e}")
        return None, "Помилка сервера при парсингу"