Write-Host "🔧 Setting up complete development environment..." -ForegroundColor Green

Write-Host "🗑️  Resetting Docker environment..." -ForegroundColor Yellow
npm run docker:reset

Write-Host "📧 Starting Mailcow..." -ForegroundColor Yellow
npm run mailcow:start

Write-Host "⏳ Waiting for Mailcow to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "⚙️  Setting up Mailcow configuration..." -ForegroundColor Yellow
npm run mailcow:setup

Write-Host "🐳 Building application containers (no cache)..." -ForegroundColor Yellow
npm run docker:build-nocache

Write-Host "🚀 Starting application in detached mode..." -ForegroundColor Yellow
npm run docker:dev-detached

Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host "🌐 Application: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📧 Mailcow Admin: https://mail.aeropace.com" -ForegroundColor Cyan