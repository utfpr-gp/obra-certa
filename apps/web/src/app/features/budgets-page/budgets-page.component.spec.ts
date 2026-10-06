import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetsPageComponent } from './budgets-page.component';

describe('BudgetsPageComponent', () => {
  let component: BudgetsPageComponent;
  let fixture: ComponentFixture<BudgetsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetsPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create budgets page component', () => {
    expect(component).toBeTruthy();
  });

  it('should render placeholder text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('budgets works!');
  });
});
