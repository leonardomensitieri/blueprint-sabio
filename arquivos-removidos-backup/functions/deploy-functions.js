// Script para fazer deploy das functions sem linting
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando deploy manual das Firebase Functions...');

// Função para executar comandos e mostrar a saída em tempo real
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { shell: true, stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código de saída ${code}`));
      }
    });
  });
}

async function deployFunctions() {
  try {
    // Remover verificação de linting do Firebase CLI temporariamente
    console.log('Fazendo deploy das Firebase Functions...');
    
    // Usar diretamente o firebase-tools instalado globalmente
    await runCommand('firebase', ['deploy', '--only', 'functions']);
    
    console.log('Deploy concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o deploy:', error);
    process.exit(1);
  }
}

deployFunctions();