type CalendarDay={date:string;times:string[]};
type CalendarData={month:string;days:CalendarDay[];today:string;lastDate:string};
const labelDate=(date:string)=>new Intl.DateTimeFormat('en-CA',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const labelTime=(time:string)=>{const hour=Number(time.slice(0,2));return `${hour%12||12} ${hour<12?'a.m.':'p.m.'}–${(hour+2)%12||12} ${hour+2<12?'a.m.':'p.m.'}`;};
export function startBookingCalendar(form:HTMLFormElement){
 const root=form.querySelector<HTMLElement>('[data-booking-calendar]')!;
 const details=root.querySelector<HTMLDetailsElement>('details')!;
 const summary=root.querySelector<HTMLElement>('summary')!;
 const dateInput=form.elements.namedItem('preferredDate') as HTMLInputElement;
 const timeInput=root.querySelector('select')!;
 const grid=root.querySelector<HTMLElement>('[data-calendar-days]')!;
 const title=root.querySelector<HTMLElement>('[data-calendar-month]')!;
 const notice=root.querySelector<HTMLElement>('[data-calendar-notice]')!;
 const previous=root.querySelector<HTMLButtonElement>('[data-calendar-previous]')!;
 const next=root.querySelector<HTMLButtonElement>('[data-calendar-next]')!;
 const retry=root.querySelector<HTMLButtonElement>('[data-calendar-retry]')!;
 const useTime=root.querySelector<HTMLButtonElement>('[data-calendar-use]')!;
 // Construct ISO explicitly because locale date ordering can vary.
 const nowParts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'America/Toronto'}).formatToParts(new Date());
 let month=`${nowParts.find(p=>p.type==='year')!.value}-${nowParts.find(p=>p.type==='month')!.value}`;
 let data:CalendarData|undefined,loading=0;
 function select(date:string){
  dateInput.value=date;timeInput.replaceChildren(new Option('Choose a start time',''));
  const times=data?.days.find(d=>d.date===date)?.times||[];
  times.forEach(t=>timeInput.add(new Option(labelTime(t),t)));
  timeInput.disabled=!times.length;useTime.disabled=true;
  summary.textContent=date?`${labelDate(date)} · choose a two-hour block`:'Choose a date and time';
  grid.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.date===date)));
 }
 async function refresh(){
  const ticket=++loading;retry.hidden=true;notice.textContent='Loading available dates…';previous.disabled=true;next.disabled=true;grid.setAttribute('aria-busy','true');
  grid.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);timeInput.disabled=true;useTime.disabled=true;
  try {
   const r=await fetch(`/api/availability?month=${month}`,{headers:{Accept:'application/json'}});
   if(!r.ok || !r.headers.get('content-type')?.includes('application/json'))throw Error('Calendar unavailable. Please try again.');
   const result=await r.json() as CalendarData;if(ticket!==loading)return;data=result;
   title.textContent=new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00Z'));
   grid.replaceChildren();
   const firstDay=new Date(month+'-01T12:00Z').getUTCDay();
   for(let i=0;i<firstDay;i++){const spacer=document.createElement('span');spacer.setAttribute('aria-hidden','true');grid.appendChild(spacer);}
   data.days.forEach(day=>{const b=document.createElement('button');b.type='button';b.dataset.date=day.date;b.textContent=String(Number(day.date.slice(-2)));b.disabled=!day.times.length;b.setAttribute('aria-label',`${labelDate(day.date)} · ${day.times.length?'available':'unavailable'}`);b.addEventListener('click',()=>select(day.date));grid.appendChild(b);});
   const selected=data.days.some(d=>d.date===dateInput.value&&d.times.length)?dateInput.value:'';
   select(selected);previous.disabled=month<=data.today.slice(0,7);next.disabled=month>=data.lastDate.slice(0,7);
   notice.textContent=data.days.some(d=>d.times.length)?'Choose an available weekday. Grey dates are unavailable.':'No blocks are available this month. Try the next month.';
  }catch{if(ticket===loading){data=undefined;retry.hidden=false;summary.textContent='Choose a date and time';dateInput.value='';timeInput.replaceChildren(new Option('Choose a date first',''));notice.textContent='Calendar temporarily unavailable. Use Retry to load dates.';}}
  finally{if(ticket===loading)grid.removeAttribute('aria-busy');}
 }
 const shift=(amount:number)=>{const d=new Date(month+'-01T12:00Z');d.setUTCMonth(d.getUTCMonth()+amount);month=d.toISOString().slice(0,7);dateInput.value='';void refresh();};
 previous.addEventListener('click',()=>shift(-1));next.addEventListener('click',()=>shift(1));
 root.querySelector('[data-calendar-retry]')?.addEventListener('click',()=>void refresh());
 timeInput.addEventListener('change',()=>{useTime.disabled=!timeInput.value;});
 useTime.addEventListener('click',()=>{if(!dateInput.value||!timeInput.value)return;summary.textContent=`${labelDate(dateInput.value)} · ${labelTime(timeInput.value)} · Toronto`;details.open=false;form.querySelector<HTMLInputElement>('[name="name"]')?.focus();});
 const focus=()=>{details.open=true;root.focus();};
 void refresh();
 return {refresh,focus,reset:()=>{dateInput.value='';timeInput.value='';details.open=true;summary.textContent='Choose a date and time';void refresh();}};
}
