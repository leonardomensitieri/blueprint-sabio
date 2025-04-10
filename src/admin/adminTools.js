import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Exclui um usuário completamente (Authentication e Firestore)
 * @param {string} email - Email do usuário a ser excluído
 * @returns {Promise<object>} - Resultado da operação
 */
export async function deleteUserByEmail(email) {
  try {
    console.log(`Solicitando exclusão do usuário: ${email}`);
    
    const functions = getFunctions();
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    
    const result = await deleteUserFunction({ email });
    
    console.log('Resultado da exclusão:', result.data);
    return result.data;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
}

/**
 * Promove um usuário para administrador
 * @param {string} email - Email do usuário a ser promovido
 * @returns {Promise<object>} - Resultado da operação
 */
export async function promoteToAdmin(email) {
  try {
    console.log(`Promovendo usuário para administrador: ${email}`);
    
    const functions = getFunctions();
    const setAdminFunction = httpsCallable(functions, 'setAdmin');
    
    const result = await setAdminFunction({ email });
    
    console.log('Resultado da promoção:', result.data);
    return result.data;
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    throw error;
  }
}

/**
 * Adiciona uma assinatura ativa para um usuário
 * @param {string} email - Email do usuário a adicionar assinatura
 * @returns {Promise<object>} - Resultado da operação
 */
export async function addSubscription(email) {
  try {
    console.log(`Adicionando assinatura para usuário: ${email}`);
    
    const functions = getFunctions();
    const addSubscriptionFunction = httpsCallable(functions, 'addSubscription');
    
    const result = await addSubscriptionFunction({ email });
    
    console.log('Resultado da adição de assinatura:', result.data);
    return result.data;
  } catch (error) {
    console.error('Erro ao adicionar assinatura:', error);
    throw error;
  }
}