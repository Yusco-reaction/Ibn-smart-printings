# Ibn Smart Print - Mfumo wa Kisasa wa Kuprinti Duka la Stationery (Tanzania)

Mfumo kamili wa kiteknolojia unaowawezesha wateja wa duka la stationery kuchanganua QR code kwa simu zao za mkononi, kupakia nyaraka (PDF, Word DOCX, Picha JPG/PNG, Excel XLSX), kuchagua mipangilio ya uchapishaji kwenye printer ya **Epson EcoTank L3250**, kulipia kwa M-Pesa/Tigo Pesa/Airtel Money au Kaunta, na kutoa amri ya uchapishaji moja kwa moja.

---

## 🏗️ Muundo wa Mfumo (Architecture)

1. **Customer Smartphone Portal (HTML5 / Modern Responsive Web)**:
   - Inafunguka kwenye simu ya mteja (Android, iPhone, n.k.) baada ya kuchanganua QR code.
   - Ina lugha mbili: **Kiswahili** na **English**.
   - Inaruhusu kupakia faili, kukagua idadi ya kurasa, na kuchagua mipangilio ya Epson L3250.
   - Ina taarifa maalum ya **Manual Duplex**: Kwa sababu Epson EcoTank L3250 haina duplex ya moja kwa moja, mteja anathibitisha kuwa opereta wa duka atageuza karatasi kwa mkono na anapata punguzo la 10% la karatasi.
   - Inakokotoa bei kiotomatiki kwa Shilingi za Kitanzania (TZS).

2. **Dashboard ya Utawala ya Admin (Python na Django)**:
   - Imesanidiwa kwa kutumia **Python 3 na Django 5**.
   - Inapatikana katika folda ya `django_admin/`.
   - Inaruhusu opereta wa kaunta kuthibitisha malipo ya pesa taslimu (`confirm_counter_payment_action`), kusimamia foleni ya uchapishaji, kubadili bei za TZS, kufuatilia viwango vya wino wa EcoTank (Black, Cyan, Magenta, Yellow), na kutoa ripoti ya CSV (`export_jobs_to_csv`).

3. **Core Backend & File Processing API (Python FastAPI)**:
   - Inapatikana katika folda ya `backend/main.py`.
   - Inapokea faili, inakagua ukubwa (hadi 50MB), inahifadhi kwa usalama na kuweka tokeni ya ulinzi (`access_token`).
   - Inatoa API salama za Windows Agent kupitia `X-Agent-Secret`.

4. **Python Windows Local Print Agent (Epson L3250 Integration)**:
   - Inapatikana katika folda ya `agent/print_agent.py`.
   - Inafanya kazi kwenye kompyuta ya Windows ya duka iliyounganishwa na printer ya Epson L3250 kupitia Wi-Fi au USB.
   - Inatumia Windows Spooler (`win32print`), `win32api`, na `SumatraPDF` kutoa uchapishaji halisi wa kimya (silent background printing).
   - Inazuia kurudia kazi mara mbili (idempotent spooling) na inaripoti hali ya kazi moja kwa moja kwenye seva.

---

## 🚀 Maelekezo ya Kuanzisha (Installation & Setup)

### 1. Kwenye Seva Kuu (Backend & Django Admin)
```bash
# 1. Sakinisha vifurushi vya Python
pip install -r requirements.txt

# 2. Anzisha Database ya SQLite/PostgreSQL
python backend/main.py

# 3. Kuanzisha Django Admin Dashboard
cd django_admin
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### 2. Kwenye Kompyuta ya Windows ya Duka (Stationery PC)
1. Hakikisha umesakinisha driver rasmi ya **Epson L3250 Series** kutoka tovuti ya Epson.
2. Hakikisha printer imeunganishwa kwenye Wi-Fi ya dukani au kebo ya USB na inaonekana kwenye *Printers & Scanners* ya Windows.
3. Sakinisha **SumatraPDF** (bure kwa Windows) kwenye `C:\Program Files\SumatraPDF\SumatraPDF.exe`.
4. Bofya mara mbili faili ya `setup_windows_service.bat` au endesha kwa CMD:
```cmd
pip install -r agent\requirements_agent.txt
python agent\printer_setup_wizard.py
python agent\print_agent.py
```

---

## 📋 Orodha ya Ukaguzi wa Printer Halisi (Epson L3250 Checklist)

- [ ] **Tangi za Wino (EcoTank 003)**: Hakikisha viwango vya wino viko juu ya mstari wa chini.
- [ ] **Karatasi**: Weka karatasi za A4 (70gsm au 80gsm) kwenye trei ya nyuma ya printer.
- [ ] **Mwangaza wa Wi-Fi**: Taa ya Wi-Fi kwenye paneli ya Epson L3250 iwake kijani bila kumweka (solid green).
- [ ] **Duplex ya Mkono (Manual Duplex)**:
  - Wakati kazi ya kurasa mbili inapochapishwa, mwendeshaji atatoa karatasi zilizochapishwa upande mmoja, atazigeuza na kuziweka tena trei ya nyuma kulingana na mshale wa mwelekeo.
- [ ] **Bango la QR**: Printi bango la A4 kutoka sehemu ya "Bango la QR" na ulibandike kaunta karibu na eneo la malipo.

---

## 🔒 Usalama na Faragha ya Nyaraka
- Kila kazi inapewa tokeni ya kipekee (`access_token`) ili mteja asiweze kuona faili au risiti ya mteja mwingine.
- Faili za wateja zinafutwa kiotomatiki kwenye seva baada ya saa 24 za kukamilika kwa uchapishaji.
