#!/bin/bash
# setup-mailserver.sh

# Create config directory
mkdir -p config

# Create the mailserver setup
cat > config/mail-setup.env << EOF
# General
HOSTNAME=${MAILCOW_HOSTNAME}
DOMAINNAME=${MAILCOW_HOSTNAME}

# Postfix
POSTFIX_REJECT_UNKNOWN_CLIENT_HOSTNAME=0
POSTFIX_MAILBOX_SIZE_LIMIT=0
POSTFIX_MESSAGE_SIZE_LIMIT=0

# Dovecot
ENABLE_POP3=1
ENABLE_IMAP=1
ENABLE_MANAGESIEVE=1

# SSL
SSL_TYPE=self-signed
TLS_LEVEL=modern

# Accounts
USERNAMES=admin@test.com,user@test.com
PASSWORDS=adminpass,userpass
EOF

# Setup the mailserver
docker-compose run --rm mailserver setup email add admin@test.com adminpass
docker-compose run --rm mailserver setup email add user@test.com userpass