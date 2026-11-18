export async function assertReadableTable(
  root: HTMLElement,
  widths: readonly number[],
  selector = 'table',
): Promise<void> {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;inset:0 auto auto 0;height:900px;border:0';
  document.body.appendChild(frame);
  const parent = root.parentNode!;
  const next = root.nextSibling;
  const doc = frame.contentDocument!;
  try {
    await Promise.all(Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'), source => {
      const clone = source.cloneNode(true) as HTMLElement;
      const ready = clone instanceof HTMLLinkElement
        ? new Promise<void>((resolve, reject) => {
            clone.onload = () => resolve();
            clone.onerror = () => reject(new Error('Viewport styles failed to load'));
          })
        : Promise.resolve();
      doc.head.appendChild(clone);
      return ready;
    }));
    doc.body.style.margin = '0';
    doc.body.appendChild(root);
    for (const width of widths) {
      frame.style.width = `${width}px`;
      const section = root.querySelector<HTMLElement>(selector)!;
      const bounds = section.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.left < -1 || bounds.right > width + 1) {
        throw new Error(`${selector} does not fit at ${width}px`);
      }
      for (const cell of section.querySelectorAll<HTMLElement>('th,td,dd,li,p,select,input,button,a')) {
        if (!cell.offsetWidth || cell.closest('thead')?.getBoundingClientRect().width === 1) continue;
        const rect = cell.getBoundingClientRect();
        if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) {
          throw new Error(`Element outside ${selector} at ${width}px: ${cell.textContent?.trim()}`);
        }
        if (cell.matches('th,td,dd,li,p') && !cell.classList.contains('hover-scroll-text')
            && cell.scrollWidth > cell.clientWidth + 1) {
          throw new Error(`Text overflows at ${width}px: ${cell.textContent?.trim()}`);
        }
      }
    }
  } finally {
    parent.insertBefore(root, next);
    frame.remove();
  }
}
