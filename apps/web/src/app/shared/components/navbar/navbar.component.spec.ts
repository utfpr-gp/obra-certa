import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { ObraMockService } from '../../../core/services/obra-mock.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let obraService: ObraMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        ObraMockService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    obraService = TestBed.inject(ObraMockService);
    fixture.detectChanges();
  });

  it('should create navbar', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle desktop dropdown', () => {
    expect(component.deskDropdownOpen()).toBeFalse();
    component.toggleDeskDropdown();
    expect(component.deskDropdownOpen()).toBeTrue();
    component.toggleDeskDropdown();
    expect(component.deskDropdownOpen()).toBeFalse();
  });

  it('should select an obra and update active obra in service', () => {
    const secondObra = obraService.obras()[1];
    component.selectObra(secondObra);
    expect(obraService.activeObra().id).toBe(secondObra.id);
    expect(component.deskDropdownOpen()).toBeFalse();
    expect(component.mobileSheetOpen()).toBeFalse();
  });

  it('should open and close mobile sheet', () => {
    component.openMobileSheet();
    expect(component.mobileSheetOpen()).toBeTrue();
    component.closeMobileSheet();
    expect(component.mobileSheetOpen()).toBeFalse();
  });
});
