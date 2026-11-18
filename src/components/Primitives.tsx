"use client";
import { useEffect,useRef,type KeyboardEvent } from "react";
import { X,Check,FileText,Users,MapPin,Swords,Flag,UserRound } from "lucide-react";
import type { Entity,Kind } from "@/lib/types";
export const kindIcons={character:UserRound,faction:Users,location:MapPin,item:Swords,event:Flag,lore:FileText};
export function KindIcon({kind,size=16}:{kind:Kind;size?:number}){const Icon=kindIcons[kind];return <Icon size={size} strokeWidth={1.6}/>;}
export function Status({entity}:{entity:Entity}){return <span className={"status "+(entity.status==="canon"?"canon":"draft")}>{entity.status==="canon"?<Check size={11}/>:<span className="small-dot"/>}{entity.status==="canon"?"공식 설정":"초안"}</span>;}
export function Empty({children,action}:{children:React.ReactNode;action?:React.ReactNode}){return <div className="empty"><FileText size={27} strokeWidth={1}/><p>{children}</p>{action}</div>;}
export function tabKeyNavigation(event:KeyboardEvent<HTMLElement>){
 const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
 const index=tabs.indexOf(event.target as HTMLButtonElement);
 const next=event.key==="ArrowRight"?(index+1)%tabs.length:event.key==="ArrowLeft"?(index-1+tabs.length)%tabs.length:event.key==="Home"?0:event.key==="End"?tabs.length-1:-1;
 if(next<0)return;
 event.preventDefault();tabs[next]?.click();tabs[next]?.focus();
}
export function Modal({title,children,onClose,wide=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const prev=document.activeElement as HTMLElement;const first=ref.current?.querySelector<HTMLElement>("button,input,textarea,select");first?.focus();function key(e:globalThis.KeyboardEvent){if(e.key==="Escape"){e.stopPropagation();close.current();}if(e.key==="Tab"){const elements=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')||[]).filter(el=>el.tabIndex>=0&&el.getClientRects().length);if(!elements.length)return;const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);requestAnimationFrame(()=>{if(prev?.isConnected&&!prev.closest("[inert]"))prev.focus();});};},[]);
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} className={"modal "+(wide?"wide":"")} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={18}/></button></div>{children}</div></div>;
}
