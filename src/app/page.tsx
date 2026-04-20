'use client';

import { useState, useEffect } from 'react';
import PokemonCard from '@/components/PokemonCard/PokemonCard';
import { pokeAPI } from '@/services/api';
import { Pokemon, PokemonListResponse } from '@/types/pokemon';
import styles from './page.module.css';

export default function Home() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const limit = 20;

  useEffect(() => {
    loadPokemons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  useEffect(() => {
    filterAndSortPokemons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, sortBy, allPokemons]);

  const loadPokemons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PokemonListResponse = await pokeAPI.getPokemonList({ limit, offset });
      
      const pokemonDetails = await pokeAPI.getPokemonBatch(
        data.results.map(p => p.name)
      );

      setAllPokemons(pokemonDetails);
      setPokemons(pokemonDetails);
    } catch (err) {
      setError('Erro ao carregar Pokémon. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPokemons = () => {
    let filtered = [...allPokemons];

    if (selectedType) {
      filtered = filtered.filter((pokemon) =>
        pokemon.types.some((type) => type.type.name === selectedType)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'hp') {
        const hpA = a.stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
        const hpB = b.stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
        return hpB - hpA;
      }
      return 0;
    });

    setPokemons(filtered);
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
      <div className={styles.backgroundPattern}></div>
      
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.pokeball}></div>
          <h1 className={styles.title}>Pokédex</h1>
        </div>
        <p className={styles.subtitle}>Descubra todos os Pokémon do universo</p>
      </header>

      <div className={styles.controls}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar Pokémon por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  loadPokemons();
                }}
                className={styles.clearIcon}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.filterSelect}
              aria-label="Filtrar por tipo de Pokémon"
            >
              <option value="">Todos</option>
              <option value="normal">Normal</option>
              <option value="fire">Fogo</option>
              <option value="water">Água</option>
              <option value="electric">Elétrico</option>
              <option value="grass">Planta</option>
              <option value="ice">Gelo</option>
              <option value="fighting">Lutador</option>
              <option value="poison">Veneno</option>
              <option value="ground">Terra</option>
              <option value="flying">Voador</option>
              <option value="psychic">Psíquico</option>
              <option value="bug">Inseto</option>
              <option value="rock">Pedra</option>
              <option value="ghost">Fantasma</option>
              <option value="dragon">Dragão</option>
              <option value="dark">Sombrio</option>
              <option value="steel">Aço</option>
              <option value="fairy">Fada</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Ordenar:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
              aria-label="Ordenar Pokémon"
            >
              <option value="id">Número</option>
              <option value="name">Nome</option>
              <option value="hp">HP</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingPokeball}></div>
          <p className={styles.loadingText}>Carregando Pokémon...</p>
        </div>
      ) : (
        <>
          {pokemons.length > 0 ? (
            <>
              <div className={styles.resultsInfo}>
                <span className={styles.resultsCount}>
                  {pokemons.length} Pokémon{pokemons.length !== 1 ? 's' : ''} encontrado{pokemons.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className={styles.grid}>
                {pokemons.map((pokemon) => (
                  <PokemonCard key={pokemon.id} pokemon={pokemon} />
                ))}
              </div>

              {!searchTerm && !selectedType && (
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
          ) : (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <p>Nenhum Pokémon encontrado</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
