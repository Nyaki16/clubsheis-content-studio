'use client';

import { useState } from 'react';
import { GeneratedOutput, ContentType } from '@/types';
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

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-1">
        YOUR CONTENT
      </h2>
      <p className="font-ui text-sm text-grey-mid mb-6">
        {output.clientName} / {output.contentType.replace('-', ' ')}
      </p>

      {/* Floating toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-grey-light font-ui text-sm hover:border-yellow transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={handlePdf}
          className="flex items-center gap-2 px-4 py-2 border border-grey-light font-ui text-sm hover:border-yellow transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>

        <button
          onClick={handleTxt}
          className="flex items-center gap-2 px-4 py-2 border border-grey-light font-ui text-sm hover:border-yellow transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          .txt
        </button>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 border border-grey-light font-ui text-sm hover:border-yellow transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>

        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2 border font-ui text-sm transition-colors ${
            editMode
              ? 'border-yellow bg-yellow text-black'
              : 'border-grey-light hover:border-yellow'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {editMode ? 'Editing' : 'Edit'}
        </button>
      </div>

      {/* Content area */}
      <div
        id="output-content"
        className={`bg-white border border-grey-light p-8 min-h-[300px] ${
          editMode ? 'outline outline-2 outline-yellow' : ''
        }`}
        contentEditable={editMode}
        suppressContentEditableWarning
      >
        <div className="font-body text-base leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-grey-light">
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-black text-yellow font-display tracking-widest hover:bg-yellow hover:text-black transition-colors"
        >
          START NEW PIECE
        </button>
        <button
          onClick={onChangeClient}
          className="px-6 py-3 border-2 border-black text-black font-display tracking-widest hover:bg-black hover:text-yellow transition-colors"
        >
          CHANGE CLIENT
        </button>
        <button
          disabled
          className="px-6 py-3 border-2 border-grey-light text-grey-mid font-display tracking-widest cursor-not-allowed relative group"
        >
          SAVE TO DRIVE
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-ui px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Coming soon
          </span>
        </button>
      </div>
    </div>
  );
}
