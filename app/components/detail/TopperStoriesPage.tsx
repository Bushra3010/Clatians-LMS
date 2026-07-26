"use client";
import type { Story } from "../../lib/resource-types";

const Back = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    CLATians Toppers
  </button>
);

export default function TopperStoriesPage({ onBack, stories }: { onBack: () => void; stories: Story[] }) {
  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} />

      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#2B1700,#5C3A00)", borderRadius:20, padding:"18px 16px", marginBottom:16 }}>
          <span style={{ background:"#C8860A", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>🏆 HALL OF FAME</span>
          <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>CLATians Toppers</p>
          <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.7)" }}>Real stories from NLU qualifiers who trained with us</p>
        </div>

        {stories.length === 0 && (
          <div style={{ background:"white", borderRadius:16, padding:"26px 18px", textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:30, marginBottom:6 }}>🏆</div>
            <p style={{ margin:0, fontSize:13, color:"#9CA3AF" }}>No success stories published yet.</p>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {stories.map((t,i)=>(
            <div key={i} style={{ background:"white", borderRadius:18, overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ height:6, background:`linear-gradient(90deg,${t.color},${t.color}88)` }}/>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${t.color},${t.color}BB)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"white", flexShrink:0 }}>{t.initials}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:800, color:"#1A1A2E" }}>{t.name}</p>
                    <p style={{ margin:"2px 0", fontSize:12, color:"#6B7280" }}>🎓 {t.college}</p>
                    {t.rank && <span style={{ background:`${t.color}15`, color:t.color, fontSize:10.5, fontWeight:800, padding:"2px 9px", borderRadius:20 }}>{t.rank}</span>}
                  </div>
                </div>
                {t.quote && (
                  <div style={{ background:"#F9FAFB", borderRadius:12, padding:"10px 12px" }}>
                    <p style={{ margin:0, fontSize:12.5, color:"#374151", fontStyle:"italic", lineHeight:1.5 }}>&ldquo;{t.quote}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
