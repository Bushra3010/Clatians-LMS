"use client";
import { useState } from "react";
import type { Update } from "../../lib/resource-types";

const Back = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    What's New
  </button>
);

export default function WhatsNewPage({ onBack, updates }: { onBack: () => void; updates: Update[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} />

      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#0891B2,#0E7490)", borderRadius:20, padding:"18px 16px", marginBottom:16 }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>✨ LATEST UPDATES</span>
          <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>What's New at CLATians</p>
          <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>New features, courses &amp; events</p>
        </div>

        {updates.length === 0 && (
          <div style={{ background:"white", borderRadius:16, padding:"26px 18px", textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:30, marginBottom:6 }}>✨</div>
            <p style={{ margin:0, fontSize:13, color:"#9CA3AF" }}>No updates yet.</p>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {updates.map((u,i)=>(
            <div key={i} style={{ background:"white", borderRadius:18, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"stretch" }}>
                <div style={{ width:5, background:`linear-gradient(180deg,${u.color},${u.color}88)`, flexShrink:0 }}/>
                <div style={{ padding:"14px 16px", flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22 }}>{u.icon}</span>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        {u.tag && <span style={{ background:`${u.color}15`, color:u.color, fontSize:9.5, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>{u.tag}</span>}
                        {u.hot && <span style={{ background:"#FEF2F2", color:"#DC2626", fontSize:9.5, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>🔥 HOT</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:10.5, color:"#9CA3AF", flexShrink:0 }}>{u.dateLabel}</span>
                  </div>
                  <p style={{ margin:"0 0 6px", fontSize:14, fontWeight:800, color:"#1A1A2E", lineHeight:1.35 }}>{u.title}</p>
                  <p style={{ margin:"0 0 10px", fontSize:12.5, color:"#6B7280", lineHeight:1.5 }}>{u.desc}</p>
                  {open === i && u.more && (
                    <div style={{ background:`${u.color}0D`, border:`1px solid ${u.color}22`, borderRadius:12, padding:"10px 12px", marginBottom:10 }}>
                      <p style={{ margin:0, fontSize:12.5, color:"#374151", lineHeight:1.5 }}>{u.more}</p>
                    </div>
                  )}
                  {u.more && (
                    <button onClick={() => setOpen(open === i ? null : i)} style={{ background:`${u.color}12`, color:u.color, border:`1px solid ${u.color}30`, borderRadius:10, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      {open === i ? "Show less" : "Learn More →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
