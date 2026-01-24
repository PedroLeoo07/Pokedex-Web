# Sistema Web Pokémon - Pokédex

Sistema web completo desenvolvido com Next.js e TypeScript para explorar o universo Pokémon utilizando a [PokeAPI](https://pokeapi.co/).

## 🚀 Funcionalidades

- ✅ Listagem de Pokémon com paginação
- ✅ Busca por nome ou número
- ✅ Visualização detalhada de cada Pokémon
- ✅ Exibição de tipos, habilidades e estatísticas
- ✅ Design responsivo e moderno
- ✅ Animações e transições suaves

## 🛠️ Tecnologias

- **Next.js 15** - Framework React para produção
- **TypeScript** - Tipagem estática
- **CSS Modules** - Estilização componentizada
- **PokeAPI** - API REST de dados Pokémon

## 📋 Pré-requisitos

- Node.js 20.9.0 ou superior
- npm, yarn, pnpm ou bun

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto

2. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

## 🚀 Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build para Produção

```bash
npm run build
npm run start
# ou
yarn build
yarn start
# ou
pnpm build
pnpm start
```

## 📁 Estrutura do Projeto

```
pokemonApi/
├── src/
│   ├── app/
│   │   ├── pokemon/
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Página de detalhes
│   │   │       └── page.module.css
│   │   ├── globals.css               # Estilos globais
│   │   ├── layout.tsx                # Layout principal
│   │   ├── page.tsx                  # Página inicial
│   │   └── page.module.css
│   ├── components/
│   │   └── PokemonCard/
│   │       ├── PokemonCard.tsx       # Card do Pokémon
│   │       └── PokemonCard.module.css
│   ├── services/
│   │   └── api.ts                    # Integração com PokeAPI
│   └── types/
│       └── pokemon.ts                # Tipos TypeScript
├── .github/
│   └── copilot-instructions.md
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 🎮 Como Usar

1. **Página Principal**: Visualize uma lista paginada de Pokémon
2. **Buscar**: Use a barra de busca para encontrar um Pokémon específico
3. **Detalhes**: Clique em qualquer Pokémon para ver informações detalhadas
4. **Navegação**: Use os botões de paginação para explorar mais Pokémon

## 🌐 API Utilizada

Este projeto consome a [PokeAPI](https://pokeapi.co/), uma API RESTful completa com dados sobre:

- Pokémon (nome, tipo, estatísticas, habilidades)
- Tipos e suas relações
- Habilidades e movimentos
- Itens e muito mais

### Principais Endpoints:

- `GET /api/v2/pokemon` - Lista de Pokémon
- `GET /api/v2/pokemon/{id}` - Detalhes do Pokémon
- `GET /api/v2/type` - Lista de tipos
- `GET /api/v2/ability` - Lista de habilidades

## 📝 Licença

Este é um projeto de exemplo para fins educacionais.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

Desenvolvido com ❤️ e Next.js
