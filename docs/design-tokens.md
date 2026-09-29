# 🎨 Tokens de Design & Protótipo - ObraCerta!

**Projeto:** ObraCerta (Gestão de Obras Residenciais)  
**Status:** 🟢 Definido (Fase 0 - SDD)  
**Última Atualização:** 2026-09-03  
**Framework Visual:** Tailwind CSS v4 + DaisyUI v5 | **Tipografia:** Inter  

---

## 🎯 1. Visão Geral

Este documento define os **tokens visuais obrigatórios** da aplicação ObraCerta. O objetivo é garantir consistência estética rigorosa em todas as telas, evitando que novas interfaces inventem botões, cores ou espaçamentos fora do padrão do projeto.

---

## 🎨 2. Paleta de Cores (Color Tokens)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VERDE PETRÓLEO (Brand/Primary)     AMARELO (Accent/Secondary)              │
│  Base:   #007A80                    Base:   #FDBE00                         │
│  Hover:  #00686D                    Hover:  #F7AE05                         │
│  Light:  #E6F2F3                    Light:  #FFF8E1                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Token | Hex | Classe Tailwind / DaisyUI | Finalidade Semântica |
| :--- | :--- | :--- | :--- |
| `color-primary` | `#007A80` | `bg-[#007A80]` / `text-[#007A80]` | Cor principal da marca, botões de ação primária, links e destaques ativos. |
| `color-primary-hover` | `#00686D` | `hover:bg-[#00686D]` | Estado hover de botões primários. |
| `color-primary-light` | `#E6F2F3` | `bg-[#E6F2F3]` | Fundo sutil de cards selecionados e itens de menu ativos. |
| `color-secondary` | `#FDBE00` | `bg-[#FDBE00]` / `text-[#FDBE00]` | Cor de destaque (capacete de obra), CTAs secundários e botão "Registrar-se". |
| `color-secondary-hover`| `#F7AE05` | `hover:bg-[#F7AE05]` | Estado hover de botões secundários. |
| `color-bg-app` | `#F8FAFC` | `bg-slate-50` | Fundo padrão de todas as páginas da aplicação. |
| `color-surface` | `#FFFFFF` | `bg-white` | Fundo de cards, modais, formulários e tabelas. |
| `color-border` | `#E2E8F0` | `border-slate-200` | Bordas de cards, inputs e divisores de tabela. |
| `color-text-main` | `#1E293B` | `text-slate-800` | Títulos, rótulos e textos principais com alto contraste. |
| `color-text-muted` | `#64748B` | `text-slate-500` | Subtítulos, textos auxiliares e placeholders. |
| `color-success` | `#10B981` | `bg-emerald-500` / `text-emerald-700` | Indicador de despesa paga, orçamento sob controle (<90%). |
| `color-warning` | `#F59E0B` | `bg-amber-500` / `text-amber-700` | Alerta de conta próxima ao vencimento ou orçamento em 90-99%. |
| `color-danger` | `#EF4444` | `bg-rose-500` / `text-rose-700` | Alerta de conta vencida, estouro de orçamento (>=100%) e erros. |

---

## 🔤 3. Tipografia (Typography Tokens)

- **Família Tipográfica:** `Inter`, sans-serif (importada globalmente em `styles.css`).

| Nível / Elemento | Tamanho | Peso | Classes Tailwind | Exemplo de Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **Título de Página (H1)** | 24px (1.5rem) | Bold (700) | `text-2xl font-bold text-slate-800` | "Dashboard Financeiro", "Minhas Despesas" |
| **Título de Seção (H2)** | 20px (1.25rem) | Semibold (600) | `text-xl font-semibold text-slate-800` | "Pagamentos Próximos", "Orçamento por Categoria" |
| **Título de Card (H3)** | 16px (1.0rem) | Semibold (600) | `text-base font-semibold text-slate-700` | "Total Gasto", "Saldo Restante" |
| **Texto de Corpo (Body)** | 14px (0.875rem)| Regular (400) | `text-sm text-slate-600` | Linhas de tabela, descrições e parágrafos |
| **Legenda / Helper** | 12px (0.75rem) | Medium (500) | `text-xs text-slate-500` | Mensagens de validação e rodapés |

---

## 📐 4. Espaçamento, Raios e Sombras

| Token | Valor | Classes Tailwind | Finalidade |
| :--- | :--- | :--- | :--- |
| `radius-input` | 6px | `rounded-md` | Inputs, selects e botões. |
| `radius-card` | 16px | `rounded-2xl` | Cards do dashboard, modais e containers principais. |
| `spacing-card` | 24px | `p-6` | Espaçamento interno padrão dos cards. |
| `spacing-gap` | 16px | `gap-4` ou `gap-6` | Grade de cards e colunas de formulário. |
| `shadow-card` | Suave | `shadow-sm hover:shadow-md transition-shadow` | Elevação de cards de métricas e tabelas. |

---

## 🔘 5. Padrão de Componentes & Estados de Botão

O projeto adota classes utilitárias no `@layer components` (`styles.css`) além do padrão Tailwind/DaisyUI para manter uniformidade absoluta:

### 5.1 Botão Primário (Ação Principal)
- **Token:** `bg-[#007A80]` com hover `hover:bg-[#00686d]`, bordas `rounded-md`, sem borda (`border-0`), texto branco `text-white` e tipografia `font-medium`.
```html
<!-- Opção 1: Classe utilitária do Design System (Recomendada) -->
<button type="button" class="btn-oc-primary">
  Lançar Nova Despesa
</button>

<!-- Opção 2: Classes utilitárias explícitas -->
<button type="button" class="btn border-0 bg-[#007A80] hover:bg-[#00686d] rounded-md text-white font-medium">
  Lançar Nova Despesa
</button>
```

### 5.2 Botão Secundário / Destaque (Accent)
- **Token:** `bg-[#FDBE00]` com hover `hover:bg-[#f7ae05]`, bordas `rounded-md`, sem borda (`border-0`), texto escuro `text-slate-900` e tipografia `font-medium`.
```html
<!-- Opção 1: Classe utilitária do Design System (Recomendada) -->
<button type="button" class="btn-oc-secondary">
  Registrar-se
</button>

<!-- Opção 2: Classes utilitárias explícitas -->
<button type="button" class="btn border-0 bg-[#FDBE00] hover:bg-[#f7ae05] rounded-md text-slate-900 font-medium">
  Registrar-se
</button>
```

### 5.3 Botão Outline / Cancelar
```html
<button type="button" class="btn-oc-outline">
  Cancelar
</button>

<!-- Ou com utilitários explícitos: -->
<button type="button" class="btn border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md font-medium">
  Cancelar
</button>
```

### 5.4 Botão Destrutivo / Excluir
```html
<button type="button" class="btn-oc-danger">
  Excluir
</button>

<!-- Ou com utilitários explícitos: -->
<button type="button" class="btn border-0 bg-rose-600 hover:bg-rose-700 rounded-md text-white font-medium">
  Excluir
</button>
```

### 5.5 Botão Ghost
```html
<button type="button" class="btn-oc-ghost">
  Ver detalhes
</button>
```

### 5.6 Botão de Redirecionamento de Seção (Ghost Compacto com Ícone)
- **Finalidade:** Utilizado nos cabeçalhos de seções de dashboards e painéis para redirecionar o usuário para a página correspondente (ex: *"Gerenciar Orçamentos"*, *"Ver todas"*).
- **Padrão:** Efeito ghost suave com texto em Teal (`#007A80`), hover com fundo sutil (`hover:bg-[#007A80]/10`), cantos `rounded-md`, tipografia `font-semibold text-xs` e ícone direcional `lucideArrowRight` [size 14].
```html
<!-- Classe utilitária do Design System (Recomendada) -->
<a routerLink="/orcamentos" class="btn-oc-redirect">
  <span>Gerenciar Orçamentos</span>
  <svg lucideArrowRight [size]="14" />
</a>

<!-- Ou com classes atômicas Tailwind/DaisyUI: -->
<a routerLink="/orcamentos" class="btn btn-ghost btn-sm text-[#007A80] hover:bg-[#007A80]/10 rounded-md font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors">
  <span>Gerenciar Orçamentos</span>
  <svg lucideArrowRight [size]="14" />
</a>
```

### 5.7 Inputs e Formulários
```html
<input 
  type="text" 
  class="input border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007A80] focus:border-transparent w-full"
  placeholder="Digite a descrição..."
/>
```

### 5.8 Badges de Status
```html
<!-- Pago -->
<span class="badge bg-emerald-100 text-emerald-800 border-0 font-medium">Pago</span>


<!-- A Pagar / Pendente -->
<span class="badge bg-amber-100 text-amber-800 border-0 font-medium">Pendente</span>

<!-- Vencido -->
<span class="badge bg-rose-100 text-rose-800 border-0 font-medium">Vencido</span>
```

---

## 📱 6. Especificação das 5 Telas Principais do Protótipo

> **Referência Figma Oficial:** [Protótipo no Figma](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1)

---

### 🖥️ Tela 1: Autenticação (Login & Cadastro)
- **Objetivo:** Acesso seguro e criação de conta com validação reativa.
- **Estrutura:** Card centralizado (`rounded-2xl shadow-xl`), logotipo institucional no topo, campos com ícones Lucide (visualização de senha), botão primário *"Entrar"* (`#007A80`) e botão de alternância *"Registrar-se"* (`#FDBE00`).

---

### 📊 Tela 2: Dashboard Principal (Home-Page)
- **Objetivo:** Visão panorâmica da saúde financeira da obra.
- **Estrutura:**
  1. **Header:** Saudação ao usuário, nome da obra ativa e botão de logout.
  2. **Cards de Métricas:** 3 cards destacados:
     - **Orçamento Total Previsto:** Valor em R$ com ícone azul/verde.
     - **Total Gasto:** Valor acumulado em R$ com badge de percentual consumido.
     - **Saldo Restante:** Valor disponível com cor dinâmica (Verde se > 10%, Vermelho se negativo).
  3. **Barra de Progresso Geral:** Barra percentual com indicação de teto consumido.
  4. **Seção de Alertas e Pagamentos Próximos:** Lista das contas com vencimento nos próximos 7 dias com badges coloridos (`Pendente`/`Vencido`).
  5. **Ações Rápidas:** Botões de acesso direto `[+ Nova Despesa]`, `[📥 Importar NF-e]` e `[🎯 Ajustar Orçamento]`.

---

### 💸 Tela 3: Gestão e Listagem de Despesas
- **Objetivo:** Registro detalhado, filtros e histórico de compras.
- **Estrutura:**
  1. **Barra de Filtros:** Inputs para Período (Data Inicial / Final), Dropdown de Categoria e Fornecedor.
  2. **Card Totalizador Dinâmico:** Exibe *"Total filtrado: R$ X.XXX,XX"*.
  3. **Tabela de Despesas:** Colunas: *Data*, *Descrição*, *Categoria*, *Fornecedor*, *Valor Total*, *Status* e *Ações (Editar / Excluir)*.
  4. **Modais:** Modal de cadastro manual e modal de confirmação de exclusão.

---

### 🎯 Tela 4: Planejamento de Orçamentos (Budgets)
- **Objetivo:** Definição de teto financeiro por categoria e comparação visual.
- **Estrutura:**
  1. **Lista de Categorias:** Alvenaria, Elétrica, Hidráulica, Acabamento, Pintura, Mão de Obra, etc.
  2. **Linha por Categoria:** Input de valor estimado, valor já gasto real e barra de progresso visual por item:
     - 🟢 **Verde:** Gasto < 90% do previsto.
     - 🟡 **Amarelo:** Gasto entre 90% e 99% (atenção).
     - 🔴 **Vermelho:** Gasto >= 100% (estouro de orçamento).

---

### 📥 Tela 5: Modal de Importação de NF-e (SEFAZ)
- **Objetivo:** Leitura automatizada via chave de 44 dígitos.
- **Estrutura:**
  1. **Input de Chave:** Campo de texto numérico com máscara de 44 dígitos e validação instantânea.
  2. **Ação:** Botão *"Consultar SEFAZ"* com spinner de loading.
  3. **Área de Pré-visualização:** Dados extraídos da nota (Emitente, CNPJ, Data, Valor e Itens).
  4. **Confirmação:** Dropdown para selecionar a categoria da obra e botão *"Salvar Despesa"*.
