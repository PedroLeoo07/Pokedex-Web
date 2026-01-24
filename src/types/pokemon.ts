// Tipos principais
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  order: number;
  sprites: PokemonSprites;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  species: NamedAPIResource;
  forms: NamedAPIResource[];
  game_indices: GameIndex[];
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  back_female: string | null;
  back_shiny_female: string | null;
  other: {
    dream_world: {
      front_default: string | null;
      front_female: string | null;
    };
    home: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonAbility {
  is_hidden: boolean;
  slot: number;
  ability: NamedAPIResource;
}

export interface PokemonMove {
  move: NamedAPIResource;
  version_group_details: VersionGroupDetail[];
}

export interface VersionGroupDetail {
  level_learned_at: number;
  move_learn_method: NamedAPIResource;
  version_group: NamedAPIResource;
}

export interface GameIndex {
  game_index: number;
  version: NamedAPIResource;
}

// Tipos de recursos da API
export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface APIResource {
  url: string;
}

// Resposta de listas
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface TypeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

// Type detalhado
export interface TypeDetail {
  id: number;
  name: string;
  damage_relations: TypeRelations;
  pokemon: TypePokemon[];
  moves: NamedAPIResource[];
  generation: NamedAPIResource;
}

export interface TypeRelations {
  no_damage_to: NamedAPIResource[];
  half_damage_to: NamedAPIResource[];
  double_damage_to: NamedAPIResource[];
  no_damage_from: NamedAPIResource[];
  half_damage_from: NamedAPIResource[];
  double_damage_from: NamedAPIResource[];
}

export interface TypePokemon {
  slot: number;
  pokemon: NamedAPIResource;
}

// Species
export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: PokedexNumber[];
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource;
  evolves_from_species: NamedAPIResource | null;
  evolution_chain: APIResource;
  habitat: NamedAPIResource | null;
  generation: NamedAPIResource;
  names: Name[];
  flavor_text_entries: FlavorText[];
  form_descriptions: Description[];
  genera: Genus[];
  varieties: PokemonSpeciesVariety[];
}

export interface PokedexNumber {
  entry_number: number;
  pokedex: NamedAPIResource;
}

export interface Name {
  name: string;
  language: NamedAPIResource;
}

export interface FlavorText {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface Description {
  description: string;
  language: NamedAPIResource;
}

export interface Genus {
  genus: string;
  language: NamedAPIResource;
}

export interface PokemonSpeciesVariety {
  is_default: boolean;
  pokemon: NamedAPIResource;
}

// Evolution Chain
export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionDetail {
  item: NamedAPIResource | null;
  trigger: NamedAPIResource;
  gender: number | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  turn_upside_down: boolean;
}

// Cache
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

// Filtros e opções
export interface PokemonFilters {
  type?: string;
  generation?: number;
  isLegendary?: boolean;
  isMythical?: boolean;
  minStats?: number;
  maxStats?: number;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'speed';
  order: 'asc' | 'desc';
}
