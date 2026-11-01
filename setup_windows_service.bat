@echo off
TITLE Ibn Smart Print - Windows Print Agent (Epson L3250)
color 0A

echo ======================================================================
echo    IBN SMART PRINT - WINDOWS PRINT AGENT (EPSON ECOTANK L3250)
echo    Duka la Stationery, Tanzania
echo ======================================================================
echo.

REM Hakikisha Python imesakinishwa
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HITILAFU] Python haipatikani kwenye kompyuta hii!
    echo Tafadhali sakinisha Python 3.10+ kutoka https://www.python.org
    pause
    exit /b
)

echo [1/3] Inasakinisha mahitaji ya mfumo (dependencies)...
pip install -r agent\requirements_agent.txt

echo.
echo [2/3] Inaanzisha utambuzi wa printer ya Epson L3250...
python agent\printer_setup_wizard.py

echo.
echo [3/3] Inaanzisha huduma ya Print Agent...
echo Huduma hii inatakiwa kubaki wazi muda wote duka linapofanya kazi.
echo.
python agent\print_agent.py

pause
