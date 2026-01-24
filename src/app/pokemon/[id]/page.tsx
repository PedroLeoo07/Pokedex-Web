import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pokeAPI } from '@/services/api';
import { Pokemon } from '@/types/pokemon';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PokemonDetail({ params }: PageProps) {
  const { id } = await params;
  let pokemon: Pokemon;

  try {
    pokemon = await pokeAPI.getPokemon(id);
  } catch (error) {
    notFound();
  }

  const typeColors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        ← Voltar para Pokédex
      </Link>

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.name}>{pokemon.name}</h1>
          <span className={styles.id}>#{String(pokemon.id).padStart(3, '0')}</span>
        </div>

        <div className={styles.imageContainer}>
          <Image
            src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
            alt={pokemon.name}
            width={400}
            height={400}
            className={styles.image}
            priority
          />
        </div>

        <div className={styles.types}>
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className={styles.type}
              style={{ backgroundColor: typeColors[type.type.name] || '#777' }}
            >
              {type.type.name}
            </span>
          ))}
        </div>

        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Altura</span>
            <span className={styles.value}>{pokemon.height / 10}m</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Peso</span>
            <span className={styles.value}>{pokemon.weight / 10}kg</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Habilidades</h2>
          <div className={styles.abilities}>
            {pokemon.abilities.map((ability, index) => (
              <span key={index} className={styles.ability}>
                {ability.ability.name}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Estatísticas Base</h2>
          <div className={styles.stats}>
            {pokemon.stats.map((stat) => (
              <div key={stat.stat.name} className={styles.stat}>
                <div className={styles.statInfo}>
                  <span className={styles.statName}>{stat.stat.name}</span>
                  <span className={styles.statValue}>{stat.base_stat}</span>
                </div>
                <div className={styles.statBar}>
                  <div
                    className={styles.statFill}
                    style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
