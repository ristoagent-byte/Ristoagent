"""
RistoAgent - Scraper ristoranti Milano
Ricerche multiple per zona/tipo per aggirare i limiti di paginazione.

Setup:
  pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time

# ─── CONFIGURAZIONE ────────────────────────────────────────────────────────────
GOOGLE_API_KEY = "AIzaSyCEbVFlT2jWwCL8pIQ4SlxkwykhvbyPVFw"
OUTPUT_FILE    = "ristoranti_milano.csv"
MAX_RESULTS    = 500
# ───────────────────────────────────────────────────────────────────────────────

# Ricerche diverse per ottenere più risultati (20 per ricerca)
QUERIES = [
    "ristorante Milano centro",
    "ristorante Milano Navigli",
    "ristorante Milano Brera",
    "ristorante Milano Porta Romana",
    "ristorante Milano Isola",
    "ristorante Milano Loreto",
    "ristorante Milano Moscova",
    "ristorante Milano Porta Venezia",
    "ristorante Milano Città Studi",
    "ristorante Milano Ticinese",
    "ristorante Milano Porta Genova",
    "ristorante Milano Garibaldi",
    "pizzeria Milano centro",
    "pizzeria Milano Navigli",
    "pizzeria Milano Brera",
    "trattoria Milano",
    "osteria Milano",
    "ristorante pesce Milano",
    "ristorante carne Milano",
    "ristorante italiano Milano",
]

BASE_URL = "https://maps.googleapis.com/maps/api/place"
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
HEADERS  = {
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


def scrape_restaurants():
    results = []
    seen_ids = set()

    for query in QUERIES:
        if len(results) >= MAX_RESULTS:
            break

        print(f"\n🔍 {query}")
        places = places_search(query)

        for place in places:
            if len(results) >= MAX_RESULTS:
                break
            pid = place.get("place_id")
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)

            details  = place_details(pid)
            name     = details.get("name", place.get("name", ""))
            address  = details.get("formatted_address", "")
            phone    = details.get("formatted_phone_number", "")
            website  = details.get("website", "")
            rating   = details.get("rating", "")
            reviews  = details.get("user_ratings_total", "")

            emails    = find_emails(website) if website else []
            email_str = "; ".join(emails)

            results.append({
                "nome": name, "indirizzo": address, "telefono": phone,
                "sito": website, "email": email_str,
                "rating": rating, "recensioni": reviews,
            })
            print(f"  [{len(results):>3}] {name} — {'✉ ' + email_str if email_str else '(no email)'}")
            time.sleep(0.3)

    # Salva CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["nome", "indirizzo", "telefono", "sito", "email", "rating", "recensioni"])
        writer.writeheader()
        writer.writerows(results)

    with_email = sum(1 for r in results if r["email"])
    print(f"\n✅ Fatto! {len(results)} ristoranti in '{OUTPUT_FILE}'")
    print(f"   📧 Con email: {with_email}  |  Senza: {len(results) - with_email}")


if __name__ == "__main__":
    scrape_restaurants()
