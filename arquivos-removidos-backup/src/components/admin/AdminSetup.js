import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import './AdminSetup.css';

/**
 * Componente para configuração de administrador
 * Esta é uma tela "secreta" que só deve ser acessada diretamente pela URL
 */
const AdminSetup = () => {
  const { currentUser } = useAuth();
  const [adminEmail, setAdminEmail] = useState('leonardomensitierii@gmail.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [adminCode, setAdminCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Código de segurança adicional (simples, apenas para desencorajar uso não autorizado)
  const SECURITY_CODE = 'BlueprintSabio2024';

  const verifyCode = () => {
    if (adminCode === SECURITY_CODE) {
      setIsCodeVerified(true);
      setResult({
        success: true,
        message: 'Código verificado. Você pode prosseguir com a configuração de administrador.'
      });
    } else {
      setResult({
        success: false,
        message: 'Código de segurança incorreto. Tente novamente.'
      });
    }
  };

  const setUserAsAdmin = async (e) => {
    e.preventDefault();
    
    if (!isCodeVerified) {
      setResult({
        success: false,
        message: 'Por favor, verifique o código de segurança primeiro.'
      });
      return;
    }
    
    if (!currentUser) {
      setResult({
        success: false,
        message: 'Você precisa estar autenticado para realizar esta operação.'
      });
      return;
    }
    
    if (!adminEmail) {
      setResult({
        success: false,
        message: 'Por favor, forneça um email válido.'
      });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const db = getFirestore();
      
      // Buscar usuário pelo email
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', adminEmail)
      );
      
      const querySnapshot = await getDocs(userQuery);
      
      if (querySnapshot.empty) {
        setResult({
          success: false,
          message: `Nenhum usuário encontrado com o email ${adminEmail}. Certifique-se de que este usuário já foi registrado no aplicativo.`
        });
        setIsProcessing(false);
        return;
      }
      
      // Obter o primeiro documento encontrado
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      
      // Atualizar como administrador
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
        hasActiveSubscription: true,
        updatedAt: serverTimestamp()
      });
      
      setResult({
        success: true,
        message: `Usuário ${adminEmail} agora é um administrador com acesso permanente.`,
        userId
      });
    } catch (error) {
      console.error('Erro ao definir administrador:', error);
      setResult({
        success: false,
        message: `Erro ao definir administrador: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Se não estiver autenticado, mostrar mensagem
  if (!currentUser) {
    return (
      <div className="admin-setup">
        <h2>Configuração de Administrador</h2>
        <div className="result-message error">
          <p>Você precisa estar autenticado para acessar esta página.</p>
          <p>Por favor, faça login e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-setup">
      <h2>Configuração de Administrador</h2>
      
      {!isCodeVerified ? (
        <div className="security-verification">
          <p>Esta é uma página de configuração de administradores. Por favor, insira o código de segurança para continuar.</p>
          
          <div className="form-group">
            <label htmlFor="security-code">Código de Segurança:</label>
            <input
              type="password"
              id="security-code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Digite o código de segurança"
            />
          </div>
          
          <button 
            className="verify-button"
            onClick={verifyCode}
            disabled={!adminCode}
          >
            Verificar Código
          </button>
          
          {result && (
            <div className={`result-message ${result.success ? 'success' : 'error'}`}>
              {result.message}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="admin-info">
            <p>
              Esta ferramenta permite definir um usuário como administrador no Blueprint Sábio.
              O administrador terá acesso permanente a todos os recursos, sem necessidade de assinatura.
            </p>
            
            <p className="warning">
              <strong>Atenção:</strong> Esta operação é sensível e não pode ser facilmente revertida.
              Certifique-se de que está definindo o usuário correto como administrador.
            </p>
          </div>
          
          <form onSubmit={setUserAsAdmin}>
            <div className="form-group">
              <label htmlFor="admin-email">Email do Administrador:</label>
              <input
                type="email"
                id="admin-email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={isProcessing}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="admin-button"
              disabled={isProcessing || !adminEmail}
            >
              {isProcessing ? 'Processando...' : 'Definir como Administrador'}
            </button>
          </form>
          
          {result && (
            <div className={`result-message ${result.success ? 'success' : 'error'}`}>
              {result.message}
            </div>
          )}
          
          <div className="instructions">
            <h3>Instruções</h3>
            <ol>
              <li>Certifique-se de que o usuário já está registrado no aplicativo</li>
              <li>Informe o email do usuário no campo acima</li>
              <li>Clique em "Definir como Administrador"</li>
              <li>Aguarde a confirmação de sucesso</li>
              <li>O usuário terá acesso permanente ao Blueprint Sábio</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSetup;