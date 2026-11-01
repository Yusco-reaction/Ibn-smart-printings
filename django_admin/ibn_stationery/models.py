from django.db import models
from django.utils import timezone
import uuid

class StationeryPricing(models.Model):
    """Configuration for printing and stationery prices in Tanzanian Shillings (TZS)"""
    title = models.CharField(max_length=100, default="Bei za Kawaida za Duka")
    bw_per_page_tzs = models.PositiveIntegerField(default=150, verbose_name="Bei ya B&W kwa Ukurasa (TZS)")
    color_per_page_tzs = models.PositiveIntegerField(default=500, verbose_name="Bei ya Rangi kwa Ukurasa (TZS)")
    photo_paper_markup_tzs = models.PositiveIntegerField(default=200, verbose_name="Nyongeza ya Karatasi ya Picha (TZS)")
    staple_cost_tzs = models.PositiveIntegerField(default=100, verbose_name="Kubana Pini / Staple (TZS)")
    spiral_binding_cost_tzs = models.PositiveIntegerField(default=2500, verbose_name="Jalada la Spesho / Spiral (TZS)")
    manual_duplex_discount_pct = models.PositiveIntegerField(default=10, verbose_name="Punguzo la Duplex ya Mkono (%)")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bei ya Stationery (Pricing)"
        verbose_name_plural = "Mipangilio ya Bei za Stationery"

    def __str__(self):
        return f"{self.title} - B&W: {self.bw_per_page_tzs} TZS | Color: {self.color_per_page_tzs} TZS"


class PrintJob(models.Model):
    """Customer Print Job submission for Epson EcoTank L3250"""
    STATUS_CHOICES = [
        ('uploaded', 'Imepokelewa (Uploaded)'),
        ('awaiting_payment', 'Inasubiri Malipo (Awaiting Payment)'),
        ('payment_confirmed', 'Malipo Yamethibitishwa (Paid)'),
        ('queued', 'Kwenye Foleni ya Epson (Queued)'),
        ('printing', 'Inachapishwa (Printing)'),
        ('completed', 'Imekamilika (Completed)'),
        ('failed', 'Imeshindikana (Failed)'),
        ('cancelled', 'Imeghairiwa (Cancelled)'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('counter', 'Lipia Kaunta (Cash / POS)'),
        ('mpesa', 'M-Pesa (Vodacom)'),
        ('tigopesa', 'Tigo Pesa'),
        ('airtelmoney', 'Airtel Money'),
        ('halopesa', 'Halopesa'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Inasubiri (Pending)'),
        ('counter_pending', 'Inasubiri Kaunta (Counter Pending)'),
        ('completed', 'Imelipwa (Paid)'),
        ('failed', 'Imefeli (Failed)'),
    ]

    PAPER_SIZE_CHOICES = [
        ('A4', 'A4 (210 x 297 mm)'),
        ('A5', 'A5 (148 x 210 mm)'),
        ('A6', 'A6 (105 x 148 mm)'),
        ('B5', 'B5 (182 x 257 mm)'),
        ('Legal', 'Legal (8.5 x 14 in)'),
        ('Letter', 'Letter (8.5 x 11 in)'),
        ('Photo_10x15', 'Photo 10x15 cm (4x6 in)'),
        ('Envelope_DL', 'Envelope DL'),
    ]

    id = models.CharField(max_length=32, primary_key=True, help_text="Mfano: IBN-2026-1042")
    access_token = models.CharField(max_length=64, editable=False)
    customer_name = models.CharField(max_length=120, verbose_name="Jina la Mteja")
    customer_phone = models.CharField(max_length=30, verbose_name="Namba ya Simu")
    file_name = models.CharField(max_length=255, verbose_name="Jina la Faili")
    file_path = models.CharField(max_length=500, verbose_name="Njia ya Faili Seva")
    file_size_bytes = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=100, default="application/pdf")
    page_count = models.PositiveIntegerField(default=1, verbose_name="Idadi ya Kurasa")

    # Epson L3250 Print Settings
    color_mode = models.CharField(max_length=10, choices=[('bw', 'Black & White'), ('color', 'Colour')], default='bw')
    paper_size = models.CharField(max_length=20, choices=PAPER_SIZE_CHOICES, default='A4')
    copies = models.PositiveIntegerField(default=1, verbose_name="Nakala (Copies)")
    page_range_mode = models.CharField(max_length=10, choices=[('all', 'Zote'), ('custom', 'Maalum')], default='all')
    custom_page_range = models.CharField(max_length=100, blank=True, help_text="Mfano: 1-5, 8")
    orientation = models.CharField(max_length=15, choices=[('portrait', 'Wima'), ('landscape', 'Mlalo')], default='portrait')
    scaling = models.CharField(max_length=15, choices=[('fit', 'Fit to Page'), ('actual', 'Actual Size')], default='fit')
    quality = models.CharField(max_length=15, choices=[('standard', 'Standard'), ('high', 'High Quality')], default='standard')
    is_manual_duplex = models.BooleanField(default=False, verbose_name="Manual Duplex (Epson L3250)")
    binding_finishing = models.CharField(max_length=30, default='none')

    # Financials
    total_tzs = models.PositiveIntegerField(verbose_name="Jumla ya Malipo (TZS)")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='counter')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='counter_pending')
    payment_reference = models.CharField(max_length=100, blank=True, null=True, verbose_name="Kumbukumbu ya Malipo")

    # Spooler & Hardware
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='awaiting_payment')
    printer_assigned = models.CharField(max_length=100, default='EPSON L3250 Series')
    os_job_id = models.IntegerField(null=True, blank=True, verbose_name="Windows Spooler Job ID")

    created_at = models.DateTimeField(default=timezone.now, verbose_name="Tarehe ya Kuwasilishwa")
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Tarehe ya Kukamilika")

    class Meta:
        verbose_name = "Kazi ya Printi (Print Job)"
        verbose_name_plural = "Kazi Zote za Printi (Print Jobs)"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.id} - {self.customer_name} ({self.total_tzs} TZS) [{self.get_status_display()}]"


class PrinterAgentHeartbeat(models.Model):
    """Telemetry report from the stationery shop's Windows PC"""
    printer_name = models.CharField(max_length=120, default="EPSON L3250 Series")
    status = models.CharField(max_length=50, default="online")
    queue_count = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(default="192.168.1.145")
    black_ink_percent = models.IntegerField(default=85)
    cyan_ink_percent = models.IntegerField(default=70)
    magenta_ink_percent = models.IntegerField(default=65)
    yellow_ink_percent = models.IntegerField(default=80)
    paper_status = models.CharField(max_length=50, default="ready")
    agent_version = models.CharField(max_length=50, default="v2.4.1")
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hali ya Printer & Agent (Telemetry)"
        verbose_name_plural = "Mwenendo wa Printer ya Epson L3250"

    def __str__(self):
        return f"{self.printer_name} ({self.status}) - Jobs: {self.queue_count}"


class AuditLog(models.Model):
    """Security audit log for cash payments and admin actions"""
    timestamp = models.DateTimeField(default=timezone.now)
    action = models.CharField(max_length=150)
    performed_by = models.CharField(max_length=100, default="Stationery Admin")
    job_id = models.CharField(max_length=32, blank=True, null=True)
    details = models.TextField()

    class Meta:
        verbose_name = "Kumbukumbu ya Vitendo (Audit Log)"
        verbose_name_plural = "Kumbukumbu za Vitendo vya Admin (Audit Logs)"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} | {self.action} | {self.performed_by}"
