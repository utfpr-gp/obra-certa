import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sidebar', () => {
    expect(component).toBeTruthy();
  });

  it('should list all main navigation items', () => {
    expect(component.navItems.length).toBe(5);
    expect(component.navItems[0].label).toBe('Resumo da Obra');
  });

  it('keeps accounts as the entry to registration without a standalone registration item', () => {
    const menu = fixture.nativeElement as HTMLElement;
    expect(menu.textContent).not.toContain('Cadastrar despesa');
    expect(menu.querySelector('a[href="/contas/nova"]')).toBeNull();
    expect(menu.querySelector('a[href="/contas"]')?.textContent).toContain('Contas a Pagar');
  });

  it('should emit closeDrawer when onClose is called', () => {
    spyOn(component.closeDrawer, 'emit');
    component.onClose();
    expect(component.closeDrawer.emit).toHaveBeenCalled();
  });
});
