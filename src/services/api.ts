const BASE_URL = 'https://pokeapi.co/api/v2';

export const pokeAPI = {
  async getPokemonList(limit: number = 20, offset: number = 0) {
    const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Falha ao buscar lista de Pokémon');
    return response.json();
  },

  async getPokemon(nameOrId: string | number) {
    const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
    if (!response.ok) throw new Error('Pokémon não encontrado');
    return response.json();
  },

  async getPokemonByType(type: string) {
    const response = await fetch(`${BASE_URL}/type/${type}`);
    if (!response.ok) throw new Error('Tipo não encontrado');
    return response.json();
  },

  async getTypes() {
    const response = await fetch(`${BASE_URL}/type`);
    if (!response.ok) throw new Error('Falha ao buscar tipos');
    return response.json();
  },

  async getGeneration(id: number) {
    const response = await fetch(`${BASE_URL}/generation/${id}`);
    if (!response.ok) throw new Error('Geração não encontrada');
    return response.json();
  }
};
