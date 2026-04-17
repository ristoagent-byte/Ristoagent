"""
Invio cold email multi-città — legge da contatti_osm_puliti.csv.
Ogni city ha la sua lista; --citta e --limit controllano quanto inviare.

Esempi:
  python invia_osm.py --citta milano --limit 50
  python invia_osm.py --citta roma --limit 50 --start 0
  python invia_osm.py --citta tutte --limit 50      # 50 per ogni città
  python invia_osm.py --dry --citta milano --limit 5  # prova senza inviare
"""

import csv, time, argparse, json, sys, io
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = Path(__file__).parent

FROM_EMAIL = "Alex <info@ristoagent.com>"
DELAY = 2
CONTATTI_CSV = BASE / "contatti_osm_puliti.csv"
LOG_PATH = BASE / "invii_osm_log.json"

# Usa lo stesso template Step 1 Tier B (tono neutro, va bene per contatti non rankati)
TEMPLATE_HTML = BASE / "email_template.html"
SUBJECT = "Ho visto {{NOME}} su Google Maps"

CITTA_VALID = ["milano", "roma", "napoli", "torino", "bologna", "firenze"]


def load_env():
    env_path = BASE.parent / ".env.local"
    env = {}
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def load_log():
    if LOG_PATH.exists():
        return json.loads(LOG_PATH.read_text(encoding="utf-8"))
    return {"inviati": [], "errori": []}


def save_log(log):
    LOG_PATH.write_text(json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")


def load_contacts_city(citta: str) -> list:
    contacts = []
    with open(CONTATTI_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["citta"] == citta:
                contacts.append(row)
    return contacts


def build_subject(nome: str) -> str:
    return SUBJECT.replace("{{NOME}}", nome)


def build_html(nome: str) -> str:
    html = TEMPLATE_HTML.read_text(encoding="utf-8")
    return html.replace("{{NOME_RISTORANTE}}", nome)


def build_text(nome: str) -> str:
    return f"""Buongiorno,

mi chiamo Alex e ho sviluppato RistoAgent, un assistente AI per ristoranti come {nome}.

In breve: un bot Telegram che risponde ai clienti 24/7, gestisce le prenotazioni e le sincronizza con Google Calendar.

Offerta Founding Members (solo 20 posti):
- Piano Starter: 19 EUR/mese (poi 29)
- Piano Pro: 29 EUR/mese (poi 49)

15 giorni di prova gratuita, nessuna carta richiesta.
Scopri di piu: https://ristoagent.com

Alex — info@ristoagent.com
"""


def send_email(resend, contact, dry_run: bool):
    nome = contact["nome"]
    email = contact["email"]
    subj = build_subject(nome)

    if dry_run:
        print(f"  [DRY] {contact['citta'][:3].upper()} -> {nome} <{email}>")
        return True

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [email],
            "subject": subj,
            "html": build_html(nome),
            "text": build_text(nome),
        })
        print(f"  OK  {contact['citta'][:3].upper()} -> {nome} <{email}> | ID: {result.get('id', '?')}")
        return True
    except Exception as e:
        print(f"  ERR {contact['citta'][:3].upper()} -> {nome} <{email}> | {e}")
        return False


def run_city(resend_lib, citta: str, limit: int, start: int, dry: bool, log: dict, skip_confirm: bool):
    contacts = load_contacts_city(citta)
    gia_inviati = set(log.get("inviati", []))
    da_inviare = [c for c in contacts if c["email"] not in gia_inviati]

    print(f"\n=== {citta.upper()} ===")
    print(f"Totale lista:  {len(contacts)}")
    print(f"Già inviati:   {len(contacts) - len(da_inviare)}")
    print(f"Da inviare:    {len(da_inviare)}  (invierò max {limit})")

    if not da_inviare:
        print("Niente da inviare.")
        return 0

    batch = da_inviare[start:start + limit]
    if not batch:
        print(f"Batch vuoto (start={start}).")
        return 0

    if not dry and not skip_confirm:
        r = input(f"Confermi invio di {len(batch)} email per {citta.upper()}? (SI): ")
        if r.strip().upper() != "SI":
            print("Annullato.")
            return 0

    inviati = 0
    for i, c in enumerate(batch):
        print(f"[{i+1}/{len(batch)}] ", end="")
        ok = send_email(resend_lib, c, dry)
        if ok and not dry:
            log.setdefault("inviati", []).append(c["email"])
            inviati += 1
            save_log(log)
        elif not ok:
            log.setdefault("errori", []).append({
                "email": c["email"], "citta": citta,
                "data": datetime.now().isoformat(),
            })
            save_log(log)
        if i < len(batch) - 1:
            time.sleep(DELAY)

    print(f"→ {inviati} email inviate per {citta}")
    return inviati


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--citta", required=True, help="milano|roma|napoli|torino|bologna|firenze|tutte")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--dry", action="store_true", help="Non invia, stampa solo")
    parser.add_argument("--yes", action="store_true", help="Salta conferma interattiva")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("RESEND_API_KEY", "")
    if not api_key:
        print("RESEND_API_KEY non trovata in .env.local")
        sys.exit(1)

    try:
        import resend as resend_lib
        resend_lib.api_key = api_key
    except ImportError:
        print("Installa resend: pip install resend")
        sys.exit(1)

    log = load_log()
    totale = 0

    cities = CITTA_VALID if args.citta == "tutte" else [args.citta]
    for c in cities:
        if c not in CITTA_VALID:
            print(f"Città non valida: {c}")
            continue
        totale += run_city(resend_lib, c, args.limit, args.start, args.dry, log, args.yes)

    print(f"\n=== TOTALE sessione: {totale} email ===")


if __name__ == "__main__":
    main()
