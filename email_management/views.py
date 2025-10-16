import imaplib
import email
from email.header import decode_header
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.conf import settings
from django.core.mail import send_mail
from .forms import ComposeEmailForm, OrganizationForm
from .models import Organization


@login_required
def inbox(request):
    # Connect to the IMAP server
    imap = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
    imap.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
    
    # Select the inbox
    imap.select("INBOX")
    
    # Search for all emails in the inbox
    status, messages_data = imap.search(None, "ALL")
    
    email_ids = messages_data[0].split()
    emails = []
    
    # Get the latest 20 emails
    for email_id in email_ids[-20:]:
        status, msg_data = imap.fetch(email_id, "(RFC822)")
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Decode email subject
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                # Decode email sender
                sender, encoding = decode_header(msg.get("From"))[0]
                if isinstance(sender, bytes):
                    sender = sender.decode(encoding if encoding else "utf-8")
                
                # Get email date
                date = msg.get("Date")
                
                emails.append({
                    'id': email_id.decode('utf-8'),
                    'subject': subject,
                    'sender': sender,
                    'date': date,
                })
    
    imap.close()
    imap.logout()
    
    return render(request, 'email_management/inbox.html', {'emails': emails})


@login_required
def email_detail(request, email_id):
    # Connect to the IMAP server
    imap = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
    imap.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
    
    # Select the inbox
    imap.select("INBOX")
    
    # Fetch the specific email
    status, msg_data = imap.fetch(email_id, "(RFC822)")
    
    email_content = ""
    subject = ""
    sender = ""
    
    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            
            # Decode email subject
            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding if encoding else "utf-8")
            
            # Decode email sender
            sender, encoding = decode_header(msg.get("From"))[0]
            if isinstance(sender, bytes):
                sender = sender.decode(encoding if encoding else "utf-8")
            
            # Get email body
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain":
                        try:
                            email_content = part.get_payload(decode=True).decode()
                            break
                        except:
                            pass
            else:
                try:
                    email_content = msg.get_payload(decode=True).decode()
                except:
                    pass
    
    imap.close()
    imap.logout()
    
    return render(request, 'email_management/email_detail.html', {
        'email_id': email_id,
        'subject': subject,
        'sender': sender,
        'content': email_content
    })


@login_required
def delete_email(request, email_id):
    # Connect to the IMAP server
    imap = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
    imap.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
    
    # Select the inbox
    imap.select("INBOX")
    
    # Mark the email for deletion
    imap.store(email_id, "+FLAGS", "\\Deleted")
    
    # Expunge to permanently delete
    imap.expunge()
    
    imap.close()
    imap.logout()
    
    messages.success(request, "Email deleted successfully.")
    return redirect('inbox')


@login_required
def compose_email(request):
    if request.method == 'POST':
        form = ComposeEmailForm(request.POST)
        if form.is_valid():
            # Send the email
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            recipient = form.cleaned_data['recipient']
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient],
                fail_silently=False,
            )
            
            messages.success(request, "Email sent successfully.")
            return redirect('inbox')
    else:
        form = ComposeEmailForm()
    
    return render(request, 'email_management/compose_email.html', {'form': form})


@login_required
def organization_list(request):
    organizations = Organization.objects.all()
    return render(request, 'email_management/organization_list.html', {'organizations': organizations})


@login_required
def add_organization(request):
    if request.method == 'POST':
        form = OrganizationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Organization added successfully.")
            return redirect('organization_list')
    else:
        form = OrganizationForm()
    
    return render(request, 'email_management/add_organization.html', {'form': form})