"""
Unisce i CSV OSM delle 6 città in un'unica lista pulita.

- Tiene solo righe con email valida (email_osm non vuoto)
- Rimuove email spam-like (noreply, PEC, facebook, ecc.)
- Rimuove duplicati cross-città
- Esclude email già inviate (da invii_log.json e da contatti_email.csv)
- Output: contatti_osm_puliti.csv
"""

import csv, json, re, sys, io
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = Path(__file__).parent
CITTA = ["milano", "roma", "napoli", "torino", "bologna", "firenze"]
OUTPUT = BASE / "contatti_osm_puliti.csv"

BLACKLIST_SUBSTR = [
    "noreply", "no-reply", "test@", "example", "wixpress",
    "schema.org", "facebook", "instagram", "googlemail",
    "@pec.", "@sarenet", "sentry",
]
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def is_valid_email(email: str) -> bool:
    if not email:
        return False
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        return False
    for bad in BLACKLIST_SUBSTR:
        if bad in email:
            return False
    return True


def load_already_sent() -> set:
    """Email già inviate (dal log della campagna attuale)."""
    sent = set()
    log_path = BASE / "invii_log.json"
    if log_path.exists():
        log = json.loads(log_path.read_text(encoding="utf-8"))
        for key in ("step1", "step2", "step3"):
            for e in log.get(key, []):
                sent.add(e.strip().lower())
    return sent


def load_existing_contacts() -> set:
    """Email già in contatti_email.csv (campagna Milano in corso)."""
    existing = set()
    path = BASE / "contatti_email.csv"
    if path.exists():
        with open(path, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                e = (row.get("email") or "").strip().lower()
                if e:
                    # Può contenere più email separate da ;
                    for part in e.split(";"):
                        existing.add(part.strip())
    return existing


def parse_emails_field(value: str) -> list:
    """Un record OSM può avere più email separate da ; — ritorna la prima valida."""
    if not value:
        return []
    return [e.strip().lower() for e in value.split(";") if e.strip()]


def main():
    already_sent = load_already_sent()
    existing = load_existing_contacts()
    print(f"Escludo: {len(already_sent)} email già inviate + {len(existing)} email già in campagna Milano")

    seen = set()
    pulito = []
    stats_per_citta = {c: {"totale": 0, "scartati": 0, "duplicati": 0, "esclusi": 0} for c in CITTA}

    for citta in CITTA:
        src = BASE / f"ristoranti_osm_{citta}.csv"
        if not src.exists():
            print(f"  manca: {src}")
            continue

        with open(src, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                emails_raw = parse_emails_field(row.get("email_osm", ""))
                valide = [e for e in emails_raw if is_valid_email(e)]
                if not valide:
                    stats_per_citta[citta]["scartati"] += 1
                    continue

                email = valide[0]

                # Escludi se già inviata o già in lista campagna
                if email in already_sent or email in existing:
                    stats_per_citta[citta]["esclusi"] += 1
                    continue

                # Dedupe cross-città
                if email in seen:
                    stats_per_citta[citta]["duplicati"] += 1
                    continue
                seen.add(email)

                pulito.append({
                    "citta": citta,
                    "nome": row.get("nome", "").strip(),
                    "email": email,
                    "indirizzo": row.get("indirizzo", ""),
                    "telefono": row.get("telefono", ""),
                    "sito": row.get("sito", ""),
                    "amenity": row.get("amenity", ""),
                    "cuisine": row.get("cuisine", ""),
                })
                stats_per_citta[citta]["totale"] += 1

    # Ordina: per città, poi ha sito (siti prima), poi nome
    pulito.sort(key=lambda r: (r["citta"], 0 if r["sito"] else 1, r["nome"].lower()))

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["citta", "nome", "email", "indirizzo", "telefono", "sito", "amenity", "cuisine"])
        w.writeheader()
        w.writerows(pulito)

    print("\n" + "=" * 60)
    print(f"LISTA PULITA salvata in: {OUTPUT.name}")
    print("=" * 60)
    print(f"{'CITTÀ':10} {'VALIDI':>7} {'DUPLICATI':>10} {'ESCLUSI':>8} {'NO-EMAIL':>9}")
    print("-" * 60)
    tot = 0
    for c in CITTA:
        s = stats_per_citta[c]
        tot += s["totale"]
        print(f"{c.upper():10} {s['totale']:>7} {s['duplicati']:>10} {s['esclusi']:>8} {s['scartati']:>9}")
    print("-" * 60)
    print(f"{'TOTALE':10} {tot:>7}")


if __name__ == "__main__":
    main()
