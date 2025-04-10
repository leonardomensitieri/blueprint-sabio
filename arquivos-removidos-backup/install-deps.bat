@echo off
echo Instalando dependencias do Blueprint Sabio...

echo Limpando cache do npm...
call npm cache clean --force

echo Instalando todas as dependencias...
call npm install --legacy-peer-deps

echo Verificando bibliotecas criticas...

echo Instalando React Router...
call npm install react-router-dom@6 --legacy-peer-deps

echo Instalando Firebase...
call npm install firebase --legacy-peer-deps

echo Instalando Stripe...
call npm install @stripe/stripe-js @stripe/react-stripe-js --legacy-peer-deps

echo Instalando tipos para TypeScript...
call npm install --save-dev @types/react-router-dom @types/react @types/react-dom --legacy-peer-deps

echo ======================================
echo Instalacao concluida!
echo.
echo Se voce ainda encontrar problemas de compatibilidade, considere:
echo 1. Fazer downgrade do React para a versao 18:
echo    npm install react@18 react-dom@18 --legacy-peer-deps
echo.
echo 2. Ou forcar a instalacao das dependencias:
echo    npm install --force
echo.
echo Para iniciar o projeto, execute: npm start
echo ======================================
pause