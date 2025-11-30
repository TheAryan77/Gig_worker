"use client";

import React from "react";

import { CodeBlock } from "@/components/ui/code-block";

export default function CodeBlockDemo() {
  const code = `// when client tries to run away without paying...
function releasePayment(workDone) {
  if (!workDone) {
    throw new Error("Nice try. Do the work first 🧐");
  }
  return "💸 Payment released. Freelancer is now happy!";
}
function aiVerify(code) {
  if (code.includes("console.log('hello world')")) {
    return "❌ AI says: Bro... this is not a project.";
  }
  return "✅ Verified by AI. Go get that money 🤑";
}
const escrow = {
  locked: true,
  release() {
    if (this.locked) {
      this.locked = false;
      return "🔐 Escrow unlocked. Funds sent!";
    }
  }
};
console.log(aiVerify("console.log('hello world')"));
console.log(releasePayment(true));
console.log(escrow.release());
`;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <CodeBlock
        language="jsx"
        filename="DummyComponent.jsx"
        highlightLines={[9, 13, 14, 18]}
        code={code}
      />
    </div>
  );
}
