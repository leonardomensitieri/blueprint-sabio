@echo off
echo Iniciando script para corrigir usuarios...
echo.
echo Este script vai corrigir os valores padrao para usuarios (role e hasActiveSubscription)
echo.
echo Certifique-se de que o arquivo service-account-key.json esteja na mesma pasta.
echo.
node corrigir-usuarios.js
echo.
pause