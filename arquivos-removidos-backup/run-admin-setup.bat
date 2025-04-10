@echo off
echo ========================================
echo  Blueprint Sabio - Configuracao de Admin
echo ========================================
echo.
echo Este script vai configurar leonardomensitierii@gmail.com como administrador.
echo.
echo Verificando Node.js...

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo [ERRO] Node.js nao encontrado. Por favor, instale o Node.js primeiro.
  goto :end
)

echo Node.js encontrado.
echo.
echo Instalando dependencias necessarias...
cd /d "%~dp0"
call npm install firebase --no-save

echo.
echo Executando script de configuracao...
node simple-admin.js

echo.
echo ========================================
echo Se tudo correu bem, o usuario ja deve ter acesso de administrador.
echo Para confirmar, faca login com leonardomensitierii@gmail.com no aplicativo.
echo.

:end
pause