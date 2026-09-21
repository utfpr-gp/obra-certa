import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sidebar', () => {
    expect(component).toBeTruthy();
  });

  it('should list all main navigation items', () => {
    expect(component.navItems.length).toBe(6);
    expect(component.navItems[0].label).toBe('Resumo da Obra');
  });

  it('should emit closeDrawer when onClose is called', () => {
    spyOn(component.closeDrawer, 'emit');
    component.onClose();
    expect(component.closeDrawer.emit).toHaveBeenCalled();
  });
});
