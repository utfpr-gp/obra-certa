---
issue: 11
status: rascunho   # rascunho | aprovada
---

# US09 — Importação de Despesas via NF-e (Chave ou XML)

## O problema

O proprietário compra materiais com nota fiscal e precisa lançar cada item à mão, um por um, escolhendo fornecedor, valor e categoria. Isso é lento e propenso a erro, e o rateio por categoria — que alimenta o orçamento — fica impreciso quando uma mesma compra cobre materiais de etapas diferentes.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** importar compras via upload do arquivo XML da NF-e e distribuir os itens pelas categorias da obra **para que** eu agilize os lançamentos e mantenha a precisão do rateio financeiro por etapa.

<!-- Texto do PRD (US09). Escopo desta entrega: XML (NF-e e NFS-e) com leitura automática, e chave digitada como referência. A consulta remota por chave fica para a Fase 2. -->

## Modelo desta entrega

- Uma nota importada gera **uma linha em `expenses` por item**, todas com a mesma `nfe_key` e a mesma obra. Cada linha tem a categoria escolhida para o seu item.
- O **pagamento único** da nota e o **XML** ficam **somente na primeira linha** do grupo (ordem do item no XML, `nItem = 1`). As demais linhas não têm pagamento nem comprovante.
- **Excluir uma despesa exclui só aquela linha**, com o seu pagamento e o seu comprovante (RN04). As demais linhas da nota continuam. Excluir a primeira linha remove também o XML guardado para a nota.
- **Chave digitada:** no lançamento manual de despesa, o campo opcional de chave da NF-e aceita 44 dígitos com dígito verificador módulo 11 válido. A chave é gravada como referência da linha (`nfe_key`) e sujeita à trava de duplicidade. Os dados são digitados à mão; a chave não busca nada externo.
- **Liberação da chave:** a chave só volta a ser aceita para nova importação quando **não restar nenhuma linha ativa** dela na obra. Para importar de novo, o proprietário exclui as despesas da nota e importa outra vez.
- **Nota cancelada:** o sistema não detecta nem avisa. Se a nota for cancelada, o proprietário exclui a despesa manualmente.
- **Fornecedor:** a razão social do fornecedor é atualizada com a da nota quando o CNPJ já existe para o usuário. A razão social da nota é considerada mais precisa.
- **Formatos:** o XML aceito é de NF-e (produtos) ou de NFS-e (serviços). Não há limite de tamanho definido. Para NFS-e, os serviços da nota fazem o papel dos itens na conferência.

## Critérios de aceite

- [ ] **CA1 — Dado** que o proprietário está na área de importação de uma obra ativa, **quando** envia um arquivo `.xml` de NF-e válido, **então** o sistema exibe a tela de conferência com fornecedor (razão social e CNPJ), data de emissão, chave de acesso e a lista de todos os itens (descrição, quantidade, unidade, valor unitário e valor total).
- [ ] **CA2 — Dado** que o proprietário envia um arquivo `.xml` de NFS-e válido, **quando** o sistema lê o arquivo, **então** a tela de conferência exibe fornecedor, data de emissão, número/chave da nota e os serviços da nota, com descrição e valor de cada um.
- [ ] **CA3 — Dado** que o proprietário digita uma chave com menos ou mais de 44 dígitos, ou com dígito verificador módulo 11 inválido, **quando** tenta salvar a despesa manual, **então** o sistema impede o envio e exibe alerta de chave de acesso inválida, sem nenhuma requisição ao servidor.
- [ ] **CA4 — Dado** que o proprietário digita uma chave válida e não importada na obra, **quando** salva a despesa manual, **então** a chave é gravada como referência da linha e a despesa é gravada normalmente.
- [ ] **CA5 — Dado** que a conferência está aberta, **quando** o proprietário escolhe a categoria de cada item e confirma com uma forma de pagamento (à vista ou a prazo com vencimento), **então** o sistema grava uma linha de despesa por item, com a categoria escolhida, a `nfe_key`, a data de emissão como data da compra e o fornecedor vinculado; grava o pagamento único na primeira linha; e grava o XML como comprovante da primeira linha.
- [ ] **CA6 — Dado** que o fornecedor do XML tem CNPJ já cadastrado para o mesmo usuário, **quando** a nota é confirmada, **então** o sistema vincula esse fornecedor existente e atualiza a razão social dele com a da nota, sem criar outro cadastro; se o CNPJ não existir, cria um fornecedor com razão social e CNPJ da nota.
- [ ] **CA7 — Dado** que a chave da NF-e do XML (ou a chave digitada) já existe em linhas ativas na mesma obra deste usuário, **quando** tenta importar ou salvar, **então** o sistema bloqueia a operação, informa que a nota fiscal já foi registrada e não grava nenhuma linha.
- [ ] **CA8 — Dado** que um item da conferência não tem categoria, **quando** o proprietário tenta confirmar, **então** o sistema impede a gravação e indica os itens sem categoria.
- [ ] **CA9 — Dado** que o arquivo enviado é um XML corrompido ou que não é nem NF-e nem NFS-e, **quando** o sistema tenta extrair os dados, **então** exibe alerta explicando o motivo da falha e oferece o cadastro manual da despesa.
- [ ] **CA10 — Dado** que a importação confirmada faz uma categoria passar do teto orçado, **quando** a gravação conclui, **então** as despesas são gravadas normalmente e o painel de orçamento mostra a categoria como estourada.
- [ ] **CA11 — Dado** que a confirmação falha em qualquer etapa (linhas, pagamento, fornecedor ou comprovante), **quando** a falha ocorre, **então** nada é gravado: a operação é atômica e uma nova tentativa não duplica nem deixa linhas parciais.
- [ ] **CA12 — Dado** que uma requisição tenta importar XML ou gravar chave em obra de outro proprietário, ou em obra excluída, **quando** é executada, **então** o sistema responde que a obra não foi localizada (404), sem gravar nada e sem expor a existência da obra.
- [ ] **CA13 — Dado** que o proprietário confirma a importação e clica duas vezes no botão, **quando** o segundo clique chega enquanto o primeiro ainda processa, **então** somente uma importação é gravada.
- [ ] **CA14 — Dado** que o proprietário exclui uma linha de uma nota com várias linhas, **quando** a exclusão é confirmada, **então** só aquela linha é excluída; as demais linhas da mesma chave continuam ativas e a chave continua bloqueada para nova importação.

## Fora de escopo

- Consulta remota de NF-e por chave (SEFAZ ou provedor fiscal externo). A chave digitada não busca os itens; a busca fica para a Fase 2.
- Detecção e aviso de nota cancelada.
- Emissão de notas.
- Importação de vários XMLs de uma vez (lote).
- Edição dos itens importados como grupo. Cada linha continua editável pela tela de despesas (US04).
- Banco de preços colaborativo alimentado por NF-e.

## Abandono no meio

- **Fechar a aba ou o diálogo antes de confirmar:** nada é gravado; o XML enviado é descartado da memória (CA5, CA11).
- **Rede cai durante a confirmação:** a gravação é atômica. Se a resposta nunca chega, o usuário não vê sucesso e pode consultar a lista de despesas; uma nova tentativa é bloqueada pela trava de chave (CA7, CA11).
- **Clique repetido no botão de confirmar:** o envio fica bloqueado durante o processamento (CA13).
- **Sessão expira no meio da importação:** segue o fluxo de login existente; nada é gravado parcialmente (CA11).
- **Troca de obra com a conferência aberta:** o diálogo é fechado e a resposta antiga é descartada, sem gravar na obra anterior (CA12).
- **Leitura do arquivo demora ou falha:** o usuário recebe o motivo e pode cadastrar manualmente (CA9).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| Nota cancelada não é detectada; o XML é aceito como válido e cabe ao proprietário excluir a despesa | Não há issue prevista: decisão do autor |
| Consulta remota por chave não existe nesta entrega | Fase 2 — a abrir |
| Layout de NFS-e varia por município; o parser cobre o padrão nacional, e layouts não reconhecidos caem no alerta de CA9 | a abrir, se houver municípios não cobertos |

<!-- Cada linha desta tabela precisa de um `// TODO #<issue>` no código que depende dela. -->

## Depende de

- US14 — Obra ativa selecionada (ambiente de obra e troca de obra).
- US03 — Cadastro de despesas (`expenses`, `suppliers`, `pending_payments`).
- US04 — Comprovantes de despesa (armazenamento e remoção do arquivo).
- Categorias pré-definidas (V7).

## Dúvidas em aberto

_Nenhuma._
