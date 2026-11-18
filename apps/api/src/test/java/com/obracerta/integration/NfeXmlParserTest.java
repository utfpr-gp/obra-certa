package com.obracerta.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.obracerta.exception.NfeInvalidXmlException;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class NfeXmlParserTest {

    private static final String PROJECT_ID = "project-1";
    private static final String ACCESS_KEY = "35261012345678000190550010000000011000000012";
    private static final String DH_EMI = "2026-10-15T10:30:00-03:00";
    private static final String DET_VALIDO = det("1", "10.0000", "32.5000", "325.00");

    private final NfeXmlParser parser = new NfeXmlParser();

    @Test
    void extraiChaveFornecedorDataEItensDeUmaNfeValida() throws IOException {
        NfePreviewResponseDTO preview = parser.parse(PROJECT_ID, lerFixture("nfe-valida.xml"));

        assertThat(preview.projectId()).isEqualTo(PROJECT_ID);
        assertThat(preview.accessKey()).isEqualTo(ACCESS_KEY);
        assertThat(preview.issueDate()).isEqualTo(LocalDate.of(2026, 10, 15));
        assertThat(preview.supplier().name()).isEqualTo("Construções Exemplo Materiais Ltda");
        assertThat(preview.supplier().document()).isEqualTo("12345678000190");

        assertThat(preview.items()).hasSize(2);
        NfePreviewResponseDTO.Item primeiro = preview.items().get(0);
        assertThat(primeiro.itemNumber()).isEqualTo(1);
        assertThat(primeiro.description()).isEqualTo("Cimento CP-II 50kg");
        assertThat(primeiro.quantity()).isEqualByComparingTo(new BigDecimal("10"));
        assertThat(primeiro.unit()).isEqualTo("SC");
        assertThat(primeiro.unitPrice()).isEqualByComparingTo(new BigDecimal("32.5"));
        assertThat(primeiro.totalPrice()).isEqualByComparingTo(new BigDecimal("325.00"));

        NfePreviewResponseDTO.Item segundo = preview.items().get(1);
        assertThat(segundo.itemNumber()).isEqualTo(2);
        assertThat(segundo.description()).isEqualTo("Areia média lavada");
        assertThat(segundo.totalPrice()).isEqualByComparingTo(new BigDecimal("300.00"));

        assertThat(preview.total()).isEqualByComparingTo(new BigDecimal("625.00"));
    }

    @Test
    void recusaXmlCorrompidoComMotivo() throws IOException {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID, lerFixture("nfe-corrompida.xml")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaXmlDeOutroDocumentoFiscalComMotivo() throws IOException {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID, lerFixture("nfe-outro-documento.xml")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("não é NF-e");
    }

    @Test
    void recusaXmlComDoctypeComMotivo() throws IOException {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID, lerFixture("nfe-xxe.xml")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void recusaDoctypeMesmoQuandoOXmlEhBemFormado() {
        byte[] xml = comDoctype(nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO), "<!DOCTYPE nfeProc>");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void entidadeExternaComDoctypeEhRecusadaSemSerResolvida() {
        byte[] xml = comDoctype(
                nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO.replace("<xProd>Cimento</xProd>", "<xProd>&xxe;</xProd>")),
                "<!DOCTYPE nfeProc [<!ENTITY xxe SYSTEM \"file:///caminho/inexistente/segredo.txt\">]>");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void dtdExternoEhRecusadoSemAcessoExterno() {
        byte[] xml = comDoctype(
                nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO),
                "<!DOCTYPE nfeProc SYSTEM \"file:///caminho/inexistente/nfe.dtd\">");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void recusaEntidadesAninhadasComDoctype() throws IOException {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID, lerFixture("nfe-entidades-aninhadas.xml")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void recusaChaveComQuarentaETresDigitos() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY.substring(0, 43)), DH_EMI, DET_VALIDO)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("44 dígitos");
    }

    @Test
    void recusaChaveComQuarentaECincoDigitos() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY + "0"), DH_EMI, DET_VALIDO)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("44 dígitos");
    }

    @Test
    void recusaChaveComLetra() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY.substring(0, 43) + "A"), DH_EMI, DET_VALIDO)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("44 dígitos");
    }

    @Test
    void recusaNItemNaoNumerico() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, det("abc", "10.0000", "32.5000", "325.00"))))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaQComNaoNumerico() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, det("1", "dez", "32.5000", "325.00"))))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaVUnComNaoNumerico() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, det("1", "10.0000", "trinta", "325.00"))))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaVProdNaoNumerico() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, det("1", "10.0000", "32.5000", "xx"))))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaDhEmiInvalida() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), "15/10/2026", DET_VALIDO)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaNfeSemItens() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, "")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaInfNfeSemId() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml("", DH_EMI, DET_VALIDO)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaRaizSemNamespaceDaNfe() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <nfeProc versao="4.00"><NFe><infNFe Id="NFe%s"/></NFe></nfeProc>
                """.formatted(ACCESS_KEY);

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("não é NF-e");
    }

    @Test
    void recusaNfeProcSemElementoNFe() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><protNFe versao="4.00"/></nfeProc>
                """;

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("não é NF-e");
    }

    @Test
    void recusaRaizNfeQueNaoEhNfeProcNemNfe() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <outroDoc xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe%s"/></outroDoc>
                """.formatted(ACCESS_KEY);

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("não é NF-e");
    }

    @Test
    void recusaNFeSemInfNFe() {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <NFe xmlns="http://www.portalfiscal.inf.br/nfe"><ide><dhEmi>%s</dhEmi></ide></NFe>
                """.formatted(DH_EMI);

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("não é NF-e");
    }

    @Test
    void recusaNfeSemEmitente() {
        byte[] xml = semFragmento(nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO),
                "<emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor</xNome></emit>");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaNfeSemIde() {
        byte[] xml = semFragmento(nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO),
                "<ide><dhEmi>" + DH_EMI + "</dhEmi></ide>");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaItemSemProd() {
        assertThatThrownBy(() -> parser.parse(PROJECT_ID,
                nfeXml(idValido(ACCESS_KEY), DH_EMI, "<det nItem=\"1\"><cProd>001</cProd></det>")))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    @Test
    void recusaProdSemXProd() {
        byte[] xml = semFragmento(nfeXml(idValido(ACCESS_KEY), DH_EMI, DET_VALIDO), "<xProd>Cimento</xProd>");

        assertThatThrownBy(() -> parser.parse(PROJECT_ID, xml))
                .isInstanceOf(NfeInvalidXmlException.class)
                .hasMessageContaining("corrompido");
    }

    private static byte[] semFragmento(byte[] xml, String fragmento) {
        String original = new String(xml, StandardCharsets.UTF_8);
        assertThat(original).contains(fragmento);
        return original.replace(fragmento, "").getBytes(StandardCharsets.UTF_8);
    }

    private static String idValido(String chave) {
        return "Id=\"NFe" + chave + "\"";
    }

    private static String det(String nItem, String qCom, String vUnCom, String vProd) {
        return """
                <det nItem="%s"><prod><cProd>001</cProd><xProd>Cimento</xProd><uCom>SC</uCom><qCom>%s</qCom><vUnCom>%s</vUnCom><vProd>%s</vProd></prod></det>
                """.formatted(nItem, qCom, vUnCom, vProd);
    }

    private static byte[] nfeXml(String atributosInfNFe, String dhEmi, String dets) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
                  <NFe>
                    <infNFe %s versao="4.00">
                      <ide><dhEmi>%s</dhEmi></ide>
                      <emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor</xNome></emit>
                      %s
                    </infNFe>
                  </NFe>
                </nfeProc>
                """.formatted(atributosInfNFe, dhEmi, dets).getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] comDoctype(byte[] xml, String declaracao) {
        return new String(xml, StandardCharsets.UTF_8)
                .replace("<nfeProc", declaracao + "\n<nfeProc")
                .getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] lerFixture(String nome) throws IOException {
        try (InputStream in = NfeXmlParserTest.class.getResourceAsStream("/nfe/" + nome)) {
            assertThat(in).as("fixture %s", nome).isNotNull();
            return in.readAllBytes();
        }
    }
}
