subject: Quarantine notification
from: "Mail Quarantine <quarantine@mail.aeropace.com>"
to: <{{ rcpt }}>
content_type: text/plain; charset=utf-8
Hello,

A message was quarantined:
From: {{ from }}
To: {{ to }}
Subject: {{ subject }}
Date: {{ date }}

Reason: {{ reason }}

This is an automated notification.
