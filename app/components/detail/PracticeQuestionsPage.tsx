"use client";
import { useState } from "react";

const Back = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    Practice Questions
  </button>
);

const topics = [
  { name:"Principle-Fact Questions", subject:"Legal Reasoning", count:120, done:45, diff:"Medium" },
  { name:"Constitutional Provisions", subject:"Legal Reasoning", count:80, done:20, diff:"Hard" },
  { name:"Reading Comprehension", subject:"English", count:60, done:60, diff:"Medium" },
  { name:"Vocabulary in Context", subject:"English", count:100, done:10, diff:"Easy" },
  { name:"Current Affairs MCQs", subject:"GK & CA", count:200, done:80, diff:"Easy" },
  { name:"Ratio & Proportion", subject:"Quant", count:50, done:0, diff:"Medium" },
  { name:"Syllogisms & Analogies", subject:"Logical", count:90, done:30, diff:"Hard" },
];

const diffColor: Record<string,string> = { Easy:"#059669", Medium:"#D97706", Hard:"#DC2626" };

const sampleQ = {
  q: "PRINCIPLE: No person shall be convicted of any offence except for violation of a law in force at the time of commission of the act charged as an offence.\n\nFACT: Ram was tried and convicted under a law that was enacted after he committed the alleged act. Ram challenges his conviction.",
  options: ["Ram cannot be convicted as the law did not exist when he acted.", "Ram can be convicted as the court has discretionary power.", "Ram's conviction is valid since the act was morally wrong.", "Ram should be retried under the old law."],
  correct: 0,
  explanation: "The principle clearly states that conviction requires violation of a law in force at the time of the act. Since the law was enacted after Ram's act, his conviction is unconstitutional — it violates Article 20(1) of the Indian Constitution.",
};

export default function PracticeQuestionsPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<"list"|"quiz">("list");
  const [selected, setSelected] = useState<number|null>(null);
  const [showExplain, setShowExplain] = useState(false);

  if (view === "quiz") {
    return (
      <div style={{ background:"#F7F3EA", minHeight:"100vh", paddingBottom:90 }}>
        <button onClick={()=>{ setView("list"); setSelected(null); setShowExplain(false); }}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"#2B1700", fontSize:14, fontWeight:700, padding:"14px 16px 0" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Topics
        </button>

        <div style={{ padding:"14px 16px 0" }}>
          {/* Question Card */}
          <div style={{ background:"white", borderRadius:18, padding:"18px 16px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ background:"#FEF3E2", color:"#92400E", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>Legal Reasoning</span>
              <span style={{ fontSize:12, color:"#9CA3AF", fontWeight:600 }}>Q 1 of 10</span>
            </div>
            <p style={{ margin:0, fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-line" }}>{sampleQ.q}</p>
          </div>

          {/* Options */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
            {sampleQ.options.map((opt, i) => {
              const isSelected = selected===i;
              const isCorrect = showExplain && i===sampleQ.correct;
              const isWrong = showExplain && isSelected && i!==sampleQ.correct;
              return (
                <button key={i} onClick={()=>{ if(!showExplain){ setSelected(i); }}} style={{
                  background: isCorrect ? "#DCFCE7" : isWrong ? "#FEF2F2" : isSelected ? "#F6ECD9" : "white",
                  border: `2px solid ${isCorrect ? "#15803D" : isWrong ? "#DC2626" : isSelected ? "#C8860A" : "#E5E7EB"}`,
                  borderRadius:14, padding:"14px 16px",
                  display:"flex", alignItems:"center", gap:12, cursor: showExplain?"default":"pointer",
                  textAlign:"left",
                }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13,
                    background: isCorrect?"#15803D": isWrong?"#DC2626": isSelected?"#C8860A":"#F3F4F6",
                    color: (isCorrect||isWrong||isSelected) ? "white" : "#6B7280"
                  }}>{String.fromCharCode(65+i)}</div>
                  <p style={{ margin:0, fontSize:13, color: isCorrect?"#15803D":isWrong?"#DC2626":"#374151", fontWeight:600, lineHeight:1.4 }}>{opt}</p>
                </button>
              );
            })}
          </div>

          {selected!==null && !showExplain && (
            <button onClick={()=>setShowExplain(true)} style={{ width:"100%", background:"linear-gradient(135deg,#2B1700,#5C3A00)", color:"white", border:"none", borderRadius:14, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              Submit Answer
            </button>
          )}

          {showExplain && (
            <div style={{ background:"#F0FDF4", borderRadius:16, padding:"16px", border:"1.5px solid #BBF7D0", marginBottom:14 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:800, color:"#15803D" }}>✓ Correct Answer: Option A</p>
              <p style={{ margin:0, fontSize:12.5, color:"#374151", lineHeight:1.6 }}>{sampleQ.explanation}</p>
            </div>
          )}

          {showExplain && (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{ setSelected(null); setShowExplain(false); }} style={{ flex:1, background:"#F3F4F6", color:"#374151", border:"none", borderRadius:14, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer" }}>← Previous</button>
              <button style={{ flex:1, background:"linear-gradient(135deg,#2B1700,#5C3A00)", color:"white", border:"none", borderRadius:14, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer" }}>Next →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"#F7F3EA", paddingBottom:90, minHeight:"100vh" }}>
      <Back onBack={onBack} />

      {/* Banner */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"linear-gradient(135deg,#9D174D,#DB2777)", borderRadius:20, padding:"18px 16px" }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>QUESTION BANK</span>
          <p style={{ margin:"8px 0 2px", fontSize:18, fontWeight:800, color:"white" }}>Practice Questions</p>
          <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>700+ topic-wise questions with solutions</p>
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            {[
              { val:"700+", label:"Questions" },
              { val:"185", label:"Attempted" },
              { val:"78%", label:"Accuracy" },
            ].map((s,i)=>(
              <div key={i} style={{ textAlign:"center", background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px 14px" }}>
                <p style={{ margin:0, fontSize:18, fontWeight:900, color:"white" }}>{s.val}</p>
                <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.7)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div style={{ padding:"16px 16px 0" }}>
        <p style={{ margin:"0 0 12px", fontSize:16, fontWeight:800, color:"#1A1A2E" }}>Topics</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {topics.map((t,i)=>(
            <div key={i} style={{ background:"white", borderRadius:16, padding:"14px 16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#1A1A2E" }}>{t.name}</p>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ background:"#FEF3E2", color:"#92400E", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{t.subject}</span>
                    <span style={{ background:`${diffColor[t.diff]}15`, color:diffColor[t.diff], fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{t.diff}</span>
                  </div>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:"#3D2411" }}>{t.done}/{t.count}</span>
              </div>
              <div style={{ height:5, background:"#F3F4F6", borderRadius:20, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:`${(t.done/t.count)*100}%`, background:"linear-gradient(90deg,#DB2777,#F472B6)", borderRadius:20 }}/>
              </div>
              <button onClick={()=>setView("quiz")} style={{
                width:"100%", background: t.done===t.count ? "#F3F4F6" : "linear-gradient(135deg,#9D174D,#DB2777)",
                color: t.done===t.count ? "#9CA3AF" : "white",
                border:"none", borderRadius:12, padding:"10px",
                fontSize:13, fontWeight:700, cursor:"pointer",
              }}>
                {t.done===0 ? "Start Practice" : t.done===t.count ? "✓ Completed" : "Continue →"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
