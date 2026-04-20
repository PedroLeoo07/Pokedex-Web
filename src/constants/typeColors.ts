/**
 * Cores dos tipos Pokémon
 * Usado em PokemonCard e página de detalhes
 */

export const typeColors: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#A8A878', text: '#FFFFFF' },
  fire: { bg: '#F08030', text: '#FFFFFF' },
  water: { bg: '#6890F0', text: '#FFFFFF' },
  electric: { bg: '#F8D030', text: '#000000' },
  grass: { bg: '#78C850', text: '#FFFFFF' },
  ice: { bg: '#98D8D8', text: '#000000' },
  fighting: { bg: '#C03028', text: '#FFFFFF' },
  poison: { bg: '#A040A0', text: '#FFFFFF' },
  ground: { bg: '#E0C068', text: '#000000' },
  flying: { bg: '#A890F0', text: '#FFFFFF' },
  psychic: { bg: '#F85888', text: '#FFFFFF' },
  bug: { bg: '#A8B820', text: '#FFFFFF' },
  rock: { bg: '#B8A038', text: '#FFFFFF' },
  ghost: { bg: '#705898', text: '#FFFFFF' },
  dragon: { bg: '#7038F8', text: '#FFFFFF' },
  dark: { bg: '#705848', text: '#FFFFFF' },
  steel: { bg: '#B8B8D0', text: '#000000' },
  fairy: { bg: '#EE99AC', text: '#000000' },
};

/**
 * Obtém a cor de um tipo específico
 * @param type - Nome do tipo (ex: 'fire', 'water')
 * @returns Objeto com bg (background) e text (cor do texto)
 */
export const getTypeColor = (type: string): { bg: string; text: string } => {
  return typeColors[type.toLowerCase()] || typeColors.normal;
};

/**
 * Obtém a cor de background de um tipo
 * @param type - Nome do tipo
 * @returns Cor hexadecimal do background
 */
export const getTypeBackgroundColor = (type: string): string => {
  return getTypeColor(type).bg;
};

/**
 * Obtém a cor de texto de um tipo
 * @param type - Nome do tipo
 * @returns Cor hexadecimal do texto
 */
export const getTypeTextColor = (type: string): string => {
  return getTypeColor(type).text;
};
