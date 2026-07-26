"use client";
import { useState } from "react";

const BackArrow = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    Video Lectures
  </button>
);

const subjects = ["All", "Legal Reasoning", "English", "GK & CA", "Quant", "Logical Reasoning"];

const chapters: Record<string, { ch: string; topics: { title: string; dur: string; watched: boolean; locked?: boolean }[] }[]> = {
  "Legal Reasoning": [
    { ch: "Chapter 1 — Introduction", topics: [
      { title: "What is Legal Reasoning?", dur: "22 min", watched: true },
      { title: "Principle-Fact Method", dur: "35 min", watched: true },
      { title: "Cause & Effect in Law", dur: "28 min", watched: false },
      { title: "Landmark Cases Intro", dur: "40 min", watched: false },
    ]},
    { ch: "Chapter 2 — Constitutional Law", topics: [
      { title: "Fundamental Rights Overview", dur: "45 min", watched: false, locked: true },
      { title: "Article 21 & Life Liberty", dur: "52 min", watched: false, locked: true },
    ]},
  ],
  "English": [
    { ch: "Chapter 1 — Reading Comprehension", topics: [
      { title: "RC Strategy for CLAT", dur: "30 min", watched: false },
      { title: "Advanced Inference Questions", dur: "38 min", watched: false, locked: true },
    ]},
    { ch: "Chapter 2 — Vocabulary", topics: [
      { title: "Root Words & Etymology", dur: "25 min", watched: false, locked: true },
    ]},
  ],
  "GK & CA": [
    { ch: "Chapter 1 — Static GK", topics: [
      { title: "Indian Constitution Basics", dur: "35 min", watched: true },
      { title: "Important Committees & Reports", dur: "28 min", watched: false },
    ]},
  ],
  "Quant": [
    { ch: "Chapter 1 — Number System", topics: [
      { title: "CLAT Quant Strategy", dur: "20 min", watched: false },
      { title: "Ratio & Proportion", dur: "32 min", watched: false, locked: true },
    ]},
  ],
  "Logical Reasoning": [
    { ch: "Chapter 1 — Patterns", topics: [
      { title: "Series & Analogy", dur: "25 min", watched: false },
      { title: "Critical Reasoning", dur: "40 min", watched: false, locked: true },
    ]},
  ],
};

export default function VideoLecturesPage({ onBack }: { onBack: () => void }) {
  const [activeSubject, setActiveSubject] = useState("Legal Reasoning");
  const data = chapters[activeSubject] || chapters["Legal Reasoning"];
  const total = data.flatMap(c => c.topics).length;
  const done = data.flatMap(c => c.topics).filter(t => t.watched).length;

  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <BackArrow onBack={onBack} />

      {/* Header */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#2B1700,#5C3A00)", borderRadius:20, padding:"18px 16px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(200,134,10,0.15)" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <span style={{ background:"#C8860A", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>VIDEO LIBRARY</span>
              <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>Video Lectures</p>
              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.7)" }}>{total} videos · CLAT 2026</p>
            </div>
            <div style={{ textAlign:"center", background:"rgba(255,255,255,0.12)", borderRadius:14, padding:"12px 16px" }}>
              <p style={{ margin:0, fontSize:28, fontWeight:900, color:"#C8860A" }}>{Math.round((done/total)*100)}%</p>
              <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.7)" }}>Complete</p>
            </div>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.15)", borderRadius:20, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.round((done/total)*100)}%`, background:"linear-gradient(90deg,#C8860A,#F5A623)", borderRadius:20 }}/>
          </div>
          <p style={{ margin:"6px 0 0", fontSize:11, color:"rgba(255,255,255,0.6)" }}>{done} of {total} videos watched</p>
        </div>
      </div>

      {/* Subject tabs */}
      <div style={{ overflowX:"auto", paddingBottom:0 }} className="no-scroll">
        <div style={{ display:"flex", gap:8, padding:"16px 16px 0", width:"max-content" }}>
          {subjects.filter(s => s !== "All").map(sub => (
            <button key={sub} onClick={()=>setActiveSubject(sub)} style={{
              padding:"8px 16px", borderRadius:22, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              background: activeSubject===sub ? "#2B1700" : "#F3F4F6",
              color: activeSubject===sub ? "white" : "#374151",
              boxShadow: activeSubject===sub ? "0 3px 10px rgba(43,23,0,0.3)" : "none",
            }}>{sub}</button>
          ))}
        </div>
      </div>

      {/* Chapters */}
      <div style={{ padding:"16px 16px 0" }}>
        {data.map((chapter, ci) => (
          <div key={ci} style={{ marginBottom:16 }}>
            <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:800, color:"#2B1700", letterSpacing:"0.2px" }}>{chapter.ch}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {chapter.topics.map((v, vi) => (
                <div key={vi} style={{
                  background:"white", borderRadius:14, padding:"13px 14px",
                  display:"flex", alignItems:"center", gap:12,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
                  opacity: v.locked ? 0.65 : 1,
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:13, flexShrink:0,
                    background: v.watched ? "linear-gradient(135deg,#DCFCE7,#BBF7D0)" : v.locked ? "#F3F4F6" : "linear-gradient(135deg,#2B1700,#5C3A00)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {v.watched
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : v.locked
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    }
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{v.title}</p>
                    <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
                      <span style={{ background:"#FEF3E2", color:"#92400E", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{activeSubject}</span>
                      <span style={{ fontSize:11, color:"#9CA3AF" }}>⏱ {v.dur}</span>
                    </div>
                  </div>
                  {!v.locked && !v.watched && (
                    <button style={{ background:"linear-gradient(135deg,#2B1700,#5C3A00)", color:"white", border:"none", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Play</button>
                  )}
                  {v.watched && (
                    <span style={{ fontSize:11, color:"#15803D", fontWeight:700 }}>✓ Done</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
