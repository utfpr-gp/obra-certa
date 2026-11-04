# 🎨 Tokens de Design & Protótipo - ObraCerta!

**Projeto:** ObraCerta (Gestão Financeira de Obras Residenciais)  
**Status:** 🟢 Definido (Fase 0 - SDD)  
**Versão:** 2.0.0 (Alinhada ao Método UTF-SDD)  
**Framework Visual:** Tailwind CSS v4 + DaisyUI v5 | **Tipografia:** Inter  
**Protótipo Oficial Figma:** [ObraCerta no Figma](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1)

---

## 🎯 1. Visão Geral

Este documento define os **tokens visuais obrigatórios**, regras de **responsividade mobile-first**, especificações do **manifesto PWA** e padrões de interface para mitigação dos **pontos de desistência** na aplicação ObraCerta. O objetivo é assegurar uniformidade estética, facilidade de uso em dispositivos móveis no canteiro de obras e robustez de experiência.

---

## 🎨 2. Paleta de Cores Semântica (Color Tokens)

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
| `color-primary-light` | `#E6F2F3` | `bg-[#E6F2F3]` | Fundo sutil de cards selecionados, chips e menus ativos. |
| `color-secondary` | `#FDBE00` | `bg-[#FDBE00]` / `text-slate-900` | Cor de destaque (amarelo capacete), CTAs secundários e botão "Registrar-se". |
| `color-secondary-hover`| `#F7AE05` | `hover:bg-[#F7AE05]` | Estado hover de botões secundários. |
| `color-bg-app` | `#F8FAFC` | `bg-slate-50` | Fundo padrão de todas as páginas da aplicação. |
| `color-surface` | `#FFFFFF` | `bg-white` | Fundo de cartões, modais, formulários e painéis. |
| `color-border` | `#E2E8F0` | `border-slate-200` | Bordas de containers, inputs e divisores de tabela. |
| `color-text-main` | `#1E293B` | `text-slate-800` | Títulos, rótulos e textos principais com alto contraste. |
| `color-text-muted` | `#64748B` | `text-slate-500` | Subtítulos, textos auxiliares e placeholders. |
| `color-success` | `#10B981` | `bg-emerald-500` / `text-emerald-700` | Despesa paga, sobra de orçamento, operação concluída com sucesso. |
| `color-warning` | `#F59E0B` | `bg-amber-500` / `text-amber-700` | Alerta de conta próxima do vencimento (<=3 dias) ou consumo em 90-99%. |
| `color-danger` | `#EF4444` | `bg-rose-500` / `text-rose-700` | Alerta de conta vencida, estouro de orçamento (>=100%) e erros críticos. |

---

## 🔤 3. Tipografia (Typography Tokens)

- **Família Tipográfica:** `Inter`, sans-serif (importada globalmente em `styles.css`).

| Nível / Elemento | Tamanho | Peso | Classes Tailwind | Exemplo de Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **Título de Página (H1)** | 24px (1.5rem) | Bold (700) | `text-2xl font-bold text-slate-800` | "Dashboard da Obra", "Despesas" |
| **Título de Seção (H2)** | 20px (1.25rem) | Semibold (600) | `text-xl font-semibold text-slate-800` | "Alertas de Vencimento", "Orçamento Previsto" |
| **Título de Card (H3)** | 16px (1.0rem) | Semibold (600) | `text-base font-semibold text-slate-700` | "Total Gasto", "Saldo Remanescente" |
| **Texto de Corpo (Body)** | 14px (0.875rem)| Regular (400) | `text-sm text-slate-600` | Linhas de lista, descrições e parágrafos |
| **Legenda / Helper** | 12px (0.75rem) | Medium (500) | `text-xs text-slate-500` | Mensagens de validação e rodapés |

---

## 📐 4. Espaçamento, Raios e Sombras

| Token | Valor | Classes Tailwind | Finalidade |
| :--- | :--- | :--- | :--- |
| `radius-input` | 6px | `rounded-md` | Inputs, selects e botões. |
| `radius-card` | 16px | `rounded-2xl` | Cards de métricas, modais e containers principais. |
| `spacing-card` | 24px | `p-6` | Espaçamento interno padrão dos cards no desktop (`p-4` no mobile). |
| `spacing-gap` | 16px | `gap-4` ou `gap-6` | Grade de cards e colunas de formulário. |
| `shadow-card` | Suave | `shadow-sm hover:shadow-md transition-shadow` | Elevação de cartões e painéis interativos. |

---

## 📱 5. Estratégia Mobile-First e Breakpoints

O ObraCerta é projetado para uso direto no canteiro de obras por meio de smartphones. Todo layout nasce primeiro para telas compactas (`360px+`) e expande progressivamente.

### Breakpoints Oficiais (Tailwind CSS)

| Breakpoint | Faixa | Regra de Layout |
| :--- | :--- | :--- |
| **Mobile (Base)** | `< 640px` | - Coluna única vertical.<br>- Menu de navegação drawer/gaveta inferior.<br>- Alvos de toque (touch targets) com altura mínima de 44px.<br>- **Tabelas são transformadas em cartões empilhados (cards)**, exibindo dados em pares chave-valor para leitura com uma mão. |
| **Tablet (`md`)** | `768px - 1023px` | - Grade de 2 colunas para cards de métricas e formulários.<br>- Filtros organizados em grade responsiva. |
| **Desktop (`lg` / `xl`)** | `>= 1024px` | - Navbar completa com Seletor Global de Obra no topo.<br>- Grid de 3 colunas para totalizadores financeiros.<br>- Tabelas horizontais completas com ordenação e ações rápidas por linha. |

---

## 📲 6. Identidade PWA (Progressive Web App)

Valores formais que configuram o `manifest.webmanifest` e o comportamento do aplicativo instalado:

- **Nome da Aplicação (`name`):** `ObraCerta - Gestão de Obras`
- **Nome Curto (`short_name`):** `ObraCerta`
- **Descrição:** `Controle financeiro e planejamento orçamentário de obras residenciais autogeridas`
- **Cor de Tema (`theme_color`):** `#007A80` (Verde Petróleo da marca — colore a barra de status do dispositivo)
- **Cor de Fundo (`background_color`):** `#F8FAFC` (Slate 50 — fundo da tela de splash ao iniciar)
- **Modo de Exibição (`display`):** `standalone` (interface em tela cheia, sem barra de URL do navegador)
- **Orientação Padrão:** `portrait-primary`
- **Ícone:** Capacete e prancheta com fundo teal e acentos amarelos (192x192 e 512x512 maskable)
- **Comportamento Visual Offline (Sem Rede):**
  - Banner discreto no topo em fundo neutro com ícone de aviso: *"Você está desconectado. Os dados exibidos podem estar desatualizados."*
  - Telas previamente carregadas continuam acessíveis para consulta local;
  - Ações que demandam comunicação ativa com o servidor (salvar despesa, importar NF-e) são temporariamente desabilitadas com mensagem amigável convidando o usuário a reconectar.

---

## 🛡️ 7. Decisões de Interface nos Pontos de Desistência

Para garantir que a interface nunca deixe o usuário em becos sem saída, aplicam-se as seguintes regras de design de interação:

1. **Bloqueio de Redução Orçamentária (RN02 com Visibilidade Direta):**
   - Ao tentar reduzir o teto orçado abaixo do gasto, a mensagem de erro exibe um atalho direto clicável: *"Ver as X despesas desta categoria"*. Ao clicar, a listagem de despesas abre com o filtro daquela categoria já aplicado, permitindo auditoria imediata.
2. **Despesa em Categoria Sem Orçamento:**
   - No formulário de despesa, selecionar uma categoria sem teto orçado exibe um alerta inline não bloqueante: *"Esta categoria ainda não tem orçamento definido"*, acompanhado do link direto *"Definir teto agora"*, sem travar o lançamento.
3. **Upload de Comprovante em Rede Instável:**
   - O upload de anexo exibe barra de progresso visual percentual. Em caso de oscilação de sinal no canteiro, o sistema salva os dados da despesa e sinaliza o comprovante como pendente de envio, com botão de reenvio (`Retry`), evitando perder os dados digitados.
4. **Sessão Expirada em Formulários e Modais de Confirmação:**
   - **US03 e US04 implementadas:** `401` encerra a sessão e redireciona ao login. Os campos e a intenção de exclusão não são restaurados após novo login e não há reenvio automático. O usuário retorna manualmente à despesa e solicita a operação novamente. A recuperação inicialmente prevista foi retirada pelo autor (US03 em 30/10/2026 e US04 em 31/10/2026); a diretriz de reautenticação abaixo não se aplica a essas entregas.
   - Formulários longos e modais de confirmação de exclusão retêm os dados em memória. Ao receber `401`, abrem modal compacto de reautenticação (*"Confirme sua senha para continuar"*), executando a ação original imediatamente após o login sem fechar a tela nem perder dados.
5. **Onboarding Imediato (Zero Obras):**
   - Usuário sem nenhuma obra cadastrada nunca visualiza painéis em branco ou tabelas vazias; visualiza um card centralizado acolhedor com ilustração orientativa e CTA destacado: `[+ Cadastrar Minha Primeira Obra]`.
6. **NF-e Indisponível na SEFAZ:**
   - Em caso de timeout ou erro de consulta remota, a tela oferece instantaneamente: `[Importar arquivo XML local]` e `[Preencher Manualmente]` (mantendo a chave fiscal já preenchida).

---

## 🔘 8. Estados de Botões e Componentes

### 8.1 Botão Primário (Ação Principal)
- **Token:** `bg-[#007A80]` | `hover:bg-[#00686D]` | `text-white` | `rounded-md font-medium px-4 py-2`
```html
<button type="button" class="btn border-0 bg-[#007A80] hover:bg-[#00686D] rounded-md text-white font-medium">
  Salvar Despesa
</button>
```

### 8.2 Botão Secundário / Destaque (Accent)
- **Token:** `bg-[#FDBE00]` | `hover:bg-[#F7AE05]` | `text-slate-900` | `rounded-md font-medium px-4 py-2`
```html
<button type="button" class="btn border-0 bg-[#FDBE00] hover:bg-[#F7AE05] rounded-md text-slate-900 font-medium">
  Registrar-se
</button>
```

### 8.3 Botão Outline / Cancelar
```html
<button type="button" class="btn border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md font-medium px-4 py-2">
  Cancelar
</button>
```

### 8.4 Botão Destrutivo / Excluir
```html
<button type="button" class="btn border-0 bg-rose-600 hover:bg-rose-700 rounded-md text-white font-medium px-4 py-2">
  Excluir
</button>
```

### 8.5 Badges de Status
```html
<!-- Pago / Sob Controle -->
<span class="badge bg-emerald-100 text-emerald-800 border-0 font-medium">Pago</span>

<!-- Pendente / Atenção -->
<span class="badge bg-amber-100 text-amber-800 border-0 font-medium">Pendente</span>

<!-- Vencido / Estouro de Teto -->
<span class="badge bg-rose-100 text-rose-800 border-0 font-medium">Vencido</span>
```
