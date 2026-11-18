import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-kr";
import "@fontsource/noto-serif-kr/400.css";
import "@fontsource/noto-serif-kr/500.css";
import "./globals.css";
import "./content.css";
import "./responsive.css";
export const metadata:Metadata={title:"LoreOS — 당신의 세계를 기록하는 곳",description:"세계관 위키, 캐릭터 관계도, 검토 가능한 AI 창작 도우미"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>;}
