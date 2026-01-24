import Link from 'next/link';
import Image from 'next/image';
import { Pokemon } from '@/types/pokemon';
import styles from './PokemonCard.module.css';

interface PokemonCardProps {
  pokemon: Pokemon;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
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
    <Link href={`/pokemon/${pokemon.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
          alt={pokemon.name}
          width={200}
          height={200}
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <span className={styles.id}>#{String(pokemon.id).padStart(3, '0')}</span>
        <h3 className={styles.name}>{pokemon.name}</h3>
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
      </div>
    </Link>
  );
}
