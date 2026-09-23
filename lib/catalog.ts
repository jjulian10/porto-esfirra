export type Category = 'Esfirras salgadas' | 'Esfirras doces' | 'Pizzas' | 'Bebidas';
export type Product = { id: string; name: string; description: string; price: number; category: Category; featured?: boolean };

// Transcribed from the screenshots supplied by the proprietor. Verify live availability before opening the store.
export const products: Product[] = [
  { id:'carne-catupiry', name:'Carne com catupiry', description:'Carne temperada com tomate, cebola, limão e catupiry.', price:600, category:'Esfirras salgadas', featured:true },
  { id:'frango-catupiry', name:'Frango com catupiry', description:'Frango desfiado com catupiry.', price:600, category:'Esfirras salgadas' },
  { id:'calabresa-catupiry', name:'Calabresa com catupiry', description:'Calabresa em fatias e catupiry.', price:600, category:'Esfirras salgadas' },
  { id:'carne-seca', name:'Carne seca', description:'Carne desfiada, banana da terra frita e catupiry.', price:700, category:'Esfirras salgadas' },
  { id:'bacon-catupiry', name:'Bacon com catupiry', description:'Mussarela, bacon e catupiry.', price:600, category:'Esfirras salgadas' },
  { id:'romeu-julieta', name:'Romeu e Julieta', description:'Base de queijo, creme de goiabada e catupiry.', price:600, category:'Esfirras doces' },
  { id:'banana-nevada', name:'Banana Nevada', description:'Base de queijo e banana com chocolate.', price:800, category:'Esfirras doces' },
  { id:'flambanana', name:'Flambanana', description:'Mussarela, banana e chocolate.', price:800, category:'Esfirras doces' },
  { id:'dois-amores', name:'Dois amores', description:'Mussarela e creme de chocolate.', price:800, category:'Esfirras doces' },
  { id:'mm-confete', name:'M&M confete', description:'Mussarela, chocolate ao leite e confeitos.', price:600, category:'Esfirras doces' },
  { id:'morango', name:'Morango', description:'Esfirra doce com chocolate ao leite e morango.', price:800, category:'Esfirras doces' },
  { id:'banana-canela', name:'Banana com canela', description:'Mussarela, banana e canela.', price:600, category:'Esfirras doces' },
  { id:'pizza-familia', name:'Pizza família · 12 fatias', description:'Tamanho família. Escolha dois sabores com a loja.', price:5899, category:'Pizzas' },
  { id:'pizza-coca', name:'Pizza + Coca-Cola', description:'Pizza família de 12 fatias + refrigerante de 1,5 L. Confirme os sabores.', price:6999, category:'Pizzas' },
  { id:'pizza-grande', name:'Pizza grande · 8 fatias', description:'Tamanho grande. Escolha dois sabores com a loja.', price:5200, category:'Pizzas' },
  { id:'coca-2l-zero', name:'Coca-Cola 2 L Zero', description:'Refrigerante 2 L.', price:1600, category:'Bebidas' },
  { id:'coca-2l', name:'Coca-Cola 2 L', description:'Refrigerante 2 L.', price:1600, category:'Bebidas' },
  { id:'parecis', name:'Refrigerante Parecis', description:'Refrigerante regional.', price:700, category:'Bebidas' },
  { id:'coca-1l', name:'Coca-Cola 1 L', description:'Refrigerante 1 L.', price:1000, category:'Bebidas' },
  { id:'coca-600-zero', name:'Coca-Cola 600 ml Zero', description:'Refrigerante 600 ml.', price:700, category:'Bebidas' },
  { id:'coca-600', name:'Coca-Cola 600 ml', description:'Refrigerante 600 ml.', price:700, category:'Bebidas' },
  { id:'coca-lata-zero', name:'Coca-Cola lata Zero', description:'Refrigerante em lata.', price:600, category:'Bebidas' },
  { id:'coca-lata', name:'Coca-Cola lata', description:'Refrigerante em lata.', price:600, category:'Bebidas' },
];

export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
