"use client";
import { useState } from "react";
import type { Tip } from "../../lib/resource-types";

const Back = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    Tips & Tricks
  </button>
);

export default function TipsTricksPage({ onBack, tips, savedKeys, onToggleSave }: { onBack: () => void; tips: Tip[]; savedKeys: string[]; onToggleSave: (key: string, title: string, subtitle: string) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const isSaved = (title: string) => savedKeys.includes(title);

  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} />

      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#C8860A,#D97706)", borderRadius:20, padding:"18px 16px", marginBottom:16 }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>💡 EXPERT ADVICE</span>
          <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>Tips & Tricks</p>
          <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>Topper-tested strategies for CLAT 2026</p>
        </div>

        {tips.length === 0 && (
          <div style={{ background:"white", borderRadius:16, padding:"26px 18px", textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:30, marginBottom:6 }}>💡</div>
            <p style={{ margin:0, fontSize:13, color:"#9CA3AF" }}>No tips published yet.</p>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ background:"white", borderRadius:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
              <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${tip.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{tip.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:5, alignItems:"center" }}>
                      {tip.tag && <span style={{ background:`${tip.color}15`, color:tip.color, fontSize:9.5, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>{tip.tag}</span>}
                      {tip.points.length > 0 && <span style={{ fontSize:10, color:"#9CA3AF" }}>{tip.points.length} strategies</span>}
                    </div>
                    <p style={{ margin:"0 0 6px", fontSize:14, fontWeight:800, color:"#1A1A2E", lineHeight:1.35 }}>{tip.title}</p>
                    <p style={{ margin:0, fontSize:12.5, color:"#6B7280", lineHeight:1.4 }}>{tip.body}</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
                    style={{ transform: expanded===i ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>

              {expanded===i && (
                <div style={{ borderTop:"1px solid #F3F4F6", padding:"14px 16px", background:"#FAFAFA" }}>
                  {tip.points.length > 0 && <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:tip.color }}>Key Strategies:</p>}
                  {tip.points.map((point,j)=>(
                    <div key={j} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:`${tip.color}15`, border:`1.5px solid ${tip.color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:800, color:tip.color }}>{j+1}</div>
                      <p style={{ margin:0, fontSize:13, color:"#374151", lineHeight:1.5 }}>{point}</p>
                    </div>
                  ))}
                  <button onClick={() => onToggleSave(tip.title, tip.title, tip.tag)} style={{ marginTop:4, background: isSaved(tip.title) ? "#DCFCE7" : `linear-gradient(135deg,${tip.color},${tip.color}CC)`, color: isSaved(tip.title) ? "#15803D" : "white", border:"none", borderRadius:12, padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {isSaved(tip.title) ? "✓ Saved to My Notes" : "Save to My Notes"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
