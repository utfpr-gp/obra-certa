import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ExpenseCategory } from '../models/expense-category.model';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpTesting: HttpTestingController;

  const categories: ExpenseCategory[] = [
    { id: 'cat-alvenaria', name: 'Alvenaria' },
    { id: 'cat-eletrica', name: 'Elétrica' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('reads the category catalog from the API', () => {
    service.getCategories().subscribe((response) => {
      expect(response).toEqual(categories);
    });

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/api/expense-categories`,
    );
    expect(request.request.method).toBe('GET');
    request.flush(categories);
  });
});
