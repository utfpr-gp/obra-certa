import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';
import { ObraMockService } from '../../core/services/obra-mock.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let obraService: ObraMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        ObraMockService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    obraService = TestBed.inject(ObraMockService);
    fixture.detectChanges();
  });

  it('should create the home page', () => {
    expect(component).toBeTruthy();
  });

  it('should display the active obra name and categories', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(obraService.activeObra().nome);
    expect(compiled.textContent).toContain('Fundação');
  });

  it('should react when active obra changes', () => {
    const secondObra = obraService.obras()[1];
    obraService.selectObra(secondObra.id);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(secondObra.nome);
  });
});
