export async function api(tool:string,businessId:string,data:object={},signal?:AbortSignal){
 const response=await fetch(`/api/herramientas/${tool}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,businessId}),signal,cache:'no-store'});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Tu sesión puede haber vencido. Actualiza la página.');
 const body=await response.json();if(!response.ok)throw new Error(body.error||'No se pudo completar la consulta.');return body;
}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function downloadImage(tool:string,businessId:string,data:object,name:string){const response=await fetch(`/api/herramientas/${tool}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,businessId}),cache:'no-store'});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error||'No se pudo generar la imagen.');}if(!response.headers.get('content-type')?.startsWith('image/png'))throw new Error('La sesión venció o la imagen no está disponible.');downloadBlob(await response.blob(),name);}
