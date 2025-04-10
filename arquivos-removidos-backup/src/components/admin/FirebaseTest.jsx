import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

function FirebaseTest() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('Verificando...');
  const [firestoreStatus, setFirestoreStatus] = useState('Não testado');
  const [dbContent, setDbContent] = useState(null);
  
  // Função de log para registrar todas as operações e resultados
  const log = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Verificar o status de autenticação
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthStatus(`Autenticado como: ${user.email} (${user.uid})`);
        log(`Usuário autenticado: ${user.email}`);
      } else {
        setAuthStatus('Não autenticado');
        log('Nenhum usuário autenticado');
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Testar leitura do Firestore
  const testFirestoreRead = async () => {
    try {
      log('Testando leitura do Firestore...');
      setFirestoreStatus('Testando leitura...');
      
      // Tentar ler uma coleção básica
      const usersSnapshot = await getDocs(collection(db, 'users'));
      log(`Leitura bem-sucedida! ${usersSnapshot.size} documentos encontrados.`);
      
      // Mostrar os dados
      const usersData = [];
      usersSnapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setDbContent(usersData);
      
      setFirestoreStatus('Leitura bem-sucedida');
      return true;
    } catch (error) {
      log(`ERRO DE LEITURA: ${error.message}`);
      setError(error);
      setFirestoreStatus(`Falha na leitura: ${error.code}`);
      return false;
    }
  };
  
  // Testar escrita no Firestore
  const testFirestoreWrite = async () => {
    if (auth.currentUser === null) {
      log('ERRO: Autenticação necessária para escrever');
      setFirestoreStatus('Falha: Autenticação necessária');
      return;
    }
    
    try {
      log('Testando escrita no Firestore...');
      setFirestoreStatus('Testando escrita...');
      
      // Testar escrita em uma coleção de testes
      const testRef = collection(db, 'test_collection');
      const docRef = await addDoc(testRef, {
        text: 'Teste de escrita',
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid
      });
      
      log(`Escrita bem-sucedida! ID do documento: ${docRef.id}`);
      
      // Ler o documento recém-criado para verificar
      const docSnap = await getDoc(doc(db, 'test_collection', docRef.id));
      if (docSnap.exists()) {
        log('Verificação de escrita: documento existe!');
      }
      
      setFirestoreStatus('Escrita bem-sucedida');
      return true;
    } catch (error) {
      log(`ERRO DE ESCRITA: ${error.message}`);
      setError(error);
      setFirestoreStatus(`Falha na escrita: ${error.code}`);
      return false;
    }
  };
  
  // Testar escrita em subcoleção
  const testSubcollectionWrite = async () => {
    if (auth.currentUser === null) {
      log('ERRO: Autenticação necessária para escrever');
      return;
    }
    
    try {
      log('Testando escrita em subcoleção...');
      
      // Criar documento principal se necessário
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      
      // Verificar se o documento do usuário existe
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        log('Documento de usuário não existe, criando...');
        await setDoc(userRef, {
          email: auth.currentUser.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        log('Documento de usuário criado');
      }
      
      // Tentar escrever na subcoleção
      const subcollectionRef = collection(userRef, 'test_subcollection');
      const subDocRef = await addDoc(subcollectionRef, {
        text: 'Teste de subcoleção',
        timestamp: serverTimestamp()
      });
      
      log(`Escrita em subcoleção bem-sucedida! ID do documento: ${subDocRef.id}`);
      
      // Tentar escrever diretamente com path completo
      const directSubDocRef = doc(db, 'users', userId, 'financialData', 'main');
      await setDoc(directSubDocRef, {
        testField: 'Teste direto de financialData',
        timestamp: serverTimestamp()
      });
      
      log('Escrita direta em financialData bem-sucedida!');
      return true;
    } catch (error) {
      log(`ERRO EM SUBCOLEÇÃO: ${error.message}`);
      setError(error);
      return false;
    }
  };
  
  // Testar caso específico da estrutura solicitada
  const testFinancialDataStructure = async () => {
    if (auth.currentUser === null) {
      log('ERRO: Autenticação necessária para escrever');
      return;
    }
    
    try {
      log('Testando criação da estrutura financeira...');
      
      const userId = auth.currentUser.uid;
      
      // 1. Garantir que o documento de usuário existe
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        email: auth.currentUser.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      log('Documento de usuário verificado/criado');
      
      // 2. Criar financialData/main
      const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
      await setDoc(financialDataRef, {
        poderDeAporte: 1000,
        custoDeVidaMensal: 4000,
        patrimonioAcoes: {
          total: 5000,
          tickers: {
            "PETR4": {
              quantidadeAcoes: 100,
              cotacao: 25.50,
              ultimaAtualizacao: serverTimestamp()
            }
          }
        },
        patrimonioTotal: 5000,
        updatedAt: serverTimestamp()
      });
      
      log('Estrutura financeira criada com sucesso!');
      
      // 3. Verificar se foi criado corretamente
      const verification = await getDoc(financialDataRef);
      if (verification.exists()) {
        log('Verificação: documento financialData/main existe!');
        setDbContent(verification.data());
      } else {
        log('ERRO: documento não encontrado após a criação');
      }
      
      return true;
    } catch (error) {
      log(`ERRO NA ESTRUTURA FINANCEIRA: ${error.message}`);
      setError(error);
      return false;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Teste Direto de Conectividade Firebase</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Status:</h2>
        <p><strong>Autenticação:</strong> {authStatus}</p>
        <p><strong>Firestore:</strong> {firestoreStatus}</p>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={testFirestoreRead} 
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Testar Leitura
        </button>
        
        <button 
          onClick={testFirestoreWrite}
          style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Testar Escrita
        </button>
        
        <button 
          onClick={testSubcollectionWrite}
          style={{ padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Testar Subcoleção
        </button>
        
        <button 
          onClick={testFinancialDataStructure}
          style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Testar Estrutura Financeira
        </button>
      </div>
      
      {error && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <h3>Erro Detalhado:</h3>
          <p><strong>Código:</strong> {error.code}</p>
          <p><strong>Mensagem:</strong> {error.message}</p>
          {error.stack && (
            <details>
              <summary>Stack Trace</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
            </details>
          )}
          
          <h4>Possíveis soluções:</h4>
          <ul>
            <li>Verifique as <a href="https://console.firebase.google.com/project/blueprint-sabio/firestore/rules" target="_blank" rel="noopener noreferrer">regras do Firestore</a> no Console do Firebase</li>
            <li>Certifique-se de que sua conta tem permissões adequadas</li>
            <li>Verifique se o serviço do Firestore está ativo para seu projeto</li>
            <li>Verifique seu navegador para bloqueadores de cookies ou extensões de privacidade que podem interferir</li>
          </ul>
        </div>
      )}
      
      {dbContent && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px' }}>
          <h3>Conteúdo do Banco de Dados:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dbContent, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Logs:</h3>
        <div style={{ height: '300px', overflowY: 'auto', backgroundColor: '#343a40', color: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #495057', paddingBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Próximos Passos:</h3>
        <ol>
          <li>Primeiro teste a <strong>Leitura</strong> para verificar se você pode acessar o Firestore</li>
          <li>Depois teste a <strong>Escrita</strong> para verificar se você pode adicionar documentos</li>
          <li>Se esses testes funcionarem, teste a <strong>Subcoleção</strong> para verificar o acesso a estruturas aninhadas</li>
          <li>Por fim, teste a <strong>Estrutura Financeira</strong> para criar a estrutura exata solicitada</li>
        </ol>
        <p>Se todos os testes funcionarem, o problema está na lógica do componente SetupDatabase, não na conexão com o Firebase.</p>
      </div>
    </div>
  );
}

export default FirebaseTest; 