"use client";
import { useEffect,useState } from "react";
import type { Entity } from "@/lib/types";
export function Mark(){return <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true"><path d="M15 2 27 9v16l-12 7L3 25V9Z" stroke="currentColor" strokeWidth="1"/><path d="M20 9a8 8 0 1 0 0 16 9 9 0 0 1 0-16Z" fill="currentColor"/><path d="m17 5 .8 2.3L20 8l-2.2.7L17 11l-.7-2.3L14 8l2.3-.7Z" fill="currentColor"/></svg>;}
export function Landscape({className=""}:{className?:string}){
 return <svg className={className} viewBox="0 0 1000 330" fill="none" preserveAspectRatio="xMidYMid slice" role="img" aria-label="멈춘 바다와 소금항의 등대를 그린 LoreOS 원화">
 <rect width="1000" height="330" fill="#20272a"/><circle cx="738" cy="90" r="58" fill="#c6c5b8"/><circle cx="717" cy="76" r="57" fill="#20272a"/>
 <g fill="#9caaa9" opacity=".55">{[[78,44],[160,87],[340,37],[490,74],[575,25],[912,74],[847,26],[43,125],[645,69]].map(([x,y])=><circle key={x} cx={x} cy={y} r="1.2"/>)}</g>
 <path d="M0 223 82 178 137 195 242 124 318 164 386 124 463 201 528 179 600 213 664 176 741 216 830 190 915 199 1000 165V330H0Z" fill="#303b3d"/>
 <path d="m0 253 111-45 105 25 114-52 92 40 128 15 67-34 86 44 116-27 181 28V330H0Z" fill="#263235"/>
 <path d="M0 274q250-30 500-4t500-9v69H0Z" fill="#192426"/>
 <g stroke="#7c9290" opacity=".23" strokeWidth="1">{Array.from({length:12},(_,i)=><path key={i} d={`M${80+(i%3)*90} ${272+i*5}h${650-i*15}`}/>)}</g>
 <g fill="#101b1e"><path d="M590 245v-72l17-9 16 9v72zM584 174l23-14 23 14zM599 160v-26h16v26zM596 135l11-14 11 14z"/><path d="M652 261v-58h45v58zM648 203l27-26 27 26zM707 266v-46h38v46zM702 220l25-22 25 22zM541 260v-38h34v38zM537 223l21-18 21 18z"/><path d="M420 270q120-46 255-5l60 15-315 17Z"/><path d="M0 289q120-50 234-15l86 56H0Z"/></g>
 <path d="M603 141h9v13h-9z" fill="#dfc89c"/><path d="m613 145 192-24-192 33Z" fill="#d9cdac" opacity=".06"/>
 <g stroke="#8a9691" opacity=".3"><path d="M580 265h188M603 178v65M611 178v65M657 214h31M657 229h31M714 231h24M588 248h40"/></g>
 <g stroke="#526564" opacity=".5"><path d="m120 253 23 11 25-8M810 264l21 9 40-8M853 290l48-6M369 286l52-4"/></g>
 </svg>;
}
export function Portrait({entity,large=false}:{entity:Entity;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[entity.imageUrl]);
 const hue=entity.id.includes("haerin")?"#9caaa0":entity.id.includes("noel")?"#b5a790":"#afa2bd";
 if(entity.imageUrl&&!failed)return <img className={large?"portrait portrait-large":"portrait"} src={entity.imageUrl} alt={entity.name} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
 return <svg className={large?"portrait portrait-large":"portrait"} viewBox="0 0 180 200" role="img" aria-label={entity.name+"의 인물 표식"}>
 <rect width="180" height="200" fill="#27272b"/><circle cx="90" cy="87" r="60" stroke={hue} strokeOpacity=".23"/><circle cx="90" cy="87" r="68" stroke={hue} strokeOpacity=".1"/>
 <path d="M15 200q5-51 48-68l27 14 26-14q45 14 49 68" fill="#18181c"/><path d="m63 133-18 47 45-25 45 25-18-47-27 13Z" fill={hue} fillOpacity=".21"/>
 <path d="M62 86q0-38 28-38t28 38q0 42-28 48T62 86Z" fill={hue} fillOpacity=".58"/>
 <path d={entity.id.includes("haerin")?"M57 132q-8-57 3-78 25-36 54 1 15 17 10 76l-13-28V74L80 83 68 66l-1 42Z":"M58 93q-15-40 18-54 30-12 48 24l-7 39-8-36-17 19 2-19-26 20-4 18Z"} fill="#131316"/>
 <path d="m78 103 8 1m12-1 8-2" stroke="#ded6c9" strokeOpacity=".7"/>
 <path d="m90 156-5 44h10Z" fill={hue} fillOpacity=".35"/>
 </svg>;
}
