package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.dto.budget.SinapiReferencesDTO;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import com.obracerta.service.SidraClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CA3 e CA4 no PostgreSQL real: confirmação do lote SINAPI, com o SIDRA mockado e o banco
 * de verdade. A concorrência e o rollback dependem do índice único parcial e do comportamento
 * do PostgreSQL, por isso não usam H2.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class BudgetSinapiConfirmationIntegrationTest {

    private static final String PATH = "/api/budgets/%s/sinapi/confirm";
    private static final String FINISH_ID = "787";
    private static final String SIDRA_UF = "41";
    private static final String SIDRA_MONTH = "202609";
    private static final String SIDRA_PROJECT = "7090";
    private static final BigDecimal UNIT_COST = new BigDecimal("2221.06");
    private static final BigDecimal AREA = new BigDecimal("100");
    private static final String FUNDACAO = "Fundação e Estrutura";
    private static final String ALVENARIA = "Alvenaria";
    private static final String ELETRICA = "Elétrica";
    private static final String MAO_DE_OBRA = "Mão de Obra";
    private static final String TAXAS = "Taxas e Serviços";

    /** Tabela inicial de percentuais do PRD (US15), na ordem exigida pelo servidor. */
    private static final List<String> PRD_NAMES = List.of(
            FUNDACAO, ALVENARIA, ELETRICA, "Hidráulica", "Telhado e Cobertura",
            "Esquadrias e Vidros", "Acabamento e Pintura", MAO_DE_OBRA, TAXAS);
    private static final List<String> PRD_PERCENTS = List.of("25", "14", "8", "9", "10", "10", "24", "0", "0");

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataSource dataSource;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @MockBean private UserContextHelper identity;
    @MockBean private SidraClient sidra;
    @MockitoSpyBean private BudgetRepository budgets;

    private final ObjectMapper json = new ObjectMapper();
    private final List<String> createdUserIds = new ArrayList<>();
    private final List<String> createdProjectIds = new ArrayList<>();
    private User owner;
    private Project project;
    private Map<String, ExpenseCategory> byName;

    @BeforeEach
    void setUp() {
        owner = newUser();
        project = newProject(owner);
        byName = categories.findAll().stream()
                .collect(Collectors.toMap(ExpenseCategory::getName, Function.identity()));
        assertThat(byName.keySet()).containsAll(PRD_NAMES);
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        serveCost(UNIT_COST);
        clearInvocations(sidra);
    }

    @AfterEach
    void removeOnlyTheFixtures() {
        for (String projectId : createdProjectIds) {
            jdbc.update("delete from pending_payments where expense_id in "
                    + "(select id from expenses where project_id = ?)", projectId);
            jdbc.update("delete from expenses where project_id = ?", projectId);
            jdbc.update("delete from budgets where project_id = ?", projectId);
            jdbc.update("delete from projects where id = ?", projectId);
        }
        for (String userId : createdUserIds) {
            jdbc.update("delete from suppliers where user_id = ?", userId);
            users.deleteById(userId);
        }
    }

    @Test
    void gravaTetosSomenteDasCategoriasComParcelaPositiva() throws Exception {
        confirm(project, UNIT_COST, AREA, prdShares()).andExpect(status().isOk());

        assertThat(activeBudgets(project)).hasSize(7)
                .containsKeys(byName.get(FUNDACAO).getId(), byName.get(ALVENARIA).getId());
        assertThat(activeBudgets(project).get(byName.get(FUNDACAO).getId()))
                .isEqualByComparingTo("55526.50");
        assertThat(activeBudgets(project)).doesNotContainKeys(
                byName.get(MAO_DE_OBRA).getId(), byName.get(TAXAS).getId());
    }

    @Test
    void custoAlteradoDesdeAPreviaRetorna409SemGravarNada() throws Exception {
        serveCost(new BigDecimal("2300.00"));

        confirm(project, UNIT_COST, AREA, prdShares())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("nova prévia")));

        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void obraAlheiaOuInexistenteRetorna404SemConsultarSidraNemGravar() throws Exception {
        User stranger = newUser();
        Project foreign = newProject(stranger);

        confirm(foreign, UNIT_COST, AREA, prdShares()).andExpect(status().isNotFound());
        mvc.perform(post(String.format(PATH, "inexistente")).contentType("application/json")
                        .content(confirmBody(UNIT_COST, AREA, prdShares())))
                .andExpect(status().isNotFound());

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(foreign)).isEmpty();
    }

    @Test
    void tetoAtivoComValorZeroFicaPreservadoSemSobrescrever() throws Exception {
        String alvenariaId = insertBudget(project, byName.get(ALVENARIA).getId(), "0.00");

        confirm(project, UNIT_COST, AREA, prdShares())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preserved[0].categoryName").value(ALVENARIA));

        assertThat(activeBudgets(project).get(byName.get(ALVENARIA).getId())).isEqualByComparingTo("0.00");
        assertThat(countActive(project, byName.get(ALVENARIA).getId())).isOne();
        assertThat(jdbc.queryForObject("select id from budgets where project_id = ? and category_id = ? and deleted_at is null",
                String.class, project.getId(), byName.get(ALVENARIA).getId())).isEqualTo(alvenariaId);
    }

    @Test
    void parcelaZeroNaoCriaTeto() throws Exception {
        List<Pct> shares = List.of(
                new Pct(byName.get(FUNDACAO).getId(), "25"), new Pct(byName.get(ALVENARIA).getId(), "14"),
                new Pct(byName.get(ELETRICA).getId(), "0"), new Pct(byName.get("Hidráulica").getId(), "9"),
                new Pct(byName.get("Telhado e Cobertura").getId(), "10"),
                new Pct(byName.get("Esquadrias e Vidros").getId(), "10"),
                new Pct(byName.get("Acabamento e Pintura").getId(), "24"),
                new Pct(byName.get(MAO_DE_OBRA).getId(), "8"), new Pct(byName.get(TAXAS).getId(), "0"));

        confirm(project, UNIT_COST, AREA, shares).andExpect(status().isOk());

        assertThat(activeBudgets(project)).doesNotContainKey(byName.get(ELETRICA).getId())
                .doesNotContainKey(byName.get(TAXAS).getId())
                .containsKey(byName.get(MAO_DE_OBRA).getId());
    }

    @Test
    void repeticaoDaConfirmacaoConcluidaPreservaTetosSemDuplicar() throws Exception {
        confirm(project, UNIT_COST, AREA, prdShares()).andExpect(status().isOk());
        Map<String, BigDecimal> first = activeBudgets(project);

        confirm(project, UNIT_COST, AREA, prdShares())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created.length()").value(0))
                .andExpect(jsonPath("$.preserved.length()").value(7));

        assertThat(activeBudgets(project)).isEqualTo(first);
        assertThat(jdbc.queryForObject("select count(*) from budgets where project_id = ? and deleted_at is null",
                Long.class, project.getId())).isEqualTo(7L);
    }

    @Test
    void ordemForaDoPrdRetorna400SemGravar() throws Exception {
        List<Pct> swapped = new ArrayList<>(prdShares());
        Pct fundacao = swapped.get(0);
        swapped.set(0, swapped.get(1));
        swapped.set(1, fundacao);

        confirm(project, UNIT_COST, AREA, swapped).andExpect(status().isBadRequest());

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void custoNegativoRetorna400AntesDoBanco() throws Exception {
        confirm(project, new BigDecimal("-1"), AREA, prdShares())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("unitCost"));

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void percentuaisInvalidosRetorna400SemGravar() throws Exception {
        List<Pct> duplicated = new ArrayList<>(prdShares());
        duplicated.set(1, new Pct(byName.get(FUNDACAO).getId(), "14"));
        List<Pct> sumNot100 = new ArrayList<>(prdShares());
        sumNot100.set(0, new Pct(byName.get(FUNDACAO).getId(), "26"));
        List<Pct> negative = new ArrayList<>(prdShares());
        negative.set(0, new Pct(byName.get(FUNDACAO).getId(), "-25"));
        negative.set(1, new Pct(byName.get(ALVENARIA).getId(), "39"));

        for (List<Pct> shares : List.of(duplicated, sumNot100, negative)) {
            confirm(project, UNIT_COST, AREA, shares).andExpect(status().isBadRequest());
        }

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void custoUnitarioAcimaDoLimiteRetorna400SemConsultarSidraNemGravar() throws Exception {
        confirm(project, new BigDecimal("1E17"), BigDecimal.ONE, prdShares())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("limite")));

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void totalAcimaDoNumeric15_2Retorna400SemConsultarSidraNemGravar() throws Exception {
        confirm(project, new BigDecimal("10000000000000"), BigDecimal.ONE, prdShares())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("limite")));

        verifyNoInteractions(sidra);
        assertThat(activeBudgets(project)).isEmpty();
    }

    @Test
    void falhaNoMeioDoLoteRevertTodosOsTetosNovos() {
        // Fundação é gravada primeiro; a inserção de Alvenaria falha e o lote inteiro deve voltar.
        doThrow(new IllegalStateException("falha simulada na gravação"))
                .when(budgets).insertIfAbsent(anyString(), anyString(), anyString(),
                        eq(byName.get(ALVENARIA).getId()), any());

        assertThatThrownBy(() -> confirm(project, UNIT_COST, AREA, prdShares()))
                .hasMessageContaining("falha simulada na gravação");

        assertThat(activeBudgets(project))
                .as("o teto de Fundação foi inserido antes da falha e precisa ser revertido")
                .isEmpty();
    }

    @Test
    void duasConfirmacoesSimultaneasDaMesmaObraGravamUmConjuntoSemDuplicata() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try (Connection blocker = dataSource.getConnection()) {
            blocker.setAutoCommit(false);
            // Uma conexão independente segura o teto de Fundação sem commit, forçando as duas
            // confirmações a esperar no índice único parcial da obra e categoria.
            try (PreparedStatement insert = blocker.prepareStatement("""
                    insert into budgets (id, user_id, project_id, category_id, estimated_amount, created_at, updated_at)
                    values (?, ?, ?, ?, 0.00, now(), now())
                    """)) {
                insert.setString(1, UUID.randomUUID().toString());
                insert.setString(2, owner.getId());
                insert.setString(3, project.getId());
                insert.setString(4, byName.get(FUNDACAO).getId());
                insert.executeUpdate();
            }

            String body = confirmBody(UNIT_COST, AREA, prdShares());
            CountDownLatch start = new CountDownLatch(1);
            Future<Integer> first = pool.submit(() -> send(body, start));
            Future<Integer> second = pool.submit(() -> send(body, start));
            start.countDown();

            awaitTwoSessionsWaitingOnTheBudgetRow();
            blocker.rollback();

            assertThat(first.get(15, TimeUnit.SECONDS)).isEqualTo(200);
            assertThat(second.get(15, TimeUnit.SECONDS)).isEqualTo(200);
        } finally {
            pool.shutdownNow();
        }

        assertThat(activeBudgets(project)).hasSize(7);
        assertThat(jdbc.queryForObject("""
                select count(*) from (select category_id from budgets
                where project_id = ? and deleted_at is null group by category_id having count(*) > 1) d
                """, Long.class, project.getId())).isZero();
    }

    // ---- auxiliares -------------------------------------------------------------------

    private int send(String body, CountDownLatch start) throws Exception {
        start.await();
        return mvc.perform(post(String.format(PATH, project.getId())).contentType("application/json").content(body))
                .andReturn().getResponse().getStatus();
    }

    private void awaitTwoSessionsWaitingOnTheBudgetRow() {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(15);
        int waiting;
        do {
            waiting = jdbc.queryForObject("""
                    select count(*) from pg_stat_activity
                    where datname = current_database()
                      and wait_event_type = 'Lock'
                      and pid <> pg_backend_pid()
                    """, Integer.class);
            if (waiting >= 2) return;
            try {
                Thread.sleep(20);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                fail("interrompido enquanto aguardava as sessões");
            }
        } while (System.nanoTime() < deadline);
        fail("As duas confirmações deveriam esperar no índice da obra, mas apenas "
                + waiting + " sessão(ões) aguarda(m) lock.");
    }

    private void serveCost(BigDecimal cost) {
        when(sidra.getFinishes(eq(SIDRA_UF), eq(SIDRA_MONTH), eq(SIDRA_PROJECT)))
                .thenReturn(List.of(new SinapiReferencesDTO.Finish(FINISH_ID, "Normal", cost)));
    }

    private List<Pct> prdShares() {
        List<Pct> shares = new ArrayList<>();
        for (int index = 0; index < PRD_NAMES.size(); index++) {
            shares.add(new Pct(byName.get(PRD_NAMES.get(index)).getId(), PRD_PERCENTS.get(index)));
        }
        return shares;
    }

    private org.springframework.test.web.servlet.ResultActions confirm(
            Project target, BigDecimal unitCost, BigDecimal area, List<Pct> shares) throws Exception {
        return mvc.perform(post(path(target)).contentType("application/json")
                .content(confirmBody(unitCost, area, shares)));
    }

    private String confirmBody(BigDecimal unitCost, BigDecimal area, List<Pct> shares) throws Exception {
        List<Map<String, Object>> percentages = new ArrayList<>();
        for (Pct share : shares) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("categoryId", share.categoryId());
            entry.put("percentage", new BigDecimal(share.percentage()));
            percentages.add(entry);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("uf", "PR");
        body.put("month", "2026-09");
        body.put("projectType", SIDRA_PROJECT);
        body.put("finishId", FINISH_ID);
        body.put("area", area);
        body.put("unitCost", unitCost);
        body.put("percentages", percentages);
        return json.writeValueAsString(body);
    }

    private String path(Project target) {
        return String.format(PATH, target.getId());
    }

    private Map<String, BigDecimal> activeBudgets(Project target) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        jdbc.query("select category_id, estimated_amount from budgets where project_id = ? and deleted_at is null",
                rs -> {
                    result.put(rs.getString("category_id"), rs.getBigDecimal("estimated_amount"));
                }, target.getId());
        return result;
    }

    private long countActive(Project target, String categoryId) {
        return jdbc.queryForObject("select count(*) from budgets where project_id = ? and category_id = ? and deleted_at is null",
                Long.class, target.getId(), categoryId);
    }

    private String insertBudget(Project target, String categoryId, String amount) {
        String id = UUID.randomUUID().toString();
        jdbc.update("insert into budgets (id, user_id, project_id, category_id, estimated_amount, created_at, updated_at) "
                + "values (?, ?, ?, ?, ?::numeric, now(), now())",
                id, owner.getId(), target.getId(), categoryId, amount);
        return id;
    }

    private User newUser() {
        User user = users.saveAndFlush(User.builder().name("Proprietário")
                .email("sinapi-confirm-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build());
        createdUserIds.add(user.getId());
        return user;
    }

    private Project newProject(User user) {
        Project created = projects.saveAndFlush(Project.builder().user(user).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        createdProjectIds.add(created.getId());
        return created;
    }

    private record Pct(String categoryId, String percentage) {
    }
}
