import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { Auth } from '../../core/services/auth';
import { ProjectService } from '../../core/services/project.service';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { environment } from '../../../environments/environment';

describe('Accounts navigation', () => {
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
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Contas a pagar');
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
