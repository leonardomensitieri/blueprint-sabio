const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Você precisa baixar este arquivo

console.log('Iniciando teste de conexão com Firebase...');

try {
  // Inicializar o app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin SDK inicializado com sucesso!');
  
  const db = admin.firestore();
  console.log('Firestore inicializado com sucesso!');
  
  // Realizar teste de leitura simples
  async function testReadWrite() {
    try {
      // Testar leitura
      console.log('Testando leitura...');
      const testRef = db.collection('test_collection').doc('test_document');
      
      // Testar escrita
      console.log('Testando escrita...');
      await testRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Teste de conexão',
        success: true
      });
      console.log('Escrita realizada com sucesso!');
      
      // Confirmar leitura
      const doc = await testRef.get();
      console.log('Leitura realizada com sucesso!');
      console.log('Documento:', doc.exists ? 'existe' : 'não existe');
      
      if (doc.exists) {
        console.log('Dados do documento:', doc.data());
      }
      
      console.log('TESTE COMPLETO: Conexão com Firebase funcionando corretamente!');
      return true;
    } catch (error) {
      console.error('ERRO NO TESTE:', error);
      return false;
    }
  }
  
  // Executar teste
  testReadWrite().then(success => {
    if (success) {
      console.log('Teste concluído com sucesso!');
    } else {
      console.log('Teste falhou!');
    }
    process.exit();
  });
  
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  process.exit(1);
}

/**
 * INSTRUÇÕES PARA USO:
 * 
 * 1. Você precisa baixar sua chave de conta de serviço do Firebase:
 *    - Acesse o Firebase Console: https://console.firebase.google.com/project/blueprint-sabio/settings/serviceaccounts/adminsdk
 *    - Clique em "Gerar nova chave privada"
 *    - Salve o arquivo JSON na mesma pasta deste script e renomeie para "service-account-key.json"
 * 
 * 2. Instale as dependências necessárias:
 *    $ npm install firebase-admin
 * 
 * 3. Execute o script:
 *    $ node test-firebase-connection.js
 */ 