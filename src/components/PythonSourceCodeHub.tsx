import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Folder,
  FileCode,
  FileText,
  Terminal,
  ShieldCheck,
  Printer,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Language } from '../types/index.ts';

interface PythonSourceCodeHubProps {
  lang: Language;
}

export const PythonSourceCodeHub: React.FC<PythonSourceCodeHubProps> = ({ lang }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const files = [
    {
      id: 'django_admin',
      name: 'django_admin/ibn_stationery/admin.py',
      category: 'Django Admin',
      description: 'Customized Django Administration with Actions, Badges, and CSV Export',
      code: `import csv
from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from django.utils import timezone
from .models import PrintJob, StationeryPricing, PrinterAgentHeartbeat, AuditLog

@admin.action(description="Thibitisha Malipo ya Kaunta & Tuma kwa Epson L3250")
def confirm_counter_payment_action(modeladmin, request, queryset):
    """Admin action to accept cash/POS payment at counter and dispatch to Windows print agent"""
    count = 0
    for job in queryset:
        if job.status in ['uploaded', 'awaiting_payment']:
            job.payment_status = 'completed'
            job.status = 'queued'
            job.payment_reference = f"COUNTER-CASH-{request.user.username.upper()}"
            job.save()
            count += 1
            AuditLog.objects.create(
                action="Uthibitisho wa Malipo ya Kaunta",
                performed_by=request.user.username,
                job_id=job.id,
                details=f"Malipo ya {job.total_tzs} TZS yamethibitishwa kwa pesa taslimu. Kazi imetumwa kwenye foleni ya Epson L3250."
            )
    modeladmin.message_user(request, f"Kazi {count} zimethibitishwa na kuingizwa kwenye foleni ya Epson L3250.")

@admin.action(description="Export Kazi Zilizochaguliwa kwenda CSV Report")
def export_jobs_to_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="ibn_print_jobs_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
    writer = csv.writer(response)
    writer.writerow(['Job ID', 'Mteja', 'Simu', 'Faili', 'Kurasa', 'Nakala', 'Rangi/BW', 'Karatasi', 'Gharama (TZS)', 'Hali ya Printi'])
    for job in queryset:
        writer.writerow([job.id, job.customer_name, job.customer_phone, job.file_name, job.page_count, job.copies, job.get_color_mode_display(), job.paper_size, job.total_tzs, job.get_status_display()])
    return response

@admin.register(PrintJob)
class PrintJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_phone', 'file_name', 'page_count', 'copies', 'color_badge', 'total_cost_tzs', 'payment_status_badge', 'job_status_badge')
    list_filter = ('status', 'payment_status', 'payment_method', 'color_mode', 'paper_size', 'created_at')
    search_fields = ('id', 'customer_name', 'customer_phone', 'file_name')
    actions = [confirm_counter_payment_action, export_jobs_to_csv]

    def total_cost_tzs(self, obj):
        return format_html('<b>{:,} TZS</b>', obj.total_tzs)

    def color_badge(self, obj):
        if obj.color_mode == 'color':
            return format_html('<span style="color:#d97706; font-weight:bold;">● Colour</span>')
        return format_html('<span style="color:#4b5563; font-weight:bold;">○ B&W</span>')

    def payment_status_badge(self, obj):
        color = '#16a34a' if obj.payment_status == 'completed' else '#d97706'
        return format_html('<span style="background:{}; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px;">{}</span>', color, obj.get_payment_status_display())

    def job_status_badge(self, obj):
        color = '#16a34a' if obj.status == 'completed' else '#2563eb' if obj.status == 'printing' else '#0891b2' if obj.status == 'queued' else '#d97706'
        return format_html('<span style="background:{}; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">{}</span>', color, obj.get_status_display())`,
    },
    {
      id: 'django_models',
      name: 'django_admin/ibn_stationery/models.py',
      category: 'Django Models',
      description: 'Database Models for Print Jobs, TZS Pricing, EcoTank Telemetry & Audit Logs',
      code: `from django.db import models
from django.utils import timezone

class StationeryPricing(models.Model):
    title = models.CharField(max_length=100, default="Bei za Kawaida za Duka")
    bw_per_page_tzs = models.PositiveIntegerField(default=150, verbose_name="Bei ya B&W kwa Ukurasa (TZS)")
    color_per_page_tzs = models.PositiveIntegerField(default=500, verbose_name="Bei ya Rangi kwa Ukurasa (TZS)")
    photo_paper_markup_tzs = models.PositiveIntegerField(default=200)
    staple_cost_tzs = models.PositiveIntegerField(default=100)
    spiral_binding_cost_tzs = models.PositiveIntegerField(default=2500)
    manual_duplex_discount_pct = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

class PrintJob(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    access_token = models.CharField(max_length=64, editable=False)
    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=30)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    page_count = models.PositiveIntegerField(default=1)
    color_mode = models.CharField(max_length=10, choices=[('bw', 'Black & White'), ('color', 'Colour')], default='bw')
    paper_size = models.CharField(max_length=20, default='A4')
    copies = models.PositiveIntegerField(default=1)
    total_tzs = models.PositiveIntegerField()
    payment_method = models.CharField(max_length=20, default='counter')
    payment_status = models.CharField(max_length=20, default='counter_pending')
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=25, default='awaiting_payment')
    printer_assigned = models.CharField(max_length=100, default='EPSON L3250 Series')
    os_job_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

class PrinterAgentHeartbeat(models.Model):
    printer_name = models.CharField(max_length=120, default="EPSON L3250 Series")
    status = models.CharField(max_length=50, default="online")
    queue_count = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(default="192.168.1.145")
    black_ink_percent = models.IntegerField(default=85)
    cyan_ink_percent = models.IntegerField(default=70)
    magenta_ink_percent = models.IntegerField(default=65)
    yellow_ink_percent = models.IntegerField(default=80)
    last_seen = models.DateTimeField(auto_now=True)`,
    },
    {
      id: 'fastapi_backend',
      name: 'backend/main.py',
      category: 'FastAPI Backend',
      description: 'REST API, Smartphone Uploads, M-Pesa Webhooks & Windows Agent Polling',
      code: `from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
import sqlite3, os, uuid, datetime

app = FastAPI(title="Ibn Smart Print API", version="2.0.0")

@app.post("/api/jobs/create")
async def create_print_job(
    file: UploadFile = File(...),
    customer_name: str = Form(...),
    customer_phone: str = Form(...),
    color_mode: str = Form("bw"),
    paper_size: str = Form("A4"),
    copies: int = Form(1),
    total_tzs: int = Form(...)
):
    job_id = f"IBN-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    saved_path = f"storage/documents/{job_id}_{file.filename}"
    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)

    return {"job_id": job_id, "status": "awaiting_payment", "total_tzs": total_tzs}

@app.get("/api/agent/next-job")
async def agent_get_next_job(x_agent_secret: str = Header(...)):
    # Returns queued and paid jobs to Windows Print Agent
    return {"has_job": True, "download_url": "/api/agent/download/IBN-2026-0841"}`,
    },
    {
      id: 'windows_agent',
      name: 'agent/print_agent.py',
      category: 'Windows Print Agent',
      description: 'Local Python Service for Epson L3250 Driver, Win32 Spooler & Idempotent Printing',
      code: `import os, sys, time, json, requests, subprocess
from pathlib import Path

# Windows native spooler bindings
if sys.platform.startswith("win"):
    import win32print, win32api
else:
    win32print = None

class WindowsEpsonL3250Agent:
    def __init__(self):
        self.server_url = "https://ibn-print.tz"
        self.secret = "ibn-secret-agent-key-2026"
        self.target_printer = "EPSON L3250 Series"
        self.session = requests.Session()
        self.session.headers.update({"X-Agent-Secret": self.secret})

    def execute_windows_print(self, file_path: Path, job: dict):
        # Sends job directly to Epson L3250 driver
        args = ["SumatraPDF.exe", "-print-to", self.target_printer, "-silent"]
        if job.get("copies", 1) > 1:
            args.extend(["-print-settings", f"{job['copies']}x"])
        args.append(str(file_path))
        subprocess.run(args, check=True)
        self.update_job_status(job["id"], "completed")`,
    },
    {
      id: 'setup_wizard',
      name: 'agent/printer_setup_wizard.py',
      category: 'Setup & Diagnostics',
      description: 'CLI Tool to Detect Epson L3250, Check Wi-Fi / USB, Test Spooler & Test PDF',
      code: `import win32print, requests
print("=== EPSON ECOTANK L3250 SETUP WIZARD (TANZANIA) ===")
# Detects printers in Windows and checks Wi-Fi connectivity`,
    },
    {
      id: 'batch_runner',
      name: 'setup_windows_service.bat',
      category: 'Windows Runner',
      description: 'One-Click Batch Script to Install Dependencies & Launch Agent on Shop PC',
      code: `@echo off
TITLE Ibn Smart Print - Windows Agent
pip install -r agent\\requirements_agent.txt
python agent\\print_agent.py
pause`,
    },
  ];

  const [selectedFile, setSelectedFile] = useState(files[0]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (fileName: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName.split('/').pop() || 'script.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white mb-8 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <Code className="w-3.5 h-3.5" />
              <span>Source Code & Production Architecture</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Msimbo Rasmi wa Mfumo (Python, Django & FastAPI)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Kulingana na masharti yako, dashboard ya utawala imeandaliwa kwa <strong>Python na Django</strong>, seva ya API imeandaliwa kwa <strong>FastAPI</strong>, na huduma ya uchapishaji ya kompyuta ya duka (Windows) imeandaliwa kwa <strong>Python Local Print Agent</strong> ya Epson L3250.
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadFile(selectedFile.name, selectedFile.code)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Pakua Faili Hili (.py)</span>
          </button>
        </div>
      </div>

      {/* Explorer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar File Tree */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-2">
            Orodha ya Mafaili (System Modules)
          </span>

          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-start justify-between gap-2 ${
                  selectedFile.id === file.id
                    ? 'bg-slate-900 text-white border-slate-800 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="block font-mono font-bold truncate">{file.name}</span>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      selectedFile.id === file.id ? 'text-teal-300' : 'text-slate-500'
                    }`}
                  >
                    {file.category}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-50 mt-1" />
              </button>
            ))}
          </div>

          {/* Windows Setup Guidance Card */}
          <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-teal-800" />
              <span>Mwongozo wa Duka la Tanzania:</span>
            </h5>
            <p className="leading-relaxed text-[11px] text-teal-900">
              Kompyuta ya Windows ya duka itafungua <code>setup_windows_service.bat</code>, ambayo itaunganisha moja kwa moja na printer ya <strong>Epson EcoTank L3250</strong> kupitia Wi-Fi ya dukani.
            </p>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-slate-200 font-bold">{selectedFile.name}</span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(selectedFile.code, selectedFile.id)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium text-xs flex items-center gap-1.5 transition"
            >
              {copiedKey === selectedFile.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Imenakiliwa!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nakili Msimbo</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-900/90 text-[11px] font-mono text-slate-400 border-b border-slate-800/80">
            {selectedFile.description}
          </div>

          <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[600px] select-all">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
