#!/usr/bin/env python3
"""Envoie un e-mail d'alerte avec le compte Gmail deja configure (MAIL_USERNAME / MAIL_PASSWORD
dans /opt/myaddictive/.env.production). Destinataire : ALERTE_EMAIL (sinon MAIL_USERNAME).
Usage : alerte.py "sujet" "message"      (ne leve jamais d'erreur : une alerte ne doit rien casser)"""
import smtplib, sys, os
from email.message import EmailMessage

def lire_env(chemin):
    env = {}
    try:
        for ligne in open(chemin, encoding="utf-8"):
            ligne = ligne.strip()
            if ligne and not ligne.startswith("#") and "=" in ligne:
                k, v = ligne.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    except OSError:
        pass
    return env

env = lire_env(os.environ.get("ENV_FILE", "/opt/myaddictive/.env.production"))
user, mdp = env.get("MAIL_USERNAME"), env.get("MAIL_PASSWORD")
dest = env.get("ALERTE_EMAIL") or user
sujet = sys.argv[1] if len(sys.argv) > 1 else "Alerte My Addictive"
corps = sys.argv[2] if len(sys.argv) > 2 else ""
if not (user and mdp and dest):
    print("alerte non envoyee : MAIL_USERNAME / MAIL_PASSWORD absents"); sys.exit(0)
try:
    m = EmailMessage()
    m["From"], m["To"], m["Subject"] = user, dest, sujet
    m.set_content(corps)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as s:
        s.login(user, mdp)
        s.send_message(m)
    print("alerte envoyee a", dest)
except Exception as e:
    print("alerte non envoyee :", e)
