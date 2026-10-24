import { normalizePhone } from '../lib/phone';
import { detectLeadSource } from '../lib/lead-source';
export function startBooking() {
  const form = document.querySelector<HTMLFormElement>('[data-booking-form]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-booking-dialog]');
  const home = document.querySelector<HTMLElement>('[data-booking-home]');
  const dialogBody = dialog?.querySelector<HTMLElement>('[data-booking-dialog-body]');
  if (!form || !dialog || !home || !dialogBody) return;
  const sourceInput=form.elements.namedItem('leadSource') as HTMLInputElement;
  sourceInput.value=detectLeadSource(location.href,document.referrer);
  if (typeof dialog.showModal === 'function') document.querySelectorAll('a[href="#booking"]').forEach(link=> { link.setAttribute('aria-haspopup','dialog'); link.setAttribute('aria-controls','booking-dialog'); });
  const status = form.querySelector<HTMLElement>('[data-booking-status]')!;
  let started = false;
  let opener: HTMLElement | null = null;
  const close = () => dialog.close();
  const restore = () => {
    home.appendChild(form);
    document.body.classList.remove('booking-modal-open');
    home.style.minHeight = '';
    const hiddenMenuLink = opener?.closest('.site-nav') && matchMedia('(max-width: 900px)').matches;
    const visible = opener && opener.getClientRects().length > 0 && getComputedStyle(opener).visibility === 'visible';
    const target = visible && !hiddenMenuLink ? opener : document.querySelector<HTMLButtonElement>('.menu-toggle');
    target?.focus({preventScroll:true});
  };
  dialog.addEventListener('close',restore);
  dialog.querySelector('[data-booking-close]')?.addEventListener('click',close);
  // Native dialog handles Escape, focus containment and background inertness.
  dialog.addEventListener('click',event=> {
    if (event.target !== dialog) return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) close();
  });
  document.addEventListener('click',event=> {
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const trigger = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href="#booking"]') : null;
    if (!trigger || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    if (dialog.open) return;
    opener=trigger;
    home.style.minHeight=`${home.getBoundingClientRect().height}px`;
    dialogBody.appendChild(form);
    document.body.classList.add('booking-modal-open');
    dialog.showModal();
    dialog.scrollTop=0;
    // Focus the heading/close control, avoiding an unexpected mobile keyboard.
    dialog.querySelector<HTMLButtonElement>('[data-booking-close]')?.focus({preventScroll:true});
    window.plausible?.('booking_form_viewed');
  });
  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-field-error]').forEach(el=>el.textContent='');
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  };
  const showErrors = (errors: Record<string,string>) => {
    let first: HTMLElement | null = null;
    for (const [name,message] of Object.entries(errors)) {
      if (!["name","phone","contactMethod","consent"].includes(name)) continue;
      const field=form.elements.namedItem(name);
      const hint=form.querySelector<HTMLElement>(`[data-field-error="${name}"]`);
      if (hint) hint.textContent=message;
      if (field instanceof HTMLElement) { field.setAttribute('aria-invalid','true'); first ??= field; }
    }
    status.textContent='Please check the highlighted fields.';
    first?.focus();
    window.plausible?.('booking_validation_error');
  };
  const trackStart = () => {
    if (started) return;
    started=true;
    window.plausible?.('booking_request_started');
  };
  form.addEventListener('input',trackStart);
  form.addEventListener('change',trackStart);
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=> {
      if (!entries.some(e=>e.isIntersecting)) return;
      window.plausible?.('booking_form_viewed'); observer.disconnect();
    },{threshold:.25});observer.observe(form);
  }
  form.addEventListener('submit',async event=> {
    event.preventDefault();
    const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    if (submit.disabled) return;
    clearErrors();
    const data=new FormData(form);
    const errors: Record<string,string>={};
    if(String(data.get('name')||'').trim().length<2) errors.name='Please enter your name.';
    if(!normalizePhone(String(data.get('phone')||''))) errors.phone='Enter a Canadian or US phone number, including area code.';
    if(!['call','text'].includes(String(data.get('contactMethod')))) errors.contactMethod='Choose a call or text back.';
    if(!data.get('consent')) errors.consent='Please agree so we can respond to your request.';
    if(Object.keys(errors).length) {showErrors(errors);return;}
    submit.disabled=true;
    form.setAttribute('aria-busy','true');
    status.textContent='Sending your request…';
    try {
      const response=await fetch(form.action,{method:'POST',body:data});
      if (!response.headers.get('content-type')?.includes('application/json')) throw Error('The request could not be sent. Please try again shortly. Your details are still here.');
      const result=await response.json() as {ok?:boolean;message?:string;errors?:Record<string,string>};
      if(result.errors) {showErrors(result.errors);return;}
      if(!response.ok || !result.ok) throw Error(result.message || 'The request could not be sent. Please try again shortly.');
      form.reset();sourceInput.value=detectLeadSource(location.href,document.referrer);started=false;
      status.textContent=result.message || 'Your request has been received.';
      status.tabIndex=-1;status.focus();
      window.plausible?.('booking_request_submitted');
    } catch(error) {
      status.textContent=error instanceof Error && !(error instanceof SyntaxError) ? error.message : 'The request could not be sent. Please try again shortly.';
      window.plausible?.('booking_request_failed');
    } finally {submit.disabled=false;form.removeAttribute('aria-busy');}
  });
}
