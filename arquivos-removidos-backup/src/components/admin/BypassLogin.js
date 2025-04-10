import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { 
  getDoc, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Componente para login direto como usuário de teste
 * Este componente cria e/ou faz login automaticamente com as credenciais de teste
 */
const BypassLogin = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Preparando acesso rápido...');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Usuário de teste padrão
    const testEmail = 'teste@exemplo.com';
    const testPassword = 'senha123';
    
    const createAndLoginUser = async () => {
      const auth = getAuth();
      
      try {
        setMessage('Tentando login automático...');
        
        try {
          // Primeiro, tentar login normal
          const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log('Login bem-sucedido com credenciais de teste');
          
          // Definir como admin, se necessário
          await ensureUserIsAdmin(userCredential.user.uid, testEmail);
          
          setMessage('Login realizado com sucesso! Redirecionando...');
          
        } catch (loginError) {
          console.log('Erro no login, tentando criar usuário:', loginError.message);
          
          // Se o usuário não existir, tente criá-lo
          if (loginError.code === 'auth/user-not-found') {
            setMessage('Criando conta de teste...');
            
            try {
              // Criar um novo usuário
              const newUserCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
              console.log('Usuário de teste criado com sucesso!');
              
              // Configurar como admin
              await ensureUserIsAdmin(newUserCredential.user.uid, testEmail);
              
              setMessage('Conta de teste criada com sucesso! Redirecionando...');
              
            } catch (createError) {
              console.error('Erro ao criar usuário:', createError);
              
              // Se já existe (outro processo pode ter criado), tente login novamente
              if (createError.code === 'auth/email-already-in-use') {
                try {
                  const retryCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
                  console.log('Login realizado após tentativa de criação');
                  
                  // Garantir que é admin
                  await ensureUserIsAdmin(retryCredential.user.uid, testEmail);
                  
                  setMessage('Login realizado após tentativa de criação! Redirecionando...');
                } catch (retryError) {
                  throw retryError;
                }
              } else {
                throw createError;
              }
            }
          } else {
            throw loginError;
          }
        }
        
        // Definir flag de sessão e redirecionar
        sessionStorage.setItem('adminAccess', 'true');
        
        // Redirecionar após breve atraso para permitir ver a mensagem
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
      } catch (error) {
        console.error('Erro geral no processo de login/criação:', error);
        setError(`Erro ao acessar: ${error.message}`);
      }
    };
    
    // Função para garantir que o usuário é admin
    const ensureUserIsAdmin = async (uid, email) => {
      try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Criar documento de usuário se não existir
          await setDoc(userRef, {
            email: email,
            role: 'admin',
            name: 'Usuário Teste',
            hasActiveSubscription: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('Perfil de admin criado para o usuário');
        } else if (userDoc.data().role !== 'admin') {
          // Atualizar para admin se não for
          await setDoc(userRef, {
            role: 'admin',
            hasActiveSubscription: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log('Perfil atualizado para admin');
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao configurar perfil de admin:', error);
        return false;
      }
    };
    
    createAndLoginUser();
  }, [navigate]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '50px',
      maxWidth: '500px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h2>Acesso Rápido</h2>
      
      {!error ? (
        <>
          <p>{message}</p>
          <div className="loading-icon">
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
          <p>Aguarde o redirecionamento automático...</p>
          
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      ) : (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Ir para Login Normal
          </button>
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <p><strong>Instruções:</strong></p>
        <p>Este processo cria automaticamente um usuário de teste se necessário.</p>
        <p>Se o redirecionamento não ocorrer, clique no botão abaixo:</p>
        <button 
          onClick={() => {
            sessionStorage.setItem('adminAccess', 'true');
            navigate('/dashboard');
          }}
          style={{
            padding: '10px 20px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Acessar Dashboard
        </button>
      </div>
    </div>
  );
};

export default BypassLogin;