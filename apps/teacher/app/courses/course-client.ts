export async function courseRequest<T>(url:string, body?:unknown):Promise<T>{
  const response=await fetch(url,{credentials:'same-origin',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok)throw new Error(data.error?.message??'Please try again.');return data;
}
