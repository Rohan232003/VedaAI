'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore, QuestionTypeName } from '@/store/assignmentStore';
import FileUpload from '@/components/FileUpload';

const questionTypeOptions: QuestionTypeName[] = [
  'MCQ', 'Short Answer', 'Long Answer', 'True/False',
  'Fill in the Blanks', 'Match the Following', 'Case Study', 'Assertion & Reason',
];

const questionTypeLabels: Record<string, string> = {
  'MCQ': 'Multiple Choice Questions',
  'Short Answer': 'Short Questions',
  'Long Answer': 'Long Answer Questions',
  'True/False': 'True/False',
  'Fill in the Blanks': 'Fill in the Blanks',
  'Match the Following': 'Match the Following',
  'Case Study': 'Case Study',
  'Assertion & Reason': 'Assertion & Reason',
};

export default function CreateAssignment() {
  const router = useRouter();
  const {
    formData, updateFormData, addQuestionType, removeQuestionType,
    updateQuestionType, createAssignment, resetForm, isLoading,
  } = useAssignmentStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const totalQuestions = formData.questionTypes.reduce((s, qt) => s + qt.count, 0);
  const totalMarks = formData.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!formData.title.trim()) e.title = 'Title is required';
      if (!formData.subject.trim()) e.subject = 'Subject is required';
      if (!formData.className.trim()) e.className = 'Class is required';
    }
    if (step === 2) {
      if (!formData.dueDate) e.dueDate = 'Due date is required';
      if (formData.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
      for (let i = 0; i < formData.questionTypes.length; i++) {
        if (formData.questionTypes[i].count < 1) e[`qt_count_${i}`] = 'Min 1';
        if (formData.questionTypes[i].marks < 1) e[`qt_marks_${i}`] = 'Min 1';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const id = await createAssignment();
    if (id) {
      resetForm();
      router.push(`/assignment/${id}`);
    }
  };

  return (
    <div className="create-page fade-in">
      {/* Page Header */}
      <div className="create-page-header">
        <button className="create-mobile-back" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="create-page-header-left">
          <div className="create-page-dot" />
          <div>
            <h1 className="create-page-title">Create Assignment</h1>
            <p className="create-page-subtitle">Set up a new assignment for your students</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="create-progress">
        <div className={`create-progress-segment ${step >= 1 ? 'active' : ''}`} />
        <div className={`create-progress-segment ${step >= 2 ? 'active' : ''}`} />
      </div>

      {/* Step 1: Basic Details */}
      {step === 1 && (
        <div className="create-card fade-in">
          <div className="create-section-header">
            <h2 className="create-section-title">Basic Details</h2>
            <p className="create-section-subtitle">Enter the basic information for your assignment</p>
          </div>

          <div className="create-form-group">
            <label className="create-form-label">Assignment Title <span className="required">*</span></label>
            <input className="create-form-input" placeholder="e.g. Mid-Term Physics Exam" value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })} />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="create-form-row">
            <div className="create-form-group">
              <label className="create-form-label">Subject <span className="required">*</span></label>
              <input className="create-form-input" placeholder="e.g. Physics" value={formData.subject}
                onChange={(e) => updateFormData({ subject: e.target.value })} />
              {errors.subject && <div className="form-error">{errors.subject}</div>}
            </div>
            <div className="create-form-group">
              <label className="create-form-label">Class <span className="required">*</span></label>
              <input className="create-form-input" placeholder="e.g. Class 10" value={formData.className}
                onChange={(e) => updateFormData({ className: e.target.value })} />
              {errors.className && <div className="form-error">{errors.className}</div>}
            </div>
          </div>

          <div className="create-form-group">
            <label className="create-form-label">Topic / Chapter</label>
            <input className="create-form-input" placeholder="e.g. Electricity" value={formData.topic}
              onChange={(e) => updateFormData({ topic: e.target.value })} />
          </div>

          {/* Upload Reference */}
          <div className="create-form-group">
            <label className="create-form-label">Upload Reference Material (Optional)</label>
            <FileUpload
              currentFile={formData.fileName}
              onUploaded={(fileUrl, fileName) => updateFormData({ fileUrl, fileName })}
              onRemove={() => updateFormData({ fileUrl: undefined, fileName: undefined })}
            />
          </div>

          <div className="create-nav">
            <button className="create-nav-prev" onClick={() => router.push('/')}>
              ← Cancel
            </button>
            <button className="create-nav-next" onClick={() => { if (validate()) setStep(2); }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Assignment Details */}
      {step === 2 && (
        <div className="create-card fade-in">
          <div className="create-section-header">
            <h2 className="create-section-title">Assignment Details</h2>
            <p className="create-section-subtitle">Basic information about your assignment</p>
          </div>

          {/* File Upload Zone */}
          <div className="create-form-group">
            <FileUpload
              currentFile={formData.fileName}
              onUploaded={(fileUrl, fileName) => updateFormData({ fileUrl, fileName })}
              onRemove={() => updateFormData({ fileUrl: undefined, fileName: undefined })}
            />
            <p className="create-upload-hint">Upload images of your preferred document/image</p>
          </div>

          {/* Due Date */}
          <div className="create-form-group">
            <label className="create-form-label create-form-label-bold">Due Date</label>
            <div className="create-date-input-wrap">
              <input type="date" className="create-form-input" placeholder="DD-MM-YYYY" value={formData.dueDate}
                onChange={(e) => updateFormData({ dueDate: e.target.value })} />
              <svg className="create-date-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            {errors.dueDate && <div className="form-error">{errors.dueDate}</div>}
          </div>

          {/* Question Types */}
          <div className="create-qt-section">
            <div className="create-qt-header">
              <span className="create-form-label create-form-label-bold">Question Type</span>
              <span className="create-qt-col-label">No. of Questions</span>
              <span className="create-qt-col-label">Marks</span>
            </div>

            {formData.questionTypes.map((qt, i) => (
              <div key={i} className="create-qt-row">
                <div className="create-qt-select-wrap">
                  <select className="create-qt-select" value={qt.type}
                    onChange={(e) => updateQuestionType(i, { type: e.target.value as QuestionTypeName })}>
                    {questionTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>{questionTypeLabels[opt] || opt}</option>
                    ))}
                  </select>
                  <svg className="create-qt-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {formData.questionTypes.length > 1 && (
                  <button className="create-qt-remove" onClick={() => removeQuestionType(i)}>×</button>
                )}
                <div className="create-qt-counter">
                  <button type="button" onClick={() => updateQuestionType(i, { count: Math.max(1, qt.count - 1) })}>−</button>
                  <span className="create-qt-counter-value">{qt.count}</span>
                  <button type="button" onClick={() => updateQuestionType(i, { count: qt.count + 1 })}>+</button>
                </div>
                <div className="create-qt-counter">
                  <button type="button" onClick={() => updateQuestionType(i, { marks: Math.max(1, qt.marks - 1) })}>−</button>
                  <span className="create-qt-counter-value">{qt.marks}</span>
                  <button type="button" onClick={() => updateQuestionType(i, { marks: qt.marks + 1 })}>+</button>
                </div>
              </div>
            ))}

            <button className="create-qt-add" onClick={addQuestionType}>
              <span className="create-qt-add-icon">+</span>
              Add Question Type
            </button>

            {errors.questionTypes && <div className="form-error">{errors.questionTypes}</div>}

            <div className="create-qt-totals">
              <div>Total Questions : {totalQuestions}</div>
              <div>Total Marks : {totalMarks}</div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="create-form-group">
            <label className="create-form-label create-form-label-bold">Additional Information (For better output)</label>
            <div className="create-textarea-wrap">
              <textarea className="create-form-textarea" rows={4}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                value={formData.additionalInstructions}
                onChange={(e) => updateFormData({ additionalInstructions: e.target.value })}
              />
              <svg className="create-textarea-mic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
          </div>

          <div className="create-nav">
            <button className="create-nav-prev" onClick={() => setStep(1)}>
              ← Previous
            </button>
            <button className="create-nav-next" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: 0 }} />
                  Generating...
                </>
              ) : (
                <>Next →</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
