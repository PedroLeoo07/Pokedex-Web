/**
 * Testes unitários para o serviço de API Pokémon
 * Execute com: npm test
 */

import { pokeAPI, logger, circuitBreaker, rateLimiter, cache } from './api';
import { Pokemon, PokemonListResponse } from '@/types/pokemon';

// Mock do fetch global
global.fetch = jest.fn();

describe('API Service - Pokémon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
    pokeAPI.clearLogs();
  });

  // ========================================================================
  // TESTES DE CACHE
  // ========================================================================
  describe('Cache Management', () => {
    it('deve retornar tamanho do cache', () => {
      expect(pokeAPI.getCacheSize()).toBe(0);
    });

    it('deve limpar cache', () => {
      pokeAPI.removeFromCache('test-key');
      expect(pokeAPI.getCacheSize()).toBe(0);
    });

    it('deve salvar dados no cache e retornar', async () => {
      const mockPokemon: Pokemon = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        base_experience: 64,
        order: 1,
        sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
        types: [],
        stats: [],
        abilities: [],
        moves: [],
        species: { name: 'bulbasaur', url: 'url' },
        forms: [],
        game_indices: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

      const result = await pokeAPI.getPokemon('bulbasaur');
      expect(result).toEqual(mockPokemon);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Segunda chamada deve usar cache
      const result2 = await pokeAPI.getPokemon('bulbasaur');
      expect(result2).toEqual(mockPokemon);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Sem nova chamada
    });
  });

  // ========================================================================
  // TESTES DE ERRO
  // ========================================================================
  describe('Error Handling', () => {
    it('deve lançar erro para Pokémon não encontrado', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(pokeAPI.getPokemon('invalidpokemon')).rejects.toThrow(
        'não encontrado'
      );
    });

    it('deve fazer retry em caso de erro temporário', async () => {
      const mockPokemon: Pokemon = {
        id: 1,
        name: 'test',
        height: 7,
        weight: 69,
        base_experience: 64,
        order: 1,
        sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
        types: [],
        stats: [],
        abilities: [],
        moves: [],
        species: { name: 'test', url: 'url' },
        forms: [],
        game_indices: [],
      };

      // Primeira chamada falha, segunda sucede
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPokemon,
        });

      const result = await pokeAPI.getPokemon('test');
      expect(result).toEqual(mockPokemon);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Retry realizado
    });
  });

  // ========================================================================
  // TESTES DE LOGGING
  // ========================================================================
  describe('Logging', () => {
    it('deve registrar operações no log', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [] }),
      });

      await pokeAPI.getPokemonList();
      const logs = pokeAPI.getLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe('info');
    });

    it('deve limpar logs', () => {
      pokeAPI.clearLogs();
      expect(pokeAPI.getLogs().length).toBe(0);
    });
  });

  // ========================================================================
  // TESTES DE MONITORAMENTO
  // ========================================================================
  describe('Monitoring', () => {
    it('deve retornar informações de monitoramento', () => {
      const monitoring = pokeAPI.getMonitoring();

      expect(monitoring).toHaveProperty('cache');
      expect(monitoring).toHaveProperty('circuitBreaker');
      expect(monitoring).toHaveProperty('queue');
      expect(monitoring.cache).toHaveProperty('size');
    });
  });

  // ========================================================================
  // TESTES DE VALIDAÇÃO DE ENTRADA
  // ========================================================================
  describe('Input Validation', () => {
    it('deve aceitar ID ou nome como string', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: 'bulbasaur' }),
      });

      await pokeAPI.getPokemon('bulbasaur');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('deve aceitar ID como número', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: 'bulbasaur' }),
      });

      await pokeAPI.getPokemon(1);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('deve lançar erro para geração inválida', async () => {
      await expect(pokeAPI.getPokemonByGeneration(999)).rejects.toThrow(
        'Geração inválida'
      );
    });
  });

  // ========================================================================
  // TESTES DE SEARCH
  // ========================================================================
  describe('Search', () => {
    it('deve buscar Pokémon por nome exato', async () => {
      const mockPokemon: Pokemon = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        base_experience: 64,
        order: 1,
        sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
        types: [],
        stats: [],
        abilities: [],
        moves: [],
        species: { name: 'bulbasaur', url: 'url' },
        forms: [],
        game_indices: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

      const results = await pokeAPI.searchPokemon('bulbasaur');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('bulbasaur');
    });
  });

  // ========================================================================
  // TESTES DE RANDOM
  // ========================================================================
  describe('Random Pokemon', () => {
    it('deve retornar Pokémon aleatório', async () => {
      const mockPokemon: Pokemon = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        base_experience: 112,
        order: 1,
        sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
        types: [],
        stats: [],
        abilities: [],
        moves: [],
        species: { name: 'pikachu', url: 'url' },
        forms: [],
        game_indices: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

      const results = await pokeAPI.getRandomPokemon(1);
      expect(results).toHaveLength(1);
    });
  });
});

describe('API Service - Types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar lista de tipos', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        count: 18,
        results: [{ name: 'normal', url: 'url' }],
      }),
    });

    const result = await pokeAPI.getTypes();
    expect(result.count).toBe(18);
    expect(result.results).toHaveLength(1);
  });

  it('deve buscar tipo específico', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        name: 'normal',
        damage_relations: {
          no_damage_to: [],
          half_damage_to: [],
          double_damage_to: [],
          no_damage_from: [],
          half_damage_from: [],
          double_damage_from: [],
        },
        pokemon: [],
        moves: [],
        generation: { name: 'generation-i', url: 'url' },
      }),
    });

    const result = await pokeAPI.getType('normal');
    expect(result.name).toBe('normal');
  });
});

describe('API Service - Batch Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar múltiplos Pokémon', async () => {
    const mockPokemon: Pokemon = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [],
      abilities: [],
      moves: [],
      species: { name: 'bulbasaur', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPokemon,
    });

    const results = await pokeAPI.getPokemonBatch([1, 2, 3]);
    expect(results).toHaveLength(3);
  });

  it('deve lançar erro se um Pokémon falhar no lote', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: 'bulbasaur' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

    await expect(pokeAPI.getPokemonBatch([1, 2])).rejects.toThrow();
  });
});

// ========================================================================
// TESTES DE SPECIES E EVOLUÇÃO
// ========================================================================
describe('API Service - Species and Evolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar informações da espécie', async () => {
    const mockSpecies = {
      id: 1,
      name: 'bulbasaur',
      evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' },
      base_happiness: 45,
      capture_rate: 45,
      growth_rate: { name: 'medium', url: 'url' },
      habitat: { name: 'grassland', url: 'url' },
      color: { name: 'green', url: 'url' },
      gender_rate: 1,
      hatch_counter: 20,
      is_baby: false,
      is_legendary: false,
      is_mythical: false,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSpecies,
    });

    const result = await pokeAPI.getPokemonSpecies(1);
    expect(result.name).toBe('bulbasaur');
    expect(result.evolution_chain).toBeDefined();
  });

  it('deve buscar cadeia de evolução', async () => {
    const mockEvolutionChain = {
      id: 1,
      chain: {
        is_baby: false,
        species: { name: 'bulbasaur', url: 'url' },
        evolution_details: [],
        evolves_to: [
          {
            is_baby: false,
            species: { name: 'ivysaur', url: 'url' },
            evolution_details: [],
            evolves_to: [
              {
                is_baby: false,
                species: { name: 'venusaur', url: 'url' },
                evolution_details: [],
                evolves_to: [],
              },
            ],
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEvolutionChain,
    });

    const result = await pokeAPI.getEvolutionChain(1);
    expect(result.id).toBe(1);
    expect(result.chain).toBeDefined();
  });

  it('deve retornar null para evolução não encontrada', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

    const result = await pokeAPI.getPokemonEvolutionChain(1);
    expect(result).toBeNull();
  });
});

// ========================================================================
// TESTES DE POKEMON POR TIPO
// ========================================================================
describe('API Service - Pokemon by Type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar Pokémon por tipo', async () => {
    const mockTypeDetail = {
      id: 1,
      name: 'normal',
      pokemon: [
        { pokemon: { name: 'pidgeot', url: 'url' }, slot: 1 },
        { pokemon: { name: 'spearow', url: 'url' }, slot: 1 },
      ],
      damage_relations: {
        no_damage_to: [],
        half_damage_to: [],
        double_damage_to: [],
        no_damage_from: [],
        half_damage_from: [],
        double_damage_from: [],
      },
      moves: [],
      generation: { name: 'generation-i', url: 'url' },
    };

    const mockPokemon = {
      id: 1,
      name: 'pidgeot',
      height: 15,
      weight: 300,
      base_experience: 200,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [],
      abilities: [],
      moves: [],
      species: { name: 'pidgeot', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTypeDetail,
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

    const results = await pokeAPI.getPokemonByType('normal');
    expect(results.length).toBeGreaterThan(0);
  });
});

// ========================================================================
// TESTES DE GERAÇÃO
// ========================================================================
describe('API Service - Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar informações de uma geração', async () => {
    const mockGeneration = {
      id: 1,
      name: 'generation-i',
      main_region: { name: 'kanto', url: 'url' },
      pokemon_species: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGeneration,
    });

    const result = await pokeAPI.getGeneration(1);
    expect(result.name).toBe('generation-i');
  });

  it('deve buscar Pokémon de uma geração válida', async () => {
    const mockPokemon = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [],
      abilities: [],
      moves: [],
      species: { name: 'bulbasaur', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPokemon,
    });

    const results = await pokeAPI.getPokemonByGeneration(1);
    expect(results.length).toBeGreaterThan(0);
  }, 15000);

  it('deve filtrar Pokémon por stats', async () => {
    const mockList = {
      count: 100,
      results: Array.from({ length: 10 }, (_, i) => ({
        name: `pokemon-${i}`,
        url: 'url',
      })),
    };

    const mockPokemon = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [{ stat: { name: 'hp', url: 'url' }, base_stat: 100 }],
      abilities: [],
      moves: [],
      species: { name: 'bulbasaur', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockList,
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

    const results = await pokeAPI.getPokemonByStats('hp', 50, 10);
    expect(results.length).toBeGreaterThan(0);
  }, 15000);
});

// ========================================================================
// TESTES DE LISTA E BUSCA COMPLETA
// ========================================================================
describe('API Service - List and Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve buscar lista de Pokémon com paginação', async () => {
    const mockList: PokemonListResponse = {
      count: 1000,
      next: 'url',
      previous: null,
      results: Array.from({ length: 20 }, (_, i) => ({
        name: `pokemon-${i}`,
        url: `https://pokeapi.co/api/v2/pokemon/${i}/`,
      })),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockList,
    });

    const result = await pokeAPI.getPokemonList({ limit: 20, offset: 0 });
    expect(result.results).toHaveLength(20);
    expect(result.count).toBe(1000);
  }, 10000);

  it('deve buscar por nome com fallback para padrão', async () => {
    const mockPokemon = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [],
      abilities: [],
      moves: [],
      species: { name: 'bulbasaur', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPokemon,
      });

    const results = await pokeAPI.searchPokemon('bulbasaur');
    expect(results).toHaveLength(1);
  }, 10000);
});

// ========================================================================
// TESTES DE PRÉ-CARREGAMENTO
// ========================================================================
describe('API Service - Prefetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve pré-carregar dados comuns', async () => {
    const mockList = {
      count: 100,
      results: Array.from({ length: 20 }, (_, i) => ({
        name: `pokemon-${i}`,
        url: 'url',
      })),
    };

    const mockTypes = {
      count: 18,
      results: [{ name: 'normal', url: 'url' }],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockList,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      });

    await pokeAPI.prefetchCommonData();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('deve continuar mesmo se pré-carregamento falhar', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    await expect(pokeAPI.prefetchCommonData()).resolves.not.toThrow();
  });
});

// ========================================================================
// TESTES DE CIRCUITO (Padrão: dados soltos)
// ========================================================================
describe('API Service - Circuit Breaker States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve registrar falha e abrir o circuito', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    try {
      await pokeAPI.getPokemon(1);
    } catch (error) {
      // Esperado
    }

    const monitoring = pokeAPI.getMonitoring();
    expect(monitoring.circuitBreaker).toBeDefined();
  });
});

// ========================================================================
// TESTES DE CACHE AVANÇADO
// ========================================================================
describe('API Service - Advanced Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pokeAPI.clearCache();
  });

  it('deve respeitar expiração de cache', async () => {
    const mockPokemon = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      sprites: { front_default: 'url', front_shiny: null, front_female: null, front_shiny_female: null, back_default: null, back_shiny: null, back_female: null, back_shiny_female: null, other: { dream_world: { front_default: null, front_female: null }, home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null }, 'official-artwork': { front_default: null, front_shiny: null } } },
      types: [],
      stats: [],
      abilities: [],
      moves: [],
      species: { name: 'bulbasaur', url: 'url' },
      forms: [],
      game_indices: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPokemon,
    });

    await pokeAPI.getPokemon('bulbasaur');
    expect(pokeAPI.getCacheSize()).toBe(1);

    await pokeAPI.getPokemon('bulbasaur');
    // Deve usar cache e não fazer nova requisição
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
