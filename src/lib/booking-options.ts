import {pricingDraft} from '../data/pricing.ts';
export const bookingPackages=[
 ...pricingDraft.manicures.map(p=>({...p,structured:p.id==='structured'})),
 ...pricingDraft.fills.map(p=>({...p,description:p.detail,structured:false})),
 {...pricingDraft.naturalMaintenance,description:pricingDraft.naturalMaintenance.detail,structured:false},
 {id:'removal',name:pricingDraft.standaloneRemoval.name,price:pricingDraft.standaloneRemoval.price,description:'Standalone gel removal.',structured:false},
];
export const reconstructionTiers=pricingDraft.reconstructionTiers;
export const repairOptions=pricingDraft.repairs;
export function quoteBooking(input:Record<string,unknown>){
 if(input.package==='unsure')return {serviceId:'unsure',serviceName:'Not sure — help me choose',length:'unsure',art:'unsure',reconstruction:'none',repair:'none',repairCount:0,shape:'Not sure',lines:[] as {label:string;amount:number}[],total:null,currency:'CAD',approved:pricingDraft.approved,needsConsultation:true};
 const service=bookingPackages.find(p=>p.id===input.package);
 if(!service)throw Error('Choose a service package.');
 const length=String(input.length||'short'),art=String(input.art||'none'),reconstruction=String(input.reconstruction||'none'),repair=String(input.repair||'none'),shape=String(input.shape||'Not sure');
 if(!['short','medium','long','extra-long','unsure'].includes(length))throw Error('Choose a nail length.');
 if(!['none','1','2','3','4','unsure'].includes(art))throw Error('Choose an art tier.');
 if(!['none','1','2','3','4'].includes(reconstruction))throw Error('Choose a reconstruction tier.');
 if(!['Not sure',...pricingDraft.shapes].includes(shape))throw Error('Choose a nail shape.');
 const countText=String(input.repairCount??'0');
 if(!/^(?:[0-9]|10)$/.test(countText))throw Error('Choose between zero and ten nail repairs.');
 const repairCount=Number(countText),repairItem=repairOptions.find(p=>p.id===repair);
 if(repair!=='none'&&!repairItem)throw Error('Choose an individual repair.');
 if((repair==='none')!==(repairCount===0))throw Error('Choose a repair and the number of nails, or no repairs.');
 if(reconstruction!=='none'&&repair!=='none')throw Error('Choose reconstruction or individual repairs so the same work is not charged twice.');
 const hasGel=!['dry','maintenance','removal'].includes(service.id);
 if(!hasGel&&(art!=='none'||reconstruction!=='none'||repair!=='none'))throw Error('Art and gel repairs need a gel service.');
 const effectiveLength=service.structured?length:'included';
 const lengthCharge=service.structured?({short:pricingDraft.lengths[0].addOn,medium:pricingDraft.lengths[1].addOn,long:pricingDraft.lengths[2].addOn,'extra-long':0,unsure:0}[length]||0):0;
 const artItem=['none','unsure'].includes(art)?null:pricingDraft.artTiers[Number(art)-1];
 const reconstructionItem=reconstructionTiers.find(p=>p.id===reconstruction);
 const lines:{label:string;amount:number}[]=[{label:service.name,amount:service.price}];
 if(service.structured)lines.push({label:`${length} length`,amount:lengthCharge});
 if(artItem)lines.push({label:artItem.name,amount:artItem.addOn});
 if(reconstructionItem)lines.push({label:reconstructionItem.name,amount:reconstructionItem.price});
 if(repairItem&&repairCount)lines.push({label:`${repairItem.name} × ${repairCount}`,amount:repairItem.price*repairCount});
 return {serviceId:service.id,serviceName:service.name,length:effectiveLength,art,reconstruction,repair,repairCount,shape,lines,total:lines.reduce((n,l)=>n+l.amount,0),currency:'CAD',approved:pricingDraft.approved,needsConsultation:art==='unsure'||length==='unsure'||art==='4'||reconstruction!=='none'||repair!=='none'||(service.structured&&length==='extra-long')};
}
export function formatBookingEstimate(quote:{total:number|null;needsConsultation:boolean;approved:boolean}){
 if(quote.total===null)return 'Bianca will help you choose and confirm your quote.';
 return `${quote.needsConsultation?'From ':''}$${quote.total.toFixed(2)} CAD estimated · before applicable taxes${quote.needsConsultation?' · final quote after consultation':''}${quote.approved?'':' · proposed pricing'}`;
}
export function parseInspirationLinks(value:unknown){
 if(typeof value!=='string')throw Error('Paste inspiration links, one per line.');
 if(value.length>1800)throw Error('Keep inspiration links under 1,800 characters.');
 const links=value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(links.length>3)throw Error('Add up to three inspiration links.');
 return [...new Set(links.map(link=>{
  let url:URL;try{url=new URL(link);}catch{throw Error('Use a complete HTTPS inspiration link.');}
  if (url.username || url.password) throw Error('Use a public HTTPS inspiration link.');
  const privateHost = !url.hostname.includes('.') || /^[\d.:]+$/.test(url.hostname)
    || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname) || url.hostname.startsWith('[');
  if (url.protocol !== 'https:' || url.port || privateHost) throw Error('Use a public HTTPS inspiration link.');
  return url.href;
 }))];
}
export const inspirationLimits={files:2,bytes:300000,bodyBytes:700000};
export function validateInspirationImage(bytes:Uint8Array,mime:string){
 if(!bytes.length||bytes.length>inspirationLimits.bytes)throw Error('Each inspiration image must be under 300 KB after preparation.');
 const png=mime==='image/png'&&bytes.length>=24&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 const jpeg=mime==='image/jpeg'&&bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes.at(-2)===255&&bytes.at(-1)===217;
 if(!png&&!jpeg)throw Error('Choose a JPEG or PNG inspiration image.');
 let width=0,height=0;
 if(png){const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);width=d.getUint32(16);height=d.getUint32(20);}
 if(jpeg){
  let offset=2,scan=false;
  while(offset<bytes.length-2){
   if(bytes[offset++]!==255)throw Error('Choose a valid JPEG image.');
   while(bytes[offset]===255)offset++;
   const marker=bytes[offset++];
   if(marker===0||marker===216||marker===217)throw Error('Choose a valid JPEG image.');
   if(marker===1||(marker>=208&&marker<=215))continue;
   if(offset+2>bytes.length)throw Error('Choose a valid JPEG image.');
   const length=(bytes[offset]<<8)|bytes[offset+1];
   if(length<2||offset+length>bytes.length-2)throw Error('Choose a valid JPEG image.');
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
    if(length<8||width||height)throw Error('Choose a valid JPEG image.');
    height=(bytes[offset+3]<<8)|bytes[offset+4];width=(bytes[offset+5]<<8)|bytes[offset+6];
    if(!width||!height||width>8192||height>8192||width*height>24000000)throw Error('Choose a smaller inspiration image.');
   }
   if(marker===218){scan=true;break;}
   offset+=length;
  }
  if(!scan||!width||!height)throw Error('Choose a valid JPEG image.');
 }
 if(!width||!height||width>8192||height>8192||width*height>24000000)throw Error('Choose a smaller inspiration image.');
 return {mime,bytes};
}
