'use client';

import { useState } from 'react';
import { GeneratedOutput } from '@/types';
import { downloadPdf, downloadTxt, copyToClipboard, stripJsonFormatting } from '@/lib/download';

interface Props {
  output: GeneratedOutput;
  onRegenerate: () => void;
  onStartNew: () => void;
  onChangeClient: () => void;
}

export default function OutputPanel({
  output,
  onRegenerate,
  onStartNew,
  onChangeClient,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGhlModal, setShowGhlModal] = useState(false);
  const [ghlStatus, setGhlStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [ghlResult, setGhlResult] = useState<{ ghlUrl?: string; ghlTemplatesUrl?: string; previewUrl?: string; message?: string; error?: string; dataDebug?: string; editorType?: string } | null>(null);

  const displayContent = output.rawJson
    ? stripJsonFormatting(output.rawJson)
    : output.content;

  const handleCopy = async () => {
    await copyToClipboard(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdf = () => {
    downloadPdf('output-content', output.clientName, output.contentType);
  };

  const handleTxt = () => {
    downloadTxt(displayContent, output.clientName, output.contentType);
  };

  const extractSubjectLine = (content: string): string => {
    const match = content.match(/SUBJECT LINE:\s*(.+)/i);
    return match ? match[1].trim() : '';
  };

  const handleSendToGHL = async (templateName: string, subjectLine: string, fromName: string, editorType: 'code' | 'builder') => {
    setGhlStatus('sending');
    setGhlResult(null);

    try {
      const res = await fetch('/api/ghl/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: '',
          clientName: output.clientName,
          content: displayContent,
          subjectLine,
          fromName,
          templateName,
          editorType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGhlStatus('error');
        setGhlResult({ error: data.error });
        return;
      }

      setGhlStatus('success');
      setGhlResult(data);
      setShowGhlModal(false);
    } catch {
      setGhlStatus('error');
      setGhlResult({ error: 'Failed to connect to Ghutte. Try again.' });
    }
  };

  const showGhlButton = ['newsletter', 'email-sequence'].includes(output.contentType);
  const defaultSubject = extractSubjectLine(displayContent);

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8">
      <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
        Your Content
      </h2>
      <p className="font-ui text-sm text-text-muted mb-6">
        {output.clientName} / {output.contentType.replace('-', ' ')}
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={handlePdf}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>

        <button
          onClick={handleTxt}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          .txt
        </button>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>

        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors ${
            editMode
              ? 'border-brown bg-brown text-white'
              : 'border-border-light hover:border-brown/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {editMode ? 'Editing' : 'Edit'}
        </button>

        {showGhlButton && (
          <button
            onClick={() => setShowGhlModal(true)}
            disabled={ghlStatus === 'sending'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors ${
              ghlStatus === 'success'
                ? 'border-green bg-green-light text-green'
                : 'border-green/40 text-green hover:bg-green-light hover:border-green'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {ghlStatus === 'success' ? 'Sent to Ghutte' : 'Send to Ghutte'}
          </button>
        )}
      </div>

      {/* Send to Ghutte modal */}
      {showGhlModal && (
        <SendToGhlModal
          defaultName={defaultSubject || `${output.clientName} Newsletter`}
          defaultSubject={defaultSubject}
          defaultFrom={output.clientName}
          sending={ghlStatus === 'sending'}
          onSend={handleSendToGHL}
          onClose={() => setShowGhlModal(false)}
        />
      )}

      {/* GHL result banner */}
      {ghlResult && ghlResult.dataDebug && ghlStatus === 'success' && (
        <div className="mb-3 bg-orange-light rounded-xl border border-orange/20 p-3">
          <p className="font-ui text-xs text-orange">⚠ Content upload issue: {ghlResult.dataDebug}</p>
          <p className="font-ui text-xs text-text-muted mt-1">Template was created but content may not have loaded. Try the Code Editor option instead.</p>
        </div>
      )}

      {ghlResult && ghlStatus === 'success' && (
        <div className="mb-4 bg-green-light rounded-xl border border-green/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui text-sm font-semibold text-green">Template created in Ghutte</p>
              <p className="font-ui text-xs text-text-secondary mt-0.5">{ghlResult.message}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {ghlResult.ghlUrl && (
                <a
                  href={ghlResult.ghlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green text-white font-ui font-semibold text-sm rounded-full hover:opacity-90 transition-all"
                >
                  Open in Ghutte
                </a>
              )}
              {ghlResult.previewUrl && (
                <a
                  href={ghlResult.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-green text-green font-ui font-semibold text-sm rounded-full hover:bg-green hover:text-white transition-all"
                >
                  Preview
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {ghlResult && ghlStatus === 'error' && (
        <div className="mb-4 bg-orange-light rounded-xl border border-orange/20 p-4">
          <p className="font-ui text-sm text-orange">{ghlResult.error}</p>
        </div>
      )}

      {/* Content area */}
      <div
        id="output-content"
        className={`bg-cream/50 border border-border-light rounded-xl p-6 min-h-[300px] ${
          editMode ? 'ring-2 ring-brown/30' : ''
        }`}
        contentEditable={editMode}
        suppressContentEditableWarning
      >
        <div className="font-body text-base leading-relaxed whitespace-pre-wrap text-text-primary">
          {displayContent}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border-light">
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors"
        >
          Start New Piece
        </button>
        <button
          onClick={onChangeClient}
          className="px-6 py-3 border-2 border-brown text-brown font-ui font-semibold rounded-full hover:bg-brown hover:text-white transition-colors"
        >
          Change Client
        </button>
        <button
          disabled
          className="px-6 py-3 border-2 border-border-light text-text-muted font-ui font-semibold rounded-full cursor-not-allowed relative group"
        >
          Save to Drive
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-primary text-white text-xs font-ui px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Coming soon
          </span>
        </button>
      </div>
    </div>
  );
}

function SendToGhlModal({
  defaultName,
  defaultSubject,
  defaultFrom,
  sending,
  onSend,
  onClose,
}: {
  defaultName: string;
  defaultSubject: string;
  defaultFrom: string;
  sending: boolean;
  onSend: (name: string, subject: string, from: string, editorType: 'code' | 'builder') => void;
  onClose: () => void;
}) {
  const [templateName, setTemplateName] = useState(defaultName);
  const [subjectLine, setSubjectLine] = useState(defaultSubject);
  const [fromName, setFromName] = useState(defaultFrom);
  const [editorType, setEditorType] = useState<'code' | 'builder'>('builder');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border-light max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-text-primary">Send to Ghutte</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Editor type selector */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Editor Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditorType('builder')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  editorType === 'builder'
                    ? 'border-brown bg-brown/5 ring-1 ring-brown/20'
                    : 'border-border-light hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span className="font-ui text-sm font-semibold text-text-primary">Visual Editor</span>
                </div>
                <p className="font-ui text-xs text-text-muted">Drag-and-drop blocks. Edit visually in Ghutte.</p>
              </button>
              <button
                type="button"
                onClick={() => setEditorType('code')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  editorType === 'code'
                    ? 'border-brown bg-brown/5 ring-1 ring-brown/20'
                    : 'border-border-light hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="font-ui text-sm font-semibold text-text-primary">Code Editor</span>
                </div>
                <p className="font-ui text-xs text-text-muted">Styled HTML. Pixel-perfect control.</p>
              </button>
            </div>
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. April Newsletter - Systems That Serve You"
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
            />
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
              Subject Line
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="The subject your recipients will see"
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
            />
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
              From Name
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="e.g. Nyaki from ClubSheIs"
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSend(templateName, subjectLine, fromName, editorType)}
              disabled={!templateName.trim() || sending}
              className={`flex-1 px-6 py-3 font-ui font-semibold text-sm rounded-full transition-all ${
                templateName.trim() && !sending
                  ? 'bg-green text-white hover:opacity-90'
                  : 'bg-cream-dark text-text-muted cursor-not-allowed'
              }`}
            >
              {sending ? 'Creating template...' : 'Create in Ghutte'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border-light text-text-secondary font-ui font-semibold text-sm rounded-full hover:border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
