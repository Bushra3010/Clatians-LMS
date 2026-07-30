"use client";

import type { ReactElement } from "react";

/** Renders AI text safely: paragraphs, • / - / numbered bullets, **bold**, and
 * lightweight "## heading" lines. No raw HTML is ever injected. */
export default function AiText({ text }: { text: string }): ReactElement {
  return (
    <>
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.length > 0 && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} style={{ margin: "5px 0", paddingLeft: 18 }}>
              {lines.map((l, j) => (
                <li key={j} style={{ margin: "2px 0" }}>{inlineBold(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        const heading = block.match(/^#{1,6}\s+(.*)$/);
        if (heading && lines.length === 1) {
          return (
            <p key={i} style={{ margin: "8px 0 3px", fontWeight: 800, fontSize: 12.5 }}>{inlineBold(heading[1])}</p>
          );
        }
        return <p key={i} style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>{inlineBold(block)}</p>;
      })}
    </>
  );
}

function inlineBold(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );
}
