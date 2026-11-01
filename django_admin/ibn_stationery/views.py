import csv
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from .models import PrintJob, StationeryPricing, PrinterAgentHeartbeat, AuditLog

@staff_member_required
def admin_dashboard_view(request):
    """Rich interactive admin dashboard embedded in Django Admin"""
    today = timezone.now().date()
    today_jobs = PrintJob.objects.filter(created_at__date=today)
    
    total_today_revenue = today_jobs.filter(payment_status='completed').aggregate(Sum('total_tzs'))['total_tzs__sum'] or 0
    total_today_jobs = today_jobs.count()
    completed_today = today_jobs.filter(status='completed').count()
    pending_counter_jobs = PrintJob.objects.filter(status='awaiting_payment', payment_method='counter').count()
    active_in_queue = PrintJob.objects.filter(status__in=['queued', 'printing']).count()
    
    latest_jobs = PrintJob.objects.all().order_by('-created_at')[:20]
    printer_status = PrinterAgentHeartbeat.objects.order_by('-last_seen').first()
    active_pricing = StationeryPricing.objects.filter(is_active=True).first()
    recent_audits = AuditLog.objects.order_by('-timestamp')[:10]

    context = {
        'total_today_revenue': total_today_revenue,
        'total_today_jobs': total_today_jobs,
        'completed_today': completed_today,
        'pending_counter_jobs': pending_counter_jobs,
        'active_in_queue': active_in_queue,
        'latest_jobs': latest_jobs,
        'printer_status': printer_status,
        'active_pricing': active_pricing,
        'recent_audits': recent_audits,
        'title': 'Ibn Smart Print - Dashboard ya Utawala ya Duka',
    }
    return render(request, 'admin/ibn_stationery/dashboard.html', context)

@staff_member_required
def approve_counter_payment(request, job_id):
    """Quick counter payment approval action"""
    if request.method == 'POST':
        job = get_object_or_404(PrintJob, id=job_id)
        job.payment_status = 'completed'
        job.status = 'queued'
        job.payment_reference = f"COUNTER-{request.user.username.upper()}"
        job.save()

        AuditLog.objects.create(
            action="Idhini ya Malipo ya Kaunta",
            performed_by=request.user.username,
            job_id=job.id,
            details=f"Pesa taslimu {job.total_tzs:,} TZS zimethibitishwa na {request.user.username}. Kazi imetumwa Epson L3250."
        )
        return JsonResponse({'success': True, 'job_id': job_id, 'status': 'queued'})
    return JsonResponse({'error': 'Invalid request method'}, status=400)
