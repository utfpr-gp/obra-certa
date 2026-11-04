package com.obracerta.service;

import com.obracerta.exception.NfeInvalidXmlException;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

@Service
public class NfeXmlParser {

    private static final String NFE_NAMESPACE = "http://www.portalfiscal.inf.br/nfe";
    private static final String ID_PREFIX = "NFe";

    private static final String MSG_CORROMPIDO = "O arquivo XML está corrompido ou incompleto";
    private static final String MSG_NAO_NFE = "O arquivo não é NF-e (nota fiscal eletrônica de produtos)";
    private static final String MSG_DOCTYPE = "O XML contém DOCTYPE, que não é aceito por segurança";
    private static final String MSG_CHAVE = "A chave de acesso deve ter 44 dígitos numéricos";

    public NfePreviewResponseDTO parse(String projectId, byte[] xml) {
        Element infNFe = localizarInfNFe(lerDocumento(xml).getDocumentElement());
        try {
            String accessKey = chave(infNFe);
            Element emit = filho(infNFe, "emit");
            Element ide = filho(infNFe, "ide");

            List<NfePreviewResponseDTO.Item> items = new ArrayList<>();
            for (Element det : filhos(infNFe, "det")) {
                Element prod = filho(det, "prod");
                items.add(new NfePreviewResponseDTO.Item(
                        Integer.parseInt(det.getAttribute("nItem")),
                        texto(prod, "xProd"),
                        new BigDecimal(texto(prod, "qCom")),
                        texto(prod, "uCom"),
                        new BigDecimal(texto(prod, "vUnCom")),
                        new BigDecimal(texto(prod, "vProd"))));
            }
            if (items.isEmpty()) {
                throw new NfeInvalidXmlException(MSG_CORROMPIDO);
            }

            BigDecimal total = items.stream()
                    .map(NfePreviewResponseDTO.Item::totalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return new NfePreviewResponseDTO(
                    projectId,
                    accessKey,
                    OffsetDateTime.parse(texto(ide, "dhEmi")).toLocalDate(),
                    new NfePreviewResponseDTO.Supplier(texto(emit, "xNome"), texto(emit, "CNPJ")),
                    items,
                    total);
        } catch (NumberFormatException | DateTimeParseException e) {
            throw new NfeInvalidXmlException(MSG_CORROMPIDO);
        }
    }

    private static Document lerDocumento(byte[] xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setExpandEntityReferences(false);
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml));
            if (doc.getDoctype() != null) {
                throw new NfeInvalidXmlException(MSG_DOCTYPE);
            }
            return doc;
        } catch (SAXException e) {
            throw new NfeInvalidXmlException(MSG_CORROMPIDO);
        } catch (IOException e) {
            throw new NfeInvalidXmlException(MSG_CORROMPIDO);
        } catch (ParserConfigurationException e) {
            throw new IllegalStateException("Parser XML indisponível", e);
        }
    }

    private static Element localizarInfNFe(Element raiz) {
        if (!NFE_NAMESPACE.equals(raiz.getNamespaceURI())) {
            throw new NfeInvalidXmlException(MSG_NAO_NFE);
        }
        Element nfe = switch (raiz.getLocalName()) {
            case "nfeProc" -> filhoOuNull(raiz, "NFe");
            case "NFe" -> raiz;
            default -> null;
        };
        Element infNFe = nfe == null ? null : filhoOuNull(nfe, "infNFe");
        if (infNFe == null) {
            throw new NfeInvalidXmlException(MSG_NAO_NFE);
        }
        return infNFe;
    }

    private static String chave(Element infNFe) {
        String id = infNFe.getAttribute("Id");
        if (!id.startsWith(ID_PREFIX)) {
            throw new NfeInvalidXmlException(MSG_CORROMPIDO);
        }
        String chave = id.substring(ID_PREFIX.length());
        if (!chave.matches("[0-9]{44}")) {
            throw new NfeInvalidXmlException(MSG_CHAVE);
        }
        return chave;
    }

    private static String texto(Element pai, String nome) {
        return filho(pai, nome).getTextContent().trim();
    }

    private static Element filho(Element pai, String nome) {
        Element encontrado = filhoOuNull(pai, nome);
        if (encontrado == null) {
            throw new NfeInvalidXmlException(MSG_CORROMPIDO);
        }
        return encontrado;
    }

    private static Element filhoOuNull(Element pai, String nome) {
        List<Element> encontrados = filhos(pai, nome);
        return encontrados.isEmpty() ? null : encontrados.get(0);
    }

    private static List<Element> filhos(Element pai, String nome) {
        List<Element> resultado = new ArrayList<>();
        for (Node n = pai.getFirstChild(); n != null; n = n.getNextSibling()) {
            if (n instanceof Element e
                    && NFE_NAMESPACE.equals(e.getNamespaceURI())
                    && nome.equals(e.getLocalName())) {
                resultado.add(e);
            }
        }
        return resultado;
    }
}
