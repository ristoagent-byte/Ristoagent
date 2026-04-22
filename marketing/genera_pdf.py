"""
RistoAgent - Generatore PDF Marketing
Genera un PDF professionale da allegare alle cold email.

Dipendenze: pip install reportlab pillow
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
import os

# ─── PERCORSI SCREENSHOT ───────────────────────────────────────────────────────
SCREENSHOTS = "C:/Users/Admin/Pictures/Screenshots"
SS = {
    "landing":      f"{SCREENSHOTS}/Screenshot 2026-04-12 232229.png",
    "pricing":      f"{SCREENSHOTS}/Screenshot 2026-04-12 232416.png",
    "auth":         f"{SCREENSHOTS}/Screenshot 2026-04-12 232700.png",
    "onb1":         f"{SCREENSHOTS}/Screenshot 2026-04-12 232720.png",
    "onb2":         f"{SCREENSHOTS}/Screenshot 2026-04-12 232809.png",
    "onb3":         f"{SCREENSHOTS}/Screenshot 2026-04-12 232836.png",
    "onb4":         f"{SCREENSHOTS}/Screenshot 2026-04-12 232859.png",
    "botfather":    f"{SCREENSHOTS}/Screenshot 2026-04-12 233059.png",
    "qrcode":       f"{SCREENSHOTS}/Screenshot 2026-04-12 233130.png",
    "dashboard":    f"{SCREENSHOTS}/Screenshot 2026-04-12 233151.png",
    "bot_desktop":  f"{SCREENSHOTS}/telegram_chat_only.png",
    "bot_prenot1":  f"{SCREENSHOTS}/Screenshot 2026-04-13 001400.png",
    "bot_prenot2":  f"{SCREENSHOTS}/Screenshot 2026-04-13 001420.png",
}

OUTPUT = "RistoAgent_Guida_v5.pdf"

# ─── COLORI ────────────────────────────────────────────────────────────────────
BLUE      = colors.HexColor("#0EA5E9")
DARK      = colors.HexColor("#0a0f0d")
GRAY      = colors.HexColor("#6B7280")
LIGHTGRAY = colors.HexColor("#F3F4F6")
GREEN     = colors.HexColor("#4ade80")
WHITE     = colors.white
BLACK     = colors.HexColor("#111827")

W, H = A4

# ─── HELPER: ridimensiona immagine mantenendo aspect ratio ─────────────────────
def make_image(path, max_width, max_height=None):
    if not os.path.exists(path):
        return None
    img = PILImage.open(path)
    iw, ih = img.size
    ratio = iw / ih
    w = max_width
    h = w / ratio
    if max_height and h > max_height:
        h = max_height
        w = h * ratio
    return Image(path, width=w, height=h)

# ─── HEADER/FOOTER ─────────────────────────────────────────────────────────────
def on_page(c: canvas.Canvas, doc):
    c.saveState()
    # Header bar
    c.setFillColor(BLUE)
    c.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1.5*cm, H - 0.85*cm, "RistoAgent")
    c.setFont("Helvetica", 9)
    c.drawRightString(W - 1.5*cm, H - 0.85*cm, "ristoagent.com")
    # Footer
    c.setFillColor(LIGHTGRAY)
    c.rect(0, 0, W, 0.8*cm, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W/2, 0.28*cm, f"© 2026 RistoAgent · ristoagent.com · info@ristoagent.com · Pagina {doc.page}")
    c.restoreState()

def on_first_page(c, doc):
    c.saveState()
    c.setFillColor(LIGHTGRAY)
    c.rect(0, 0, W, 0.8*cm, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W/2, 0.28*cm, "© 2026 RistoAgent · ristoagent.com · info@ristoagent.com")
    c.restoreState()

# ─── STILI ─────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def style(name, **kwargs):
    return ParagraphStyle(name, **kwargs)

s_title    = style("title",    fontSize=28, fontName="Helvetica-Bold", textColor=BLACK, leading=34, spaceAfter=8)
s_subtitle = style("subtitle", fontSize=14, fontName="Helvetica",      textColor=GRAY,  leading=20, spaceAfter=20)
s_h1       = style("h1",       fontSize=20, fontName="Helvetica-Bold", textColor=BLACK, leading=26, spaceAfter=8, spaceBefore=16)
s_h2       = style("h2",       fontSize=14, fontName="Helvetica-Bold", textColor=BLUE,  leading=20, spaceAfter=6, spaceBefore=12)
s_body     = style("body",     fontSize=10, fontName="Helvetica",      textColor=BLACK, leading=16, spaceAfter=6)
s_small    = style("small",    fontSize=8,  fontName="Helvetica",      textColor=GRAY,  leading=12, spaceAfter=4)
s_center   = style("center",   fontSize=10, fontName="Helvetica",      textColor=BLACK, leading=16, alignment=TA_CENTER)
s_badge    = style("badge",    fontSize=9,  fontName="Helvetica-Bold", textColor=BLUE,  leading=14)
s_cta      = style("cta",      fontSize=13, fontName="Helvetica-Bold", textColor=WHITE, leading=18, alignment=TA_CENTER)

def badge(text):
    return Table([[Paragraph(text, s_badge)]], colWidths=[None],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#E0F2FE")),
            ("ROUNDEDCORNERS", [6]),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 10),
            ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ]))

def cta_button(text):
    return Table([[Paragraph(text, s_cta)]], colWidths=[12*cm],
        hAlign="CENTER",
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), BLUE),
            ("ROUNDEDCORNERS", [8]),
            ("TOPPADDING", (0,0), (-1,-1), 12),
            ("BOTTOMPADDING", (0,0), (-1,-1), 12),
            ("LEFTPADDING", (0,0), (-1,-1), 20),
            ("RIGHTPADDING", (0,0), (-1,-1), 20),
        ]))

def step_box(number, title, desc, screenshot_path=None, max_w=14*cm):
    content = [
        [Paragraph(f"<b>{number}</b>", style("sn", fontSize=16, fontName="Helvetica-Bold", textColor=WHITE, alignment=TA_CENTER)),
         Paragraph(f"<b>{title}</b><br/><font size=9 color='#6B7280'>{desc}</font>",
                   style("st", fontSize=11, fontName="Helvetica-Bold", textColor=BLACK, leading=16))]
    ]
    box = Table(content, colWidths=[1.2*cm, max_w - 1.2*cm],
        style=TableStyle([
            ("BACKGROUND",    (0,0), (0,0), BLUE),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (1,0), (1,0), 12),
            ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ]))
    items = [box]
    if screenshot_path:
        img = make_image(screenshot_path, max_w, 7*cm)
        if img:
            items.append(Spacer(1, 0.3*cm))
            items.append(img)
    return items


# ─── GENERA PDF ────────────────────────────────────────────────────────────────
def genera():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        topMargin=2*cm,    bottomMargin=1.5*cm,
    )

    story = []
    M = W - 3.6*cm  # larghezza utile

    # ── PAGINA 1: COVER ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 1*cm))
    logo_path = "C:/Users/Admin/Documents/PROJECTS/RISTOAGENT/ristoagent logo.jpg"
    logo_img = make_image(logo_path, 7*cm, 7*cm)
    if logo_img:
        logo_img.hAlign = "CENTER"
        story.append(logo_img)
    else:
        story.append(Paragraph("RistoAgent", style("cv", fontSize=36, fontName="Helvetica-Bold", textColor=BLUE, leading=42, alignment=TA_CENTER)))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("L'assistente AI che risponde ai tuoi clienti su Telegram,<br/>automaticamente — anche di notte.", style("cvs", fontSize=13, fontName="Helvetica", textColor=GRAY, leading=20, alignment=TA_CENTER, spaceAfter=24)))

    img_landing = make_image(SS["landing"], M, 8*cm)
    if img_landing:
        story.append(img_landing)

    story.append(Spacer(1, 0.8*cm))

    # 3 pillole
    pillole = [
        ["⚡  Setup in 5 minuti", "🎁  15 giorni gratis", "💳  Nessuna carta richiesta"],
    ]
    t = Table(pillole, colWidths=[M/3]*3,
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#F0F9FF")),
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica-Bold"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("TEXTCOLOR",     (0,0), (-1,-1), BLUE),
            ("ALIGN",         (0,0), (-1,-1), "CENTER"),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("BOX",           (0,0), (-1,-1), 0.5, BLUE),
            ("INNERGRID",     (0,0), (-1,-1), 0.5, BLUE),
        ]))
    story.append(t)
    story.append(Spacer(1, 1*cm))
    story.append(cta_button("→  Inizia la prova gratuita su ristoagent.com"))

    story.append(PageBreak())

    # ── PAGINA 2: IL PROBLEMA + LA SOLUZIONE ────────────────────────────────────
    story.append(Paragraph("Il problema", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=10))
    story.append(Paragraph(
        "Ogni giorno il tuo ristorante perde prenotazioni. Non perché non ci siano clienti interessati — ma perché <b>nessuno risponde</b> quando chiamano, scrivono o chiedono informazioni fuori orario.",
        s_body))
    story.append(Spacer(1, 0.3*cm))

    problemi = [
        ["😓  Il telefono squilla mentre sei in cucina"],
        ["🌙  I clienti scrivono la sera e non ricevono risposta"],
        ["📅  Le prenotazioni arrivano su WhatsApp, Messenger, email — ovunque"],
        ["⏰  Perdi tempo a rispondere sempre alle stesse domande (orari, menù, parcheggio)"],
    ]
    t2 = Table(problemi, colWidths=[M],
        style=TableStyle([
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("TEXTCOLOR",     (0,0), (-1,-1), BLACK),
            ("TOPPADDING",    (0,0), (-1,-1), 7),
            ("BOTTOMPADDING", (0,0), (-1,-1), 7),
            ("LEFTPADDING",   (0,0), (-1,-1), 12),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHTGRAY]),
        ]))
    story.append(t2)

    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph("La soluzione", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=10))
    story.append(Paragraph(
        "<b>RistoAgent</b> è un assistente AI che risponde automaticamente ai tuoi clienti su <b>Telegram</b>, 24 ore su 24, 7 giorni su 7. Gestisce prenotazioni, FAQ, orari e molto altro — senza che tu debba fare nulla.",
        s_body))
    story.append(Spacer(1, 0.5*cm))

    vantaggi = [
        ["✓  Risposta istantanea", "Non perdi mai un cliente per lentezza"],
        ["✓  Prenotazioni automatiche", "Raccoglie data, orario e numero di persone"],
        ["✓  Personalizzato per te", "Carica menù, prezzi e info — il bot risponde con precisione"],
        ["✓  Google Calendar integrato", "Le prenotazioni finiscono direttamente nel calendario"],
        ["✓  Link Google Maps automatico", "Il cliente riceve le indicazioni stradali ad ogni prenotazione"],
        ["✓  QR code incluso", "I clienti lo scansionano e iniziano a chattare subito"],
    ]
    t3 = Table(vantaggi, colWidths=[M*0.35, M*0.65],
        style=TableStyle([
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",     (0,0), (0,-1), BLUE),
            ("TOPPADDING",    (0,0), (-1,-1), 7),
            ("BOTTOMPADDING", (0,0), (-1,-1), 7),
            ("LEFTPADDING",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHTGRAY]),
            ("LINEBELOW",     (0,0), (-1,-2), 0.3, colors.HexColor("#E5E7EB")),
        ]))
    story.append(t3)

    story.append(PageBreak())

    # ── PAGINA 3: COME APPARE AI CLIENTI ────────────────────────────────────────
    story.append(Paragraph("Come appare ai tuoi clienti", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=10))
    story.append(Paragraph(
        "I tuoi clienti aprono Telegram, scansionano il QR code e iniziano a chattare. L'AI risponde in secondi, in modo naturale — come farebbe un receptionist.",
        s_body))
    story.append(Spacer(1, 0.4*cm))

    # Due screenshot affiancati della prenotazione
    img1 = make_image(SS["bot_prenot1"], M*0.48, 10*cm)
    img2 = make_image(SS["bot_prenot2"], M*0.48, 10*cm)
    if img1 and img2:
        t_bot = Table([[img1, img2]], colWidths=[M*0.49, M*0.49],
            style=TableStyle([
                ("ALIGN",   (0,0), (-1,-1), "CENTER"),
                ("VALIGN",  (0,0), (-1,-1), "TOP"),
                ("LEFTPADDING",  (0,0), (-1,-1), 2),
                ("RIGHTPADDING", (0,0), (-1,-1), 2),
            ]))
        story.append(t_bot)
    elif img1:
        story.append(img1)

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("Conversazione reale: il cliente prenota un tavolo per 2 persone in pochi messaggi.", s_small))

    story.append(Spacer(1, 0.6*cm))
    story.append(Paragraph(
        "Il bot raccoglie data, orario, numero di persone e nome — poi conferma la prenotazione in automatico. Nessun intervento da parte tua.",
        s_body))

    story.append(Spacer(1, 0.8*cm))

    # ── SEZIONE: MESSAGGI VOCALI ─────────────────────────────────────────────────
    story.append(Paragraph("Funziona anche con i messaggi vocali", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=10))
    story.append(Paragraph(
        "I tuoi clienti possono mandare un <b>messaggio vocale</b> su Telegram — RistoAgent capisce cosa dicono, elabora la richiesta e risponde. Esattamente come farebbe un cameriere al telefono, ma in automatico.",
        s_body))
    story.append(Spacer(1, 0.4*cm))

    vocali = [
        ["🎙️  Il cliente manda un vocale", "\"Ciao, vorrei prenotare per venerdì sera, siamo in 3\""],
        ["🧠  L'AI trascrive e capisce", "Elabora la richiesta in tempo reale con Whisper AI"],
        ["✅  Risponde e prenota", "Conferma la prenotazione e la inserisce nel calendario"],
    ]
    t_voc = Table(vocali, colWidths=[M*0.40, M*0.60],
        style=TableStyle([
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",     (0,0), (0,-1), BLUE),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHTGRAY, WHITE]),
            ("LINEBELOW",     (0,0), (-1,-2), 0.3, colors.HexColor("#E5E7EB")),
        ]))
    story.append(t_voc)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Funziona con qualsiasi lingua. Zero configurazione — attivo da subito per tutti i piani.",
        s_small))

    story.append(PageBreak())

    # ── PAGINA 4: COME INIZIARE ──────────────────────────────────────────────────
    story.append(Paragraph("Come iniziare in 5 minuti", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=12))

    # Step 1
    for item in step_box("1", "Crea il tuo account", "Vai su ristoagent.com e clicca 'Prova gratis'. Nessuna carta richiesta.", SS["auth"]):
        story.append(item)
    story.append(Spacer(1, 0.5*cm))

    # Step 2
    for item in step_box("2", "Inserisci i dati della tua attività", "Nome, tipo di attività, orari e menù. L'AI userà queste info per rispondere ai clienti.", SS["onb1"]):
        story.append(item)
    story.append(Spacer(1, 0.3*cm))
    tip = Table([[Paragraph(
        "💡  <b>Più informazioni inserisci, migliore sarà il bot.</b> Puoi caricare il PDF del menù, un foglio Excel con i prezzi o un documento Word con le informazioni pratiche. Il bot userà tutti questi dati per rispondere in modo preciso ai tuoi clienti.",
        style("tip", fontSize=9, fontName="Helvetica", textColor=BLACK, leading=14))]],
        colWidths=[M],
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
            ("BOX",           (0,0), (-1,-1), 1, colors.HexColor("#FCD34D")),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING",   (0,0), (-1,-1), 12),
            ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ]))
    story.append(tip)
    story.append(Spacer(1, 0.5*cm))

    # Step 3
    for item in step_box("3", "Descrivi i tuoi servizi e orari", "Rispondi a 3 domande semplici. L'AI impara come una receptionist.", SS["onb2"]):
        story.append(item)

    story.append(PageBreak())

    # Step 4
    for item in step_box("4", "Crea il tuo Bot Telegram", "Apri Telegram, cerca @BotFather, crea il bot e incolla il token. Ci vogliono 2 minuti.", SS["onb4"]):
        story.append(item)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("Come creare il bot su Telegram:", s_h2))
    passi = [
        ["1", "Apri Telegram e cerca @BotFather"],
        ["2", "Invia il comando /newbot"],
        ["3", "Scegli un nome per il bot (es. 'Trattoria da Mario')"],
        ["4", "Scegli uno username che finisca con 'bot' (es. trattoria_mario_bot)"],
        ["5", "Copia il token che BotFather ti invia e incollalo su RistoAgent"],
    ]
    t4 = Table(passi, colWidths=[0.8*cm, M - 0.8*cm],
        style=TableStyle([
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",     (0,0), (0,-1), BLUE),
            ("ALIGN",         (0,0), (0,-1), "CENTER"),
            ("TOPPADDING",    (0,0), (-1,-1), 7),
            ("BOTTOMPADDING", (0,0), (-1,-1), 7),
            ("LEFTPADDING",   (1,0), (1,-1), 10),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHTGRAY]),
        ]))
    story.append(t4)
    story.append(Spacer(1, 0.5*cm))

    # Step 5
    for item in step_box("5", "Scarica il QR code e condividilo", "Stampalo, mettilo sul tavolo, postalo sui social. I clienti lo scansionano e iniziano subito.", SS["qrcode"]):
        story.append(item)

    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph("Come vedere le prenotazioni su Google Calendar", s_h2))
    story.append(Paragraph(
        "Ogni prenotazione confermata dal bot appare automaticamente nel tuo Google Calendar — esattamente come se l'avessi inserita tu a mano. Puoi vederle da qualsiasi dispositivo.",
        s_body))
    story.append(Spacer(1, 0.4*cm))
    cal_steps = [
        ["1", "Collega il tuo account Google durante l'onboarding (step 3)"],
        ["2", "Apri Google Calendar su calendar.google.com o dall'app sul tuo telefono"],
        ["3", "Le prenotazioni appaiono automaticamente con nome cliente, orario e numero di persone"],
        ["4", "Il cliente riceve anche un link Google Maps per trovare il tuo locale"],
    ]
    t_cal = Table(cal_steps, colWidths=[0.8*cm, M - 0.8*cm],
        style=TableStyle([
            ("FONTNAME",      (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 10),
            ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",     (0,0), (0,-1), BLUE),
            ("ALIGN",         (0,0), (0,-1), "CENTER"),
            ("TOPPADDING",    (0,0), (-1,-1), 7),
            ("BOTTOMPADDING", (0,0), (-1,-1), 7),
            ("LEFTPADDING",   (1,0), (1,-1), 10),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHTGRAY]),
        ]))
    story.append(t_cal)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "→  Apri il calendario: <u>calendar.google.com</u>",
        style("callink", fontSize=10, fontName="Helvetica-Bold", textColor=BLUE, leading=16)))

    story.append(PageBreak())

    # ── PAGINA 5: PREZZI + CTA ───────────────────────────────────────────────────
    story.append(Paragraph("Prezzi semplici, senza sorprese", s_h1))
    story.append(HRFlowable(width=M, thickness=1, color=LIGHTGRAY, spaceAfter=10))

    # Banner prova gratuita
    banner = Table([[Paragraph("🎁  <b>15 giorni gratis — nessuna carta richiesta</b><br/><font size=9 color='#6B7280'>Un'unica prova per attività. Dopo 15 giorni scegli il piano più adatto a te.</font>",
        style("ban", fontSize=11, fontName="Helvetica", textColor=BLACK, leading=18))]],
        colWidths=[M],
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#F0F9FF")),
            ("BOX",           (0,0), (-1,-1), 1.5, BLUE),
            ("TOPPADDING",    (0,0), (-1,-1), 14),
            ("BOTTOMPADDING", (0,0), (-1,-1), 14),
            ("LEFTPADDING",   (0,0), (-1,-1), 16),
            ("RIGHTPADDING",  (0,0), (-1,-1), 16),
        ]))
    story.append(banner)
    story.append(Spacer(1, 0.8*cm))

    # Tabella piani
    piani = [
        [Paragraph("<b>Piano</b>", s_center), Paragraph("<b>Prezzo</b>", s_center), Paragraph("<b>Operazioni</b>", s_center), Paragraph("<b>Rinnovo</b>", s_center)],
        [Paragraph("Flessibile", s_body), Paragraph("€39/mese", s_center), Paragraph("500/mese", s_center), Paragraph("Nessun rinnovo automatico", s_small)],
        [Paragraph("Starter", s_body), Paragraph("€29/mese", s_center), Paragraph("300/mese", s_center), Paragraph("Mensile automatico", s_small)],
        [Paragraph("⭐ Pro", style("pro", fontSize=10, fontName="Helvetica-Bold", textColor=BLUE)), Paragraph("€49/mese", s_center), Paragraph("Illimitate", s_center), Paragraph("Mensile automatico", s_small)],
    ]
    col = M/4
    t5 = Table(piani, colWidths=[col]*4,
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,0), BLUE),
            ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
            ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
            ("ALIGN",         (0,0), (-1,-1), "CENTER"),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHTGRAY, colors.HexColor("#EFF6FF")]),
            ("BOX",           (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
            ("INNERGRID",     (0,0), (-1,-1), 0.3, colors.HexColor("#E5E7EB")),
            ("FONTNAME",      (0,3), (0,3), "Helvetica-Bold"),
        ]))
    story.append(t5)
    story.append(Spacer(1, 1*cm))

    story.append(Paragraph("Tutti i piani includono:", s_h2))
    incluso = ["1 Bot Telegram personalizzato", "Google Calendar integrato", "FAQ automatiche", "QR code per i clienti", "Dashboard di controllo", "Messaggi vocali (risponde anche ai vocali Telegram)", "Supporto via chat dedicato"]
    for item in incluso:
        story.append(Paragraph(f"✓  {item}", style("inc", fontSize=10, fontName="Helvetica", textColor=BLACK, leading=16, leftIndent=10)))
    story.append(Spacer(1, 1*cm))

    story.append(cta_button("→  Inizia gratis su ristoagent.com"))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("Nessuna carta di credito · Setup in 5 minuti · Disdici quando vuoi", style("fine", fontSize=9, fontName="Helvetica", textColor=GRAY, alignment=TA_CENTER)))
    story.append(Spacer(1, 0.6*cm))
    story.append(Paragraph("Domande? Scrivi a info@ristoagent.com", style("fine2", fontSize=9, fontName="Helvetica", textColor=GRAY, alignment=TA_CENTER)))

    # ── BUILD ────────────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f"PDF generato: {OUTPUT}")


if __name__ == "__main__":
    genera()
