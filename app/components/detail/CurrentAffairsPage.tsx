"use client";
import { useState } from "react";

const Back = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    Current Affairs
  </button>
);

const cats = ["All","Law & Judiciary","Polity","Economy","International","Science & Tech","Awards","Sports"];

const news = [
  { date:"May 11", headline:"Supreme Court upholds Right to Privacy as absolute Fundamental Right in landmark 9-judge bench ruling", tag:"Law & Judiciary", importance:"HIGH", mcq: true },
  { date:"May 11", headline:"Parliament passes Criminal Procedure Code (Amendment) Bill 2026 with key provisions on cybercrime", tag:"Polity", importance:"HIGH", mcq: true },
  { date:"May 10", headline:"India signs Free Trade Agreement with 6 EU nations, effective from July 2026", tag:"International", importance:"MEDIUM", mcq: true },
  { date:"May 10", headline:"India GDP growth rate stands at 7.2% for Q4 FY2025-26, beats IMF projection", tag:"Economy", importance:"MEDIUM", mcq: false },
  { date:"May 9", headline:"ISRO launches GSAT-30B satellite for enhanced broadband connectivity in remote regions", tag:"Science & Tech", importance:"MEDIUM", mcq: true },
  { date:"May 9", headline:"India ranks 132nd on Human Development Index 2026, up 4 places from last year", tag:"International", importance:"LOW", mcq: false },
  { date:"May 8", headline:"Padma Awards 2026 announced — 130 recipients across Art, Science, and Social Work", tag:"Awards", importance:"LOW", mcq: true },
  { date:"May 8", headline:"NITI Aayog releases India Innovation Index 2026 — Karnataka tops among large states", tag:"Economy", importance:"LOW", mcq: false },
  { date:"May 7", headline:"Indian cricket team wins ICC Champions Trophy 2026, defeats Australia in final", tag:"Sports", importance:"LOW", mcq: false },
];

const importanceColor: Record<string,{ bg:string; text:string }> = {
  HIGH: { bg:"#FEF2F2", text:"#DC2626" },
  MEDIUM: { bg:"#FEF9C3", text:"#D97706" },
  LOW: { bg:"#F3F4F6", text:"#6B7280" },
};

export default function CurrentAffairsPage({ onBack }: { onBack: () => void }) {
  const [activeCat, setActiveCat] = useState("All");
  const [expanded, setExpanded] = useState<number|null>(null);

  const filtered = activeCat==="All" ? news : news.filter(n=>n.tag===activeCat);

  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} />

      {/* Banner */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#6D28D9,#7C3AED)", borderRadius:20, padding:"18px 16px" }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>DAILY UPDATE</span>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginTop:8 }}>
            <div>
              <p style={{ margin:"0 0 2px", fontSize:18, fontWeight:800, color:"white" }}>Current Affairs</p>
              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>Updated: May 11, 2026 · CLAT focused</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:22, fontWeight:900, color:"white" }}>{news.length}</p>
              <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.7)" }}>Stories today</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:12 }}>
            {[
              { val: news.filter(n=>n.importance==="HIGH").length+"", label:"HIGH", color:"#FCA5A5" },
              { val: news.filter(n=>n.mcq).length+"", label:"With MCQ", color:"#A5F3FC" },
              { val: cats.length-1+"", label:"Categories", color:"#FDE68A" },
            ].map((s,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center", background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px" }}>
                <p style={{ margin:0, fontSize:16, fontWeight:900, color:s.color }}>{s.val}</p>
                <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.7)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ overflowX:"auto" }} className="no-scroll">
        <div style={{ display:"flex", gap:8, padding:"16px 16px 0", width:"max-content" }}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{
              padding:"8px 16px", borderRadius:22, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              background: activeCat===c ? "#6D28D9" : "#F3F4F6",
              color: activeCat===c ? "white" : "#374151",
              boxShadow: activeCat===c ? "0 3px 10px rgba(109,40,217,0.3)" : "none",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* News list */}
      <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map((item,i)=>(
          <div key={i} style={{ background:"white", borderRadius:16, padding:"14px 16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)", cursor:"pointer" }}
            onClick={()=>setExpanded(expanded===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ background:importanceColor[item.importance].bg, color:importanceColor[item.importance].text, fontSize:9.5, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>
                  {item.importance}
                </span>
                <span style={{ background:"#EDE9FE", color:"#6D28D9", fontSize:9.5, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{item.tag}</span>
                {item.mcq && <span style={{ background:"#DBEAFE", color:"#1D4ED8", fontSize:9.5, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>MCQ</span>}
              </div>
              <span style={{ fontSize:10.5, color:"#9CA3AF", fontWeight:600, flexShrink:0 }}>{item.date}</span>
            </div>
            <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#1A1A2E", lineHeight:1.5 }}>{item.headline}</p>

            {expanded===i && item.mcq && (
              <div style={{ marginTop:12, background:"#F5F3FF", borderRadius:12, padding:"14px" }}>
                <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#6D28D9" }}>🧠 CLAT MCQ — Test Yourself</p>
                <p style={{ margin:"0 0 10px", fontSize:12.5, color:"#374151", lineHeight:1.5 }}>
                  Based on the above news, which article of the Indian Constitution most directly relates to this development?
                </p>
                {["Article 19","Article 20","Article 21","Article 32"].map((opt,j)=>(
                  <button key={j} style={{ display:"block", width:"100%", textAlign:"left", background:"white", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"10px 14px", marginBottom:7, fontSize:12.5, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                    {String.fromCharCode(65+j)}. {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
