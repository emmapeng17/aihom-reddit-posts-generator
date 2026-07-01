#!/usr/bin/env python3
"""
reddit-home-decor-draft — Installer

This script:
  1. Copies SKILL.md into the Codex skills directory
  2. Installs Python dependencies (Flask only)
  3. Creates the .setup-done marker so the skill knows setup is complete
  4. Optionally starts the preview server

After running this, tell Claude: "开始reddit帖子制作流程"
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

PROJECT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))


def bold(text):
    return f"\033[1m{text}\033[0m"


def dim(text):
    return f"\033[2m{text}\033[0m"


def green(text):
    return f"\033[32m{text}\033[0m"


def yellow(text):
    return f"\033[33m{text}\033[0m"


def red(text):
    return f"\033[31m{text}\033[0m"


def find_skills_dir():
    """Find the Codex/Claude skills directory."""
    codex_home = os.environ.get("CODEX_HOME")
    if codex_home:
        return Path(codex_home) / "skills"

    home = Path.home()
    candidates = [home / ".codex" / "skills", home / ".claude" / "skills"]

    for c in candidates:
        if c.parent.exists():
            return c
    return home / ".codex" / "skills"


def main():
    print()
    print(bold("  reddit-home-decor-draft — Installer"))
    print(dim("  ──────────────────────────────────"))
    print()

    # Step 1: Install SKILL.md to skills directory
    skill_src = PROJECT_DIR / "SKILL.md"
    if not skill_src.exists():
        print(red("  ✗ SKILL.md not found. Make sure you're in the project directory."))
        return

    skills_dir = find_skills_dir()
    skill_dest_dir = skills_dir / "reddit-home-decor-draft"
    skill_dest = skill_dest_dir / "SKILL.md"

    skill_dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(skill_src, skill_dest)
    print(green(f"  ✓ SKILL.md installed to skills directory"))
    print(dim(f"    {skill_dest}"))
    print()

    # Step 2: Install Python dependencies
    print(bold("  Installing dependencies (Flask)..."))
    req_file = PROJECT_DIR / "requirements.txt"
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", str(req_file)],
        capture_output=False,
    )
    if result.returncode == 0:
        print(green("  ✓ Dependencies installed."))
    else:
        print(yellow("  ⚠ Dependency install may have had issues. Check output above."))
    print()

    # Step 3: Create .setup-done marker
    marker = PROJECT_DIR / ".setup-done"
    marker.touch()
    print(green("  ✓ Setup marker created (.setup-done)"))
    print(dim("    The skill will now skip setup and go straight to drafting."))
    print()

    # Step 4: Offer to start server
    print(bold("  ┌─────────────────────────────────────────┐"))
    print(bold("  │  ✓ Installation complete!               │"))
    print(bold("  └─────────────────────────────────────────┘"))
    print()
    answer = input("  Start the preview server now? [Y/n]: ").strip().lower()
    if answer in ("", "y", "yes"):
        print()
        print(dim("  Starting server at http://localhost:5000 ..."))
        print(dim("  Press Ctrl+C to stop."))
        print()
        os.chdir(str(PROJECT_DIR))
        subprocess.run([sys.executable, "app.py"])
    else:
        print()
        print(dim("  To start the server:"))
        print(dim(f"    cd {PROJECT_DIR}"))
        print(dim("    python app.py"))
        print(dim("  Then open http://localhost:5000"))
        print()
        print(dim("  Now tell Claude: '开始reddit帖子制作流程'"))
        print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n" + dim("  Installation cancelled."))
    except Exception as e:
        print("\n" + red(f"  ✗ Install failed: {e}"))
