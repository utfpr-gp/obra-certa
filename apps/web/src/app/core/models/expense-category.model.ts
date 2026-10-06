export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StandardExpenseCategory {
  id: string;
  name: string;
  description: string;
}

export const PREDEFINED_CATEGORIES: StandardExpenseCategory[] = [
  { id: 'cat-fundacao', name: 'Fundação e Estrutura', description: 'Sapatas, vigas, colunas, lajes e terraplenagem' },
  { id: 'cat-alvenaria', name: 'Alvenaria', description: 'Tijolos, blocos, cimento, areia e paredes' },
  { id: 'cat-eletrica', name: 'Elétrica', description: 'Fiação, eletrodutos, quadros, disjuntores e iluminação' },
  { id: 'cat-hidraulica', name: 'Hidráulica', description: 'Tubulações, conexões, caixas d\'água, esgoto e louças' },
  { id: 'cat-cobertura', name: 'Telhado e Cobertura', description: 'Madeiramento, telhas, calhas e impermeabilização' },
  { id: 'cat-esquadrias', name: 'Esquadrias e Vidros', description: 'Portas, janelas, portões e vidraçaria' },
  { id: 'cat-acabamento', name: 'Acabamento e Pintura', description: 'Pisos, revestimentos, gesso, tintas e massas' },
  { id: 'cat-maodeobra', name: 'Mão de Obra', description: 'Pedreiros, mestres de obras, eletricistas e encanadores' },
  { id: 'cat-taxas', name: 'Taxas e Serviços', description: 'Projetos, alvarás, caçambas, ART e documentações' },
];

