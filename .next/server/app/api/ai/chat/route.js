"use strict";(()=>{var e={};e.id=76,e.ids=[76],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},4232:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>m,patchFetch:()=>x,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>l,staticGenerationAsyncStorage:()=>p});var r={};t.r(r),t.d(r,{POST:()=>d});var o=t(9303),s=t(8716),i=t(670),n=t(7972);async function d(e){let{messages:a,habitContext:t}=await e.json(),r=t?`

Contexto del usuario: ${JSON.stringify(t)}`:"",o=await n.Ml.chat.completions.create({model:n.dX.fast,messages:[{role:"system",content:n.p6+r},...a],temperature:.8,max_tokens:300,stream:!0}),s=new TextEncoder;return new Response(new ReadableStream({async start(e){for await(let a of o){let t=a.choices[0]?.delta?.content??"";t&&e.enqueue(s.encode(`data: ${JSON.stringify({text:t})}

`))}e.enqueue(s.encode("data: [DONE]\n\n")),e.close()}}),{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}let u=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/chat/route",pathname:"/api/ai/chat",filename:"route",bundlePath:"app/api/ai/chat/route"},resolvedPagePath:"C:\\Users\\Asus\\Downloads\\habitflow\\app\\api\\ai\\chat\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:p,serverHooks:l}=u,m="/api/ai/chat/route";function x(){return(0,i.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:p})}},7972:(e,a,t)=>{t.d(a,{Ml:()=>r,dX:()=>o,p6:()=>s});let r=new(t(9400)).ZP({apiKey:process.env.GROQ_API_KEY}),o={coach:"llama-3.3-70b-versatile",fast:"llama-3.1-8b-instant"},s=`Eres HabitFlow AI, un coach de comportamiento basado en Atomic Habits y Nudge Theory. Tu misi\xf3n es ayudar al usuario a construir h\xe1bitos duraderos mediante reducci\xf3n de fricci\xf3n y adaptaci\xf3n din\xe1mica.

Sistema de h\xe1bitos el\xe1sticos:
- Nivel M\xednimo (2-10 min): protege la racha en d\xedas dif\xedciles. Vale 10 pts.
- Nivel Ideal (15-30 min): el objetivo normal. Vale 25 pts.
- Nivel Elite (45-60 min): m\xe1ximo rendimiento. Vale 50 pts.

El Fondo de Compromiso pierde puntos cuando se omite un h\xe1bito sin justificaci\xf3n v\xe1lida. Las rachas son sagradas — el m\xednimo siempre es mejor que nada.

Principios que aplicas:
1. Nunca sacrifiques la racha por el nivel perfecto
2. El entorno determina el comportamiento m\xe1s que la voluntad
3. Celebra victorias peque\xf1as con entusiasmo genuino
4. El contexto del d\xeda manda sobre las metas r\xedgidas

Comunica en espa\xf1ol. S\xe9 conciso (m\xe1x 3 oraciones), c\xe1lido y siempre accionable. Nunca des consejos gen\xe9ricos — todo debe estar basado en los datos reales del usuario.`},9303:(e,a,t)=>{e.exports=t(517)}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[948,400],()=>t(4232));module.exports=r})();