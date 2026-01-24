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

// Sistema de Cache
class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, expiresIn: number = CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

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

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  getSize(): number {
    return this.cache.size;
  }
}

const cache = new APICache();

// Utilitários
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Função de fetch com retry e cache
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  useCache: boolean = true,
  retries: number = MAX_RETRIES
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options)}`;

  // Verificar cache
  if (useCache) {
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      const data = await response.json();

      // Salvar no cache
      if (useCache) {
        cache.set(cacheKey, data);
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;
      
      // Não fazer retry em erros 404
      if (error instanceof APIError && error.status === 404) {
        throw error;
      }

      // Aguardar antes do próximo retry
      if (attempt < retries - 1) {
        await sleep(RETRY_DELAY * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Falha ao buscar dados');
}

// API Service
export const pokeAPI = {
  // Cache management
  clearCache: () => cache.clear(),
  getCacheSize: () => cache.getSize(),
  removeFromCache: (key: string) => cache.remove(key),

  // Pokemon endpoints
  async getPokemonList(
    options: Partial<PaginationOptions> = {}
  ): Promise<PokemonListResponse> {
    const { limit = 20, offset = 0 } = options;
    const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
    return fetchWithRetry<PokemonListResponse>(url);
  },

  async getPokemon(nameOrId: string | number): Promise<Pokemon> {
    const url = `${BASE_URL}/pokemon/${nameOrId}`;
    try {
      return await fetchWithRetry<Pokemon>(url);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        throw new Error(`Pokémon "${nameOrId}" não encontrado`);
      }
      throw new Error('Erro ao buscar Pokémon');
    }
  },

  async getPokemonBatch(ids: (string | number)[]): Promise<Pokemon[]> {
    const promises = ids.map(id => this.getPokemon(id));
    return Promise.all(promises);
  },

  async getAllPokemon(limit: number = 1000): Promise<Pokemon[]> {
    const listResponse = await this.getPokemonList({ limit, offset: 0 });
    const pokemonPromises = listResponse.results.map(result => 
      this.getPokemon(result.name)
    );
    return Promise.all(pokemonPromises);
  },

  async searchPokemon(query: string): Promise<Pokemon[]> {
    try {
      // Tentar buscar por nome exato ou ID
      const pokemon = await this.getPokemon(query.toLowerCase());
      return [pokemon];
    } catch {
      // Se falhar, buscar em todos e filtrar
      const list = await this.getPokemonList({ limit: 1000 });
      const filtered = list.results.filter(p => 
        p.name.includes(query.toLowerCase())
      );
      return this.getPokemonBatch(filtered.slice(0, 20).map(p => p.name));
    }
  },

  // Species endpoints
  async getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
    const url = `${BASE_URL}/pokemon-species/${nameOrId}`;
    return fetchWithRetry<PokemonSpecies>(url);
  },

  async getEvolutionChain(id: number): Promise<EvolutionChain> {
    const url = `${BASE_URL}/evolution-chain/${id}`;
    return fetchWithRetry<EvolutionChain>(url);
  },

  async getPokemonEvolutionChain(pokemonId: number): Promise<EvolutionChain | null> {
    try {
      const species = await this.getPokemonSpecies(pokemonId);
      const chainId = species.evolution_chain.url.split('/').filter(Boolean).pop();
      if (!chainId) return null;
      return await this.getEvolutionChain(parseInt(chainId));
    } catch {
      return null;
    }
  },

  // Type endpoints
  async getTypes(): Promise<TypeListResponse> {
    const url = `${BASE_URL}/type`;
    return fetchWithRetry<TypeListResponse>(url);
  },

  async getType(nameOrId: string | number): Promise<TypeDetail> {
    const url = `${BASE_URL}/type/${nameOrId}`;
    return fetchWithRetry<TypeDetail>(url);
  },

  async getPokemonByType(type: string): Promise<Pokemon[]> {
    const typeDetail = await this.getType(type);
    const pokemonList = typeDetail.pokemon.slice(0, 50); // Limitar a 50
    const promises = pokemonList.map(p => 
      this.getPokemon(p.pokemon.name)
    );
    return Promise.all(promises);
  },

  // Generation endpoints
  async getGeneration(id: number): Promise<any> {
    const url = `${BASE_URL}/generation/${id}`;
    return fetchWithRetry(url);
  },

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
    if (!range) throw new Error('Geração inválida');

    const ids = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i
    );

    return this.getPokemonBatch(ids);
  },

  // Utility functions
  async getRandomPokemon(count: number = 1): Promise<Pokemon[]> {
    const max = 898; // Total de Pokémon (até gen 8)
    const randomIds = Array.from({ length: count }, () => 
      Math.floor(Math.random() * max) + 1
    );
    return this.getPokemonBatch(randomIds);
  },

  async getPokemonByStats(
    statName: string,
    minValue: number,
    limit: number = 20
  ): Promise<Pokemon[]> {
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
  },

  // Prefetch comum para melhor performance
  async prefetchCommonData(): Promise<void> {
    const promises = [
      this.getPokemonList({ limit: 20 }),
      this.getTypes(),
    ];
    await Promise.all(promises);
  },
};

// Export do cache para uso externo se necessário
export { cache };
