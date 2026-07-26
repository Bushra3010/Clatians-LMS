"use client";
import { useState } from "react";

const Back = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    {title}
  </button>
);

const notes = [
  { title:"CLAT 2026 — Legal Reasoning Complete Notes", subject:"Legal Reasoning", pages:112, size:"4.8 MB", type:"PDF", color:"#DC2626", new:true },
  { title:"Constitutional Law — Landmark Judgements", subject:"Legal Reasoning", pages:64, size:"2.9 MB", type:"PDF", color:"#DC2626", new:false },
  { title:"Reading Comprehension Strategies", subject:"English", pages:48, size:"2.1 MB", type:"PDF", color:"#2563EB", new:false },
  { title:"Vocabulary & Word Power for CLAT", subject:"English", pages:80, size:"3.4 MB", type:"PDF", color:"#2563EB", new:true },
  { title:"Current Affairs Jan–May 2026", subject:"GK & CA", pages:196, size:"9.2 MB", type:"PDF", color:"#7C3AED", new:true },
  { title:"Static GK — Indian Polity & Constitution", subject:"GK & CA", pages:88, size:"3.8 MB", type:"PDF", color:"#7C3AED", new:false },
  { title:"Quantitative Techniques Quick Revision", subject:"Quant", pages:44, size:"1.9 MB", type:"PDF", color:"#059669", new:false },
  { title:"Logical Reasoning Formula Sheet", subject:"Logical Reasoning", pages:32, size:"1.2 MB", type:"PDF", color:"#D97706", new:false },
  { title:"CLAT Topper Tips — Strategy Slides", subject:"General", pages:28, size:"5.6 MB", type:"PPT", color:"#C8860A", new:true },
];

const subjects = ["All","Legal Reasoning","English","GK & CA","Quant","Logical Reasoning","General"];

export default function StudyNotesPage({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter==="All" ? notes : notes.filter(n=>n.subject===filter);

  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} title="Study Notes" />

      {/* Header Banner */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#0891B2,#0E7490)", borderRadius:20, padding:"18px 16px" }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>STUDY NOTES</span>
          <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>Study Materials</p>
          <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>{notes.length} documents · PDFs, PPTs, Handouts</p>
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            {[
              { val: notes.filter(n=>n.type==="PDF").length+"", label:"PDFs" },
              { val: notes.filter(n=>n.type==="PPT").length+"", label:"PPTs" },
              { val: notes.filter(n=>n.new).length+"", label:"New" },
            ].map((s,i)=>(
              <div key={i} style={{ textAlign:"center", background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px 14px" }}>
                <p style={{ margin:0, fontSize:18, fontWeight:900, color:"white" }}>{s.val}</p>
                <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.7)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ overflowX:"auto" }} className="no-scroll">
        <div style={{ display:"flex", gap:8, padding:"16px 16px 0", width:"max-content" }}>
          {subjects.map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{
              padding:"8px 16px", borderRadius:22, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              background: filter===s ? "#0891B2" : "#F3F4F6",
              color: filter===s ? "white" : "#374151",
              boxShadow: filter===s ? "0 3px 10px rgba(8,145,178,0.3)" : "none",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map((n,i)=>(
          <div key={i} style={{ background:"white", borderRadius:16, padding:"14px 16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:52, borderRadius:12, background:`${n.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0, border:`1.5px solid ${n.color}20` }}>
              {n.type==="PDF" ? "📄" : "📊"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1A1A2E", lineHeight:1.35 }}>{n.title}</p>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ background:`${n.color}12`, color:n.color, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{n.subject}</span>
                <span style={{ fontSize:11, color:"#9CA3AF" }}>{n.pages} pg · {n.size}</span>
                {n.new && <span style={{ background:"#DCFCE7", color:"#15803D", fontSize:9, fontWeight:800, padding:"1px 7px", borderRadius:20 }}>NEW</span>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
              <span style={{ background:`${n.color}12`, color:n.color, fontSize:9.5, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>{n.type}</span>
              <button style={{ background:`linear-gradient(135deg,${n.color},${n.color}CC)`, color:"white", border:"none", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>↓ Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
