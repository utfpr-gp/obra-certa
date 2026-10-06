# 📋 Spec #003: Scaffold e Dashboard da Home-Page

**Status:** 🟢 Implementada  
**Prioridade:** Alta  
**Camada:** Frontend (`apps/web`)  
**História / Protótipo:** HU07, HU08 / Protótipo Tela 2 ([Figma](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1))

---

## 🎯 Objetivo
Construir a interface do **Dashboard Principal (Home-Page)** da aplicação ObraCerta no Angular SPA, oferecendo ao usuário uma visão panorâmica e reativa da saúde financeira da sua obra em andamento — total gasto, saldo disponível, contas a vencer, progresso de teto por categoria e alertas preventivos de estouro de orçamento.

Durante esta etapa, os dados são providos de forma reativa pelo serviço singleton em memória `ObraMockService` (preparando o terreno para consumo da API REST na [Spec #007](../007-integracao-home-com-api/spec.md)).

---

## 📦 Componentes & Arquitetura

### 1. Shell de Layout & Navegação Global
- **`MainLayoutComponent` (`apps/web/src/app/shared/layouts/main-layout/`):**
  - Layout mestre com estrutura responsiva (`flex h-screen overflow-hidden`).
  - Drawer mobile acessível e animado para resoluções menores.
  - Hospeda a `<app-navbar>` no topo, a `<app-sidebar>` na lateral e o `<router-outlet>` na área de rolagem independente.
- **`NavbarComponent` (`apps/web/src/app/shared/components/navbar/`):**
  - Dropdown/seletor de obras ativas (suporte Multi-Obra) com barra de progresso individual por obra.
  - Botão de abertura de menu mobile (hambúrguer).
  - Menu de perfil de usuário com ação de logout (`Auth.logout()`).
  - Fechamento automático via clique externo ou tecla `Escape`.
- **`SidebarComponent` (`apps/web/src/app/shared/components/sidebar/`):**
  - Menu vertical com links semânticos: *Resumo da Obra (`/home`)*, *Orçamentos (`/orcamentos`)*, *Despesas (`/despesas`)*, *Contas a Pagar (`/contas`)*, *Fornecedores (`/fornecedores`)* e *Relatórios (`/relatorios`)*.
  - Destaque visual da rota ativa via `routerLinkActive="active-item"`.

### 2. Tela Principal: `HomePage` (`apps/web/src/app/features/home-page/`)
- Injeta o `ObraMockService` e expõe signals reativos: `activeObra`, `riskCategories` e `firstRiskCategory`.
- Exibe cabeçalho contextual com nome da obra selecionada e botão de ação rápida *(Lançar Nova Despesa)*.

### 3. Componentes Compartilhados do Dashboard (`apps/web/src/app/shared/components/`)
- **`RadialGaugeComponent`:** Medidor radial em SVG calculando a porcentagem consumida do orçamento total, com cores dinâmicas e texto centralizado.
- **`KpiCardComponent`:** Cards métricos estilizados com ícones Lucide para Saldo Disponível, Contas a Vencer e Categorias em Risco.
- **`CategoryProgressCardComponent`:** Cards individuais para cada categoria (Fundação, Alvenaria, Elétrica, etc.) com orçado vs gasto, barra percentual e destaque de risco caso ultrapasse 100%.
- **`StatusBadgeComponent`:** Crachás de status semânticos para prazos e pagamentos (`hoje`, `amanha`, `futuro`, `atrasado`, `pago`, `pendente`).
- **`AlertBannerComponent`:** Banner dinâmico com botão de ação rápida para contas críticas com vencimento no dia.
- **`ConfirmModalComponent`:** Modal acessível para confirmação de ações de exclusão ou destrutivas.

### 4. Camada de Domínio & Mock Service (`apps/web/src/app/core/`)
- **`ObraMockService` (`services/obra-mock.service.ts`):** Provedor de estado baseado em Angular Signals (`signal<Obra[]>`, `activeObraId`, `activeObra = computed(...)`), permitindo troca imediata de obra sem recarregar a página.
- **Modelos (`models/`):** `Obra`, `CategoriaOrcamento`, `ContaPagar`, `DespesaRecente` e `DashboardSummary`.

---

## 🎨 Design System e Tokens
- **Cores Oficiais:**
  - Primária (Verde Petróleo): `#007A80` (Hover: `#00686d`)
  - Secundária (Destaque): `#FDBE00` (Hover: `#f7ae05`)
  - Alerta / Risco: Vermelho `#EF4444` e Âmbar `#F59E0B`
- **Tipografia:** Fonte padrão *Inter*, pesos 500 (*medium*) e 700 (*bold*).
- **Frameworks:** Tailwind CSS 4 + DaisyUI 5, respeitando botões com `rounded-md` e borda zerada.

---

## ✅ Critérios de Aceite
1. **Responsividade Total:** O layout deve se adaptar fluidamente entre mobile (<768px), tablet e desktop, com navegação por drawer no mobile.
2. **Reatividade Multi-Obra:** Ao trocar a obra selecionada no menu superior da Navbar, todos os dados do dashboard (total gasto, saldo, categorias e listas) devem atualizar de imediato através de Signals.
3. **Métricas Financeiras Claras:** Todos os valores monetários devem ser formatados no padrão brasileiro (`R$ 0.000,00`).
4. **Indicação Visual de Risco:** Categorias que estouraram o orçamento (>100%) devem receber sinalização explícita (borda vermelha e texto em destaque).
5. **Listas Rápidas:** Apresentar painel com resumo das contas próximas a vencer e últimas despesas registradas com seus respectivos status.
6. **Cobertura de Testes:** 100% dos testes unitários dos componentes do scaffold e serviços associados devem passar sem falhas (`ng test`).
