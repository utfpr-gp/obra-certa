import { Injectable, signal, computed } from '@angular/core';
import { Obra } from '../models/obra.model';

@Injectable({
  providedIn: 'root',
})
export class ObraMockService {
  private readonly initialObras: Obra[] = [
    {
      id: '1',
      nome: 'Construção Casa Praia',
      tipo: 'Construção Nova',
      local: 'Guaratuba · PR',
      orcamentoTotal: 396660,
      totalGasto: 74400,
      saldoDisponivel: 322260,
      percentualGasto: 19,
      statusCor: '#007A80',
      contasAVencerQtd: 5,
      alertaHoje: {
        titulo: 'Vence hoje:',
        detalhe: 'Pagamento do pedreiro José Silva — R$ 3.200,00',
        valor: 3200,
      },
      categorias: [
        { id: 'cat-fundacao', nome: 'Fundação e Estrutura', orcado: 45000, gasto: 15500, percentual: 34, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-alvenaria', nome: 'Alvenaria', orcado: 85000, gasto: 12000, percentual: 14, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-eletrica', nome: 'Elétrica', orcado: 8000, gasto: 9000, percentual: 112, emRisco: true, corBorda: '#EF4444' },
        { id: 'cat-hidraulica', nome: 'Hidráulica', orcado: 22000, gasto: 7400, percentual: 34, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-maodeobra', nome: 'Mão de Obra', orcado: 128660, gasto: 15000, percentual: 12, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-acabamento', nome: 'Acabamento e Pintura', orcado: 100000, gasto: 11000, percentual: 11, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-taxas', nome: 'Taxas e Serviços', orcado: 8000, gasto: 4500, percentual: 56, emRisco: false, corBorda: '#CBD5E1' },
      ],
      contasProximas: [
        { id: 'cp1', descricao: 'Madeireira Carvalho', fornecedor: 'Madeireira Carvalho', valor: 1850, vencimentoTexto: 'Hoje', status: 'hoje', dataVencimento: '2026-09-09' },
        { id: 'cp2', descricao: 'Eng. Carlos + Equipe', fornecedor: 'Carlos Eng', valor: 3500, vencimentoTexto: 'Amanhã', status: 'amanha', dataVencimento: '2026-09-10' },
        { id: 'cp3', descricao: 'Depósito Cimento & Cia', fornecedor: 'Cimento & Cia', valor: 2400, vencimentoTexto: '15/09', status: 'futuro', dataVencimento: '2026-09-15' },
        { id: 'cp4', descricao: 'Elétrica Fortaleza', fornecedor: 'Elétrica Fortaleza', valor: 4200, vencimentoTexto: '18/09', status: 'futuro', dataVencimento: '2026-09-18' },
        { id: 'cp5', descricao: 'Hidráulica Sul', fornecedor: 'Hidráulica Sul', valor: 1900, vencimentoTexto: '22/09', status: 'futuro', dataVencimento: '2026-09-22' },
      ],
      ultimosGastos: [
        { id: 'ug1', descricao: 'Cimento CP II 50kg', categoriaNome: 'Alvenaria', valor: 2850, dataTexto: 'Hoje', status: 'pago' },
        { id: 'ug2', descricao: 'Pedreiro Sem. 13', categoriaNome: 'Mão de Obra', valor: 1600, dataTexto: 'Ontem', status: 'pago' },
        { id: 'ug3', descricao: 'Adiantamento Laje', categoriaNome: 'Fundação e Estrutura', valor: 6500, dataTexto: '02/09', status: 'pendente' },
        { id: 'ug4', descricao: 'Tubos e Conexões PVC', categoriaNome: 'Hidráulica', valor: 980, dataTexto: '28/08', status: 'pago' },
        { id: 'ug5', descricao: 'Fiação e Disjuntores', categoriaNome: 'Elétrica', valor: 2300, dataTexto: '25/08', status: 'pago' },
      ],
    },
    {
      id: '2',
      nome: 'Reforma Banheiro Suíte',
      tipo: 'Reforma',
      local: 'Guarapuava · PR',
      orcamentoTotal: 45000,
      totalGasto: 12700,
      saldoDisponivel: 32300,
      percentualGasto: 28,
      statusCor: '#007A80',
      contasAVencerQtd: 1,
      alertaHoje: undefined,
      categorias: [
        { id: 'cat-alvenaria', nome: 'Alvenaria', orcado: 6000, gasto: 5800, percentual: 96, emRisco: true, corBorda: '#F59E0B' },
        { id: 'cat-hidraulica', nome: 'Hidráulica', orcado: 12000, gasto: 1500, percentual: 12, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-acabamento', nome: 'Acabamento e Pintura', orcado: 18000, gasto: 4200, percentual: 23, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-maodeobra', nome: 'Mão de Obra', orcado: 9000, gasto: 1200, percentual: 13, emRisco: false, corBorda: '#007A80' },
      ],
      contasProximas: [
        { id: 'cp21', descricao: 'Boutique dos Pisos', fornecedor: 'Boutique Pisos', valor: 3400, vencimentoTexto: '14/09', status: 'futuro', dataVencimento: '2026-09-14' },
      ],
      ultimosGastos: [
        { id: 'ug21', descricao: 'Caçamba de Entulho (2x)', categoriaNome: 'Alvenaria', valor: 700, dataTexto: 'Hoje', status: 'pago' },
        { id: 'ug22', descricao: 'Argamassa ACIII Porcelanato', categoriaNome: 'Acabamento e Pintura', valor: 450, dataTexto: '06/09', status: 'pago' },
      ],
    },
    {
      id: '3',
      nome: 'Edícula Fundos',
      tipo: 'Ampliação',
      local: 'Guarapuava · PR',
      orcamentoTotal: 78000,
      totalGasto: 74100,
      saldoDisponivel: 3900,
      percentualGasto: 95,
      statusCor: '#EF4444',
      contasAVencerQtd: 0,
      alertaHoje: undefined,
      categorias: [
        { id: 'cat-fundacao', nome: 'Fundação e Estrutura', orcado: 20000, gasto: 19800, percentual: 99, emRisco: true, corBorda: '#F59E0B' },
        { id: 'cat-cobertura', nome: 'Telhado e Cobertura', orcado: 35000, gasto: 36200, percentual: 103, emRisco: true, corBorda: '#EF4444' },
        { id: 'cat-acabamento', nome: 'Acabamento e Pintura', orcado: 23000, gasto: 18100, percentual: 78, emRisco: false, corBorda: '#007A80' },
      ],
      contasProximas: [],
      ultimosGastos: [
        { id: 'ug31', descricao: 'Verniz Naval p/ Madeira', categoriaNome: 'Acabamento e Pintura', valor: 380, dataTexto: 'Ontem', status: 'pago' },
      ],
    },
    {
      id: '4',
      nome: 'Sobrado Vila Bela',
      tipo: 'Construção Nova',
      local: 'Pinhão · PR',
      orcamentoTotal: 265000,
      totalGasto: 218900,
      saldoDisponivel: 46100,
      percentualGasto: 83,
      statusCor: '#F59E0B',
      contasAVencerQtd: 2,
      alertaHoje: {
        titulo: 'Vence hoje:',
        detalhe: 'Entrega de Esquadrias de Alumínio — R$ 8.900,00',
        valor: 8900,
      },
      categorias: [
        { id: 'cat-fundacao', nome: 'Fundação e Estrutura', orcado: 110000, gasto: 108000, percentual: 98, emRisco: true, corBorda: '#F59E0B' },
        { id: 'cat-esquadrias', nome: 'Esquadrias e Vidros', orcado: 45000, gasto: 42000, percentual: 93, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-acabamento', nome: 'Acabamento e Pintura', orcado: 50000, gasto: 38900, percentual: 77, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-eletrica', nome: 'Elétrica', orcado: 30000, gasto: 18000, percentual: 60, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-hidraulica', nome: 'Hidráulica', orcado: 30000, gasto: 12000, percentual: 40, emRisco: false, corBorda: '#007A80' },
      ],
      contasProximas: [
        { id: 'cp41', descricao: 'Esquadrias Bela Vista', fornecedor: 'Esquadrias Bela Vista', valor: 8900, vencimentoTexto: 'Hoje', status: 'hoje', dataVencimento: '2026-09-09' },
        { id: 'cp42', descricao: 'Gesseiro Marcelo', fornecedor: 'Marcelo Gesso', valor: 2500, vencimentoTexto: '16/09', status: 'futuro', dataVencimento: '2026-09-16' },
      ],
      ultimosGastos: [
        { id: 'ug41', descricao: 'Tinta Acrílica Fosca 18L (4x)', categoriaNome: 'Acabamento e Pintura', valor: 2100, dataTexto: '07/09', status: 'pago' },
      ],
    },
    {
      id: '5',
      nome: 'Telhado Chácara',
      tipo: 'Reforma',
      local: 'Turvo · PR',
      orcamentoTotal: 32000,
      totalGasto: 4800,
      saldoDisponivel: 27200,
      percentualGasto: 15,
      statusCor: '#007A80',
      contasAVencerQtd: 0,
      alertaHoje: undefined,
      categorias: [
        { id: 'cat-cobertura', nome: 'Telhado e Cobertura', orcado: 22000, gasto: 3600, percentual: 16, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-maodeobra', nome: 'Mão de Obra', orcado: 8000, gasto: 1000, percentual: 12, emRisco: false, corBorda: '#007A80' },
        { id: 'cat-taxas', nome: 'Taxas e Serviços', orcado: 2000, gasto: 200, percentual: 10, emRisco: false, corBorda: '#CBD5E1' },
      ],
      contasProximas: [],
      ultimosGastos: [
        { id: 'ug51', descricao: 'Vigas de Eucalipto Tratado', categoriaNome: 'Telhado e Cobertura', valor: 1900, dataTexto: '05/09', status: 'pago' },
      ],
    },
  ];

  readonly obras = signal<Obra[]>(this.initialObras);
  readonly activeObraId = signal<string>('1');

  readonly activeObra = computed<Obra>(() => {
    const list = this.obras();
    const id = this.activeObraId();
    return list.find((o) => o.id === id) || list[0];
  });

  readonly riskCategories = computed(() => {
    const active = this.activeObra();
    return active.categorias.filter((c) => c.emRisco || c.percentual >= 90);
  });

  selectObra(id: string): void {
    this.activeObraId.set(id);
  }

  formatBrl(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatBrlShort(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    });
  }
}
