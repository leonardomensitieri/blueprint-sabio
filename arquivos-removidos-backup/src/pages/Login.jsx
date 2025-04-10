import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('[DEBUG] Tentando login com:', email);
      
      // Login com AuthProvider
      await login(email, password);
      
      console.log('[DEBUG] Login bem-sucedido, redirecionando...');
      navigate('/dashboard');
    } catch (err) {
      console.error('[ERROR] Erro ao fazer login:', err);
      setError(
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? 'Email ou senha incorretos.'
          : 'Falha ao fazer login. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/forgot-password">Esqueceu a senha?</Link>
          <Link to="/register">Criar uma conta</Link>
        </div>
        
        {/* Informações de Debug */}
        <div className="debug-info" style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
          <p>Versão: 1.0.1 (Debug ativado)</p>
          <p>Se estiver enfrentando problemas, por favor contacte o suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 