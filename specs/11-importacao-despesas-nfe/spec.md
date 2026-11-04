---
issue: 11
status: rascunho   # rascunho | aprovada
---

# US09 — Importação de Despesas via NF-e (Chave ou XML)

## O problema

O proprietário compra materiais com nota fiscal e precisa lançar cada item à mão, um por um, escolhendo fornecedor, valor e categoria. Isso é lento e propenso a erro, e o rateio por categoria — que alimenta o orçamento — fica impreciso quando uma mesma compra cobre materiais de etapas diferentes.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** importar compras via upload do arquivo XML da NF-e e distribuir os itens pelas categorias da obra **para que** eu agilize os lançamentos e mantenha a precisão do rateio financeiro por etapa.

<!-- Texto do PRD (US09). Escopo desta entrega: somente XML. A consulta remota por chave fica para a Fase 2. -->

## Modelo desta entrega

Uma nota importada gera **uma linha em `expenses` por item**, todas com a mesma `nfe_key` e a mesma obra. Cada linha tem a categoria escolhida para o seu item. O **pagamento único** da nota e o **XML** ficam **somente na primeira linha** do grupo (ordem do item no XML, `nItem = 1`). As demais linhas não têm pagamento nem comprovante. O gasto de cada categoria é a soma das linhas ativas dela.

## Critérios de aceite

- [ ] **CA1 — Dado** que o proprietário está na área de importação de uma obra ativa, **quando** envia um arquivo `.xml` de NF-e válido, **então** o sistema exibe a tela de conferência com fornecedor (razão social e CNPJ), data de emissão, chave de acesso e a lista de todos os itens (descrição, quantidade, unidade, valor unitário e valor total).
- [ ] **CA2 — Dado** que o proprietário digita uma chave com menos ou mais de 44 dígitos, ou com dígito verificador módulo 11 inválido, **quando** solicita a consulta, **então** o sistema impede o envio e exibe alerta de chave de acesso inválida, sem nenhuma requisição ao servidor.
- [ ] **CA3 — Dado** que a conferência está aberta, **quando** o proprietário escolhe a categoria de cada item e confirma com uma forma de pagamento (à vista ou a prazo com vencimento), **então** o sistema grava uma linha de despesa por item, com a categoria escolhida, a `nfe_key`, a data de emissão como data da compra e o fornecedor vinculado; grava o pagamento único na primeira linha; e grava o XML como comprovante da primeira linha.
- [ ] **CA4 — Dado** que o fornecedor do XML tem CNPJ já cadastrado para o mesmo usuário, **quando** a nota é confirmada, **então** o sistema vincula esse fornecedor existente, sem criar outro; se não existir, cria um fornecedor com razão social e CNPJ da nota.
- [ ] **CA5 — Dado** que a chave da NF-e do XML já foi importada para a mesma obra por este usuário (linhas ativas), **quando** tenta importar de novo, **então** o sistema bloqueia a operação, informa que a nota fiscal já foi registrada e não grava nenhuma linha.
- [ ] **CA6 — Dado** que um item da conferência não tem categoria, **quando** o proprietário tenta confirmar, **então** o sistema impede a gravação e indica os itens sem categoria.
- [ ] **CA7 — Dado** que o arquivo enviado é um XML corrompido ou que não é uma NF-e, **quando** o sistema tenta extrair os dados, **então** exibe alerta explicando o motivo da falha e oferece o cadastro manual da despesa.
- [ ] **CA8 — Dado** que a importação confirmada faz uma categoria passar do teto orçado, **quando** a gravação conclui, **então** a despesa é gravada normalmente e o painel de orçamento mostra a categoria como estourada.
- [ ] **CA9 — Dado** que a confirmação falha em qualquer etapa (linhas, pagamento, fornecedor ou comprovante), **quando** a falha ocorre, **então** nada é gravado: a operação é atômica e uma nova tentativa não duplica nem deixa linhas parciais.
- [ ] **CA10 — Dado** que uma requisição tenta importar XML em obra de outro proprietário, ou em obra excluída, **quando** é executada, **então** o sistema responde que a obra não foi localizada (404), sem gravar nada e sem expor a existência da obra.
- [ ] **CA11 — Dado** que o proprietário confirma a importação e clica duas vezes no botão, **quando** o segundo clique chega enquanto o primeiro ainda processa, **então** somente uma importação é gravada.

## Fora de escopo

- Consulta remota de NF-e por chave (SEFAZ ou provedor fiscal externo). Digitar a chave valida formato e dígito verificador; a busca dos itens fica para a Fase 2.
- Detecção de nota cancelada. Com XML, o sistema não sabe se a nota foi cancelada na SEFAZ.
- NFS-e (nota de serviço) e emissão de notas.
- Importação de vários XMLs de uma vez (lote).
- Edição dos itens importados como grupo. Cada linha continua editável pela tela de despesas (US04).
- Banco de preços colaborativo alimentado por NF-e.

## Abandono no meio

- **Fechar a aba ou o diálogo antes de confirmar:** nada é gravado; o XML enviado é descartado da memória (CA3, CA9).
- **Rede cai durante a confirmação:** a gravação é atômica. Se a resposta nunca chega, o usuário não vê sucesso e pode consultar a lista de despesas; uma nova tentativa é bloqueada pela trava de chave (CA5, CA9).
- **Clique repetido no botão de confirmar:** o envio fica bloqueado durante o processamento (CA11).
- **Sessão expira no meio da importação:** segue o fluxo de login existente; nada é gravado parcialmente (CA9).
- **Troca de obra com a conferência aberta:** o diálogo é fechado e a resposta antiga é descartada, sem gravar na obra anterior (CA10).
- **Serviço de extração/parse demora ou falha:** o usuário recebe o motivo e pode cadastrar manualmente (CA7).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| Nota cancelada não é detectada offline; o XML é aceito como válido | Fase 2 (consulta SEFAZ) — a abrir |
| Consulta remota por chave não existe nesta entrega | Fase 2 — a abrir |

<!-- Cada linha desta tabela precisa de um `// TODO #<issue>` no código que depende dela. -->

## Depende de

- US14 — Obra ativa selecionada (ambiente de obra e troca de obra).
- US03 — Cadastro de despesas (`expenses`, `suppliers`, `pending_payments`, comprovantes da US04).
- Categorias pré-definidas (V7).

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
| 1 | Digitar uma chave válida, sem XML: o sistema pede o XML e não grava nada, ou aceita a chave como referência? | Autor |
| 2 | Se a primeira linha da nota (que carrega o pagamento e o XML) for excluída, o que acontece? Bloquear a exclusão, ou transferir pagamento e comprovante para a próxima linha? | Autor |
| 3 | Linhas excluídas (soft delete) liberam a chave para uma nova importação, como sugere o índice parcial da `nfe_key`? | Autor |
| 4 | O PRD pede tratamento de nota cancelada (CA5 da história). Sem consulta à SEFAZ isso não é verificável. Aceita deixar essa parte fora desta entrega? | Autor |
| 5 | Se o XML trouxer um CNPJ que já existe com razão social diferente, usa o fornecedor existente (CA4) mesmo assim? | Autor |
| 6 | Qual o limite de tamanho e o formato aceito para o XML (ex.: até 2 MB, somente `.xml`)? | Autor |
