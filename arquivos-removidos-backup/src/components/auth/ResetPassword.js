import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import './Auth.css';
import authBgImage from '../../assets/images/auth-bg.jpg';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!email.trim()) {
      setError('Por favor, informe seu email.');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      console.log('Enviando email de redefinição de senha para:', email);
      
      // Usar diretamente o Firebase Auth para evitar problemas com o AuthProvider
      await sendPasswordResetEmail(auth, email);
      
      console.log('Email de redefinição enviado com sucesso');
      setMessage('Enviamos um link para redefinir sua senha. Verifique seu email.');
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        // Para fins de teste, mostrar mensagem de sucesso mesmo se o usuário não existir
        console.log('Usuário não encontrado, mas mostrando mensagem de sucesso para testes');
        setMessage('Se este email estiver cadastrado, você receberá um link de redefinição. Verifique sua caixa de entrada.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Email inválido. Verifique o formato.');
      } else {
        setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Redefinir Senha</h2>
          <p>Informe seu email para redefinir sua senha</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Lembrou sua senha? <Link to="/login">Voltar para o Login</Link></p>
        </div>
      </div>
      
      <div className="auth-branding" style={{ backgroundImage: `url(${authBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <h3>Blueprint Sábio</h3>
        <p>A Planilha dos Bilionários</p>
      </div>
    </div>
  );
};

export default ResetPassword;