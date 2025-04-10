import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { calculateEmergencyFund, formatCurrency } from '../../services/financialCalculations';
import './EmergencyFund.css';

const EmergencyFund = () => {
  const { currentUser } = useAuth();
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [emergencyFundAmount, setEmergencyFundAmount] = useState('');
  const [employmentType, setEmploymentType] = useState('clt');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [dependents, setDependents] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [results, setResults] = useState({
    recommendedMonths: 6,
    recommendedAmount: 0,
    currentStatus: 'insufficient', // insuficiente, adequado, excesso
    statusPercentage: 0,
    monthsCovered: 0
  });

  // Carregar dados salvos do usuário
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  // Calcular recomendações quando os inputs mudarem
  useEffect(() => {
    calculateRecommendations();
  }, [monthlyExpenses, emergencyFundAmount, employmentType, riskTolerance, dependents]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const db = getFirestore();
      const userDataRef = doc(db, 'emergencyFunds', currentUser.uid);
      const docSnap = await getDoc(userDataRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setMonthlyExpenses(userData.monthlyExpenses || '');
        setEmergencyFundAmount(userData.emergencyFundAmount || '');
        setEmploymentType(userData.employmentType || 'clt');
        setRiskTolerance(userData.riskTolerance || 'moderate');
        setDependents(userData.dependents || '0');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setError('Não foi possível carregar seus dados salvos.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setSaveSuccess(false);
    setError('');
    
    try {
      const db = getFirestore();
      const userDataRef = doc(db, 'emergencyFunds', currentUser.uid);
      
      await setDoc(userDataRef, {
        monthlyExpenses: monthlyExpenses,
        emergencyFundAmount: emergencyFundAmount,
        employmentType: employmentType,
        riskTolerance: riskTolerance,
        dependents: dependents,
        updatedAt: new Date()
      });
      
      setSaveSuccess(true);
      
      // Ocultar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setError('Não foi possível salvar suas informações. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRecommendations = () => {
    // Converter strings para números
    const expenses = parseFloat(monthlyExpenses) || 0;
    const fundAmount = parseFloat(emergencyFundAmount) || 0;
    const deps = parseInt(dependents);
    
    // Usar o serviço especializado para calcular a reserva de emergência
    const emergencyFundCalc = calculateEmergencyFund({
      monthlyExpenses: expenses,
      employmentType,
      riskTolerance,
      dependents: deps
    });
    
    // Calcular status atual
    let currentStatus = 'insufficient';
    let statusPercentage = 0;
    
    if (expenses > 0) {
      statusPercentage = (fundAmount / emergencyFundCalc.recommendedAmount) * 100;
      
      if (statusPercentage >= 100) {
        currentStatus = 'sufficient';
      } else if (statusPercentage >= 75) {
        currentStatus = 'adequate';
      } else {
        currentStatus = 'insufficient';
      }
    }
    
    // Calcular meses cobertos
    const monthsCovered = expenses > 0 ? fundAmount / expenses : 0;
    
    setResults({
      recommendedMonths: emergencyFundCalc.recommendedMonths,
      recommendedAmount: emergencyFundCalc.recommendedAmount,
      currentStatus,
      statusPercentage: Math.min(statusPercentage, 100), // Limite em 100% para visualização
      monthsCovered,
      // Informações adicionais do cálculo para possível uso futuro
      baseMonths: emergencyFundCalc.baseMonths,
      riskMultiplier: emergencyFundCalc.riskMultiplier,
      dependentMultiplier: emergencyFundCalc.dependentMultiplier
    });
  };

  const handleInputChange = (e, fieldName) => {
    const { value } = e.target;
    
    // Validações específicas para cada campo
    switch (fieldName) {
      case 'monthlyExpenses':
      case 'emergencyFundAmount':
        // Remover caracteres não numéricos, exceto vírgula e ponto
        let processedValue = value.replace(/[^\d,.]/g, '');
        // Substituir vírgula por ponto
        processedValue = processedValue.replace(',', '.');
        
        if (fieldName === 'monthlyExpenses') {
          setMonthlyExpenses(processedValue);
        } else {
          setEmergencyFundAmount(processedValue);
        }
        break;
        
      case 'employmentType':
        setEmploymentType(value);
        break;
        
      case 'riskTolerance':
        setRiskTolerance(value);
        break;
        
      case 'dependents':
        setDependents(value);
        break;
        
      default:
        break;
    }
  };

  // Usando a função de formatação importada do serviço de cálculos

  return (
    <div className="emergency-fund">
      <h2>Calculadora de Reserva de Emergência</h2>
      
      {error && <div className="error-message">{error}</div>}
      {saveSuccess && <div className="success-message">Informações salvas com sucesso!</div>}
      
      <div className="emergency-fund-grid">
        <div className="input-section">
          <h3>Suas Informações</h3>
          
          <div className="form-group">
            <label htmlFor="monthlyExpenses">Despesas Mensais</label>
            <div className="input-with-prefix">
              <span className="input-prefix">R$</span>
              <input
                type="text"
                id="monthlyExpenses"
                value={monthlyExpenses}
                onChange={(e) => handleInputChange(e, 'monthlyExpenses')}
                placeholder="5.000,00"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="emergencyFundAmount">Valor Atual da Reserva</label>
            <div className="input-with-prefix">
              <span className="input-prefix">R$</span>
              <input
                type="text"
                id="emergencyFundAmount"
                value={emergencyFundAmount}
                onChange={(e) => handleInputChange(e, 'emergencyFundAmount')}
                placeholder="30.000,00"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="employmentType">Tipo de Emprego</label>
            <select
              id="employmentType"
              value={employmentType}
              onChange={(e) => handleInputChange(e, 'employmentType')}
              disabled={isLoading}
            >
              <option value="clt">Empregado CLT</option>
              <option value="public">Servidor Público</option>
              <option value="self_employed">Autônomo / Freelancer</option>
              <option value="business_owner">Empresário</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="riskTolerance">Tolerância a Risco</label>
            <select
              id="riskTolerance"
              value={riskTolerance}
              onChange={(e) => handleInputChange(e, 'riskTolerance')}
              disabled={isLoading}
            >
              <option value="low">Baixa (Prefiro segurança)</option>
              <option value="moderate">Moderada</option>
              <option value="high">Alta (Posso assumir riscos)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dependents">Número de Dependentes</label>
            <select
              id="dependents"
              value={dependents}
              onChange={(e) => handleInputChange(e, 'dependents')}
              disabled={isLoading}
            >
              <option value="0">Nenhum dependente</option>
              <option value="1">1 dependente</option>
              <option value="2">2 dependentes</option>
              <option value="3">3 dependentes</option>
              <option value="4">4 ou mais dependentes</option>
            </select>
          </div>
          
          {currentUser && (
            <button
              className="save-button"
              onClick={saveUserData}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Informações'}
            </button>
          )}
        </div>
        
        <div className="results-section">
          <h3>Sua Reserva de Emergência</h3>
          
          <div className="recommendation-card">
            <div className="recommendation-header">
              <h4>Recomendação Personalizada</h4>
            </div>
            <div className="recommendation-body">
              <div className="recommendation-item">
                <span className="label">Meses recomendados:</span>
                <span className="value">{results.recommendedMonths} meses</span>
              </div>
              <div className="recommendation-item">
                <span className="label">Valor recomendado:</span>
                <span className="value">{formatCurrency(results.recommendedAmount)}</span>
              </div>
              <div className="recommendation-item">
                <span className="label">Sua reserva atual cobre:</span>
                <span className="value">{results.monthsCovered.toFixed(1)} meses</span>
              </div>
            </div>
          </div>
          
          <div className="status-indicator">
            <h4>Status da Sua Reserva</h4>
            <div className="progress-container">
              <div 
                className={`progress-bar ${results.currentStatus}`}
                style={{ width: `${results.statusPercentage}%` }}
              ></div>
            </div>
            <div className="status-label">
              {results.currentStatus === 'insufficient' && 'Insuficiente'}
              {results.currentStatus === 'adequate' && 'Adequada'}
              {results.currentStatus === 'sufficient' && 'Excelente'}
              <span className="percentage">
                {results.statusPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="next-steps-card">
            <h4>Próximos Passos</h4>
            <ul className="next-steps-list">
              {results.currentStatus === 'insufficient' && (
                <>
                  <li>
                    <strong>Priorize construir sua reserva.</strong> 
                    Foque em acumular pelo menos 3 meses de despesas antes de outros investimentos.
                  </li>
                  <li>
                    <strong>Reduza despesas temporariamente.</strong> 
                    Corte gastos não essenciais para acelerar o acúmulo da reserva.
                  </li>
                  <li>
                    <strong>Use investimentos de liquidez diária.</strong> 
                    Mantenha sua reserva em títulos de renda fixa com resgate imediato.
                  </li>
                </>
              )}
              
              {results.currentStatus === 'adequate' && (
                <>
                  <li>
                    <strong>Continue ampliando sua reserva.</strong> 
                    Você está no caminho certo, mas um pouco mais trará maior tranquilidade.
                  </li>
                  <li>
                    <strong>Diversifique os investimentos da reserva.</strong> 
                    Considere dividir em produtos com diferentes prazos de resgate e rentabilidade.
                  </li>
                  <li>
                    <strong>Comece a pensar em investimentos de longo prazo.</strong> 
                    Com sua reserva bem encaminhada, pode começar a investir para outros objetivos.
                  </li>
                </>
              )}
              
              {results.currentStatus === 'sufficient' && (
                <>
                  <li>
                    <strong>Sua reserva está completa!</strong> 
                    Você pode focar em outros objetivos financeiros.
                  </li>
                  <li>
                    <strong>Otimize o rendimento da reserva.</strong> 
                    Considere produtos como CDBs com liquidez diária que oferecem melhor rendimento.
                  </li>
                  <li>
                    <strong>Invista o excedente.</strong> 
                    Valores acima da reserva recomendada podem ser direcionados para investimentos de maior retorno.
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="emergency-fund-info">
        <h3>Entendendo a Reserva de Emergência</h3>
        <p>
          A reserva de emergência é um fundo destinado a cobrir despesas inesperadas ou períodos sem renda.
          O tamanho ideal varia conforme sua situação profissional, familiar e perfil de risco.
        </p>
        
        <div className="info-grid">
          <div className="info-card">
            <h4>Como Usar a Reserva</h4>
            <p>
              Use apenas para verdadeiras emergências, como desemprego, problemas de saúde ou 
              consertos urgentes. Reponha os valores utilizados assim que possível.
            </p>
          </div>
          
          <div className="info-card">
            <h4>Onde Investir</h4>
            <p>
              Priorize segurança e liquidez: Tesouro Selic, CDBs com liquidez diária,
              e fundos DI são opções adequadas. Evite investimentos de risco ou baixa liquidez.
            </p>
          </div>
          
          <div className="info-card">
            <h4>Quando Revisar</h4>
            <p>
              Reavalie sua reserva ao mudar de emprego, ter alterações na renda ou despesas,
              ou ao ter mudanças familiares, como o nascimento de um filho.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFund;