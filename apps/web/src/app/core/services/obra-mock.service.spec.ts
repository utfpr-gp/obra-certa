import { TestBed } from '@angular/core/testing';
import { ObraMockService } from './obra-mock.service';

describe('ObraMockService', () => {
  let service: ObraMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObraMockService],
    });
    service = TestBed.inject(ObraMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with a list of mock obras and default active obra', () => {
    const obras = service.obras();
    expect(obras.length).toBeGreaterThan(0);
    const active = service.activeObra();
    expect(active).toBeDefined();
    expect(active.id).toBe(obras[0].id);
  });

  it('should switch active obra when selectObra is called', () => {
    const secondObra = service.obras()[1];
    service.selectObra(secondObra.id);
    expect(service.activeObra().id).toBe(secondObra.id);
  });

  it('should correctly format currency in BRL', () => {
    const formatted = service.formatBrl(1500);
    expect(formatted).toContain('1.500');
  });
});
