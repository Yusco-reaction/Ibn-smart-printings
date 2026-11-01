"""
Ibn Smart Print - FastAPI Core Backend
Serving mobile smartphone print portal, payment webhooks, and secure Windows Agent API.
"""

import os
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3

app = FastAPI(
    title="Ibn Smart Print API",
    version="2.0.0",
    description="Backend API for Tanzanian Stationery Cloud Printing with Epson L3250"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "storage/documents")
AGENT_API_SECRET = os.getenv("AGENT_API_SECRET", "ibn-secret-agent-key-2026")
DB_PATH = os.getenv("DB_PATH", "ibn_print.db")

os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS print_jobs (
        id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size_bytes INTEGER,
        file_type TEXT,
        page_count INTEGER DEFAULT 1,
        color_mode TEXT DEFAULT 'bw',
        paper_size TEXT DEFAULT 'A4',
        copies INTEGER DEFAULT 1,
        page_range_mode TEXT DEFAULT 'all',
        custom_page_range TEXT,
        orientation TEXT DEFAULT 'portrait',
        scaling TEXT DEFAULT 'fit',
        quality TEXT DEFAULT 'standard',
        is_manual_duplex BOOLEAN DEFAULT 0,
        binding_finishing TEXT DEFAULT 'none',
        total_tzs INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'counter',
        payment_status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        status TEXT DEFAULT 'uploaded',
        printer_assigned TEXT DEFAULT 'EPSON L3250 Series',
        os_job_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS printer_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_name TEXT,
        status TEXT,
        queue_count INTEGER,
        ip_address TEXT,
        black_ink INTEGER,
        cyan_ink INTEGER,
        magenta_ink INTEGER,
        yellow_ink INTEGER,
        paper_status TEXT,
        agent_version TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

init_db()

# --- Schemas ---
class JobStatusUpdate(BaseModel):
    status: str
    os_job_id: Optional[int] = None
    error_message: Optional[str] = None

class TelemetryReport(BaseModel):
    printer_name: str
    status: str
    queue_count: int
    ip_address: str
    black_ink: int
    cyan_ink: int
    magenta_ink: int
    yellow_ink: int
    paper_status: str
    agent_version: str

# --- Customer Endpoints ---

@app.post("/api/jobs/create")
async def create_print_job(
    file: UploadFile = File(...),
    customer_name: str = Form(...),
    customer_phone: str = Form(...),
    color_mode: str = Form("bw"),
    paper_size: str = Form("A4"),
    copies: int = Form(1),
    page_range_mode: str = Form("all"),
    custom_page_range: str = Form(""),
    orientation: str = Form("portrait"),
    scaling: str = Form("fit"),
    quality: str = Form("standard"),
    is_manual_duplex: bool = Form(False),
    binding_finishing: str = Form("none"),
    payment_method: str = Form("counter"),
    total_tzs: int = Form(...),
    db: sqlite3.Connection = Depends(get_db)
):
    """Handles upload and job creation from customer smartphone"""
    job_id = f"IBN-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    access_token = f"sec_{uuid.uuid4().hex[:12]}"
    
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{job_id}_{uuid.uuid4().hex[:4]}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)

    initial_payment_status = "counter_pending" if payment_method == "counter" else "pending"
    initial_job_status = "awaiting_payment"

    cur = db.cursor()
    cur.execute("""
    INSERT INTO print_jobs (
        id, access_token, customer_name, customer_phone, file_name, file_path,
        file_size_bytes, file_type, color_mode, paper_size, copies,
        page_range_mode, custom_page_range, orientation, scaling, quality,
        is_manual_duplex, binding_finishing, total_tzs, payment_method,
        payment_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_id, access_token, customer_name, customer_phone, file.filename, saved_path,
        len(content), file.content_type, color_mode, paper_size, copies,
        page_range_mode, custom_page_range, orientation, scaling, quality,
        1 if is_manual_duplex else 0, binding_finishing, total_tzs, payment_method,
        initial_payment_status, initial_job_status
    ))
    db.commit()

    return {
        "job_id": job_id,
        "access_token": access_token,
        "status": initial_job_status,
        "payment_status": initial_payment_status,
        "total_tzs": total_tzs,
        "message_sw": "Kazi yako imepokelewa kwa ufanisi! Fuatilia au kamilisha malipo.",
        "message_en": "Your job has been submitted successfully! Please proceed to payment."
    }

@app.get("/api/jobs/{job_id}/status")
async def get_job_status(job_id: str, token: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """Customer job tracking endpoint (protected by access token or query)"""
    cur = db.cursor()
    cur.execute("SELECT * FROM print_jobs WHERE id = ?", (job_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Kazi hii haikupatikana (Job not found)")

    # Return public job status summary
    return dict(row)

# --- Windows Local Agent Secure Endpoints ---

def verify_agent_token(x_agent_secret: str = Header(...)):
    if x_agent_secret != AGENT_API_SECRET:
        raise HTTPException(status_code=403, detail="Unauthorized local print agent")

@app.get("/api/agent/next-job")
async def agent_get_next_job(
    x_agent_secret: str = Header(...),
    db: sqlite3.Connection = Depends(get_db)
):
    """Windows Agent polls this endpoint to fetch the next queued & paid job"""
    verify_agent_token(x_agent_secret)
    cur = db.cursor()
    cur.execute("""
    SELECT * FROM print_jobs 
    WHERE (payment_status = 'completed') 
      AND (status = 'queued' OR status = 'payment_confirmed')
    ORDER BY created_at ASC LIMIT 1
    """)
    job = cur.fetchone()
    if not job:
        return {"has_job": False}

    job_dict = dict(job)
    # Mark as queued to prevent duplicate pick up
    cur.execute("UPDATE print_jobs SET status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (job_dict["id"],))
    db.commit()

    return {
        "has_job": True,
        "job": job_dict,
        "download_url": f"/api/agent/download/{job_dict['id']}?token={job_dict['access_token']}"
    }

@app.get("/api/agent/download/{job_id}")
async def agent_download_doc(
    job_id: str,
    token: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """Provides file binary securely to the Windows Print Agent"""
    cur = db.cursor()
    cur.execute("SELECT file_path, file_name, access_token FROM print_jobs WHERE id = ?", (job_id,))
    row = cur.fetchone()
    if not row or row["access_token"] != token:
        raise HTTPException(status_code=403, detail="Invalid download token")

    file_path = row["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing on server storage")

    return FileResponse(file_path, filename=row["file_name"])

@app.post("/api/agent/job/{job_id}/status")
async def agent_update_job_status(
    job_id: str,
    update: JobStatusUpdate,
    x_agent_secret: str = Header(...),
    db: sqlite3.Connection = Depends(get_db)
):
    """Windows Agent sends status callbacks (printing, completed, failed)"""
    verify_agent_token(x_agent_secret)
    cur = db.cursor()
    completed_time = datetime.datetime.now().isoformat() if update.status == "completed" else None
    cur.execute("""
    UPDATE print_jobs 
    SET status = ?, os_job_id = COALESCE(?, os_job_id), completed_at = COALESCE(?, completed_at), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (update.status, update.os_job_id, completed_time, job_id))
    db.commit()
    return {"status": "updated", "job_id": job_id}

@app.post("/api/agent/telemetry")
async def agent_report_telemetry(
    telemetry: TelemetryReport,
    x_agent_secret: str = Header(...),
    db: sqlite3.Connection = Depends(get_db)
):
    """Receives printer ink levels, queue count, and connectivity status"""
    verify_agent_token(x_agent_secret)
    cur = db.cursor()
    cur.execute("""
    INSERT INTO printer_telemetry (
        printer_name, status, queue_count, ip_address, black_ink, cyan_ink, magenta_ink, yellow_ink, paper_status, agent_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        telemetry.printer_name, telemetry.status, telemetry.queue_count, telemetry.ip_address,
        telemetry.black_ink, telemetry.cyan_ink, telemetry.magenta_ink, telemetry.yellow_ink,
        telemetry.paper_status, telemetry.agent_version
    ))
    db.commit()
    return {"status": "ok"}
