import v060 from './v060.js';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const RESOURCE_BY_PATH = new Map([
  ['/v1/items', 'items'],
  ['/v1/outfits', 'outfits'],
  ['/v1/wear-events', 'wear-events']
]);
const INVALIDATE_BY_MUTATION_PATH = new Map([
  ['/v1/mutations', 'items'],
  ['/v1/outfit-mutations', 'outfits'],
  ['/v1/wear-mutations', 'wear-events']
]);

function bearer(request){
  const value=request.headers.get('authorization')||'';
  return value.startsWith('Bearer ')?value.slice(7):'';
}

function allowedOrigin(request,env){
  const origin=request.headers.get('origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://shinobione.github.io';
  return origin===allowed?origin:allowed;
}

function json(body,status=200,request=null,env=null,extraHeaders={}){
  const headers={
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    ...extraHeaders
  };
  if(request&&env){
    headers['access-control-allow-origin']=allowedOrigin(request,env);
    headers['access-control-allow-methods']='GET,POST,OPTIONS';
    headers['access-control-allow-headers']='authorization,content-type';
    headers['vary']='Origin';
  }
  return new Response(JSON.stringify(body),{status,headers});
}

function cacheKey(resource){return `canonical:${resource}`;}

async function responseJson(response){
  try{return await response.clone().json();}catch{return null;}
}

export class CanonicalSyncCache {
  constructor(ctx,env){
    this.ctx=ctx;
    this.env=env;
    this.inFlight=new Map();
  }

  async fetch(request){
    const url=new URL(request.url);
    if(request.method==='POST'&&url.pathname==='/__invalidate'){
      const payload=await responseJson(request);
      const resources=Array.isArray(payload?.resources)?payload.resources:[];
      await Promise.all(resources.map(resource=>this.ctx.storage.delete(cacheKey(resource))));
      return json({ok:true,invalidated:resources});
    }

    if(request.method!=='GET')return json({error:'Method not allowed'},405);
    const resource=RESOURCE_BY_PATH.get(url.pathname);
    if(!resource)return json({error:'Not found'},404);

    const key=cacheKey(resource);
    const force=url.searchParams.get('refresh')==='1';
    const now=Date.now();
    const stored=await this.ctx.storage.get(key);
    if(!force&&stored?.body&&Number(stored.cachedAt)>0&&(now-Number(stored.cachedAt))<CACHE_TTL_MS){
      return json(stored.body,stored.status||200,request,this.env,{
        'x-tran-cache':'HIT',
        'x-tran-cache-age':String(Math.max(0,Math.floor((now-Number(stored.cachedAt))/1000)))
      });
    }

    if(this.inFlight.has(resource))return this.inFlight.get(resource);

    const task=(async()=>{
      const originResponse=await v060.fetch(request,this.env);
      const body=await responseJson(originResponse);
      if(originResponse.ok&&body?.ok){
        await this.ctx.storage.put(key,{cachedAt:Date.now(),status:originResponse.status,body});
      }
      return json(body??{error:'Invalid upstream response'},originResponse.status,request,this.env,{'x-tran-cache':'MISS'});
    })().finally(()=>this.inFlight.delete(resource));

    this.inFlight.set(resource,task);
    return task;
  }
}

function cacheStub(env){
  const id=env.SYNC_CACHE.idFromName('tran-closet-canonical');
  return env.SYNC_CACHE.get(id);
}

async function invalidate(env,resource){
  if(!resource||!env.SYNC_CACHE)return;
  const stub=cacheStub(env);
  await stub.fetch('https://sync-cache.internal/__invalidate',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({resources:[resource]})
  });
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const resource=RESOURCE_BY_PATH.get(url.pathname);

    if(resource&&request.method==='GET'){
      if(!env.CLOSET_SYNC_KEY)return json({error:'Worker sync key not configured'},503,request,env);
      if(bearer(request)!==env.CLOSET_SYNC_KEY)return json({error:'Unauthorized'},401,request,env);
      return cacheStub(env).fetch(request);
    }

    if(url.pathname==='/health'&&request.method==='GET'){
      const response=await v060.fetch(request,env);
      if(!response.ok)return response;
      const body=await responseJson(response);
      if(!body)return response;
      const headers=new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      return new Response(JSON.stringify({...body,workerRevision:'v061',apiCache:'durable-object-v1',apiCacheTtlHours:12}),{
        status:response.status,
        headers
      });
    }

    const mutationResource=INVALIDATE_BY_MUTATION_PATH.get(url.pathname);
    if(mutationResource&&request.method==='POST'){
      const response=await v060.fetch(request,env);
      const body=await responseJson(response);
      const anySuccess=Array.isArray(body?.results)&&body.results.some(result=>result?.ok);
      if(response.ok&&anySuccess){
        try{await invalidate(env,mutationResource);}catch(error){console.warn('Canonical cache invalidation failed',error);}
      }
      return response;
    }

    return v060.fetch(request,env);
  }
};
