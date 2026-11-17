/** Keep Tab at the boundaries of a native modal dialog. Open/close and restore remain owned by the page. */
export function keepDialogFocus(dialog) {
  const onKeydown = event => {
    if (event.key !== 'Tab' || !dialog.open) return;
    const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]')]
      .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
    if (!controls.length) { event.preventDefault(); return; }
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener('keydown', onKeydown);
  return () => dialog.removeEventListener('keydown', onKeydown);
}
