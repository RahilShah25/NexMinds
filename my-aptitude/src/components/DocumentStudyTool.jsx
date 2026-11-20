import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, Zap, BookOpen, Brain, Map,
  ChevronLeft, X, CheckCircle, XCircle, RotateCcw,
  ChevronRight, ChevronDown, Download, Printer, AlertCircle,
  Loader2, FileCheck, Trophy, Star, Sparkles, Copy,
  Check, List, Layers, Eye, Shuffle
} from 'lucide-react';
import { extractTextFromFile } from '../lib/documentParser';
import { generateQuiz, generateCheatsheet, generateFlashcards, generateMindMap, shuffleQuestionOptions } from '../lib/studyToolsAI';
import { exportCheatsheetToPDF, printCheatsheet } from '../lib/pdfExport';
import './DocumentStudyTool.css';

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const STUDY_TOOLS = [
  {
    id: 'mcq',
    label: 'MCQ Practice',
    icon: Zap,
    color: '#FF9500',
    desc: 'Deep conceptual MCQs with randomized options, instant scoring & explanations',
  },
  {
    id: 'cheatsheet',
    label: 'Cheatsheet',
    icon: BookOpen,
    color: '#38BDF8',
    desc: 'Structured high-yield summary of modules, formulas, terms, and key facts',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: Brain,
    color: '#0284C7',
    desc: 'Active recall cards to test memory retention and key definitions',
  },
  {
    id: 'mindmap',
    label: 'Mind Map',
    icon: Map,
    color: '#10B981',
    desc: 'Hierarchical visual breakdown of document topics and relationships',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DocumentStudyTool({ onBack }) {
  const [phase, setPhase] = useState('upload'); // upload | processing | tools | result
  const [fileInfo, setFileInfo] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolResult, setToolResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [processingPercent, setProcessingPercent] = useState(0);
  const [generatingStep, setGeneratingStep] = useState('');
  const [questionCount, setQuestionCount] = useState(15); // 10, 15, or 20 MCQs
  const [activeDiagramModal, setActiveDiagramModal] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedTypes = '.pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.svg';

  const handleFile = useCallback(async (file) => {
    setError('');
    if (!file) return;

    const name = file.name.toLowerCase();
    const validExts = [
      '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.md',
      '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff', '.svg'
    ];
    if (!validExts.some((ext) => name.endsWith(ext))) {
      setError('Please upload a valid document or image (PDF, Image/Photo, Word, PowerPoint, or Text).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds 100MB limit. Please upload a document under 100MB.');
      return;
    }

    setPhase('processing');
    setProcessingPercent(5);
    setProcessingMsg(`Loading ${file.name}...`);
    setFileInfo({ name: file.name, size: file.size });

    try {
      const parsed = await extractTextFromFile(file, ({ percent, message }) => {
        if (percent !== undefined) setProcessingPercent(percent);
        if (message) setProcessingMsg(message);
      });

      setExtractedText(parsed.text);
      setFileInfo({
        name: file.name,
        size: file.size,
        fileType: parsed.fileType,
        pageCount: parsed.pageCount,
        charCount: parsed.charCount,
        wordCount: parsed.wordCount,
        images: parsed.images || [],
      });
      setPhase('tools');
    } catch (err) {
      console.error('[DocumentStudyTool] Parse error:', err);
      setError(err.message || 'Failed to extract text from file. Please ensure it contains selectable text.');
      setPhase('upload');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handleToolSelect = async (toolId) => {
    setSelectedTool(toolId);
    setIsGenerating(true);
    setGeneratingStep('Sampling document sections across all pages & slides...');
    setToolResult(null);
    setPhase('result');
    setError('');

    try {
      let result;
      const onStatus = (status) => setGeneratingStep(status);
      if (toolId === 'mcq' || toolId === 'quiz') {
        result = await generateQuiz(extractedText, questionCount, onStatus);
      } else if (toolId === 'cheatsheet') {
        result = await generateCheatsheet(extractedText, onStatus);
      } else if (toolId === 'flashcards') {
        result = await generateFlashcards(extractedText, 16, onStatus);
      } else if (toolId === 'mindmap') {
        result = await generateMindMap(extractedText, onStatus);
      }
      setToolResult(result);
    } catch (err) {
      console.error('[DocumentStudyTool] Generation error:', err);
      setError('An error occurred during analysis. Please try again.');
      setPhase('tools');
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  const resetToUpload = () => {
    setPhase('upload');
    setFileInfo(null);
    setExtractedText('');
    setSelectedTool(null);
    setToolResult(null);
    setError('');
  };

  return (
    <div className="dst-container" id="document-study-tool">
      {/* Header */}
      <div className="dst-header">
        <button className="dst-back-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="dst-header-title">
          <div className="dst-header-icon">
            <BookOpen size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="dst-title">Smart Study Hub</h1>
            <p className="dst-subtitle">AI Document Intelligence • Instant MCQ Practice, Cheatsheets, Flashcards &amp; Mind Maps</p>
          </div>
        </div>

        {fileInfo && phase !== 'upload' && (
          <div className="dst-file-chip">
            <FileCheck size={14} />
            <span title={fileInfo.name}>{fileInfo.name}</span>
            <button onClick={resetToUpload} className="dst-chip-clear" title="Remove file">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="dst-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* ── PHASE: Upload ─────────────────────────────────────────────────── */}
      {phase === 'upload' && (
        <UploadZone
          dragOver={dragOver}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          fileInputRef={fileInputRef}
          acceptedTypes={acceptedTypes}
          onFileChange={(e) => handleFile(e.target.files[0])}
        />
      )}

      {/* ── PHASE: Processing ─────────────────────────────────────────────── */}
      {phase === 'processing' && (
        <div className="dst-processing">
          <div className="dst-processing-icon">
            <Loader2 size={48} className="dst-spin text-accent" />
          </div>
          <h2 className="dst-processing-title">Processing & Extracting Content</h2>
          <p className="dst-processing-msg">{processingMsg}</p>
          <div className="dst-processing-bar">
            <div className="dst-processing-fill" style={{ width: `${Math.max(5, processingPercent)}%` }} />
          </div>
          <div className="dst-processing-meta">
            <span className="dst-proc-pct">{processingPercent}% Completed</span>
            <span className="dst-proc-filename">{fileInfo?.name}</span>
          </div>
        </div>
      )}

      {/* ── PHASE: Tool Selection ─────────────────────────────────────────── */}
      {phase === 'tools' && (
        <ToolSelector
          fileInfo={fileInfo}
          extractedText={extractedText}
          onSelectTool={handleToolSelect}
          onReset={resetToUpload}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          onOpenDiagram={(img) => setActiveDiagramModal(img)}
        />
      )}

      {/* ── PHASE: Result ─────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <ResultView
          toolId={selectedTool}
          result={toolResult}
          isGenerating={isGenerating}
          generatingStep={generatingStep}
          onRetry={() => handleToolSelect(selectedTool)}
          onSwitchTool={(newToolId) => handleToolSelect(newToolId)}
          fileInfo={fileInfo}
          onBack={() => setPhase('tools')}
          onReset={resetToUpload}
        />
      )}

      {/* Visual Diagram Lightbox Modal */}
      {activeDiagramModal && (
        <DiagramModal
          image={activeDiagramModal}
          onClose={() => setActiveDiagramModal(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD ZONE
// ═══════════════════════════════════════════════════════════════════════════════
function UploadZone({ dragOver, onDrop, onDragOver, onDragLeave, fileInputRef, acceptedTypes, onFileChange }) {
  return (
    <div className="dst-upload-section">
      <div
        className={`dst-dropzone ${dragOver ? 'dst-dropzone--active' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload document"
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={onFileChange}
          className="dst-hidden-input"
          id="dst-file-input"
        />
        <div className="dst-dropzone-inner">
          <div className="dst-upload-icon-wrap">
            <Upload size={38} />
          </div>
          <h2 className="dst-dropzone-title">Upload your study material</h2>
          <p className="dst-dropzone-sub">Drag & drop your file here, or click to browse</p>
          <div className="dst-file-types">
            <span className="dst-type-chip dst-type-pdf">PDF Document</span>
            <span className="dst-type-chip dst-type-img">Images & Scans</span>
            <span className="dst-type-chip dst-type-docx">Word DOCX/DOC</span>
            <span className="dst-type-chip dst-type-ppt">PowerPoint PPTX</span>
            <span className="dst-type-chip dst-type-txt">Text / MD</span>
          </div>
          <p className="dst-dropzone-limit">Supports digital documents, scanned image PDFs, textbook captures & photos up to 100MB</p>
        </div>
      </div>

      {/* Features */}
      <div className="dst-how-it-works">
        <h3 className="dst-hiw-title">Four Instant AI Study Tools</h3>
        <div className="dst-hiw-steps">
          {[
            { step: '1', title: 'MCQ Practice', desc: '10–20 deep conceptual questions with visual diagram analysis', icon: Zap },
            { step: '2', title: 'Master Cheatsheet', desc: 'Executive summary, key formulas & exam takeaways (PDF download)', icon: BookOpen },
            { step: '3', title: 'Active Flashcards', desc: 'Retention-focused flashcards with mastery tracking', icon: Brain },
            { step: '4', title: 'Visual Mind Map', desc: 'Hierarchical multi-branch topic relationship map', icon: Map },
          ].map((s) => {
            const StepIcon = s.icon;
            return (
              <div key={s.step} className="dst-hiw-step">
                <div className="dst-hiw-step-icon">
                  <StepIcon size={20} className="text-accent-light" />
                </div>
                <div className="dst-hiw-step-num">{s.title}</div>
                <div className="dst-hiw-step-text">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════
function ToolSelector({
  fileInfo,
  extractedText,
  onSelectTool,
  onReset,
  questionCount = 15,
  setQuestionCount,
  onOpenDiagram,
}) {
  const wordCount = fileInfo?.wordCount || extractedText.split(/\s+/).filter(Boolean).length;
  const pageCount = fileInfo?.pageCount || 1;
  const hasImages = Array.isArray(fileInfo?.images) && fileInfo.images.length > 0;

  return (
    <div className="dst-tool-selector">
      {/* Document Stats */}
      <div className="dst-doc-stats">
        <div className="dst-doc-stat-card">
          <FileText size={22} className="text-blue" />
          <div>
            <div className="dst-stat-value">{fileInfo?.fileType || 'Doc'}</div>
            <div className="dst-stat-label">File Type</div>
          </div>
        </div>
        <div className="dst-doc-stat-card">
          <BookOpen size={22} className="text-accent" />
          <div>
            <div className="dst-stat-value">{wordCount.toLocaleString()}</div>
            <div className="dst-stat-label">Words Extracted</div>
          </div>
        </div>
        <div className="dst-doc-stat-card">
          <Layers size={22} className="text-cyan" />
          <div>
            <div className="dst-stat-value">
              {fileInfo?.fileType === 'IMAGE' ? '1 Image' : fileInfo?.fileType === 'PPTX' || fileInfo?.fileType === 'PPT' ? `${pageCount} Slides` : `${pageCount} Pages`}
            </div>
            <div className="dst-stat-label">Length</div>
          </div>
        </div>
        <div className="dst-doc-stat-card">
          <CheckCircle size={22} className="text-green" />
          <div>
            <div className="dst-stat-value">Ready</div>
            <div className="dst-stat-label">AI Ready</div>
          </div>
        </div>
      </div>

      <div className="dst-tool-section-title">
        <h2>Select an AI Study Tool</h2>
        <p>Choose how you want to analyze and study <strong>{fileInfo?.name}</strong></p>
      </div>

      <div className="dst-tools-grid">
        {STUDY_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              className={`dst-tool-card ${tool.id === 'mcq' ? 'dst-tool-card--mcq' : ''}`}
              onClick={() => onSelectTool(tool.id)}
              style={{ '--tool-color': tool.color }}
              id={`dst-tool-${tool.id}`}
            >
              {tool.id === 'mcq' && (
                <div className="dst-tool-featured-badge">{questionCount} Questions (AI Vision)</div>
              )}
              <div className="dst-tool-card-icon">
                <Icon size={28} />
              </div>
              <h3 className="dst-tool-card-label">{tool.label}</h3>
              <p className="dst-tool-card-desc">{tool.desc}</p>

              {tool.id === 'mcq' && setQuestionCount && (
                <div className="dst-mcq-count-picker" onClick={(e) => e.stopPropagation()}>
                  <span className="dst-mcq-count-label">Question Count:</span>
                  <div className="dst-mcq-count-pills">
                    {[10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`dst-mcq-count-btn ${questionCount === num ? 'dst-mcq-count-btn--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuestionCount(num);
                        }}
                      >
                        {num} MCQs
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="dst-tool-card-cta">
                Generate with AI <ChevronRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Multimodal Vision: Extracted & Analyzed Presentation/Document Schematics */}
      {hasImages && (
        <div className="dst-diagrams-gallery-section">
          <div className="dst-diagrams-header">
            <div className="dst-diagrams-title-group">
              <Eye size={20} className="text-cyan" />
              <h3>AI Vision: Extracted &amp; Analyzed Diagrams ({fileInfo.images.length})</h3>
            </div>
            <span className="dst-diagrams-subtitle">
              Presentation &amp; document schematics synthesized into your MCQ assessment
            </span>
          </div>

          <div className="dst-diagrams-grid">
            {fileInfo.images.map((img, i) => (
              <div
                key={img.id || i}
                className="dst-diagram-card"
                onClick={() => onOpenDiagram?.(img)}
                role="button"
                tabIndex={0}
                title="Click to view full schematic & AI analysis"
                onKeyDown={(e) => e.key === 'Enter' && onOpenDiagram?.(img)}
              >
                <div className="dst-diagram-thumb-wrap">
                  <img src={img.dataUrl} alt={img.name || `Diagram ${i + 1}`} className="dst-diagram-thumb-img" />
                  <span className="dst-diagram-slide-tag">Slide / Page {img.slide || i + 1}</span>
                </div>
                <div className="dst-diagram-card-meta">
                  <div className="dst-diagram-name">{img.name || `Figure ${i + 1}`}</div>
                  <div className="dst-diagram-snippet">
                    {(img.description || '').replace(/[\*#_]/g, '').slice(0, 110)}...
                  </div>
                  <div className="dst-diagram-view-link">
                    Inspect Diagram &amp; AI Breakdown <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT VIEW (Container for result views with top status bar)
// ═══════════════════════════════════════════════════════════════════════════════
function ResultView({ toolId, result, isGenerating, generatingStep, onRetry, onSwitchTool, fileInfo, onBack, onReset }) {
  if (isGenerating) {
    const tool = STUDY_TOOLS.find((t) => t.id === toolId);
    return (
      <div className="dst-generating">
        <div className="dst-generating-orb">
          <Loader2 size={52} className="dst-spin" style={{ color: tool?.color || '#2563EB' }} />
        </div>
        <h2>Analyzing Document & Generating {tool?.label}...</h2>
        <p className="dst-gen-step-txt">{generatingStep || 'Gemini AI is reading content, synthesizing key insights, and structuring your materials...'}</p>
        <div className="dst-gen-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const toolName = STUDY_TOOLS.find((t) => t.id === toolId)?.label;
  const isAI = result._isAIGenerated !== false;
  const modelDisplay = result._modelUsed
    ? result._modelUsed.replace('models/', '').replace(/^gemini-/, 'Gemini ').toUpperCase()
    : 'Gemini AI';

  return (
    <div className="dst-result-wrapper">
      <div className="dst-result-topbar">
        <button className="dst-back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> Switch Tool
        </button>

        <div className="dst-result-tag">
          <span className="dst-result-title-txt">{toolName} • {fileInfo?.name}</span>
          <span className={`dst-ai-badge ${isAI ? 'dst-ai-badge--active' : 'dst-ai-badge--fallback'}`}>
            <Sparkles size={13} />
            {isAI ? modelDisplay : 'Algorithmic Mode'}
          </span>
          {!isAI && onRetry && (
            <button className="dst-retry-ai-btn" onClick={() => onRetry(toolId)} title="Retry generation with AI">
              <RotateCcw size={12} /> Retry with AI
            </button>
          )}
        </div>

        <button className="dst-reset-btn" onClick={onReset}>
          <RotateCcw size={14} /> New Document
        </button>
      </div>

      {/* Persistent Tool Switcher Tabs - Visible across all tool result views */}
      <div className="dst-tool-tabs-bar">
        {STUDY_TOOLS.map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`dst-tool-tab-btn ${t.id === toolId ? 'dst-tool-tab-btn--active' : ''}`}
              onClick={() => onSwitchTool?.(t.id)}
              style={{ '--tab-color': t.color }}
            >
              <span className="dst-tab-icon"><TabIcon size={14} /></span>
              <span className="dst-tab-label">{t.label}</span>
              {t.id === 'mcq' && <span className="dst-tab-badge">10–20 Qs</span>}
            </button>
          );
        })}
      </div>

      {(toolId === 'mcq' || toolId === 'quiz') && (
        <MCQView questions={result} onRegenerate={() => onRetry?.(toolId)} />
      )}
      {toolId === 'cheatsheet' && <CheatsheetView data={result} />}
      {toolId === 'flashcards' && <FlashcardsView cards={result} />}
      {toolId === 'mindmap' && <MindMapView data={result} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MCQ PRACTICE VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function MCQView({ questions = [], onRegenerate }) {
  const [items, setItems] = useState(() => shuffleQuestionOptions(questions));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wrong'

  useEffect(() => {
    setItems(shuffleQuestionOptions(questions));
    setCurrent(0);
    setSelected(null);
    setAnswered([]);
    setShowResult(false);
    setScore(0);
  }, [questions]);

  const q = items[current] || {};
  const isAnswered = answered[current] !== undefined;
  const progress = items.length > 0 ? ((current + 1) / items.length) * 100 : 0;
  const correctIdx = typeof q.correct === 'number' ? q.correct : (Number(q.answer) || 0);

  const handleSelect = (idx) => {
    if (isAnswered) return;
    const newAnswered = [...answered];
    newAnswered[current] = idx;
    setAnswered(newAnswered);
    setSelected(idx);
    if (idx === correctIdx) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (current + 1 >= items.length) {
      setShowResult(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(answered[current + 1] ?? null);
    }
  };

  const restartQuiz = (reshuffle = true) => {
    if (reshuffle) {
      setItems(shuffleQuestionOptions(items));
    }
    setCurrent(0);
    setSelected(null);
    setAnswered([]);
    setShowResult(false);
    setScore(0);
    setFilterMode('all');
  };

  if (!items || items.length === 0) {
    return (
      <div className="dst-empty-state">
        <AlertCircle size={40} className="text-orange" />
        <h3>No questions available</h3>
        <p>Could not extract valid questions from this document.</p>
        {onRegenerate && (
          <button className="dst-btn-primary" onClick={onRegenerate}>
            <RotateCcw size={16} /> Try Again
          </button>
        )}
      </div>
    );
  }

  if (showResult) {
    const pct = Math.round((score / items.length) * 100);
    const wrongItems = items.filter((item, i) => {
      const cIdx = typeof item.correct === 'number' ? item.correct : (Number(item.answer) || 0);
      return answered[i] !== cIdx;
    });

    const displayList = filterMode === 'wrong'
      ? items.map((item, idx) => ({ item, idx })).filter(({ item, idx }) => {
          const cIdx = typeof item.correct === 'number' ? item.correct : (Number(item.answer) || 0);
          return answered[idx] !== cIdx;
        })
      : items.map((item, idx) => ({ item, idx }));

    return (
      <div className="dst-quiz-result">
        <div className="dst-quiz-result-icon">
          {pct >= 70 ? <Trophy size={64} className="text-gold" /> : <Star size={64} className="text-blue" />}
        </div>
        <h2 className="dst-quiz-result-title">Practice Complete!</h2>
        <div className="dst-quiz-score-ring">
          <span className="dst-score-pct">{pct}%</span>
          <span className="dst-score-label">{score} / {items.length} Correct</span>
        </div>
        <p className="dst-quiz-feedback">
          {pct >= 90
            ? 'Outstanding mastery! You understood the material thoroughly.'
            : pct >= 70
            ? 'Great job! You have strong comprehension of the document concepts.'
            : pct >= 50
            ? 'Solid effort! Review the detailed explanations below to reinforce key concepts.'
            : 'Keep practicing! Review the Cheatsheet and Flashcards, then retake.'}
        </p>

        <div className="dst-quiz-result-btns">
          <button className="dst-btn-primary" onClick={() => restartQuiz(true)}>
            <Shuffle size={16} /> Retake with Shuffled Options
          </button>
          {onRegenerate && (
            <button className="dst-btn-secondary" onClick={onRegenerate}>
              <RotateCcw size={16} /> Generate New Questions
            </button>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="dst-quiz-breakdown-list">
          <div className="dst-breakdown-header-row">
            <h3 className="dst-breakdown-title">Question Breakdown</h3>
            <div className="dst-breakdown-filters">
              <button
                className={`dst-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All ({items.length})
              </button>
              <button
                className={`dst-filter-btn ${filterMode === 'wrong' ? 'active' : ''}`}
                onClick={() => setFilterMode('wrong')}
              >
                Mistakes ({wrongItems.length})
              </button>
            </div>
          </div>

          {displayList.map(({ item: question, idx: i }) => {
            const cIdx = typeof question.correct === 'number' ? question.correct : (Number(question.answer) || 0);
            const isCorrect = answered[i] === cIdx;
            return (
              <div key={i} className={`dst-breakdown-card ${isCorrect ? 'dst-breakdown--correct' : 'dst-breakdown--wrong'}`}>
                <div className="dst-breakdown-card-header">
                  <div className="dst-bd-meta">
                    <span className="dst-breakdown-card-num">Q{i + 1}</span>
                    {question.topic && (
                      <span className="dst-quiz-topic-tag">{question.topic}</span>
                    )}
                  </div>
                  <span className="dst-breakdown-card-status">
                    {isCorrect ? (
                      <>
                        <CheckCircle size={16} className="text-green" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red" /> Incorrect
                      </>
                    )}
                  </span>
                </div>
                <p className="dst-breakdown-q">{question.question}</p>
                <div className="dst-breakdown-answers-grid">
                  <div className={`dst-bd-ans-box ${isCorrect ? 'dst-bd-ans--ok' : 'dst-bd-ans--miss'}`}>
                    <span className="dst-bd-label">Your Answer:</span>
                    <span className="dst-bd-text">
                      {answered[i] !== undefined
                        ? `${String.fromCharCode(65 + answered[i])}. ${question.options?.[answered[i]] || ''}`
                        : 'Not answered'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="dst-bd-ans-box dst-bd-ans--target">
                      <span className="dst-bd-label">Correct Answer:</span>
                      <span className="dst-bd-text">
                        {String.fromCharCode(65 + cIdx)}. {question.options?.[cIdx] || ''}
                      </span>
                    </div>
                  )}
                </div>
                {question.explanation && (
                  <div className="dst-breakdown-exp">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="dst-quiz-view">
      {/* Progress & Counter */}
      <div className="dst-quiz-progress-wrap">
        <div className="dst-quiz-progress-bar">
          <div className="dst-quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="dst-quiz-counter-group">
          <span className="dst-quiz-counter">
            Question {current + 1} of {items.length}
          </span>
          <span className="dst-quiz-total-pill">
            {items.length} Questions (AI Grounded)
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="dst-quiz-card">
        <div className="dst-quiz-card-top">
          <span className="dst-quiz-q-num">Question {current + 1}</span>
          {q.topic && (
            <span className="dst-quiz-topic-pill">
              {q.topic}
            </span>
          )}
        </div>

        <h3 className="dst-quiz-question">{q.question}</h3>

        <div className="dst-quiz-options">
          {q.options?.map((opt, idx) => {
            let cls = 'dst-quiz-option';
            if (isAnswered) {
              if (idx === correctIdx) cls += ' dst-option-correct';
              else if (idx === selected) cls += ' dst-option-wrong';
              else cls += ' dst-option-dim';
            } else if (selected === idx) {
              cls += ' dst-option-selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={cls}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
              >
                <span className="dst-option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="dst-option-text">{opt}</span>
                {isAnswered && idx === correctIdx && (
                  <CheckCircle size={18} className="dst-option-icon text-green" />
                )}
                {isAnswered && idx === selected && idx !== correctIdx && (
                  <XCircle size={18} className="dst-option-icon text-red" />
                )}
              </button>
            );
          })}
        </div>

        {/* Real-time conceptual explanation upon answering */}
        {isAnswered && q.explanation && (
          <div className="dst-quiz-explanation animate-fadeIn">
            <span className="dst-explanation-tag">Conceptual Explanation</span>
            <p>{q.explanation}</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="dst-quiz-actions">
          {isAnswered ? (
            <button className="dst-btn-primary dst-btn-next" onClick={next}>
              <span>{current + 1 >= items.length ? 'See Final Score' : 'Next Question'}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <p className="dst-quiz-hint">Select the best answer above to check correctness and reveal explanation.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CHEATSHEET VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function CheatsheetView({ data }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      exportCheatsheetToPDF(data);
    } catch (err) {
      console.error('[PDF Export] Failed:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    printCheatsheet();
  };

  const copyAsMarkdown = () => {
    let md = `# ${data.title || 'Cheatsheet'}\n\n`;
    if (data.summary) md += `> ${data.summary}\n\n`;

    if (data.sections?.length) {
      data.sections.forEach((sec, i) => {
        md += `## ${i + 1}. ${sec.heading}\n`;
        sec.points?.forEach((pt) => { md += `- ${pt}\n`; });
        if (sec.formula) md += `\n\`\`\`\n${sec.formula}\n\`\`\`\n`;
        md += '\n';
      });
    }

    if (data.keyTerms?.length) {
      md += `## Key Terms\n`;
      data.keyTerms.forEach((t) => { md += `- **${t.term}**: ${t.definition}\n`; });
      md += '\n';
    }

    if (data.quickFacts?.length) {
      md += `## High-Yield Quick Facts\n`;
      data.quickFacts.forEach((f, i) => { md += `${i + 1}. ${f}\n`; });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dst-cheatsheet">
      <div className="dst-cheatsheet-header">
        <div className="dst-cs-header-content">
          <h2 className="dst-cs-title">{data.title || 'Document Master Cheatsheet'}</h2>
          {data.summary && <p className="dst-cs-summary">{data.summary}</p>}
        </div>

        <div className="dst-cs-header-actions">
          <button
            className="dst-cs-download-btn"
            onClick={handleDownloadPDF}
            disabled={downloading}
            title="Download formatted Cheatsheet as PDF for offline reference"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          <button
            className="dst-cs-print-btn"
            onClick={handlePrint}
            title="Print or Save as Vector PDF via browser dialog"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>

          <button className="dst-cs-copy-btn" onClick={copyAsMarkdown} title="Copy as Markdown">
            {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Sections Grid */}
      {data.sections && data.sections.length > 0 && (
        <div className="dst-cs-sections">
          {data.sections.map((section, i) => (
            <div key={i} className="dst-cs-section">
              <h3 className="dst-cs-section-heading">
                <span className="dst-cs-section-num">{i + 1}</span>
                {section.heading}
              </h3>
              <ul className="dst-cs-points">
                {section.points?.map((point, pi) => (
                  <li key={pi} className="dst-cs-point">
                    <span className="dst-cs-bullet">◆</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {section.formula && (
                <div className="dst-cs-formula">
                  <code>{section.formula}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Key Terms */}
      {data.keyTerms && data.keyTerms.length > 0 && (
        <div className="dst-cs-block">
          <h3 className="dst-cs-block-title">Essential Vocabulary & Key Terms</h3>
          <div className="dst-cs-terms-grid">
            {data.keyTerms.map((item, i) => (
              <div key={i} className="dst-cs-term-card">
                <div className="dst-cs-term-name">{item.term}</div>
                <div className="dst-cs-term-def">{item.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Facts */}
      {data.quickFacts && data.quickFacts.length > 0 && (
        <div className="dst-cs-block">
          <h3 className="dst-cs-block-title">High-Yield Exam Facts & Takeaways</h3>
          <div className="dst-cs-facts">
            {data.quickFacts.map((fact, i) => (
              <div key={i} className="dst-cs-fact">
                <span className="dst-fact-num">{i + 1}</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FLASHCARDS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function FlashcardsView({ cards = [] }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'

  const activeCards = cards.filter((_, i) => !mastered.has(i));
  const card = activeCards[current % Math.max(activeCards.length, 1)];
  const totalMastered = mastered.size;

  const flip = () => setFlipped((f) => !f);

  const markMastered = () => {
    if (!card) return;
    const origIdx = cards.indexOf(card);
    setMastered((prev) => new Set([...prev, origIdx]));
    setFlipped(false);
    if (current >= activeCards.length - 1) setCurrent(0);
  };

  const next = () => {
    setFlipped(false);
    setCurrent((c) => (c + 1) % Math.max(activeCards.length, 1));
  };

  const prev = () => {
    setFlipped(false);
    setCurrent((c) => (c - 1 + Math.max(activeCards.length, 1)) % Math.max(activeCards.length, 1));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'card') return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowRight') {
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeCards.length]);

  return (
    <div className="dst-flashcards">
      {/* Top Controls */}
      <div className="dst-fc-topbar">
        <div className="dst-fc-stats">
          <div className="dst-fc-stat">
            <span className="dst-fc-stat-val">{cards.length}</span>
            <span className="dst-fc-stat-label">Total</span>
          </div>
          <div className="dst-fc-progress-track">
            <div
              className="dst-fc-progress-fill"
              style={{ width: `${(totalMastered / Math.max(cards.length, 1)) * 100}%` }}
            />
          </div>
          <div className="dst-fc-stat">
            <span className="dst-fc-stat-val text-green">{totalMastered}</span>
            <span className="dst-fc-stat-label">Mastered</span>
          </div>
        </div>

        <div className="dst-fc-mode-toggles">
          <button
            className={`dst-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Single Card Study"
          >
            <Layers size={15} /> Card Mode
          </button>
          <button
            className={`dst-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Full List View"
          >
            <List size={15} /> List View
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="dst-fc-list-grid">
          {cards.map((c, idx) => {
            const isDone = mastered.has(idx);
            return (
              <div key={idx} className={`dst-fc-list-card ${isDone ? 'mastered' : ''}`}>
                <div className="dst-fc-list-header">
                  <span className="dst-fc-badge">#{idx + 1} • {c.category || 'General'}</span>
                  <button
                    className={`dst-fc-list-check ${isDone ? 'checked' : ''}`}
                    onClick={() => {
                      setMastered((prev) => {
                        const nextSet = new Set(prev);
                        if (nextSet.has(idx)) nextSet.delete(idx);
                        else nextSet.add(idx);
                        return nextSet;
                      });
                    }}
                  >
                    <CheckCircle size={16} />
                  </button>
                </div>
                <div className="dst-fc-list-front"><strong>Q:</strong> {c.front}</div>
                <div className="dst-fc-list-back"><strong>A:</strong> {c.back}</div>
              </div>
            );
          })}
        </div>
      ) : activeCards.length === 0 ? (
        <div className="dst-flashcards-done">
          <div className="dst-done-icon">
            <CheckCircle2 size={36} className="text-success" />
          </div>
          <h2>All Cards Mastered!</h2>
          <p>You have successfully mastered all {cards.length} cards from this document.</p>
          <button className="dst-btn-primary" onClick={() => { setMastered(new Set()); setCurrent(0); }}>
            <RotateCcw size={16} /> Reset & Practice Again
          </button>
        </div>
      ) : (
        <>
          <div className="dst-fc-counter">
            Card {(current % activeCards.length) + 1} of {activeCards.length}
            {card?.category && <span className="dst-fc-category">{card.category}</span>}
          </div>

          <div
            className={`dst-fc-card ${flipped ? 'dst-fc-card--flipped' : ''}`}
            onClick={flip}
            tabIndex={0}
            role="button"
            aria-label="Flip flashcard"
          >
            <div className="dst-fc-front">
              <div className="dst-fc-side-label">FRONT — Click or press Space to flip</div>
              <div className="dst-fc-content">{card?.front}</div>
            </div>
            <div className="dst-fc-back">
              <div className="dst-fc-side-label">BACK — Answer</div>
              <div className="dst-fc-content">{card?.back}</div>
            </div>
          </div>

          <div className="dst-fc-controls">
            <button className="dst-fc-nav-btn" onClick={prev} title="Previous (Left Arrow)">
              <ChevronLeft size={22} />
            </button>
            <button className="dst-fc-flip-btn" onClick={flip}>
              <RotateCcw size={16} /> Flip Card
            </button>
            <button className="dst-fc-master-btn" onClick={markMastered} disabled={!flipped}>
              <CheckCircle size={16} /> Got it!
            </button>
            <button className="dst-fc-nav-btn" onClick={next} title="Next (Right Arrow)">
              <ChevronRight size={22} />
            </button>
          </div>

          <p className="dst-fc-hint">Tip: Use Left/Right arrow keys to navigate, Spacebar to flip</p>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. MIND MAP VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function MindMapView({ data }) {
  const [expanded, setExpanded] = useState({});

  const toggleBranch = (idx) =>
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const expandAll = () => {
    const all = {};
    data.branches?.forEach((_, i) => { all[i] = true; });
    setExpanded(all);
  };

  const collapseAll = () => {
    const all = {};
    data.branches?.forEach((_, i) => { all[i] = false; });
    setExpanded(all);
  };

  return (
    <div className="dst-mindmap">
      <div className="dst-mm-topbar">
        <div className="dst-mm-actions">
          <button className="dst-mm-act-btn" onClick={expandAll}>Expand All</button>
          <button className="dst-mm-act-btn" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      <div className="dst-mm-root">
        <div className="dst-mm-root-node">
          <Sparkles size={16} className="text-accent" />
          <span className="dst-mm-root-txt">{data.root || 'Document Overview'}</span>
        </div>
      </div>

      <div className="dst-mm-branches">
        {data.branches?.map((branch, bi) => {
          const isExp = expanded[bi] !== false; // Default open
          return (
            <div key={bi} className="dst-mm-branch-group">
              <button
                className="dst-mm-branch-node"
                style={{ '--branch-color': branch.color }}
                onClick={() => toggleBranch(bi)}
              >
                <span className="dst-mm-branch-dot" style={{ background: branch.color }} />
                <span className="dst-mm-branch-label">{branch.label}</span>
                <span className="dst-mm-badge">{branch.children?.length || 0}</span>
                <ChevronDown
                  size={14}
                  className={`dst-mm-chevron ${isExp ? 'dst-mm-chevron--open' : ''}`}
                />
              </button>

              {isExp && branch.children?.length > 0 && (
                <div className="dst-mm-children animate-fadeIn">
                  {branch.children.map((child, ci) => (
                    <div key={ci} className="dst-mm-child-group">
                      <div
                        className="dst-mm-child-node"
                        style={{ borderColor: `${branch.color}50` }}
                      >
                        <span
                          className="dst-mm-child-dot"
                          style={{ background: branch.color }}
                        />
                        <span>{child.label}</span>
                      </div>

                      {child.children?.length > 0 && (
                        <div className="dst-mm-grandchildren">
                          {child.children.map((gc, gi) => (
                            <div key={gi} className="dst-mm-grandchild">
                              <span style={{ color: branch.color }}>•</span> {gc.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dst-mm-legend">
        <p className="dst-mm-legend-text">Click any topic node to expand or collapse details</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DIAGRAM & SCHEMATIC LIGHTBOX MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function DiagramModal({ image, onClose }) {
  if (!image) return null;

  return (
    <div className="dst-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dst-diagram-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dst-diagram-modal-header">
          <div className="dst-diagram-modal-title">
            <Eye size={18} className="text-cyan" />
            <span>Slide / Page {image.slide} Diagram • AI Technical Analysis</span>
          </div>
          <button className="dst-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="dst-diagram-modal-body">
          <div className="dst-diagram-modal-img-col">
            <div className="dst-diagram-modal-img-frame">
              <img src={image.dataUrl} alt={image.name} className="dst-diagram-modal-img" />
            </div>
            <span className="dst-diagram-modal-img-name">{image.name}</span>
          </div>

          <div className="dst-diagram-modal-desc-col">
            <h4 className="dst-diagram-modal-h4">Gemini Multimodal Technical Synthesis</h4>
            <div className="dst-diagram-modal-text">
              {image.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
