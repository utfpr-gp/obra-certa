import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HoverScrollDirective } from './hover-scroll.directive';

@Component({
  imports: [HoverScrollDirective],
  template: '<span appHoverScroll style="width:80px">TIJOLO CERAMICO 8 FUROS 9X19X19 · Fundação e Estrutura</span>',
})
class TestHost {}

describe('HoverScrollDirective', () => {
  let callback: FrameRequestCallback;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    spyOn(window, 'requestAnimationFrame').and.callFake((next) => { callback = next; return 1; });
    spyOn(window, 'cancelAnimationFrame');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
  });

  it('reveals the rest of overflowing text on hover and resets after leaving', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    expect(text.title).toContain('Fundação e Estrutura');

    text.dispatchEvent(new MouseEvent('mouseenter'));
    callback(0);
    callback(2000);
    expect(text.scrollLeft).toBeGreaterThan(0);
    callback(60000);
    expect(text.scrollLeft).toBe(text.scrollWidth - text.clientWidth);

    text.dispatchEvent(new MouseEvent('mouseleave'));
    expect(text.scrollLeft).toBe(0);
    fixture.destroy();
  });

  it('supports keyboard focus and respects reduced motion', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(text.tabIndex).toBe(0);
    text.dispatchEvent(new FocusEvent('focus'));
    callback(0);
    callback(2000);
    expect(text.scrollLeft).toBeGreaterThan(0);
    text.dispatchEvent(new FocusEvent('blur'));
    expect(text.scrollLeft).toBe(0);

    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true } as MediaQueryList);
    (window.requestAnimationFrame as jasmine.Spy).calls.reset();
    text.dispatchEvent(new MouseEvent('mouseenter'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('keeps short text stationary', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('span') as HTMLElement;
    text.textContent = 'Curto';
    text.dispatchEvent(new MouseEvent('mouseenter'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
