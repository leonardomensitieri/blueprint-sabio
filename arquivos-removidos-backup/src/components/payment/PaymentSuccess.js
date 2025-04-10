import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getAnalytics, logEvent } from 'firebase/analytics';
import './Payment.css';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, checkUserSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const processSuccessfulPayment = async () => {
      try {
        // Obter o session_id da URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          setError('Informações de pagamento não encontradas');
          setLoading(false);
          return;
        }
        
        // Verificar o status da assinatura
        await checkUserSubscriptionStatus(currentUser.uid);
        
        // Registrar evento de compra finalizada no Analytics
        const analytics = getAnalytics();
        logEvent(analytics, 'purchase_completed', {
          transaction_id: sessionId
        });
        
        // Redirecionar para o dashboard após alguns segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 5000);
      } catch (error) {
        console.error('Erro ao processar confirmação de pagamento:', error);
        setError('Houve um erro ao verificar seu pagamento. Por favor, contate o suporte.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      processSuccessfulPayment();
    } else {
      navigate('/login');
    }
  }, [currentUser, location.search, navigate, checkUserSubscriptionStatus]);
  
  return (
    <div className="payment-success-container">
      {loading ? (
        <div className="payment-loading">
          <div className="loading-spinner"></div>
          <h2>Verificando seu pagamento...</h2>
        </div>
      ) : error ? (
        <div className="payment-error-container">
          <div className="error-icon">!</div>
          <h2>Ocorreu um erro</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/payment')} className="try-again-btn">
            Voltar para pagamento
          </button>
        </div>
      ) : (
        <div className="payment-success">
          <div className="success-icon">✓</div>
          <h2>Pagamento Realizado com Sucesso!</h2>
          <p>Obrigado por assinar o Blueprint Sábio!</p>
          <p>Sua assinatura está ativa e você já tem acesso a todos os recursos premium.</p>
          <p className="redirect-msg">Você será redirecionado para o dashboard em alguns segundos...</p>
          <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
            Ir para o Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;