import {parseInspirationLinks} from '../lib/booking-options';
export async function loadBookingEnquiryDetails(target:HTMLElement,id:string){
 target.textContent='Loading service and inspiration…';
 try{
  const response=await fetch(`/api/admin/bookings/${encodeURIComponent(id)}/inspiration`);
  if(!response.ok)throw Error();
  const data=await response.json() as {selection:{serviceName:string;lines:{label:string;amount:number}[];shape:string;total:number;needsConsultation:boolean;approved:boolean}|null;links:string[];images:{url:string}[]};
  if(!target.isConnected)return;
  target.replaceChildren();
  if(!data.selection&&!data.links.length&&!data.images.length){target.textContent='No service selection or inspiration attached.';return;}
  const title=document.createElement('h4');title.textContent='Service & inspiration';target.appendChild(title);
  if(data.selection){const q=data.selection,p=document.createElement('p');p.textContent=`${q.lines.map(l=>`${l.label}: $${l.amount}`).join(' · ')}. Shape: ${q.shape}. Estimate: $${q.total.toFixed(2)} CAD before tax${q.approved?'':' · proposed prices'}. ${q.needsConsultation?'Consultation required.':'Confirm suitability and timing.'}`;target.appendChild(p);}
  parseInspirationLinks(data.links.join('\n')).forEach((url,i)=>{const p=document.createElement('p'),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`Inspiration link ${i+1} · ${new URL(url).hostname}`;p.appendChild(a);target.appendChild(p);});
  data.images.forEach((image,i)=>{if(!/^\/api\/admin\/inspiration\/[a-f0-9-]{36}$/i.test(image.url))return;const a=document.createElement('a'),img=document.createElement('img');a.href=image.url;a.target='_blank';a.rel='noopener noreferrer';img.src=image.url;img.alt=`Client inspiration ${i+1}`;img.loading='lazy';img.style.width='min(100%, 240px)';a.appendChild(img);target.appendChild(a);});
 }catch{if(target.isConnected)target.textContent='Service and inspiration could not be loaded. Reopen this enquiry to retry.';}
}
