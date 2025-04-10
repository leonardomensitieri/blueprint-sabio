import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { deleteUserByEmail, promoteToAdmin, addSubscription } from './adminTools.js';

// Estilos básicos para o componente
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    fontSize: '16px'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '16px'
  },
  dangerButton: {
    backgroundColor: '#dc3545'
  },
  successButton: {
    backgroundColor: '#28a745'
  },
  warningButton: {
    backgroundColor: '#ffc107',
    color: '#212529'
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  statusMessage: {
    padding: '15px',
    marginTop: '20px',
    borderRadius: '4px'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  }
};

const AdminTools = () => {
  const { isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar se o usuário é administrador
  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Acesso Negado</h2>
        <p>Você não tem permissões de administrador para acessar esta página.</p>
      </div>
    );
  }

  const handleDeleteUser = async () => {
    if (!email) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, insira um email válido.'
      });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${email}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const result = await deleteUserByEmail(email);
      setStatusMessage({
        type: 'success',
        text: result.message || `Usuário ${email} excluído com sucesso.`
      });
      setEmail('');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.message || `Erro ao excluir usuário ${email}.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!email) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, insira um email válido.'
      });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja promover ${email} para administrador?`)) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const result = await promoteToAdmin(email);
      setStatusMessage({
        type: 'success',
        text: result.message || `Usuário ${email} promovido a administrador com sucesso.`
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.message || `Erro ao promover usuário ${email}.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!email) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, insira um email válido.'
      });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja adicionar assinatura premium para ${email}?`)) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const result = await addSubscription(email);
      setStatusMessage({
        type: 'success',
        text: result.message || `Assinatura premium adicionada para ${email} com sucesso.`
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.message || `Erro ao adicionar assinatura para ${email}.`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Ferramentas de Administração</h2>
      
      <div style={styles.formGroup}>
        <label htmlFor="email">Email do usuário:</label>
        <input 
          type="email" 
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite o email do usuário"
          style={styles.input}
          disabled={isProcessing}
        />
      </div>

      <div style={styles.buttonContainer}>
        <button 
          onClick={handlePromoteToAdmin} 
          style={{...styles.button, ...styles.successButton}}
          disabled={isProcessing}
        >
          Promover para Admin
        </button>
        
        <button 
          onClick={handleAddSubscription} 
          style={{...styles.button, ...styles.warningButton}}
          disabled={isProcessing}
        >
          Adicionar Assinatura
        </button>
        
        <button 
          onClick={handleDeleteUser} 
          style={{...styles.button, ...styles.dangerButton}}
          disabled={isProcessing}
        >
          Excluir Usuário
        </button>
      </div>

      {statusMessage && (
        <div 
          style={{
            ...styles.statusMessage, 
            ...(statusMessage.type === 'success' ? styles.success : styles.error)
          }}
        >
          {statusMessage.text}
        </div>
      )}
      
      <div style={{marginTop: '30px'}}>
        <h3>Instruções</h3>
        <ul>
          <li><strong>Promover para Admin:</strong> Define o usuário como administrador, concedendo acesso a todas as funcionalidades e assinatura premium.</li>
          <li><strong>Adicionar Assinatura:</strong> Concede acesso premium ao usuário sem alterar seu nível de permissão.</li>
          <li><strong>Excluir Usuário:</strong> Remove completamente o usuário do sistema, incluindo autenticação e todos os dados.</li>
        </ul>
        <p><strong>Atenção:</strong> A exclusão é permanente e não pode ser desfeita!</p>
      </div>
    </div>
  );
};

export default AdminTools;