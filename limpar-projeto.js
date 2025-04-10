/**
 * Script para limpar o projeto, mantendo apenas os arquivos essenciais
 * IMPORTANTE: Este script move os arquivos não essenciais para uma pasta de backup
 * ao invés de excluí-los, por segurança.
 */

const fs = require('fs');
const path = require('path');

// Diretório de backup para os arquivos não essenciais
const BACKUP_DIR = 'arquivos-removidos-backup';

// Lista de arquivos e pastas essenciais a serem mantidos
const essentialFiles = [
  'build',
  'build-backup-20250325',
  'package.json',
  'package-lock.json',
  'serve-build.js',
  'serve-build.bat',
  'INSTRUCOES-BUILD.md',
  'BACKUP-PASTA-BUILD.md',
  'ARQUIVOS-ESSENCIAIS.md',
  'COMO-PROCEDER.md',
  'README.md',
  'limpar-projeto.js',
  'limpar-projeto.bat',
  'node_modules',
  '.git'  // Manter o controle de versão se existir
];

// Função para mover um arquivo ou diretório
function moveFileOrDirectory(source, destination) {
  // Verificar se o arquivo/diretório existe
  if (!fs.existsSync(source)) {
    console.log(`Ignorando: ${source} (não existe)`);
    return false;
  }

  // Criar diretório de destino se não existir
  const dirName = path.dirname(destination);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  // Mover o arquivo/diretório
  try {
    fs.renameSync(source, destination);
    return true;
  } catch (error) {
    console.error(`Erro ao mover ${source}: ${error.message}`);
    return false;
  }
}

// Função principal
function cleanProject() {
  console.log(`Iniciando limpeza do projeto...`);
  console.log(`Os arquivos não essenciais serão movidos para: ${BACKUP_DIR}`);
  
  // Criar pasta de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Obter todos os arquivos e pastas no diretório atual
  const files = fs.readdirSync('.');
  
  // Para cada arquivo/pasta, verificar se é essencial
  let movedCount = 0;
  for (const file of files) {
    // Ignorar a pasta de backup e arquivos ocultos do sistema
    if (file === BACKUP_DIR || file.startsWith('.') && file !== '.git') {
      continue;
    }
    
    // Se não estiver na lista de essenciais, mover para o backup
    if (!essentialFiles.includes(file)) {
      console.log(`Movendo: ${file}`);
      const destination = path.join(BACKUP_DIR, file);
      const moved = moveFileOrDirectory(file, destination);
      
      if (moved) {
        console.log(`✓ ${file} movido para ${BACKUP_DIR}`);
        movedCount++;
      }
    } else {
      console.log(`Mantendo: ${file} (essencial)`);
    }
  }
  
  console.log(`
=========================================
Limpeza concluída!
=========================================

✓ ${movedCount} arquivos/pastas movidos para ${BACKUP_DIR}
✓ Todos os arquivos essenciais foram mantidos

IMPORTANTE: 
Os arquivos não foram excluídos, apenas movidos para a pasta de backup.
Se precisar recuperar algo, os arquivos estão na pasta "${BACKUP_DIR}".

Para executar a aplicação:
1. Execute: serve-build.bat
2. Acesse: http://localhost:3000

Para instalar dependências necessárias:
npm install express
`);

  // Criar arquivo README no diretório de backup
  const readmeContent = `
# Arquivos Removidos - Backup

Esta pasta contém arquivos e pastas que foram removidos do projeto principal
por não serem essenciais para executar a versão compilada (build).

Estes arquivos foram movidos aqui em ${new Date().toLocaleString()} para limpar o projeto,
mas foram preservados caso sejam necessários no futuro.

Para restaurar um arquivo, basta movê-lo de volta para o diretório principal.
`;

  fs.writeFileSync(
    path.join(BACKUP_DIR, 'README.txt'),
    readmeContent,
    'utf8'
  );
}

// Executar função principal
cleanProject();