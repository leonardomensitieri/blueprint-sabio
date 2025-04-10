// Cache simples para respostas de API
const API_CACHE = {
  data: {},
  timestamp: {}
};

// Tempo de expiração do cache em milissegundos (15 minutos)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Armazenar dados no cache
export const cacheApiResponse = (key, data) => {
  API_CACHE.data[key] = data;
  API_CACHE.timestamp[key] = Date.now();
};

// Obter dados do cache
export const getCachedApiResponse = (key) => {
  const timestamp = API_CACHE.timestamp[key];
  
  // Verificar se o cache existe e não expirou
  if (timestamp && Date.now() - timestamp < CACHE_EXPIRATION) {
    return API_CACHE.data[key];
  }
  
  return null;
};

// Limpar todo o cache
export const clearApiCache = () => {
  API_CACHE.data = {};
  API_CACHE.timestamp = {};
};

// Limpar uma entrada específica do cache
export const clearCacheEntry = (key) => {
  if (API_CACHE.data[key]) {
    delete API_CACHE.data[key];
  }
  if (API_CACHE.timestamp[key]) {
    delete API_CACHE.timestamp[key];
  }
};

export default {
  cacheApiResponse,
  getCachedApiResponse,
  clearApiCache,
  clearCacheEntry
};