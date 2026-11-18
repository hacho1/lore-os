"use client";
import { useEffect,useState } from "react";
import type { Entity } from "@/lib/types";
export function Mark(){return <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true"><path d="M15 2 27 9v16l-12 7L3 25V9Z" stroke="currentColor" strokeWidth="1"/><path d="M20 9a8 8 0 1 0 0 16 9 9 0 0 1 0-16Z" fill="currentColor"/><path d="m17 5 .8 2.3L20 8l-2.2.7L17 11l-.7-2.3L14 8l2.3-.7Z" fill="currentColor"/></svg>;}
export function Landscape({className="",example=false}:{className?:string;example?:boolean}){
 if(!example)return <svg className={className} viewBox="0 0 1000 330" fill="none" aria-hidden="true"><rect width="1000" height="330" fill="#202024"/><g stroke="#b6a8cf" strokeOpacity=".22"><circle cx="770" cy="165" r="112"/><circle cx="770" cy="165" r="80"/><path d="M610 165h320M770 15v300M690 85l160 160M690 245 850 85"/></g><circle cx="770" cy="85" r="5" fill="#bdace3"/><circle cx="850" cy="165" r="4" fill="#bdace3"/><circle cx="690" cy="165" r="4" fill="#bdace3"/></svg>;
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
 if(entity.imageUrl&&!failed)return <img className={large?"portrait portrait-large":"portrait"} src={entity.imageUrl} alt={entity.name} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
 return <svg className={large?"portrait portrait-large":"portrait"} viewBox="0 0 180 200" role="img" aria-label={entity.name+" 이름 표식 · 이미지 미등록"}><rect width="180" height="200" fill="#28262d"/><rect x="18" y="18" width="144" height="164" rx="2" fill="none" stroke="#494350"/><path d="M74 32h32M74 168h32" stroke="#90829f"/><text x="90" y="118" textAnchor="middle" fill="#d7cce4" fontFamily="Noto Serif KR,serif" fontSize="62">{Array.from(entity.name.trim())[0]||"·"}</text></svg>;
}
