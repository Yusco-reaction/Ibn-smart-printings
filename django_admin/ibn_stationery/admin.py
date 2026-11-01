import csv
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
    """Exports filtered print jobs to CSV report for stationery book-keeping"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="ibn_print_jobs_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
    writer = csv.writer(response)
    writer.writerow([
        'Job ID', 'Mteja', 'Simu', 'Faili', 'Kurasa', 'Nakala',
        'Rangi/BW', 'Karatasi', 'Gharama (TZS)', 'Njia ya Malipo',
        'Hali ya Malipo', 'Hali ya Printi', 'Tarehe'
    ])
    for job in queryset:
        writer.writerow([
            job.id, job.customer_name, job.customer_phone, job.file_name,
            job.page_count, job.copies, job.get_color_mode_display(),
            job.paper_size, job.total_tzs, job.get_payment_method_display(),
            job.get_payment_status_display(), job.get_status_display(),
            job.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    return response

@admin.register(PrintJob)
class PrintJobAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'customer_name', 'customer_phone', 'file_name',
        'page_count', 'copies', 'color_badge', 'total_cost_tzs',
        'payment_status_badge', 'job_status_badge', 'created_at'
    )
    list_filter = ('status', 'payment_status', 'payment_method', 'color_mode', 'paper_size', 'created_at')
    search_fields = ('id', 'customer_name', 'customer_phone', 'file_name', 'payment_reference')
    readonly_fields = ('id', 'access_token', 'created_at', 'updated_at', 'completed_at')
    actions = [confirm_counter_payment_action, export_jobs_to_csv]

    def total_cost_tzs(self, obj):
        return format_html('<b>{:,} TZS</b>', obj.total_tzs)
    total_cost_tzs.short_description = "Gharama (TZS)"

    def color_badge(self, obj):
        if obj.color_mode == 'color':
            return format_html('<span style="color:#d97706; font-weight:bold;">● Colour</span>')
        return format_html('<span style="color:#4b5563; font-weight:bold;">○ B&W</span>')
    color_badge.short_description = "Wino"

    def payment_status_badge(self, obj):
        colors = {
            'completed': '#16a34a',
            'counter_pending': '#d97706',
            'pending': '#ea580c',
            'failed': '#dc2626'
        }
        color = colors.get(obj.payment_status, '#64748b')
        return format_html('<span style="background:{}; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px;">{}</span>',
                           color, obj.get_payment_status_display())
    payment_status_badge.short_description = "Malipo"

    def job_status_badge(self, obj):
        colors = {
            'completed': '#16a34a',
            'printing': '#2563eb',
            'queued': '#0891b2',
            'awaiting_payment': '#d97706',
            'uploaded': '#64748b',
            'failed': '#dc2626',
            'cancelled': '#94a3b8'
        }
        color = colors.get(obj.status, '#64748b')
        return format_html('<span style="background:{}; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">{}</span>',
                           color, obj.get_status_display())
    job_status_badge.short_description = "Hali ya Kazi"


@admin.register(StationeryPricing)
class StationeryPricingAdmin(admin.ModelAdmin):
    list_display = ('title', 'bw_per_page_tzs', 'color_per_page_tzs', 'photo_paper_markup_tzs', 'manual_duplex_discount_pct', 'is_active', 'updated_at')
    list_editable = ('bw_per_page_tzs', 'color_per_page_tzs', 'is_active')


@admin.register(PrinterAgentHeartbeat)
class PrinterAgentHeartbeatAdmin(admin.ModelAdmin):
    list_display = ('printer_name', 'status', 'queue_count', 'ip_address', 'ink_levels_display', 'agent_version', 'last_seen')

    def ink_levels_display(self, obj):
        return format_html(
            '<span>BK: <b>{}%</b> | C: <b>{}%</b> | M: <b>{}%</b> | Y: <b>{}%</b></span>',
            obj.black_ink_percent, obj.cyan_ink_percent, obj.magenta_ink_percent, obj.yellow_ink_percent
        )
    ink_levels_display.short_description = "Viwango vya Wino (EcoTank)"


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'performed_by', 'job_id', 'details')
    list_filter = ('action', 'performed_by', 'timestamp')
    readonly_fields = ('timestamp', 'action', 'performed_by', 'job_id', 'details')
