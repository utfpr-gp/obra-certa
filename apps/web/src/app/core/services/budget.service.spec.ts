import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BudgetCategory, BudgetOverview } from '../models/budget.model';
import { BudgetService } from './budget.service';

describe('BudgetService', () => {
  let service: BudgetService;
  let httpTesting: HttpTestingController;

  const overview: BudgetOverview = {
    projectId: 'project-1',
    totalPlanned: 1500,
    totalSpent: 850,
    available: 650,
    globalPercentage: 56.7,
    exceededCategories: 1,
    budgetedCategories: 2,
    categories: [],
  };

  const updatedCategory: BudgetCategory = {
    categoryId: 'cat-alvenaria',
    categoryName: 'Alvenaria',
    plannedAmount: 1500,
    spentAmount: 200,
    balanceAmount: 1300,
    percentage: 13.3,
    state: 'ON_TRACK',
    hasBudget: true,
  };

  const zeroedCategory: BudgetCategory = {
    categoryId: 'cat-alvenaria',
    categoryName: 'Alvenaria',
    plannedAmount: 0,
    spentAmount: 200,
    balanceAmount: -200,
    percentage: null,
    state: 'NO_BUDGET',
    hasBudget: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BudgetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests references for the selected work and SINAPI dimensions', () => {
    const references = { source: 'SIDRA/IBGE', finishes: [{ id: '787', name: 'Normal', unitCost: 2221.06 }] };
    service.getSinapiReferences('project-1', 'PR', '2026-09', '7090').subscribe(result => {
      expect(result).toEqual(references);
    });

    const request = httpTesting.expectOne({
      method: 'GET',
      url: `${environment.apiUrl}/api/budgets/project-1/sinapi/references?uf=PR&month=2026-09&projectType=7090`,
    });
    request.flush(references);
  });

  for (const operation of ['read', 'save', 'zero'] as const) {
    for (const failure of ['error', 'timeout', 'server'] as const) {
      it(`preserves the ${failure} status and payload from ${operation}`, () => {
        const source: Observable<BudgetCategory | BudgetOverview> = operation === 'read' ? service.getOverview('project-1')
          : operation === 'save'
            ? service.setBudget('project-1', 'cat-alvenaria', { estimatedAmount: 1500 })
            : service.zeroBudget('project-1', 'cat-alvenaria');
        let received: HttpErrorResponse | undefined;
        source.subscribe({ next: () => fail('Expected an error'), error: (error) => received = error });
        const request = httpTesting.expectOne(() => true);
        const payload = failure === 'server'
          ? { status: 503, message: 'Unavailable', fieldErrors: [] }
          : new ProgressEvent(failure);
        if (payload instanceof ProgressEvent) request.error(payload);
        else request.flush(payload, { status: 503, statusText: 'Service Unavailable' });
        expect(received instanceof HttpErrorResponse).toBeTrue();
        expect(received?.status).toBe(failure === 'server' ? 503 : 0);
        expect(received?.error).toBe(payload);
      });
    }
  }

  it('ends a SINAPI lookup without response at 15 seconds with a retryable error', fakeAsync(() => {
    let failure: unknown;
    service.getSinapiReferences('project-1', 'PR', '2026-09', '7090').subscribe({
      error: (error) => { failure = error; },
    });
    const req = httpTesting.expectOne(() => true);
    tick(14999);
    expect(failure).toBeUndefined();
    tick(1);
    expect(failure).toBeInstanceOf(TimeoutError);
    expect(req.cancelled).toBeTrue();
    httpTesting.expectNone(() => true);
  }));

  it('reads the overview with projectId as a query parameter', () => {
    service.getOverview('project-1').subscribe((response) => {
      expect(response).toEqual(overview);
    });

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === `${environment.apiUrl}/api/budgets`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('projectId')).toBe('project-1');
    expect(request.request.body).toBeNull();
    request.flush(overview);
  });

  it('upserts the category budget with a PUT and returns the recalculated category', () => {
    service
      .setBudget('project-1', 'cat-alvenaria', { estimatedAmount: 1500 })
      .subscribe((response) => {
        expect(response).toEqual(updatedCategory);
      });

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/api/budgets/project-1/categories/cat-alvenaria`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ estimatedAmount: 1500 });
    expect(request.request.params.keys()).toEqual([]);
    request.flush(updatedCategory);
  });

  it('confirms the SINAPI batch with a POST and returns the created and preserved categories', () => {
    const body = {
      uf: 'PR',
      month: '2026-09',
      projectType: '7090',
      finishId: '787',
      area: 100,
      unitCost: 2221.06,
      percentages: [{ categoryId: 'cat-fundacao', percentage: 25 }],
    };
    const result = {
      created: [{ categoryId: 'cat-fundacao', categoryName: 'Fundação e Estrutura', amount: 55526.5 }],
      preserved: [{ categoryId: 'cat-alvenaria', categoryName: 'Alvenaria' }],
    };
    service.confirmSinapi('project-1', body).subscribe((response) => {
      expect(response).toEqual(result);
    });

    const request = httpTesting.expectOne(`${environment.apiUrl}/api/budgets/project-1/sinapi/confirm`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.params.keys()).toEqual([]);
    request.flush(result);
  });

  it('zeroes the category budget with a POST to the /zero action and returns the recalculated category', () => {
    service.zeroBudget('project-1', 'cat-alvenaria').subscribe((response) => {
      expect(response).toEqual(zeroedCategory);
    });

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/api/budgets/project-1/categories/cat-alvenaria/zero`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.params.keys()).toEqual([]);
    request.flush(zeroedCategory);
  });
});
