import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryProgressCardComponent } from './category-progress-card.component';
import { CategoriaOrcamento } from '../../../core/models/obra.model';

describe('CategoryProgressCardComponent', () => {
  let component: CategoryProgressCardComponent;
  let fixture: ComponentFixture<CategoryProgressCardComponent>;

  const mockCategory: CategoriaOrcamento = {
    id: 'cat-1',
    nome: 'Fundação',
    orcado: 35000,
    gasto: 33200,
    percentual: 95,
    emRisco: true,
    corBorda: '#EF4444'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryProgressCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryProgressCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('category', mockCategory);
    fixture.detectChanges();
  });

  it('should create the category progress card', () => {
    expect(component).toBeTruthy();
  });

  it('should render category name and badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fundação');
    expect(compiled.textContent).toContain('95%');
  });

  it('should format values with k abbreviation', () => {
    expect(component.formatBrlShort(35000)).toBe('R$ 35,0k');
  });
});
