import {
  CategoryBudgetSummary,
  PendingPaymentSummary,
  RecentExpenseSummary
} from './dashboard.model';

// Aliases mantidos para compatibilidade com os componentes existentes
export type CategoriaOrcamento = {
  id: string;
  nome: string;
  orcado: number;
  gasto: number;
  percentual: number;
  emRisco: boolean;
  corBorda: string;
};

export type ContaPagar = {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  vencimentoTexto: string;
  status: 'hoje' | 'amanha' | 'futuro' | 'atrasado';
  dataVencimento: string;
};

export type DespesaRecente = {
  id: string;
  descricao: string;
  categoriaNome: string;
  valor: number;
  dataTexto: string;
  status: 'pago' | 'pendente';
};

export interface Obra {
  id: string;
  nome: string;
  tipo: string;
  local: string;
  orcamentoTotal: number;
  totalGasto: number;
  saldoDisponivel: number;
  percentualGasto: number;
  statusCor: string;
  contasAVencerQtd: number;
  alertaHoje?: {
    titulo: string;
    detalhe: string;
    valor: number;
    linkUrl?: string;
  };
  categorias: CategoriaOrcamento[];
  contasProximas: ContaPagar[];
  ultimosGastos: DespesaRecente[];
}
