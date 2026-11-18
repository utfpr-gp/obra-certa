import { AfterViewInit, booleanAttribute, Directive, ElementRef, HostListener, inject, input, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appHoverScroll]',
  host: { '[class.hover-scroll-text]': 'appHoverScroll()' },
})
export class HoverScrollDirective implements AfterViewInit, OnDestroy {
  readonly appHoverScroll = input(true, { transform: booleanAttribute });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private resize?: ResizeObserver;
  private mutation?: MutationObserver;
  private frame?: number;
  private hovered = false;
  private focused = false;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const refresh = () => {
        if (!this.appHoverScroll()) return;
        const overflow = this.element.scrollWidth > this.element.clientWidth;
        this.element.tabIndex = overflow && !this.element.closest('[aria-hidden="true"]') ? 0 : -1;
        this.element.title = this.element.textContent?.trim() ?? '';
      };
      this.resize = new ResizeObserver(refresh);
      this.resize.observe(this.element);
      this.mutation = new MutationObserver(refresh);
      this.mutation.observe(this.element, { childList: true, characterData: true, subtree: true });
      refresh();
    });
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.hovered = true;
    this.start();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hovered = false;
    if (!this.focused) this.stop();
  }

  @HostListener('focus')
  onFocus(): void {
    this.focused = true;
    this.start();
  }

  @HostListener('blur')
  onBlur(): void {
    this.focused = false;
    if (!this.hovered) this.stop();
  }

  private start(): void {
    this.stop();
    if (!this.appHoverScroll() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const distance = this.element.scrollWidth - this.element.clientWidth;
    if (distance <= 0) return;
    this.zone.runOutsideAngular(() => {
      let started: number | undefined;
      const advance = (time: number) => {
        started ??= time;
        const offset = Math.min(distance, Math.max(0, time - started - 400) * 0.035);
        this.element.scrollLeft = offset;
        if (offset < distance) this.frame = requestAnimationFrame(advance);
      };
      this.frame = requestAnimationFrame(advance);
    });
  }

  private stop(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.element.scrollLeft = 0;
  }

  ngOnDestroy(): void {
    this.stop();
    this.resize?.disconnect();
    this.mutation?.disconnect();
  }
}
