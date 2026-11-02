import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { Auth } from '../../core/services/auth';
import { ProjectService } from '../../core/services/project.service';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { environment } from '../../../environments/environment';
import { ExpenseFormComponent } from './expense-form.component';

describe('Accounts navigation', () => {
  describe('registration header return', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
        provideHttpClientTesting(),
        {provide: Auth, useValue: {isAuthenticated: () => true, getToken: () => null}},
        {provide: ProjectService, useValue: {getProjects: () => of([])}}]});
    });

    it('returns from direct registration without a project while options are loading', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/contas/nova');
      const http = TestBed.inject(HttpTestingController);
      const categories = http.expectOne(`${environment.apiUrl}/api/expense-categories`);
      const suppliers = http.expectOne(`${environment.apiUrl}/api/suppliers`);
      const back = harness.routeNativeElement?.querySelector('header [data-testid="back-to-accounts"]') as HTMLAnchorElement;
      expect(back).not.toBeNull();
      if (!back) return;
      expect(back.textContent?.trim()).toBe('Voltar');
      expect(back.getAttribute('href')).toBe('/contas');
      expect(back.closest('form')).toBeNull();
      expect(back.classList.contains('btn-oc-outline')).toBeTrue();
      expect(back.classList.contains('h-11')).toBeTrue();
      expect(back.classList.contains('min-h-11')).toBeTrue();
      expect(back.classList.contains('px-3')).toBeTrue();
      expect(back.classList.contains('py-2')).toBeTrue();
      expect(back.classList.contains('text-xs')).toBeTrue();
      expect(back.closest('header')?.classList.contains('flex-wrap')).toBeTrue();
      back.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/contas');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Contas a Pagar');
      expect(categories.cancelled).toBeTrue();
      expect(suppliers.cancelled).toBeTrue();
      http.expectNone(request => request.url === `${environment.apiUrl}/api/expenses`);
      http.verify();
    });

    it('returns with a valid filled form without saving and queries the accounts list', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/contas/nova');
      TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',
        status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''}, 'owner');
      harness.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      http.expectOne(`${environment.apiUrl}/api/expense-categories`).flush([{id:'category',name:'Material',type:'MATERIAL'}]);
      http.expectOne(`${environment.apiUrl}/api/suppliers`).flush([{id:'supplier',name:'Loja',document:null}]);
      http.expectOne(`${environment.apiUrl}/api/budgets?projectId=project`).flush({projectId:'project',categories:[]});
      const component = harness.fixture.debugElement.query(By.directive(ExpenseFormComponent)).componentInstance as ExpenseFormComponent;
      component.form.patchValue({description:'Cimento',purchaseDate:'2026-11-01',categoryId:'category',
        supplierId:'supplier',totalPrice:120,paid:true});
      harness.detectChanges();
      expect(component.form.valid).toBeTrue();
      const back = harness.routeNativeElement?.querySelector('header [data-testid="back-to-accounts"]') as HTMLAnchorElement;
      expect(back).not.toBeNull();
      if (!back) return;
      back.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/contas');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Contas a Pagar');
      http.expectNone(request => request.method === 'POST');
      const listing = http.expectOne(request => request.url === `${environment.apiUrl}/api/expenses`);
      expect(listing.request.method).toBe('GET');
      expect(listing.request.params.get('projectId')).toBe('project');
      listing.flush({content:[],page:0,size:15,totalElements:0,totalPages:0,last:true,
        referenceDate:'2026-11-01',totals:{totalPaid:0,totalPending:0,totalGeneral:0}});
      http.verify();
    });
  });

  it('opens accounts from the menu, then the real registration form from Cadastrar conta', async () => {
    TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
      provideHttpClientTesting(), {provide: Auth, useValue: {isAuthenticated: () => true, getToken: () => null}},
      {provide: ProjectService, useValue: {getProjects: () => of([])}}]});
    const harness = await RouterTestingHarness.create();
    const sidebar = TestBed.createComponent(SidebarComponent);
    sidebar.detectChanges();
    (sidebar.nativeElement.querySelector('a[href="/contas"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/contas');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Contas a Pagar');
    TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',
      status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''}, 'owner');
    const button = harness.routeNativeElement?.querySelector('[data-testid="create-account"]') as HTMLAnchorElement;
    expect(button.textContent).toContain('Cadastrar conta');
    button.click();
    await harness.fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/expense-categories`).flush([]);
    http.expectOne(`${environment.apiUrl}/api/suppliers`).flush([]);
    http.expectOne(`${environment.apiUrl}/api/budgets?projectId=project`).flush({projectId:'project',categories:[]});
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/contas/nova');
    expect(harness.routeNativeElement?.querySelector('input[formControlName="description"]')).not.toBeNull();
    http.verify();
  });

  it('requires authentication before opening accounts', async () => {
    TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
      {provide: Auth, useValue: {isAuthenticated: () => false}}]});
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/contas');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('input[formControlName="email"]')).not.toBeNull();
  });

  it('opens the registration form directly at the canonical address', async () => {
    TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
      provideHttpClientTesting(),
      {provide: Auth, useValue: {isAuthenticated: () => true, getToken: () => null}},
      {provide: ProjectService, useValue: {getProjects: () => of([])}}]});
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/contas/nova');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/expense-categories`).flush([]);
    http.expectOne(`${environment.apiUrl}/api/suppliers`).flush([]);
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/contas/nova');
    expect(harness.routeNativeElement?.textContent).toContain('Selecione ou cadastre uma obra');
    http.verify();
  });

  it('requires authentication before opening the canonical registration address', async () => {
    TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
      {provide: Auth, useValue: {isAuthenticated: () => false}}]});
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/contas/nova');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('input[formControlName="email"]')).not.toBeNull();
  });

  it('redirects the legacy registration address to the canonical address', async () => {
    TestBed.configureTestingModule({providers: [provideRouter(routes), provideHttpClient(),
      provideHttpClientTesting(),
      {provide: Auth, useValue: {isAuthenticated: () => true, getToken: () => null}},
      {provide: ProjectService, useValue: {getProjects: () => of([])}}]});
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/despesas/nova');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/expense-categories`).flush([]);
    http.expectOne(`${environment.apiUrl}/api/suppliers`).flush([]);
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/contas/nova');
    expect(harness.routeNativeElement?.textContent).toContain('Selecione ou cadastre uma obra');
    http.verify();
  });
});
