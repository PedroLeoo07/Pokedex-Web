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
});
