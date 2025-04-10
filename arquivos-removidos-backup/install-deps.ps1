# Script de instalação de dependências para Blueprint Sábio (PowerShell)

Write-Host "Instalando dependências do Blueprint Sábio..." -ForegroundColor Cyan

Write-Host "Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Instalando todas as dependências..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host "Verificando bibliotecas críticas..." -ForegroundColor Yellow

Write-Host "Instalando React Router..." -ForegroundColor Yellow
npm install react-router-dom@6 --legacy-peer-deps

Write-Host "Instalando Firebase..." -ForegroundColor Yellow
npm install firebase --legacy-peer-deps

Write-Host "Instalando Stripe..." -ForegroundColor Yellow
npm install @stripe/stripe-js @stripe/react-stripe-js --legacy-peer-deps

Write-Host "Instalando tipos para TypeScript..." -ForegroundColor Yellow
npm install --save-dev @types/react-router-dom @types/react @types/react-dom --legacy-peer-deps

Write-Host "======================================" -ForegroundColor Green
Write-Host "Instalação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Se você ainda encontrar problemas de compatibilidade, considere:" -ForegroundColor Cyan
Write-Host "1. Fazer downgrade do React para a versão 18:" -ForegroundColor Cyan
Write-Host "   npm install react@18 react-dom@18 --legacy-peer-deps" -ForegroundColor White
Write-Host ""
Write-Host "2. Ou forçar a instalação das dependências:" -ForegroundColor Cyan
Write-Host "   npm install --force" -ForegroundColor White
Write-Host ""
Write-Host "Para iniciar o projeto, execute: npm start" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

Read-Host -Prompt "Pressione ENTER para continuar"