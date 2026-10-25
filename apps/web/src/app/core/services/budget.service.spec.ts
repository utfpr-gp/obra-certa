import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BudgetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

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
});
