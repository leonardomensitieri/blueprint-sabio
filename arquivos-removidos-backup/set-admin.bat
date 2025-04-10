@echo off
echo ========================================
echo  Blueprint Sabio - Configuracao de Admin
echo ========================================
echo.
echo Este script vai configurar leonardomensitierii@gmail.com como administrador.
echo.
echo Verificando requisitos...

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERRO] Node.js nao encontrado. Por favor, instale o Node.js primeiro.
  goto :end
)

echo Node.js encontrado. Executando script...
echo.

REM Executar o script de configuração de admin
node set-admin.js

echo.
echo ========================================
echo Processo concluido.
echo Por favor, verifique as mensagens acima para confirmar se a operacao foi bem-sucedida.
echo.

:end
pause