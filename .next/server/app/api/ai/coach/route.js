"use strict";(()=>{var e={};e.id=44,e.ids=[44],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},6748:(e,o,a)=>{a.r(o),a.d(o,{originalPathname:()=>x,patchFetch:()=>h,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>p,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{POST:()=>c});var t=a(9303),i=a(8716),s=a(670),n=a(7070),l=a(7972);async function c(e){try{let{habits:o,context:a,userName:r}=await e.json(),t=o.filter(e=>!e.completed&&e.scheduled),i=o.filter(e=>e.completed),s=o.reduce((e,o)=>e+o.current_streak,0),c=`
Usuario: ${r||"Usuario"}
Contexto del d\xeda: ${a.busy_level} | Energ\xeda: ${a.energy_level}%

H\xe1bitos pendientes hoy (${t.length}):
${t.map(e=>`- ${e.name}: racha ${e.current_streak} d\xedas, nivel actual ${e.current_difficulty_level}`).join("\n")}

Completados hoy: ${i.length}
Racha total acumulada: ${s} d\xedas

Genera un brief motivacional para este momento. Responde SOLO con JSON v\xe1lido:
{
  "mensaje": "mensaje motivacional personalizado (m\xe1x 2 oraciones)",
  "accion_inmediata": "qu\xe9 hacer en los pr\xf3ximos 5 minutos",
  "habito_foco_id": "${t[0]?.id||null}",
  "nivel_sugerido": "${"overloaded"===a.busy_level||a.energy_level<30?"minimum":"busy"===a.busy_level?"ideal":"elite"}",
  "puntuacion_momentum": <n\xfamero 0-100 basado en el contexto>,
  "emoji": "<emoji que representa el momento>"
}`,u=await l.Ml.chat.completions.create({model:l.dX.coach,messages:[{role:"system",content:l.p6},{role:"user",content:c}],temperature:.7,max_tokens:400,response_format:{type:"json_object"}}),d=u.choices[0]?.message?.content??"{}",m=JSON.parse(d);return n.NextResponse.json({brief:m})}catch(e){return console.error("[AI Coach]",e),n.NextResponse.json({brief:{mensaje:"Cada acci\xf3n peque\xf1a construye el camino. Empieza con un solo paso hoy.",accion_inmediata:"Abre tu primer h\xe1bito y completa el nivel m\xednimo.",habito_foco_id:null,nivel_sugerido:"ideal",puntuacion_momentum:70,emoji:"\uD83C\uDFAF"}})}}let u=new t.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/ai/coach/route",pathname:"/api/ai/coach",filename:"route",bundlePath:"app/api/ai/coach/route"},resolvedPagePath:"C:\\Users\\Asus\\Downloads\\habitflow\\app\\api\\ai\\coach\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:p}=u,x="/api/ai/coach/route";function h(){return(0,s.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:m})}},7972:(e,o,a)=>{a.d(o,{Ml:()=>r,dX:()=>t,p6:()=>i});let r=new(a(9400)).ZP({apiKey:process.env.GROQ_API_KEY}),t={coach:"llama-3.3-70b-versatile",fast:"llama-3.1-8b-instant"},i=`Eres HabitFlow AI, un coach de comportamiento basado en Atomic Habits y Nudge Theory. Tu misi\xf3n es ayudar al usuario a construir h\xe1bitos duraderos mediante reducci\xf3n de fricci\xf3n y adaptaci\xf3n din\xe1mica.

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

Comunica en espa\xf1ol. S\xe9 conciso (m\xe1x 3 oraciones), c\xe1lido y siempre accionable. Nunca des consejos gen\xe9ricos — todo debe estar basado en los datos reales del usuario.`}};var o=require("../../../../webpack-runtime.js");o.C(e);var a=e=>o(o.s=e),r=o.X(0,[948,972,400],()=>a(6748));module.exports=r})();