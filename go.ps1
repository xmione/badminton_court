# go.ps1
# Just recreate the dovecot container
Clear-Host

npm run docker:build-nocache

# Write-Host "Recreating Dovecot container..." -ForegroundColor Cyan
# Write-Host "docker-compose --env-file .env.docker up -d --force-recreate --no-deps dovecot" -ForegroundColor Cyan
# docker-compose --env-file .env.docker up -d --force-recreate --no-deps dovecot