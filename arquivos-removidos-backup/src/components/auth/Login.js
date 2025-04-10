import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './Auth.css';
import authBgImage from '../../assets/images/auth-bg.jpg';

const Login = () => {
  // Credenciais pré-preenchidas para facilitar o login
  const [email, setEmail] = useState('teste@exemplo.com');
  const [password, setPassword] = useState('senha123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Versão simplificada do login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Login básico
      await login(email, password);
      
      // Mostrar sucesso e definir admin para testes
      setSuccess('Login realizado com sucesso!');
      sessionStorage.setItem('adminAccess', 'true');
      
      // Ir para o dashboard após curto delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Falha no login. Tente com: teste@exemplo.com / senha123');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Login</h2>
          <p>Acesse o Blueprint Sábio</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
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
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="forgot-password">
            <Link to="/reset-password">Esqueceu a senha?</Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Não tem uma conta? <Link to="/register">Cadastre-se</Link></p>
          
          <div className="debug-info" style={{ marginTop: '15px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
            <p>Use as credenciais pré-preenchidas:</p>
            <p>Email: teste@exemplo.com | Senha: senha123</p>
            <p style={{ marginTop: '10px' }}>
              <Link to="/admin-login" style={{ color: '#3498db', textDecoration: 'underline' }}>
                Ou use o acesso rápido automático
              </Link>
            </p>
            <p style={{ marginTop: '5px' }}>
              <a href="/auth-reset.html" style={{ color: '#e74c3c', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
                Problemas de login? Limpar dados de autenticação
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <div className="auth-branding" style={{ backgroundImage: `url(${authBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <h3>Blueprint Sábio</h3>
        <p>A Planilha dos Bilionários</p>
      </div>
    </div>
  );
};

export default Login;