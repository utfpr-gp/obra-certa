---
issue: 11
status: aprovada   # rascunho | aprovada
---

# US09 — Importação de Despesas via NF-e (Chave ou XML)

## O problema

O proprietário compra materiais com nota fiscal e precisa lançar cada item à mão, um por um, escolhendo fornecedor, valor e categoria. Isso é lento e propenso a erro, e o rateio por categoria — que alimenta o orçamento — fica impreciso quando uma mesma compra cobre materiais de etapas diferentes.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** importar compras via upload do arquivo XML da NF-e e distribuir os itens pelas categorias da obra **para que** eu agilize os lançamentos e mantenha a precisão do rateio financeiro por etapa.

<!-- Texto do PRD (US09). Escopo desta entrega: somente upload de XML de NF-e, com leitura automática. Nada é digitado para buscar a nota. -->

## Modelo desta entrega

- Uma nota importada gera **uma linha em `expenses` por item**, todas com a mesma `nfe_key` (extraída do XML) e a mesma obra. Cada linha tem a categoria escolhida para o seu item.
- O **pagamento único** da nota e o **XML** ficam **somente na primeira linha** do grupo (ordem do item no XML, `nItem = 1`). As demais linhas não têm pagamento nem comprovante.
- **Excluir uma despesa exclui só aquela linha**, com o seu pagamento e o seu comprovante (RN04). As demais linhas da nota continuam. Excluir a primeira linha remove também o XML guardado para a nota.
- **Chave:** é lida do XML. Não há campo para digitar chave ou número de nota, nem na importação nem no lançamento manual de despesa.
- **Liberação da chave:** a chave só volta a ser aceita para nova importação quando **não restar nenhuma linha ativa** dela na obra. Para importar de novo, o proprietário exclui as despesas da nota e importa outra vez.
- **Nota cancelada:** o sistema não detecta nem avisa. Se a nota for cancelada, o proprietário exclui a despesa manualmente.
- **Fornecedor:** a razão social do fornecedor é atualizada com a da nota quando o CNPJ já existe para o usuário. A razão social da nota é considerada mais precisa.
- **Formato:** o XML aceito é de NF-e (produtos). Não há limite de tamanho definido.

## Critérios de aceite

- [ ] **CA1 — Dado** que o proprietário está na área de importação de uma obra ativa, **quando** envia um arquivo `.xml` de NF-e válido, **então** o sistema exibe a tela de conferência com fornecedor (razão social e CNPJ), data de emissão, chave de acesso e a lista de todos os itens (descrição, quantidade, unidade, valor unitário e valor total).
- [ ] **CA2 — Dado** que o arquivo enviado é um XML corrompido ou que não é uma NF-e, **quando** o sistema tenta extrair os dados, **então** exibe alerta explicando o motivo da falha e oferece o cadastro manual da despesa.
- [ ] **CA3 — Dado** que a chave extraída do XML já existe em linhas ativas na mesma obra deste usuário, **quando** tenta importar, **então** o sistema bloqueia a operação, informa que a nota fiscal já foi registrada e não grava nenhuma linha.
- [ ] **CA4 — Dado** que um item da conferência não tem categoria, **quando** o proprietário tenta confirmar, **então** o sistema impede a gravação e indica os itens sem categoria.
- [ ] **CA5 — Dado** que a conferência está aberta, **quando** o proprietário escolhe a categoria de cada item e confirma com uma forma de pagamento (à vista ou a prazo com vencimento), **então** o sistema grava uma linha de despesa por item, com a categoria escolhida, a `nfe_key` extraída do XML, a data de emissão como data da compra e o fornecedor vinculado; grava o pagamento único na primeira linha; e grava o XML como comprovante da primeira linha.
- [ ] **CA6 — Dado** que o fornecedor do XML tem CNPJ já cadastrado para o mesmo usuário, **quando** a nota é confirmada, **então** o sistema vincula esse fornecedor existente e atualiza a razão social dele com a da nota, sem criar outro cadastro; se o CNPJ não existir, cria um fornecedor com razão social e CNPJ da nota.
- [ ] **CA7 — Dado** que a importação confirmada faz uma categoria passar do teto orçado, **quando** a gravação conclui, **então** as despesas são gravadas normalmente e o painel de orçamento mostra a categoria como estourada.
- [ ] **CA8 — Dado** que a confirmação falha em qualquer etapa (linhas, pagamento, fornecedor ou comprovante), **quando** a falha ocorre, **então** nada é gravado: a operação é atômica e uma nova tentativa não duplica nem deixa linhas parciais.
- [ ] **CA9 — Dado** que uma requisição tenta importar XML em obra de outro proprietário, ou em obra excluída, **quando** é executada, **então** o sistema responde que a obra não foi localizada (404), sem gravar nada e sem expor a existência da obra.
- [ ] **CA10 — Dado** que o proprietário confirma a importação e clica duas vezes no botão, **quando** o segundo clique chega enquanto o primeiro ainda processa, **então** somente uma importação é gravada.
- [ ] **CA11 — Dado** que o proprietário exclui uma linha de uma nota com várias linhas, **quando** a exclusão é confirmada, **então** só aquela linha é excluída; as demais linhas da mesma chave continuam ativas e a chave continua bloqueada para nova importação.

## Fora de escopo

- Digitação de chave ou número de nota, em qualquer tela. A chave vem só do XML.
- Importação de NFS-e (nota de serviço). Fica para outra história.
- Consulta remota de NF-e (SEFAZ ou provedor fiscal externo), por chave ou número. Fica para uma fase futura, se houver viabilidade.
- Detecção e aviso de nota cancelada.
- Emissão de notas.
- Importação de vários XMLs de uma vez (lote).
- Edição dos itens importados como grupo. Cada linha continua editável pela tela de despesas (US04).
- Banco de preços colaborativo alimentado por NF-e.

## Abandono no meio

- **Fechar a aba ou o diálogo antes de confirmar:** nada é gravado; o XML enviado é descartado da memória (CA5, CA8).
- **Rede cai durante a confirmação:** a gravação é atômica. Se a resposta nunca chega, o usuário não vê sucesso e pode consultar a lista de despesas; uma nova tentativa é bloqueada pela trava de chave (CA3, CA8).
- **Clique repetido no botão de confirmar:** o envio fica bloqueado durante o processamento (CA10).
- **Sessão expira no meio da importação:** segue o fluxo de login existente; nada é gravado parcialmente (CA8).
- **Troca de obra com a conferência aberta:** o diálogo é fechado e a resposta antiga é descartada, sem gravar na obra anterior (CA9).
- **Leitura do arquivo demora ou falha:** o usuário recebe o motivo e pode cadastrar manualmente (CA2).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| Nota cancelada não é detectada; o XML é aceito como válido e cabe ao proprietário excluir a despesa | Não há issue prevista: decisão do autor |
| Consulta remota de nota não existe nesta entrega | Fase futura — a abrir, se houver viabilidade |

<!-- Cada linha desta tabela precisa de um `// TODO #<issue>` no código que depende dela. -->

## Depende de

- US14 — Obra ativa selecionada (ambiente de obra e troca de obra).
- US03 — Cadastro de despesas (`expenses`, `suppliers`, `pending_payments`).
- US04 — Comprovantes de despesa (armazenamento e remoção do arquivo).
- Categorias pré-definidas (V7).

## Dúvidas em aberto

_Nenhuma._
