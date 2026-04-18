"""
Helper condiviso: al termine di un invio, committa e pusha il log
in modo che la dashboard admin su Vercel veda i numeri aggiornati.
"""

import subprocess
from pathlib import Path


def autopush(log_relpath: str, count: int, tag: str) -> None:
    """Commit + push del file di log indicato (path relativo al repo root)."""
    if count <= 0:
        return

    repo_root = Path(__file__).parent.parent
    try:
        subprocess.run(
            ["git", "add", log_relpath],
            cwd=repo_root, check=True, capture_output=True,
        )
        msg = f"chore(marketing): log {tag} +{count} email"
        r = subprocess.run(
            ["git", "commit", "-m", msg],
            cwd=repo_root, capture_output=True, text=True,
        )
        if r.returncode != 0 and "nothing to commit" in (r.stdout + r.stderr).lower():
            print("  (autopush: nulla da committare)")
            return
        if r.returncode != 0:
            print(f"  (autopush commit fallito: {r.stderr.strip()})")
            return

        r = subprocess.run(
            ["git", "push"],
            cwd=repo_root, capture_output=True, text=True,
        )
        if r.returncode != 0:
            print(f"  (autopush push fallito: {r.stderr.strip()})")
            return

        print(f"  (autopush OK — dashboard si aggiornerà dopo il deploy Vercel)")
    except Exception as e:
        print(f"  (autopush errore: {e})")
