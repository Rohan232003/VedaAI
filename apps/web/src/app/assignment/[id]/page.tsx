'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function AssignmentOutput() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    currentAssignment, fetchAssignment, regenerateAssignment,
    isLoading, generationStatus,
  } = useAssignmentStore();
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchAssignment(id);
  }, [id, fetchAssignment]);

  const isGenerating = currentAssignment?.status === 'generating' || currentAssignment?.status === 'queued';
  const isFailed = currentAssignment?.status === 'failed';
  const paper = currentAssignment?.generatedPaper;

  const activeStatus = generationStatus?.assignmentId === id ? generationStatus : null;

  const handleDownloadPDF = async () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !paperRef.current) return;

      printWindow.document.write(`
        <html><head><title>${paper?.subject || 'Question Paper'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', serif; padding: 40px; color: #101828; line-height: 1.7; }
          .paper-school { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 4px; }
          .paper-subject { font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 2px; }
          .paper-class { font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 16px; }
          .paper-meta { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
          .paper-instructions { font-size: 13px; margin-bottom: 16px; }
          .paper-student-fields { margin-bottom: 24px; }
          .paper-student-field { font-size: 13px; margin-bottom: 6px; }
          .paper-student-line { display: inline-block; width: 180px; border-bottom: 1px solid #101828; }
          .paper-section-title { font-size: 16px; font-weight: 700; text-align: center; margin: 28px 0 12px; }
          .paper-section-type { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
          .paper-section-instruction { font-size: 12px; font-style: italic; color: #667085; margin-bottom: 12px; }
          .paper-question { margin-bottom: 10px; font-size: 13px; line-height: 1.7; }
          .paper-options { padding-left: 24px; margin-top: 4px; margin-bottom: 6px; }
          .paper-option { font-size: 13px; margin-bottom: 2px; }
          .paper-end { font-size: 13px; font-weight: 700; font-style: italic; margin-top: 24px; }
          .paper-answer-title { font-size: 16px; font-weight: 800; margin: 32px 0 16px; }
          .paper-answer-item { font-size: 13px; margin-bottom: 8px; line-height: 1.6; padding-left: 8px; }
          @media print { body { padding: 24px; } }
        </style></head><body>
        ${paperRef.current.innerHTML}
        <script>window.onload = function() { window.print(); }<\/script>
        </body></html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  // Loading state
  if (isLoading && !currentAssignment) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Loading assignment...</div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="output-page fade-in">
        <div className="output-banner">
          <div className="output-banner-text">
            <div className="output-banner-title">Generating your question paper</div>
            <div className="output-banner-subtitle">
              {activeStatus?.message || 'Please wait while we create your paper...'}
            </div>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner" />
          <div className="loading-text">{activeStatus?.message || 'Generating questions...'}</div>
          {activeStatus && (
            <div className="loading-progress">
              <div className="loading-progress-bar" style={{ width: `${activeStatus.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Failed state
  if (isFailed) {
    return (
      <div className="output-page fade-in">
        <div className="output-banner output-banner-error">
          <div className="output-banner-text">
            <div className="output-banner-title">❌ Generation Failed</div>
            <div className="output-banner-subtitle">{currentAssignment?.errorMessage || 'Something went wrong'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <button className="create-nav-next" onClick={() => regenerateAssignment(id)}>
            🔄 Retry Generation
          </button>
          <button className="create-nav-prev" onClick={() => router.push('/')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Loading paper...</div>
      </div>
    );
  }

  // Success — render the exam paper matching Figma design
  return (
    <div className="output-page fade-in">
      {/* Dark Banner with Download */}
      <div className="output-banner">
        <div className="output-banner-text">
          <div className="output-banner-title">
            Certainly, Here are customized Question Paper for your {paper.className} {paper.subject} classes on the NCERT chapters:
          </div>
          <button className="output-download-btn" onClick={handleDownloadPDF} style={{ marginTop: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download as PDF
          </button>
        </div>
      </div>

      {/* Paper Content */}
      <div className="paper-container" ref={paperRef}>
        {/* School Header */}
        <div className="paper-school">{paper.schoolName}</div>
        <div className="paper-subject">Subject: {paper.subject}</div>
        <div className="paper-class">Class: {paper.className}</div>

        {/* Time / Marks Row */}
        <div className="paper-meta">
          <span>Time Allowed: {paper.timeAllowed}</span>
          <span>Maximum Marks: {paper.maxMarks}</span>
        </div>

        {/* General Instructions */}
        {paper.generalInstructions && paper.generalInstructions.length > 0 && (
          <div className="paper-instructions">
            {paper.generalInstructions.map((inst, i) => (
              <div key={i}>{inst}</div>
            ))}
          </div>
        )}

        {/* Student Info Fields */}
        <div className="paper-student-fields">
          <div className="paper-student-field">Name: <span className="paper-student-line" /></div>
          <div className="paper-student-field">Roll Number: <span className="paper-student-line" /></div>
          <div className="paper-student-field">Class: {paper.className} Section: <span className="paper-student-line paper-student-line-short" /></div>
        </div>

        {/* Sections */}
        {paper.sections.map((section, si) => (
          <div key={si} className="paper-section">
            <div className="paper-section-title">{section.title}</div>
            {section.subtitle && <div className="paper-section-type">{section.subtitle}</div>}
            {section.instruction && (
              <div className="paper-section-instruction">{section.instruction}</div>
            )}
            {section.questions.map((q) => (
              <div key={q.number} className="paper-question">
                <span>{q.number}.  [{q.difficulty}] {q.text} [{q.marks} Mark{q.marks > 1 ? 's' : ''}]</span>
                {q.options && q.options.length > 0 && (
                  <div className="paper-options">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="paper-option">{opt}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="paper-end">End of Question Paper</div>

        {/* Answer Key */}
        {paper.answerKey && paper.answerKey.length > 0 && (
          <div className="paper-answer-section">
            <div className="paper-answer-title">Answer Key:</div>
            {paper.answerKey.map((ak) => (
              <div key={ak.questionNumber} className="paper-answer-item">
                {ak.questionNumber}.  {ak.answer}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
