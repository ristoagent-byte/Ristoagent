"""
Script invio cold email sequenza 3 step — RistoAgent
Strategia: Tier A prima, Tier B dopo. 3 email in 12 giorni.

UTILIZZO:
  pip install resend

  # Test (invia a te stesso)
  python invia_email.py --test

  # EMAIL 1 — Tier A (rating >= 4.5) — Giorno 1 (martedi)
  python invia_email.py --send --step 1 --tier A

  # EMAIL 1 — Tier B (rating 4.0-4.4) — Giorno 3 (giovedi)
  python invia_email.py --send --step 1 --tier B

  # EMAIL 2 (follow-up) — Giorno 5-8
  python invia_email.py --send --step 2 --tier A
  python invia_email.py --send --step 2 --tier B

  # EMAIL 3 (last call) — Giorno 12
  python invia_email.py --send --step 3

  # Riprendi da indice specifico
  python invia_email.py --send --step 1 --tier A --start 20
"""

import csv, time, argparse, json, sys
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).parent

# ─── Config ────────────────────────────────────────────────────────────────────

FROM_EMAIL   = "Alex <info@ristoagent.com>"
DELAY        = 2        # secondi tra email
MAX_PER_RUN  = 70       # limite per sessione

SUBJECTS = {
    1: {
        "A": "Una domanda su {{NOME}}",
        "B": "Ho visto {{NOME}} su Google Maps",
    },
    2: {
        "A": "10 minuti per avere un assistente Telegram",
        "B": "10 minuti per avere un assistente Telegram",
    },
    3: {
        "A": "Ultimi posti all'offerta lancio",
        "B": "Ultimi posti all'offerta lancio",
    },
}

TEMPLATES = {
    1: BASE / "email_template.html",
    2: BASE / "email_followup.html",
    3: BASE / "email_lastcall.html",
}

LOG_PATH = BASE / "invii_log.json"

# ─── Helpers ───────────────────────────────────────────────────────────────────

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
    return {"step1": [], "step2": [], "step3": [], "errori": []}

def save_log(log):
    LOG_PATH.write_text(json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")

def load_contacts(tier=None):
    contacts = []
    with open(BASE / "contatti_email.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rating = float(row.get("rating") or 0)
            if tier == "A" and rating < 4.5:
                continue
            if tier == "B" and (rating < 4.0 or rating >= 4.5):
                continue
            if tier == "C" and rating >= 4.0:
                continue
            contacts.append(row)
    return contacts

def build_subject(step, tier, nome):
    s = SUBJECTS[step].get(tier, SUBJECTS[step]["B"])
    return s.replace("{{NOME}}", nome)

def build_html(step, nome):
    html = TEMPLATES[step].read_text(encoding="utf-8")
    return html.replace("{{NOME_RISTORANTE}}", nome)

def build_text(step, nome):
    texts = {
        1: f"""Buongiorno,

mi chiamo Alex e ho sviluppato RistoAgent, un assistente AI per ristoranti come {nome}.

In breve: un bot Telegram che risponde ai clienti 24/7, gestisce le prenotazioni e le sincronizza con Google Calendar.

Offerta Founding Members (solo 20 posti):
- Piano Starter: 19 EUR/mese (poi 29)
- Piano Pro: 29 EUR/mese (poi 49)

15 giorni di prova gratuita, nessuna carta richiesta.
Scopri di piu: https://ristoagent.com

Alex — info@ristoagent.com
""",
        2: f"""Buongiorno,

vi ho scritto qualche giorno fa riguardo a RistoAgent per {nome}.

Volevo mostrarvi quanto e semplice: 10 minuti di setup e il vostro bot Telegram e attivo.
I clienti lo raggiungono scansionando un QR code che generate dalla dashboard.

15 giorni di prova gratuita: https://ristoagent.com

Alex — info@ristoagent.com
""",
        3: f"""Buongiorno,

ultima email, promesso.

I posti Founding Members per {nome} stanno per esaurirsi.
Starter a 19 EUR/mese (poi 29) — Pro a 29 EUR/mese (poi 49).
Prezzo bloccato per sempre.

15 giorni di prova gratuita: https://ristoagent.com

Alex — info@ristoagent.com
""",
    }
    return texts[step]

# ─── Invio ─────────────────────────────────────────────────────────────────────

def send_email(resend, contact, step, tier, dry_run=True):
    nome  = contact["nome"]
    email = contact["email"]
    subj  = build_subject(step, tier, nome)

    if dry_run:
        print(f"  [DRY] Step{step} Tier{tier} -> {nome} <{email}> | Oggetto: {subj}")
        return True

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [email],
            "subject": subj,
            "html": build_html(step, nome),
            "text": build_text(step, nome),
        })
        print(f"  OK  Step{step} Tier{tier} -> {nome} <{email}> | ID: {result.get('id','?')}")
        return True
    except Exception as e:
        print(f"  ERR Step{step} Tier{tier} → {nome} <{email}> | {e}")
        return False

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--test", action="store_true")
    group.add_argument("--send", action="store_true")
    parser.add_argument("--step",  type=int, choices=[1,2,3], default=1)
    parser.add_argument("--tier",  choices=["A","B","C","ALL"], default="ALL")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=MAX_PER_RUN)
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("RESEND_API_KEY", "")
    if not api_key:
        print("RESEND_API_KEY non trovata"); sys.exit(1)

    try:
        import resend as resend_lib
        resend_lib.api_key = api_key
    except ImportError:
        print("Installa resend: pip install resend"); sys.exit(1)

    log = load_log()
    step_key = f"step{args.step}"

    # ── TEST ──
    if args.test:
        print("\nMODALITA TEST\n")
        # Dry run sui primi 3 di ogni tier
        for t in ["A", "B"]:
            for c in load_contacts(t)[:2]:
                send_email(resend_lib, c, args.step, t, dry_run=True)

        # Email reale a te stesso
        print("\nInvio email reale di test a ristoagent@gmail.com ...")
        test_c = {"nome": "Ristorante Test", "email": "ristoagent@gmail.com"}
        ok = send_email(resend_lib, test_c, args.step, "A", dry_run=False)
        if ok:
            print("\nEmail di test inviata! Controlla ristoagent@gmail.com")
        return

    # ── SEND ──
    tiers = ["A","B"] if args.tier == "ALL" else [args.tier]
    contacts = []
    for t in tiers:
        for c in load_contacts(t):
            c["_tier"] = t
            contacts.append(c)

    # Escludi chi ha gia ricevuto questo step
    gia_inviati = set(log.get(step_key, []))
    da_inviare = [c for c in contacts if c["email"] not in gia_inviati]

    print(f"\nStep {args.step} | Tier {args.tier}")
    print(f"Totale lista: {len(contacts)}")
    print(f"Gia inviati:  {len(gia_inviati)}")
    print(f"Da inviare:   {len(da_inviare)}\n")

    risposta = input("Confermi invio reale? Digita SI: ")
    if risposta.strip().upper() != "SI":
        print("Annullato."); return

    inviati = 0
    for i, contact in enumerate(da_inviare[args.start:], start=args.start):
        if inviati >= args.limit:
            print(f"\nLimite {args.limit} raggiunto. Riprendi con --start {i}")
            break

        print(f"[{i+1}/{len(da_inviare)}] ", end="")
        ok = send_email(resend_lib, contact, args.step, contact["_tier"], dry_run=False)

        if ok:
            log.setdefault(step_key, []).append(contact["email"])
            inviati += 1
        else:
            log.setdefault("errori", []).append({
                "email": contact["email"],
                "step": args.step,
                "data": datetime.now().isoformat()
            })

        save_log(log)
        if i < len(da_inviare) - 1:
            time.sleep(DELAY)

    print(f"\nSessione completata: {inviati} email inviate")
    print(f"Totale step{args.step}: {len(log.get(step_key, []))}")

    if inviati > 0:
        from git_autopush import autopush
        autopush("marketing/invii_log.json", inviati, f"Milano step{args.step} tier{args.tier}")

if __name__ == "__main__":
    main()
