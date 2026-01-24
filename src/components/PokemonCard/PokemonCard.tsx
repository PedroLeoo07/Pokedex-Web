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

  const typeGradients: { [key: string]: string } = {
    normal: 'linear-gradient(135deg, #A8A878 0%, #D5D5A4 100%)',
    fire: 'linear-gradient(135deg, #F08030 0%, #F5AC78 100%)',
    water: 'linear-gradient(135deg, #6890F0 0%, #9DB7F5 100%)',
    electric: 'linear-gradient(135deg, #F8D030 0%, #FAE078 100%)',
    grass: 'linear-gradient(135deg, #78C850 0%, #A7DB8D 100%)',
    ice: 'linear-gradient(135deg, #98D8D8 0%, #BCE6E6 100%)',
    fighting: 'linear-gradient(135deg, #C03028 0%, #D67873 100%)',
    poison: 'linear-gradient(135deg, #A040A0 0%, #C183C1 100%)',
    ground: 'linear-gradient(135deg, #E0C068 0%, #EBD69D 100%)',
    flying: 'linear-gradient(135deg, #A890F0 0%, #C6B7F5 100%)',
    psychic: 'linear-gradient(135deg, #F85888 0%, #FA92B2 100%)',
    bug: 'linear-gradient(135deg, #A8B820 0%, #C6D16E 100%)',
    rock: 'linear-gradient(135deg, #B8A038 0%, #D1C17D 100%)',
    ghost: 'linear-gradient(135deg, #705898 0%, #A292BC 100%)',
    dragon: 'linear-gradient(135deg, #7038F8 0%, #A27DFA 100%)',
    dark: 'linear-gradient(135deg, #705848 0%, #A29288 100%)',
    steel: 'linear-gradient(135deg, #B8B8D0 0%, #D1D1E0 100%)',
    fairy: 'linear-gradient(135deg, #EE99AC 0%, #F4BDC9 100%)',
  };

  const primaryType = pokemon.types[0].type.name;
  const cardGradient = typeGradients[primaryType] || 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';

  const hp = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
  const attack = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0;
  const defense = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0;

  return (
    <Link href={`/pokemon/${pokemon.id}`} className={styles.card}>
      <div className={styles.cardHeader} style={{ background: cardGradient }}>
        <span className={styles.id}>#{String(pokemon.id).padStart(3, '0')}</span>
        <div className={styles.types}>
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className={styles.typeBadge}
              style={{ backgroundColor: typeColors[type.type.name] || '#777' }}
            >
              {type.type.name}
            </span>
          ))}
        </div>
      </div>
      
      <div className={styles.imageContainer}>
        <div className={styles.imageBg} style={{ background: cardGradient, opacity: 0.1 }}></div>
        <Image
          src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
          alt={pokemon.name}
          width={200}
          height={200}
          className={styles.image}
        />
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.name}>{pokemon.name}</h3>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>HP</span>
            <span className={styles.statValue}>{hp}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>ATK</span>
            <span className={styles.statValue}>{attack}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>DEF</span>
            <span className={styles.statValue}>{defense}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
