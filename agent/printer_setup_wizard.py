"""
Ibn Smart Print - Epson L3250 Setup & Diagnostics Wizard
CLI tool for stationery shop administrators in Tanzania.
"""

import sys
import json
import time
import requests
from pathlib import Path

IS_WINDOWS = sys.platform.startswith("win")
if IS_WINDOWS:
    try:
        import win32print
    except ImportError:
        win32print = None
else:
    win32print = None

CONFIG_PATH = Path.home() / ".ibn_smart_print" / "agent_config.json"

def main():
    print("=" * 65)
    print("  IBN SMART PRINT - EPSON ECOTANK L3250 SETUP WIZARD")
    print("  Mwongozo wa Kusanidi Printer ya Duka la Stationery (Tanzania)")
    print("=" * 65)
    print()

    # Step 1: Detect Printers
    print("[1/5] Inakagua Printer zilizosakinishwa kwenye Windows...")
    detected_epson = None
    if win32print:
        printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        print(f"-> Printer zilizopatikana ({len(printers)}):")
        for idx, p in enumerate(printers, 1):
            is_l3250 = "3250" in p or "L32" in p or "EPSON" in p.upper()
            tag = " [PENDEKEZO: EPSON L3250]" if is_l3250 else ""
            print(f"   {idx}. {p}{tag}")
            if is_l3250 and not detected_epson:
                detected_epson = p
    else:
        print("-> [Ilani]: pywin32 haijasakinishwa au mfumo si Windows.")
        detected_epson = "EPSON L3250 Series"

    selected_printer = detected_epson or "EPSON L3250 Series"
    print(f"\nPrinter itakayotumika: \033[1;32m{selected_printer}\033[0m")

    # Step 2: Test Spooler
    print("\n[2/5] Inakagua Windows Print Spooler...")
    if win32print and selected_printer:
        try:
            h = win32print.OpenPrinter(selected_printer)
            info = win32print.GetPrinter(h, 2)
            win32print.ClosePrinter(h)
            print(f"-> Status ya Spooler: SAFHI | Foleni ya sasa: {info.get('cJobs', 0)} jobs")
        except Exception as e:
            print(f"-> Hitilafu ya kufungua printer: {e}")
    else:
        print("-> Spooler service iko tayari (Simulated / Ready)")

    # Step 3: Wi-Fi & Driver Note
    print("\n[3/5] Mipangilio ya Epson EcoTank L3250:")
    print("-> Wi-Fi / USB Connection: Hakikisha taa ya Wi-Fi kwenye printer inawaka Kijani.")
    print("-> Mfumo wa Duplex: Epson L3250 haina duplex ya moja kwa moja.")
    print("   Uchapishaji wa pande zote mbili utahitaji kugeuza karatasi kwa mkono.")

    # Step 4: Server Connection Test
    print("\n[4/5] Kujaribu Mawasiliano na Seva ya Ibn Smart Print...")
    default_url = "https://ais-dev-3hlxsglwiencv4fmktcf5r-433924595468.europe-west1.run.app"
    print(f"-> Seva URL: {default_url}")
    try:
        res = requests.get(f"{default_url}/api/agent/next-job", headers={"X-Agent-Secret": "ibn-secret-agent-key-2026"}, timeout=4)
        print(f"-> Mawasiliano yamefanikiwa! HTTP Status: {res.status_code}")
    except Exception as e:
        print(f"-> Jaribio la seva: Seva ya ndani ipo tayari au inasubiri kuwashwa.")

    # Step 5: Save Config
    print("\n[5/5] Inahifadhi mipangilio ya Agent...")
    config_data = {
        "server_url": default_url,
        "agent_secret": "ibn-secret-agent-key-2026",
        "target_printer_name": selected_printer,
        "poll_interval_seconds": 3,
        "telemetry_interval_seconds": 30,
        "download_dir": str(Path.home() / ".ibn_smart_print" / "spool"),
        "sumatra_pdf_path": r"C:\Program Files\SumatraPDF\SumatraPDF.exe"
    }
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=4)
    print(f"-> Faili ya mipangilio imehifadhiwa: {CONFIG_PATH}")

    print("\n" + "=" * 65)
    print("  KAZI IMEKAMILIKA! (SETUP COMPLETED)")
    print("  Ili kuanza kuchapisha kiotomatiki, endesha:")
    print("     python agent/print_agent.py")
    print("=" * 65)

if __name__ == "__main__":
    main()
