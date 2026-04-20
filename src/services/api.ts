import {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  TypeDetail,
  TypeListResponse,
  EvolutionChain,
  CacheEntry,
  PaginationOptions,
} from '@/types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const REQUEST_TIMEOUT = 10000; // 10 segundos
const MAX_CONCURRENT_REQUESTS = 5;
const RATE_LIMIT_REQUESTS = 50;
const RATE_LIMIT_WINDOW = 60000; // 1 minuto

// ============================================================================
// LOGGER
// ============================================================================
/**
 * Sistema de logging estruturado para requisições e erros
 */
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  endpoint: string;
  message: string;
  duration?: number;
  status?: number;
  error?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  /**
   * Registra um evento de log
   */
  log(level: 'info' | 'warn' | 'error', endpoint: string, message: string, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      endpoint,
      message,
      ...meta,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const color = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: blue';
      console.log(`%c[${level.toUpperCase()}]`, color, endpoint, message, meta);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

const logger = new Logger();

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================
/**
 * Circuit breaker para evitar cascata de falhas
 */
enum CircuitState {
  CLOSED = 'CLOSED', // Funcionando normalmente
  OPEN = 'OPEN', // Bloqueando requisições
  HALF_OPEN = 'HALF_OPEN', // Testando recuperação
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
    };
  }

  /**
   * Verifica se a requisição deve ser permitida
   */
  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED) return true;

    if (this.state === CircuitState.OPEN) {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.log('info', 'circuit-breaker', 'Circuit breaker HALF_OPEN - tentando recuperação');
        return true;
      }
      return false;
    }

    return true; // HALF_OPEN
  }

  /**
   * Registra sucesso na requisição
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.log('info', 'circuit-breaker', 'Circuit breaker CLOSED - API recuperada');
      }
    }
  }

  /**
   * Registra falha na requisição
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.log('error', 'circuit-breaker', 'Circuit breaker OPEN - falha na recuperação');
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.log('error', 'circuit-breaker', `Circuit breaker OPEN - ${this.failureCount} falhas detectadas`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

const circuitBreaker = new CircuitBreaker();

// ============================================================================
// RATE LIMITER (Token Bucket)
// ============================================================================
/**
 * Rate limiter usando algoritmo Token Bucket
 */
class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(requestsPerWindow: number, windowMs: number) {
    this.maxTokens = requestsPerWindow;
    this.tokens = requestsPerWindow;
    this.refillRate = requestsPerWindow / (windowMs / 1000);
    this.lastRefillTime = Date.now();
  }

  /**
   * Verifica se uma requisição pode ser feita
   */
  canMakeRequest(): boolean {
    this.refillTokens();
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Retorna tempo de espera até próxima requisição disponível (em ms)
   */
  getWaitTime(): number {
    this.refillTokens();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate * 1000);
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW);

// ============================================================================
// REQUEST QUEUE (Limite de Concorrência)
// ============================================================================
/**
 * Fila de requisições para limitar concorrência
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = MAX_CONCURRENT_REQUESTS) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Adiciona uma requisição à fila
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      this.activeRequests++;
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        this.activeRequests--;
        this.process();
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }
}

const requestQueue = new RequestQueue();

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================
/**
 * Sistema para evitar requisições duplicadas simultâneas
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Executa uma requisição ou retorna uma já em andamento
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const deduplicator = new RequestDeduplicator();

// ============================================================================
// CACHE
// ============================================================================
/**
 * Sistema de Cache com expiração
 */
class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Define um valor no cache
   */
  set<T>(key: string, data: T, expiresIn: number = CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove uma entrada do cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Retorna o tamanho do cache
   */
  getSize(): number {
    return this.cache.size;
  }
}

const cache = new APICache();

// ============================================================================
// UTILITÁRIOS
// ============================================================================
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Erro customizado para requisições à API
 */
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// FETCH COM RETRY, CACHE, RATE LIMITING E TIMEOUT
// ============================================================================
/**
 * Realiza uma requisição com retry, cache, rate limiting, timeout e deduplicação
 * @param url - URL da requisição
 * @param options - Opções do fetch
 * @param useCache - Se deve usar cache
 * @param retries - Número de tentativas
 * @returns Dados da requisição
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  useCache: boolean = true,
  retries: number = MAX_RETRIES
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const startTime = Date.now();

  // 1. Verificar cache
  if (useCache) {
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      logger.log('info', url, 'Retornado do cache');
      return cachedData;
    }
  }

  // 2. Deduplicar requisições simultâneas
  return deduplicator.execute(cacheKey, async () => {
    // 3. Executar através da fila (limite de concorrência)
    return requestQueue.execute(async () => {
      // 4. Verificar circuit breaker
      if (!circuitBreaker.canExecute()) {
        logger.log('error', url, 'Circuit breaker OPEN - requisição bloqueada');
        throw new APIError('Serviço indisponível (circuit breaker aberto)', 503, url);
      }

      // 5. Verificar rate limiting
      if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.getWaitTime();
        logger.log('warn', url, `Rate limit - aguardando ${waitTime}ms`);
        await sleep(waitTime);
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // 6. Criar AbortController para timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new APIError(
              `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              url
            );
          }

          const data = await response.json() as T;
          const duration = Date.now() - startTime;

          // Registrar sucesso
          circuitBreaker.recordSuccess();
          logger.log('info', url, `Sucesso (${duration}ms)`, { duration, status: response.status });

          // Salvar no cache
          if (useCache) {
            cache.set(cacheKey, data);
          }

          return data;
        } catch (error) {
          lastError = error as Error;

          const isTimeout = error instanceof DOMException && error.name === 'AbortError';
          const isNotFound = error instanceof APIError && error.status === 404;

          // Não fazer retry em erros 404 ou timeout
          if (isNotFound || isTimeout) {
            circuitBreaker.recordFailure();
            logger.log('error', url, isTimeout ? 'Timeout' : 'Não encontrado', { attempt: attempt + 1 });
            throw error;
          }

          // Registrar falha para circuit breaker
          if (attempt === retries - 1) {
            circuitBreaker.recordFailure();
          }

          logger.log('warn', url, `Tentativa ${attempt + 1} falhou`, { error: lastError.message });

          // Aguardar antes do próximo retry
          if (attempt < retries - 1) {
            await sleep(RETRY_DELAY * (attempt + 1));
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.log('error', url, 'Falha após retries', { duration, error: lastError?.message });
      throw lastError || new APIError('Falha ao buscar dados', undefined, url);
    });
  });
}

// ============================================================================
// GERAÇÃO TYPE (para Evolution Chain)
// ============================================================================
interface Generation {
  id: number;
  name: string;
  main_region: { name: string; url: string };
  pokemon_species: { name: string; url: string }[];
}

// ============================================================================
// API SERVICE
// ============================================================================
/**
 * Serviço de API Pokémon com suporte a cache, retry, rate limiting e circuit breaker
 */
export const pokeAPI = {
  // ========================================================================
  // GERENCIAMENTO DE CACHE
  // ========================================================================

  /**
   * Limpa todo o cache
   */
  clearCache: () => {
    cache.clear();
    logger.log('info', 'cache', 'Cache limpo');
  },

  /**
   * Retorna o tamanho do cache
   */
  getCacheSize: () => cache.getSize(),

  /**
   * Remove uma entrada do cache
   */
  removeFromCache: (key: string) => cache.remove(key),

  /**
   * Retorna os logs das requisições
   */
  getLogs: () => logger.getLogs(),

  /**
   * Limpa os logs
   */
  clearLogs: () => logger.clear(),

  /**
   * Retorna informações de monitoramento
   */
  getMonitoring: () => ({
    cache: {
      size: cache.getSize(),
    },
    circuitBreaker: {
      state: circuitBreaker.getState(),
    },
    queue: {
      activeRequests: requestQueue.getActiveRequests(),
      queueSize: requestQueue.getQueueSize(),
    },
  }),

  // ========================================================================
  // POKEMON ENDPOINTS
  // ========================================================================

  /**
   * Obtém lista paginada de Pokémon
   * @param options - Opções de paginação (limit, offset)
   * @returns Lista de Pokémon
   */
  async getPokemonList(
    options: Partial<PaginationOptions> = {}
  ): Promise<PokemonListResponse> {
    const { limit = 20, offset = 0 } = options;
    const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
    try {
      return await fetchWithRetry<PokemonListResponse>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar lista', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém detalhes de um Pokémon específico
   * @param nameOrId - Nome ou ID do Pokémon
   * @returns Dados do Pokémon
   */
  async getPokemon(nameOrId: string | number): Promise<Pokemon> {
    const url = `${BASE_URL}/pokemon/${nameOrId}`;
    try {
      return await fetchWithRetry<Pokemon>(url);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        const message = `Pokémon "${nameOrId}" não encontrado`;
        logger.log('warn', url, message);
        throw new Error(message);
      }
      logger.log('error', url, 'Erro ao buscar Pokémon', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém múltiplos Pokémon em paralelo (respeitando limite de concorrência)
   * @param ids - Array com nomes ou IDs dos Pokémon
   * @returns Array com dados dos Pokémon
   */
  async getPokemonBatch(ids: (string | number)[]): Promise<Pokemon[]> {
    const promises = ids.map(id => this.getPokemon(id));
    try {
      return await Promise.all(promises);
    } catch (error) {
      logger.log('error', 'getPokemonBatch', 'Erro ao buscar lote', { count: ids.length, error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém todos os Pokémon (cuidado: lento!)
   * @param limit - Limite de Pokémon a buscar
   * @returns Array com todos os Pokémon até o limite
   */
  async getAllPokemon(limit: number = 1000): Promise<Pokemon[]> {
    try {
      const listResponse = await this.getPokemonList({ limit, offset: 0 });
      const pokemonPromises = listResponse.results.map(result =>
        this.getPokemon(result.name)
      );
      return Promise.all(pokemonPromises);
    } catch (error) {
      logger.log('error', 'getAllPokemon', 'Erro ao buscar todos', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Busca Pokémon por nome/ID
   * @param query - Termo de busca
   * @returns Array com Pokémon encontrados
   */
  async searchPokemon(query: string): Promise<Pokemon[]> {
    try {
      // Tentar busca exata primeiro (mais rápido)
      const pokemon = await this.getPokemon(query.toLowerCase());
      return [pokemon];
    } catch {
      // Se falhar, busca por padrão
      try {
        const list = await this.getPokemonList({ limit: 1000 });
        const filtered = list.results.filter(p =>
          p.name.includes(query.toLowerCase())
        );
        return this.getPokemonBatch(filtered.slice(0, 20).map(p => p.name));
      } catch (error) {
        logger.log('error', 'searchPokemon', 'Erro ao buscar', { query, error: (error as Error).message });
        throw error;
      }
    }
  },

  // ========================================================================
  // SPECIES ENDPOINTS
  // ========================================================================

  /**
   * Obtém informações da espécie de um Pokémon
   * @param nameOrId - Nome ou ID do Pokémon
   * @returns Dados da espécie
   */
  async getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
    const url = `${BASE_URL}/pokemon-species/${nameOrId}`;
    try {
      return await fetchWithRetry<PokemonSpecies>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar espécie', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém cadeia de evolução
   * @param id - ID da cadeia de evolução
   * @returns Dados da cadeia
   */
  async getEvolutionChain(id: number): Promise<EvolutionChain> {
    const url = `${BASE_URL}/evolution-chain/${id}`;
    try {
      return await fetchWithRetry<EvolutionChain>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar cadeia', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém cadeia de evolução de um Pokémon específico
   * @param pokemonId - ID do Pokémon
   * @returns Cadeia de evolução ou null se não encontrado
   */
  async getPokemonEvolutionChain(pokemonId: number): Promise<EvolutionChain | null> {
    try {
      const species = await this.getPokemonSpecies(pokemonId);
      const chainId = species.evolution_chain.url.split('/').filter(Boolean).pop();
      if (!chainId) return null;
      return await this.getEvolutionChain(parseInt(chainId));
    } catch (error) {
      logger.log('warn', 'getPokemonEvolutionChain', 'Não encontrado', { pokemonId });
      return null;
    }
  },

  // ========================================================================
  // TYPE ENDPOINTS
  // ========================================================================

  /**
   * Obtém lista de todos os tipos
   * @returns Lista de tipos
   */
  async getTypes(): Promise<TypeListResponse> {
    const url = `${BASE_URL}/type`;
    try {
      return await fetchWithRetry<TypeListResponse>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar tipos', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém detalhes de um tipo específico
   * @param nameOrId - Nome ou ID do tipo
   * @returns Dados do tipo
   */
  async getType(nameOrId: string | number): Promise<TypeDetail> {
    const url = `${BASE_URL}/type/${nameOrId}`;
    try {
      return await fetchWithRetry<TypeDetail>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar tipo', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém Pokémon de um tipo específico
   * @param type - Nome ou ID do tipo
   * @returns Array com Pokémon do tipo (máximo 50)
   */
  async getPokemonByType(type: string): Promise<Pokemon[]> {
    try {
      const typeDetail = await this.getType(type);
      const pokemonList = typeDetail.pokemon.slice(0, 50);
      const promises = pokemonList.map(p =>
        this.getPokemon(p.pokemon.name)
      );
      return Promise.all(promises);
    } catch (error) {
      logger.log('error', 'getPokemonByType', 'Erro ao buscar por tipo', { type, error: (error as Error).message });
      throw error;
    }
  },

  // ========================================================================
  // GENERATION ENDPOINTS
  // ========================================================================

  /**
   * Obtém informações de uma geração
   * @param id - ID da geração
   * @returns Dados da geração
   */
  async getGeneration(id: number): Promise<Generation> {
    const url = `${BASE_URL}/generation/${id}`;
    try {
      return await fetchWithRetry<Generation>(url);
    } catch (error) {
      logger.log('error', url, 'Erro ao buscar geração', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém Pokémon de uma geração específica
   * @param gen - Número da geração (1-8)
   * @returns Array com Pokémon da geração
   */
  async getPokemonByGeneration(gen: number): Promise<Pokemon[]> {
    const ranges: Record<number, { start: number; end: number }> = {
      1: { start: 1, end: 151 },
      2: { start: 152, end: 251 },
      3: { start: 252, end: 386 },
      4: { start: 387, end: 493 },
      5: { start: 494, end: 649 },
      6: { start: 650, end: 721 },
      7: { start: 722, end: 809 },
      8: { start: 810, end: 905 },
    };

    const range = ranges[gen];
    if (!range) {
      const error = new Error('Geração inválida');
      logger.log('error', 'getPokemonByGeneration', 'Geração inválida', { gen });
      throw error;
    }

    try {
      const ids = Array.from(
        { length: range.end - range.start + 1 },
        (_, i) => range.start + i
      );
      return this.getPokemonBatch(ids);
    } catch (error) {
      logger.log('error', 'getPokemonByGeneration', 'Erro ao buscar geração', { gen, error: (error as Error).message });
      throw error;
    }
  },

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  /**
   * Obtém Pokémon aleatório(s)
   * @param count - Quantidade de Pokémon aleatórios
   * @returns Array com Pokémon aleatórios
   */
  async getRandomPokemon(count: number = 1): Promise<Pokemon[]> {
    try {
      const max = 898; // Total de Pokémon (até gen 8)
      const randomIds = Array.from({ length: count }, () =>
        Math.floor(Math.random() * max) + 1
      );
      return this.getPokemonBatch(randomIds);
    } catch (error) {
      logger.log('error', 'getRandomPokemon', 'Erro ao buscar aleatórios', { count, error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Obtém Pokémon com base em um stat mínimo
   * @param statName - Nome do stat (hp, attack, defense, etc)
   * @param minValue - Valor mínimo do stat
   * @param limit - Limite de resultados
   * @returns Array com Pokémon filtrados
   */
  async getPokemonByStats(
    statName: string,
    minValue: number,
    limit: number = 20
  ): Promise<Pokemon[]> {
    try {
      const allPokemon = await this.getPokemonList({ limit: 500 });
      const pokemonData = await this.getPokemonBatch(
        allPokemon.results.slice(0, 100).map(p => p.name)
      );

      return pokemonData
        .filter(p => {
          const stat = p.stats.find(s => s.stat.name === statName);
          return stat && stat.base_stat >= minValue;
        })
        .slice(0, limit);
    } catch (error) {
      logger.log('error', 'getPokemonByStats', 'Erro ao filtrar por stats', { statName, minValue, error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Pré-carrega dados comuns para melhor performance
   */
  async prefetchCommonData(): Promise<void> {
    try {
      const promises = [
        this.getPokemonList({ limit: 20 }),
        this.getTypes(),
      ];
      await Promise.all(promises);
      logger.log('info', 'prefetchCommonData', 'Dados comuns pré-carregados');
    } catch (error) {
      logger.log('warn', 'prefetchCommonData', 'Erro ao pré-carregar', { error: (error as Error).message });
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================
export { cache, logger, circuitBreaker, rateLimiter, requestQueue };
