"""
RistoAgent - Scraper ristoranti multi-città via OpenStreetMap (GRATIS)
Usa Overpass API: nessuna API key, nessun costo.

Per ogni ristorante estrae email direttamente dai tag OSM,
e in fallback visita il sito per trovarle.

Uso:
  python scraper_osm.py milano
  python scraper_osm.py roma
  python scraper_osm.py napoli
  python scraper_osm.py torino
  python scraper_osm.py bologna
  python scraper_osm.py firenze
  python scraper_osm.py tutte

Setup:
  pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
import sys

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TIMEOUT_QUERY = 90
TIMEOUT_WEB = 8

CITTA = ["milano", "roma", "napoli", "torino", "bologna", "firenze"]

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def overpass_query(citta: str) -> str:
    """Restaurant, cafe, pizzeria, bar dentro i confini del comune"""
    citta_cap = citta.capitalize()
    return f"""
[out:json][timeout:{TIMEOUT_QUERY}];
area["name"="{citta_cap}"]["admin_level"~"6|8"]->.a;
(
  nwr["amenity"="restaurant"](area.a);
  nwr["amenity"="cafe"](area.a);
  nwr["amenity"="bar"](area.a);
  nwr["cuisine"="pizza"](area.a);
);
out center tags;
"""


def fetch_from_osm(citta: str) -> list:
    print(f"\n🌍 Interrogo OpenStreetMap per {citta.upper()}...")
    q = overpass_query(citta)
    try:
        r = requests.post(OVERPASS_URL, data={"data": q}, timeout=TIMEOUT_QUERY + 10)
        r.raise_for_status()
    except Exception as e:
        print(f"❌ Errore Overpass: {e}")
        return []

    data = r.json()
    elements = data.get("elements", [])
    print(f"   ✅ {len(elements)} locali trovati")

    results = []
    for el in elements:
        tags = el.get("tags", {})
        nome = tags.get("name")
        if not nome:
            continue

        # Indirizzo ricostruito dai tag
        street = tags.get("addr:street", "")
        housenum = tags.get("addr:housenumber", "")
        postcode = tags.get("addr:postcode", "")
        city = tags.get("addr:city", citta.capitalize())
        indirizzo = f"{street} {housenum}, {postcode} {city}".strip(", ").strip()

        website = (
            tags.get("website") or tags.get("contact:website") or ""
        ).strip()
        phone = (
            tags.get("phone") or tags.get("contact:phone") or ""
        ).strip()
        email_osm = (
            tags.get("email") or tags.get("contact:email") or ""
        ).strip()
        cuisine = tags.get("cuisine", "")
        amenity = tags.get("amenity", "")

        results.append({
            "citta": citta,
            "nome": nome,
            "amenity": amenity,
            "cuisine": cuisine,
            "indirizzo": indirizzo,
            "telefono": phone,
            "sito": website,
            "email_osm": email_osm,
            "email_sito": "",
        })

    return results


def find_emails_on_site(url: str) -> list:
    """Visita il sito del ristorante e cerca email nel HTML"""
    if not url:
        return []
    if not url.startswith("http"):
        url = "https://" + url

    def scrape(u):
        try:
            r = requests.get(u, headers=HEADERS, timeout=TIMEOUT_WEB)
            text = BeautifulSoup(r.text, "html.parser").get_text(" ")
            found = list(set(EMAIL_RE.findall(text)))
            return [
                e for e in found
                if not any(x in e.lower() for x in [
                    "example", "test", "noreply", "no-reply", "sentry",
                    "wixpress", "wordpress", "schema.org", "domain", "@2x",
                    "sentry.io", "googlemail", "facebook", "instagram",
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


def enrich_with_site_emails(results: list, limit_sites: int = 200) -> list:
    """Per i ristoranti senza email OSM ma con sito, fa scraping leggero."""
    to_visit = [r for r in results if not r["email_osm"] and r["sito"]][:limit_sites]
    print(f"\n🌐 Scansiono {len(to_visit)} siti per trovare email aggiuntive...")

    for i, r in enumerate(to_visit, 1):
        emails = find_emails_on_site(r["sito"])
        if emails:
            r["email_sito"] = "; ".join(emails)
            print(f"  [{i}/{len(to_visit)}] ✉ {r['nome']} → {r['email_sito']}")
        else:
            print(f"  [{i}/{len(to_visit)}]   {r['nome']} — nessuna email")
        time.sleep(0.4)

    return results


def scrape_city(citta: str, visit_sites: bool = True):
    if citta not in CITTA:
        print(f"❌ Città '{citta}' non configurata. Disponibili: {', '.join(CITTA)}")
        return

    results = fetch_from_osm(citta)
    if not results:
        return

    if visit_sites:
        results = enrich_with_site_emails(results)

    output_file = f"ristoranti_osm_{citta}.csv"
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "citta", "nome", "amenity", "cuisine", "indirizzo",
            "telefono", "sito", "email_osm", "email_sito",
        ])
        writer.writeheader()
        writer.writerows(results)

    with_email_osm = sum(1 for r in results if r["email_osm"])
    with_email_sito = sum(1 for r in results if r["email_sito"])
    with_any = sum(1 for r in results if r["email_osm"] or r["email_sito"])
    with_site = sum(1 for r in results if r["sito"])

    print(f"\n✅ {citta}: {len(results)} locali in '{output_file}'")
    print(f"   📧 Email da OSM: {with_email_osm}")
    print(f"   🌐 Email dai siti: {with_email_sito}")
    print(f"   ✉️  Totale con email: {with_any}")
    print(f"   🔗 Con sito ma senza email: {with_site - with_any}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scraper_osm.py <citta> [--no-web]")
        print(f"Città: {', '.join(CITTA)}, oppure 'tutte'")
        sys.exit(1)

    target = sys.argv[1].lower()
    visit_sites = "--no-web" not in sys.argv

    if target == "tutte":
        for c in CITTA:
            scrape_city(c, visit_sites=visit_sites)
    else:
        scrape_city(target, visit_sites=visit_sites)
