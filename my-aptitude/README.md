# NexMinds (MyAptitude) — Frontend & Core Application Engine

> **Subdirectory Documentation:** This is the core React 19 + Vite application for NexMinds.  
> **Master Academic Project Documentation:** Refer to the root [README.md](../README.md) for full project details, literature survey, mathematical formulations, and engineering lifecycle matrix.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure .env
cp .env.example .env
# Edit .env with your VITE_GEMINI_API_KEY

# 3. Start local development server
npm run dev

# 4. Production build
npm run build
```

---

## 🛠️ Key Architectural Components

* `src/components/Dashboard.jsx`: Main gamified dashboard featuring dynamic ratings (Math, Logic, Puzzle, Memory), streak tracker, and Smart Study Hub cards.
* `src/components/DocumentStudyTool.jsx`: AI Smart Study Hub providing 4 tools:
  * 🎯 **MCQ Practice** (Guaranteed 10–15 questions, Fisher-Yates shuffled options, conceptual explanations).
  * 📋 **Master Cheatsheet** (High-yield summary, key formulas, direct PDF download & print).
  * 🧠 **Flashcards** (Spaced repetition active recall with mastery tracking).
  * 🗺️ **Mind Map** (Hierarchical multi-branch topic visualization).
* `src/lib/studyToolsAI.js`: Multi-model Gemini waterfall (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, etc.), state-machine self-healing JSON parser, and algorithmic question supplementer.
* `src/lib/documentParser.js`: Client-side streaming PDF, DOCX, PPTX extractor with noise & administrative boilerplate filtering.
* `src/lib/pdfExport.js`: Client-side multi-page vector PDF generation using `jspdf`.
* `src/context/AuthContext.jsx`: User state management, Elo-based dynamic skill rating adjustments, and Supabase cloud persistence.

---

## 📑 Detailed Engineering Lifecycle & Algorithms

For the complete technical breakdown including:
* **Literature Survey** (Adaptive Learning, Computerized Adaptive Testing, Automated Question Generation)
* **Algorithms Implemented** (Modified Elo, Fisher-Yates Permutations, Proportional Token Slicing, Self-Healing JSON Parsing)
* **Engineering Matrix** (Explicit distinction between Real things implemented vs Not Applicable `NA` ML lifecycle stages)

👉 **Please refer to the Master [README.md](../README.md) at the project root.**
