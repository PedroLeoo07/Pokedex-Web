import { Pokemon, PokemonStat, ChainLink } from '@/types/pokemon';

// Type Colors
export const TYPE_COLORS: { [key: string]: string } = {
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

// Type Gradients
export const TYPE_GRADIENTS: { [key: string]: string } = {
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

// Type Names em Português
export const TYPE_NAMES_PT: { [key: string]: string } = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  electric: 'Elétrico',
  grass: 'Planta',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Veneno',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  dark: 'Sombrio',
  steel: 'Aço',
  fairy: 'Fada',
};

// Stat Names em Português
export const STAT_NAMES_PT: { [key: string]: string } = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'At. Especial',
  'special-defense': 'Def. Especial',
  speed: 'Velocidade',
};

// Helpers
export function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] || '#777';
}

export function getTypeGradient(type: string): string {
  return TYPE_GRADIENTS[type.toLowerCase()] || 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
}

export function getTypeName(type: string): string {
  return TYPE_NAMES_PT[type.toLowerCase()] || type;
}

export function getStatName(stat: string): string {
  return STAT_NAMES_PT[stat.toLowerCase()] || stat;
}

export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

export function formatPokemonName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatHeight(height: number): string {
  return `${(height / 10).toFixed(1)}m`;
}

export function formatWeight(weight: number): string {
  return `${(weight / 10).toFixed(1)}kg`;
}

// Extrair stats
export function getStat(pokemon: Pokemon, statName: string): number {
  const stat = pokemon.stats.find(s => s.stat.name === statName);
  return stat?.base_stat || 0;
}

export function getTotalStats(pokemon: Pokemon): number {
  return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
}

export function getStatPercentage(value: number, max: number = 255): number {
  return Math.min((value / max) * 100, 100);
}

// Classificar Pokémon por stats
export function sortPokemonByStats(
  pokemons: Pokemon[],
  statName: string,
  order: 'asc' | 'desc' = 'desc'
): Pokemon[] {
  return [...pokemons].sort((a, b) => {
    const statA = getStat(a, statName);
    const statB = getStat(b, statName);
    return order === 'desc' ? statB - statA : statA - statB;
  });
}

// Filtrar por tipo
export function filterByType(pokemons: Pokemon[], type: string): Pokemon[] {
  return pokemons.filter(p => 
    p.types.some(t => t.type.name === type.toLowerCase())
  );
}

// Filtrar por geração
export function filterByGeneration(pokemons: Pokemon[], generation: number): Pokemon[] {
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

  const range = ranges[generation];
  if (!range) return [];

  return pokemons.filter(p => p.id >= range.start && p.id <= range.end);
}

// Buscar na evolution chain
export function flattenEvolutionChain(chain: ChainLink): string[] {
  const names: string[] = [chain.species.name];
  
  chain.evolves_to.forEach(evolution => {
    names.push(...flattenEvolutionChain(evolution));
  });

  return names;
}

// Calcular rating de stats
export function getStatRating(value: number): string {
  if (value >= 150) return 'Excelente';
  if (value >= 100) return 'Muito Bom';
  if (value >= 70) return 'Bom';
  if (value >= 50) return 'Regular';
  return 'Fraco';
}

// Determinar raridade
export function getRarity(pokemon: Pokemon): string {
  const total = getTotalStats(pokemon);
  if (total >= 600) return 'Lendário';
  if (total >= 520) return 'Pseudo-Lendário';
  if (total >= 480) return 'Raro';
  if (total >= 400) return 'Comum';
  return 'Inicial';
}

// Calcular vantagem de tipo
export const TYPE_EFFECTIVENESS: { [key: string]: { strong: string[], weak: string[] } } = {
  normal: { strong: [], weak: ['fighting'] },
  fire: { strong: ['grass', 'ice', 'bug', 'steel'], weak: ['water', 'ground', 'rock'] },
  water: { strong: ['fire', 'ground', 'rock'], weak: ['electric', 'grass'] },
  electric: { strong: ['water', 'flying'], weak: ['ground'] },
  grass: { strong: ['water', 'ground', 'rock'], weak: ['fire', 'ice', 'poison', 'flying', 'bug'] },
  ice: { strong: ['grass', 'ground', 'flying', 'dragon'], weak: ['fire', 'fighting', 'rock', 'steel'] },
  fighting: { strong: ['normal', 'ice', 'rock', 'dark', 'steel'], weak: ['flying', 'psychic', 'fairy'] },
  poison: { strong: ['grass', 'fairy'], weak: ['ground', 'psychic'] },
  ground: { strong: ['fire', 'electric', 'poison', 'rock', 'steel'], weak: ['water', 'grass', 'ice'] },
  flying: { strong: ['grass', 'fighting', 'bug'], weak: ['electric', 'ice', 'rock'] },
  psychic: { strong: ['fighting', 'poison'], weak: ['bug', 'ghost', 'dark'] },
  bug: { strong: ['grass', 'psychic', 'dark'], weak: ['fire', 'flying', 'rock'] },
  rock: { strong: ['fire', 'ice', 'flying', 'bug'], weak: ['water', 'grass', 'fighting', 'ground', 'steel'] },
  ghost: { strong: ['psychic', 'ghost'], weak: ['ghost', 'dark'] },
  dragon: { strong: ['dragon'], weak: ['ice', 'dragon', 'fairy'] },
  dark: { strong: ['psychic', 'ghost'], weak: ['fighting', 'bug', 'fairy'] },
  steel: { strong: ['ice', 'rock', 'fairy'], weak: ['fire', 'fighting', 'ground'] },
  fairy: { strong: ['fighting', 'dragon', 'dark'], weak: ['poison', 'steel'] },
};

export function getTypeEffectiveness(type: string): { strong: string[], weak: string[] } {
  return TYPE_EFFECTIVENESS[type.toLowerCase()] || { strong: [], weak: [] };
}

// Validações
export function isValidPokemonId(id: number): boolean {
  return id > 0 && id <= 1000; // Ajustar conforme necessário
}

export function isValidTypeName(type: string): boolean {
  return Object.keys(TYPE_COLORS).includes(type.toLowerCase());
}

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
