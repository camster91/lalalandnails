import {inspirationLimits} from './booking-options.ts';
export async function readBookingBody(request:Request){
 const reader=request.body?.getReader();if(!reader)throw Error('Request body required.');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>inspirationLimits.bodyBytes){await reader.cancel();throw Error('Your request is too large. Please choose smaller images.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const type=request.headers.get('content-type')||'';
 if(type.includes('application/json')){const input=JSON.parse(new TextDecoder().decode(bytes));if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid request.');return {input:input as Record<string,unknown>,files:[] as File[]};}
 const parsed=await new Request(request.url,{method:'POST',headers:{'Content-Type':type},body:bytes}).formData();
 return {input:Object.fromEntries(parsed) as Record<string,unknown>,files:parsed.getAll('inspirationImages').filter((f):f is File=>f instanceof File&&f.size>0)};
}
