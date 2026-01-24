'use client';

import { useState, useEffect } from 'react';
import PokemonCard from '@/components/PokemonCard/PokemonCard';
import { pokeAPI } from '@/services/api';
import { Pokemon, PokemonListResponse } from '@/types/pokemon';
import styles from './page.module.css';

export default function Home() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 20;

  useEffect(() => {
    loadPokemons();
  }, [offset]);

  const loadPokemons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PokemonListResponse = await pokeAPI.getPokemonList(limit, offset);
      
      const pokemonDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const details = await pokeAPI.getPokemon(pokemon.name);
          return details;
        })
      );

      setPokemons(pokemonDetails);
    } catch (err) {
      setError('Erro ao carregar Pokémon. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      loadPokemons();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const pokemon = await pokeAPI.getPokemon(searchTerm.toLowerCase());
      setPokemons([pokemon]);
    } catch (err) {
      setError('Pokémon não encontrado. Tente outro nome ou número.');
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  const handleNext = () => {
    setOffset(offset + limit);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🎮 Pokédex</h1>
        <p className={styles.subtitle}>Explore o mundo Pokémon</p>
      </header>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Buscar Pokémon por nome ou número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          Buscar
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              loadPokemons();
            }}
            className={styles.clearButton}
          >
            Limpar
          </button>
        )}
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.pokeball}></div>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {pokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>

          {!searchTerm && (
            <div className={styles.pagination}>
              <button
                onClick={handlePrevious}
                disabled={offset === 0}
                className={styles.pageButton}
              >
                ← Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {offset / limit + 1}
              </span>
              <button onClick={handleNext} className={styles.pageButton}>
                Próximo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
