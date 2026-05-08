"use strict";(()=>{var e={};e.id=733,e.ids=[733],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},982:(e,r,a)=>{a.r(r),a.d(r,{originalPathname:()=>h,patchFetch:()=>f,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>x,staticGenerationAsyncStorage:()=>m});var i={};a.r(i),a.d(i,{POST:()=>p});var o=a(9303),t=a(8716),s=a(670),n=a(7070),c=a(7972);let d={fitness:"#f97316",health:"#22c55e",learning:"#8b5cf6",mindfulness:"#06b6d4",productivity:"#3b82f6",social:"#ec4899"};async function p(e){try{let{description:r}=await e.json(),a=`El usuario quiere crear este h\xe1bito: "${r}"

Genera la estructura completa del h\xe1bito. Responde SOLO con JSON v\xe1lido:
{
  "nombre": "nombre conciso del h\xe1bito",
  "icono": "un emoji representativo",
  "categoria": "fitness|health|learning|mindfulness|productivity|social",
  "color": "#hexcolor seg\xfan categor\xeda",
  "levels": {
    "minimum": {"duration": <2-10 min>, "description": "versi\xf3n m\xednima espec\xedfica", "points": 10},
    "ideal": {"duration": <15-30 min>, "description": "versi\xf3n ideal espec\xedfica", "points": 25},
    "elite": {"duration": <45-90 min>, "description": "versi\xf3n elite espec\xedfica", "points": 50}
  },
  "schedule": {
    "time": "HH:MM m\xe1s apropiado para este h\xe1bito",
    "days": ["mon","tue","wed","thu","fri"] (o ajusta seg\xfan el h\xe1bito),
    "pre_habit_reminder": true o false seg\xfan si necesita preparaci\xf3n,
    "pre_habit_message": "mensaje de recordatorio nocturno si aplica, si no empty string"
  },
  "commitment_contribution": <5-25 seg\xfan importancia del h\xe1bito>
}`,i=await c.Ml.chat.completions.create({model:c.dX.coach,messages:[{role:"system",content:c.p6},{role:"user",content:a}],temperature:.6,max_tokens:600,response_format:{type:"json_object"}}),o=i.choices[0]?.message?.content??"{}",t=JSON.parse(o);return!t.color&&t.categoria&&(t.color=d[t.categoria]??"#3b82f6"),n.NextResponse.json({habit:t})}catch(e){return console.error("[AI Create Habit]",e),n.NextResponse.json({error:"No se pudo crear el h\xe1bito"},{status:500})}}let l=new o.AppRouteRouteModule({definition:{kind:t.x.APP_ROUTE,page:"/api/ai/create-habit/route",pathname:"/api/ai/create-habit",filename:"route",bundlePath:"app/api/ai/create-habit/route"},resolvedPagePath:"C:\\Users\\Asus\\Downloads\\habitflow\\app\\api\\ai\\create-habit\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:u,staticGenerationAsyncStorage:m,serverHooks:x}=l,h="/api/ai/create-habit/route";function f(){return(0,s.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:m})}},7972:(e,r,a)=>{a.d(r,{Ml:()=>i,dX:()=>o,p6:()=>t});let i=new(a(9400)).ZP({apiKey:process.env.GROQ_API_KEY}),o={coach:"llama-3.3-70b-versatile",fast:"llama-3.1-8b-instant"},t=`Eres HabitFlow AI, un coach de comportamiento basado en Atomic Habits y Nudge Theory. Tu misi\xf3n es ayudar al usuario a construir h\xe1bitos duraderos mediante reducci\xf3n de fricci\xf3n y adaptaci\xf3n din\xe1mica.

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

Comunica en espa\xf1ol. S\xe9 conciso (m\xe1x 3 oraciones), c\xe1lido y siempre accionable. Nunca des consejos gen\xe9ricos — todo debe estar basado en los datos reales del usuario.`}};var r=require("../../../../webpack-runtime.js");r.C(e);var a=e=>r(r.s=e),i=r.X(0,[948,972,400],()=>a(982));module.exports=i})();