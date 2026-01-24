import { useState, useEffect, useCallback } from 'react';
import { pokeAPI } from '@/services/api';
import { Pokemon, PokemonSpecies, EvolutionChain } from '@/types/pokemon';

// Hook para buscar um Pokémon
export function usePokemon(nameOrId: string | number | null) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nameOrId) return;

    const fetchPokemon = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pokeAPI.getPokemon(nameOrId);
        setPokemon(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar Pokémon');
        setPokemon(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [nameOrId]);

  return { pokemon, loading, error };
}

// Hook para lista de Pokémon
export function usePokemonList(limit: number = 20, offset: number = 0) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPokemons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listResponse = await pokeAPI.getPokemonList({ limit, offset });
      const pokemonData = await pokeAPI.getPokemonBatch(
        listResponse.results.map(p => p.name)
      );
      setPokemons(pokemonData);
      setHasMore(listResponse.next !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lista');
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    loadPokemons();
  }, [loadPokemons]);

  return { pokemons, loading, error, hasMore, reload: loadPokemons };
}

// Hook para buscar Pokémon por tipo
export function usePokemonByType(type: string | null) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type) {
      setPokemons([]);
      return;
    }

    const fetchByType = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pokeAPI.getPokemonByType(type);
        setPokemons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar por tipo');
        setPokemons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchByType();
  }, [type]);

  return { pokemons, loading, error };
}

// Hook para species
export function usePokemonSpecies(nameOrId: string | number | null) {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nameOrId) return;

    const fetchSpecies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pokeAPI.getPokemonSpecies(nameOrId);
        setSpecies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar espécie');
        setSpecies(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, [nameOrId]);

  return { species, loading, error };
}

// Hook para evolution chain
export function usePokemonEvolution(pokemonId: number | null) {
  const [evolution, setEvolution] = useState<EvolutionChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonId) return;

    const fetchEvolution = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pokeAPI.getPokemonEvolutionChain(pokemonId);
        setEvolution(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar evolução');
        setEvolution(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvolution();
  }, [pokemonId]);

  return { evolution, loading, error };
}

// Hook para busca
export function useSearchPokemon() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPokemons([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await pokeAPI.searchPokemon(query);
      setPokemons(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPokemons([]);
    setError(null);
  }, []);

  return { pokemons, loading, error, search, clear };
}

// Hook para Pokémon aleatórios
export function useRandomPokemon(count: number = 1) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRandom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pokeAPI.getRandomPokemon(count);
      setPokemons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar aleatórios');
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  return { pokemons, loading, error, reload: loadRandom };
}
