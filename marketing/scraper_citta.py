"""
RistoAgent - Scraper ristoranti multi-città
Stessa logica di scraper.py ma parametrizzato per città.

Uso:
  python scraper_citta.py roma
  python scraper_citta.py napoli
  python scraper_citta.py torino
  python scraper_citta.py bologna
  python scraper_citta.py firenze
  python scraper_citta.py tutte       # esegue tutte le città in sequenza

Setup:
  pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
import sys

# ─── CONFIGURAZIONE ────────────────────────────────────────────────────────────
GOOGLE_API_KEY = "AIzaSyCEbVFlT2jWwCL8pIQ4SlxkwykhvbyPVFw"
MAX_RESULTS_PER_CITY = 500
# ───────────────────────────────────────────────────────────────────────────────

# Zone per città: ogni ricerca Google Places ritorna max 20 risultati
# Quindi più zone = più contatti unici
ZONE_PER_CITTA = {
    "milano": [
        "ristorante Milano centro", "ristorante Milano Navigli", "ristorante Milano Brera",
        "ristorante Milano Porta Romana", "ristorante Milano Isola", "ristorante Milano Loreto",
        "ristorante Milano Moscova", "ristorante Milano Porta Venezia", "ristorante Milano Città Studi",
        "ristorante Milano Ticinese", "ristorante Milano Porta Genova", "ristorante Milano Garibaldi",
        "pizzeria Milano centro", "pizzeria Milano Navigli", "pizzeria Milano Brera",
        "trattoria Milano", "osteria Milano", "ristorante pesce Milano",
        "ristorante carne Milano", "ristorante italiano Milano",
    ],
    "roma": [
        "ristorante Roma centro", "ristorante Roma Trastevere", "ristorante Roma Prati",
        "ristorante Roma Testaccio", "ristorante Roma Monti", "ristorante Roma Parioli",
        "ristorante Roma San Giovanni", "ristorante Roma Pigneto", "ristorante Roma Ostiense",
        "ristorante Roma Tuscolano", "ristorante Roma EUR", "ristorante Roma Flaminio",
        "ristorante Roma Esquilino", "pizzeria Roma Trastevere", "pizzeria Roma centro",
        "pizzeria Roma Prati", "trattoria Roma", "osteria Roma",
        "ristorante pesce Roma", "ristorante romanesco Roma",
    ],
    "napoli": [
        "ristorante Napoli centro", "ristorante Napoli Chiaia", "ristorante Napoli Vomero",
        "ristorante Napoli Posillipo", "ristorante Napoli Mergellina", "ristorante Napoli Spaccanapoli",
        "ristorante Napoli Quartieri Spagnoli", "ristorante Napoli Fuorigrotta", "ristorante Napoli Vasto",
        "ristorante Napoli Toledo", "ristorante Napoli Sanità", "ristorante Napoli Porto",
        "pizzeria Napoli centro", "pizzeria Napoli Chiaia", "pizzeria Napoli Vomero",
        "pizzeria napoletana Napoli", "trattoria Napoli", "osteria Napoli",
        "ristorante pesce Napoli", "ristorante tipico Napoli",
    ],
    "torino": [
        "ristorante Torino centro", "ristorante Torino San Salvario", "ristorante Torino Quadrilatero",
        "ristorante Torino Crocetta", "ristorante Torino Vanchiglia", "ristorante Torino Cit Turin",
        "ristorante Torino San Donato", "ristorante Torino Borgo Po", "ristorante Torino Aurora",
        "ristorante Torino Lingotto", "ristorante Torino Santa Rita", "ristorante Torino Barriera",
        "pizzeria Torino centro", "pizzeria Torino San Salvario", "trattoria Torino",
        "osteria Torino", "ristorante piemontese Torino", "ristorante pesce Torino",
        "ristorante carne Torino", "ristorante tipico Torino",
    ],
    "bologna": [
        "ristorante Bologna centro", "ristorante Bologna Università", "ristorante Bologna Santo Stefano",
        "ristorante Bologna Porta Saragozza", "ristorante Bologna Porta Galliera",
        "ristorante Bologna Bolognina", "ristorante Bologna San Vitale", "ristorante Bologna San Donato",
        "ristorante Bologna Murri", "ristorante Bologna Marconi",
        "pizzeria Bologna centro", "trattoria Bologna", "osteria Bologna",
        "ristorante bolognese Bologna", "ristorante tipico Bologna", "ristorante pesce Bologna",
        "ristorante carne Bologna", "ristorante emiliano Bologna",
        "tagliatelle Bologna", "tortellini Bologna",
    ],
    "firenze": [
        "ristorante Firenze centro", "ristorante Firenze Oltrarno", "ristorante Firenze Santa Croce",
        "ristorante Firenze San Niccolò", "ristorante Firenze San Frediano", "ristorante Firenze Campo di Marte",
        "ristorante Firenze Santo Spirito", "ristorante Firenze Statuto", "ristorante Firenze Cure",
        "ristorante Firenze Novoli",
        "pizzeria Firenze centro", "trattoria Firenze", "osteria Firenze",
        "ristorante toscano Firenze", "ristorante tipico Firenze", "ristorante pesce Firenze",
        "ristorante fiorentino Firenze", "bistecca Firenze",
        "ristorante carne Firenze", "ristorante pasta Firenze",
    ],
}

BASE_URL = "https://maps.googleapis.com/maps/api/place"
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def places_search(query: str) -> list:
    params = {"key": GOOGLE_API_KEY, "language": "it", "query": query}
    r = requests.get(f"{BASE_URL}/textsearch/json", params=params, timeout=10)
    data = r.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        print(f"  ⚠️  {data.get('status')}: {data.get('error_message', '')}")
        return []
    return data.get("results", [])


def place_details(place_id: str) -> dict:
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total",
        "language": "it",
        "key": GOOGLE_API_KEY,
    }
    r = requests.get(f"{BASE_URL}/details/json", params=params, timeout=10)
    return r.json().get("result", {})


def find_emails(url: str) -> list:
    def scrape(u):
        try:
            r = requests.get(u, headers=HEADERS, timeout=8)
            text = BeautifulSoup(r.text, "html.parser").get_text(" ")
            found = list(set(EMAIL_RE.findall(text)))
            return [
                e for e in found
                if not any(x in e.lower() for x in [
                    "example", "test", "noreply", "no-reply", "sentry",
                    "wixpress", "wordpress", "schema.org", "domain", "@2x",
                ])
            ][:3]
        except Exception:
            return []

    emails = scrape(url)
    if not emails:
        for path in ["/contatti", "/contattaci", "/contact", "/contacts"]:
            emails = scrape(url.rstrip("/") + path)
            if emails:
                break
    return emails


def scrape_city(citta: str):
    queries = ZONE_PER_CITTA.get(citta)
    if not queries:
        print(f"❌ Città '{citta}' non configurata. Disponibili: {', '.join(ZONE_PER_CITTA.keys())}")
        return

    output_file = f"ristoranti_{citta}.csv"
    print(f"\n🏙️  Scraping {citta.upper()} → {output_file}")
    print(f"   {len(queries)} zone, max {MAX_RESULTS_PER_CITY} ristoranti\n")

    results = []
    seen_ids = set()

    for query in queries:
        if len(results) >= MAX_RESULTS_PER_CITY:
            break

        print(f"🔍 {query}")
        places = places_search(query)

        for place in places:
            if len(results) >= MAX_RESULTS_PER_CITY:
                break
            pid = place.get("place_id")
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)

            details = place_details(pid)
            name = details.get("name", place.get("name", ""))
            address = details.get("formatted_address", "")
            phone = details.get("formatted_phone_number", "")
            website = details.get("website", "")
            rating = details.get("rating", "")
            reviews = details.get("user_ratings_total", "")

            emails = find_emails(website) if website else []
            email_str = "; ".join(emails)

            results.append({
                "citta": citta, "nome": name, "indirizzo": address, "telefono": phone,
                "sito": website, "email": email_str,
                "rating": rating, "recensioni": reviews,
            })
            print(f"  [{len(results):>3}] {name} — {'✉ ' + email_str if email_str else '(no email)'}")
            time.sleep(0.3)

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["citta", "nome", "indirizzo", "telefono", "sito", "email", "rating", "recensioni"])
        writer.writeheader()
        writer.writerows(results)

    with_email = sum(1 for r in results if r["email"])
    print(f"\n✅ {citta}: {len(results)} ristoranti in '{output_file}'")
    print(f"   📧 Con email: {with_email}  |  Senza: {len(results) - with_email}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scraper_citta.py <citta>")
        print(f"Città: {', '.join(ZONE_PER_CITTA.keys())}, oppure 'tutte'")
        sys.exit(1)

    target = sys.argv[1].lower()
    if target == "tutte":
        for citta in ZONE_PER_CITTA.keys():
            scrape_city(citta)
    else:
        scrape_city(target)
