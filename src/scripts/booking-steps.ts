import {bookingPackages,quoteBooking,parseInspirationLinks,inspirationLimits} from '../lib/booking-options';
export function startBookingSteps(form:HTMLFormElement){
 const panels=Array.from(form.querySelectorAll<HTMLFieldSetElement>('[data-booking-step]'));
 const output=form.querySelector<HTMLOutputElement>('[data-booking-estimate]')!;
 const review=form.querySelector<HTMLElement>('[data-booking-review]')!;
 const imageInput=form.querySelector<HTMLInputElement>('[name="inspirationImages"]')!;
 const previews=form.querySelector<HTMLElement>('[data-inspiration-previews]')!;
 const imageStatus=form.querySelector<HTMLElement>('[data-image-status]')!;
 let images:File[]=[],busy=false,activeStep=0;
 const raw=()=>Object.fromEntries(new FormData(form));
 function estimate(){
  const service=bookingPackages.find(p=>p.id===Array.from(form.querySelectorAll('select')).find(el=>el.name==='package')!.value);
  form.querySelector<HTMLElement>('[data-package-description]')!.textContent=service?.description||'';
  const length=Array.from(form.querySelectorAll('select')).find(el=>el.name==='length')!;
  length.disabled=!service?.structured;
  form.querySelector<HTMLElement>('[data-length-label]')!.hidden=!service?.structured;
  const selects=Array.from(form.querySelectorAll('select'));
  const hasGel=!!service&&!['dry','maintenance','removal'].includes(service.id);
  for(const name of ['art','reconstruction','repair']){const select=selects.find(s=>s.name===name)!;select.disabled=!hasGel;if(!hasGel)select.value='none';}
  const reconstruction=selects.find(s=>s.name==='reconstruction')!,repair=selects.find(s=>s.name==='repair')!;
  if(reconstruction.value!=='none'){repair.value='none';repair.disabled=true;}
  const count=form.querySelector<HTMLInputElement>('[name="repairCount"]')!;count.disabled=repair.value==='none';if(count.disabled)count.value='0';else if(count.value==='0')count.value='1';
  const input=raw();
  try {const q=quoteBooking(input);output.textContent=`${q.needsConsultation?'From / subject to consultation: ':''}$${q.total.toFixed(2)} CAD estimated · before applicable taxes${q.approved?'':' · proposed pricing'}`;return q;}
  catch(e){output.textContent=e instanceof Error?e.message:'Choose a service.';return null;}
 }
 function go(step:number,focus=true){
  activeStep=step;
  panels.forEach((p,i)=>p.hidden=i!==step);
  form.querySelectorAll<HTMLElement>('[data-progress]').forEach((p,i)=>{if(i===step)p.setAttribute('aria-current','step');else p.removeAttribute('aria-current');});
  if(step===0)form.querySelector<HTMLDetailsElement>('[data-booking-calendar] details')!.open=true;
  if(step===3){const input=raw(),q=estimate();review.textContent=`Requested: ${input.preferredDate} at ${input.preferredTime} · 2 hours · Toronto. ${q?q.lines.map(l=>l.label).join(' + '):''}. ${output.textContent} Inspiration: ${parseInspirationLinks(String(input.inspirationLinks||'')).length} link(s), ${images.length} image(s). Confirmed only after Bianca agrees on the details.`;}
  if(focus){panels[step].querySelector<HTMLElement>('legend')?.focus({preventScroll:true});const dialog=form.closest('dialog');if(dialog?.open)dialog.scrollTop=0;else panels[step].scrollIntoView({block:'start',behavior:'instant'});}
 }
 function error(name:string,message:string){const target=form.querySelector<HTMLElement>(`[data-field-error="${name}"]`);if(target)target.textContent=message;}
 form.addEventListener('booking:time-selected',()=>go(1));
 form.querySelectorAll<HTMLElement>('[data-step-back]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.stepBack))));
 form.querySelectorAll<HTMLElement>('[data-step-next]').forEach(b=>b.addEventListener('click',()=>{
  const next=Number(b.dataset.stepNext);
  if(next===2&&!estimate()){error('package',output.textContent||'Choose a service.');Array.from(form.querySelectorAll('select')).find(el=>el.name==='package')?.focus();return;}
  if(next===3){if(busy)return;try{parseInspirationLinks(String(raw().inspirationLinks||''));error('inspirationLinks','');}catch(e){error('inspirationLinks',(e as Error).message);form.querySelector<HTMLTextAreaElement>('[name="inspirationLinks"]')?.focus();return;}}
  error('package','');go(next);
 }));
 form.addEventListener('change',()=>estimate());
 function renderImages(){
  previews.replaceChildren();images.forEach((file,i)=>{const wrap=document.createElement('figure'),img=document.createElement('img'),remove=document.createElement('button');
   const url=URL.createObjectURL(file);img.src=url;img.alt=`Inspiration image ${i+1}`;img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});remove.type='button';remove.textContent=`Remove image ${i+1}`;remove.addEventListener('click',()=>{images.splice(i,1);renderImages();});wrap.appendChild(img);wrap.appendChild(remove);previews.appendChild(wrap);});
 }
 async function addFiles(files:File[]){
  if(busy)return;busy=true;imageStatus.textContent='Preparing images…';error('inspirationImages','');
  try {
   if(images.length+files.length>inspirationLimits.files)throw Error('Choose up to two inspiration images.');
   const prepared:File[]=[];
   for(const file of files){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000)throw Error('Choose JPEG, PNG or WebP images under 10 MB.');
    const bitmap=await createImageBitmap(file);
    if(bitmap.width*bitmap.height>24000000){bitmap.close();throw Error('Choose an image smaller than 24 megapixels.');}
    const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const context=canvas.getContext('2d')!;context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    let blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.8));
    if(blob&&blob.size>inspirationLimits.bytes)blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.55));
    if(!blob||blob.size>inspirationLimits.bytes)throw Error('This image is too large. Choose a smaller version.');
    prepared.push(new File([blob],`inspiration-${images.length+prepared.length+1}.jpg`,{type:'image/jpeg'}));
   }
   images.push(...prepared);renderImages();imageStatus.textContent=images.length?`${images.length} image(s) ready.`:'';
  }catch(e){imageStatus.textContent='';error('inspirationImages',e instanceof Error?e.message:'Unable to prepare image.');}
  finally{busy=false;imageInput.value='';}
 }
 imageInput.addEventListener('change',()=>void addFiles(Array.from(imageInput.files||[])));
 panels[2].addEventListener('paste',e=>{const files=Array.from(e.clipboardData?.files||[]);if(files.length){e.preventDefault();void addFiles(files);}});
 go(0,false);estimate();
 return {go,isFinal:()=>activeStep===3,next:()=>{const button=activeStep===0?form.querySelector<HTMLButtonElement>('[data-calendar-use]'):panels[activeStep].querySelector<HTMLButtonElement>('[data-step-next]');button?.click();},ready:()=>!busy,appendImages:(data:FormData)=>{data.delete('inspirationImages');images.forEach(file=>data.append('inspirationImages',file));},reset:()=>{images=[];previews.replaceChildren();imageStatus.textContent='';go(0,false);estimate();}};
}
