'use client';

import { useState } from 'react';
import {
  SelectedClient,
  ContentType,
  DeliverableProfile,
  DeliverableStyle,
} from '@/types';
import { deliverablePresets, StylePreset } from '@/lib/deliverable-presets';

interface Props {
  client: SelectedClient;
  onSelectDeliverable: (deliverable: DeliverableProfile) => void;
  onUpdateClient: (client: SelectedClient) => void;
  onPickContentType: () => void;
}

export default function ClientDeliverables({
  client,
  onSelectDeliverable,
  onUpdateClient,
  onPickContentType,
}: Props) {
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [addStep, setAddStep] = useState<'type' | 'style' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null);
  const [label, setLabel] = useState('');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const deliverables = client.deliverables || [];

  const resetAddFlow = () => {
    setShowAddFlow(false);
    setAddStep('type');
    setSelectedType(null);
    setSelectedStyle(null);
    setLabel('');
    setFrequency('');
    setNotes('');
    setEditingId(null);
  };

  const handleAddDeliverable = () => {
    if (!selectedType || !selectedStyle) return;

    const newDeliverable: DeliverableProfile = {
      id: editingId || `del-${Date.now()}`,
      contentType: selectedType,
      label: label || selectedStyle.label,
      frequency: frequency || undefined,
      style: selectedStyle.id as DeliverableStyle,
      notes: notes || undefined,
    };

    const updated = editingId
      ? deliverables.map((d) => (d.id === editingId ? newDeliverable : d))
      : [...deliverables, newDeliverable];

    onUpdateClient({ ...client, deliverables: updated });
    resetAddFlow();
  };

  const handleRemove = (id: string) => {
    onUpdateClient({
      ...client,
      deliverables: deliverables.filter((d) => d.id !== id),
    });
  };

  const handleEdit = (d: DeliverableProfile) => {
    setEditingId(d.id);
    setSelectedType(d.contentType);
    const preset = deliverablePresets
      .find((p) => p.contentType === d.contentType)
      ?.styles.find((s) => s.id === d.style);
    setSelectedStyle(preset || null);
    setLabel(d.label);
    setFrequency(d.frequency || '');
    setNotes(d.notes || '');
    setAddStep('details');
    setShowAddFlow(true);
  };

  const typeLabels: Record<ContentType, string> = {
    newsletter: 'Newsletter',
    carousel: 'Carousel',
    reel: 'Reel Script',
    'static-image': 'Static Image',
    'email-sequence': 'Email Sequence',
    'ad-creative': 'Ad Creative',
    caption: 'Caption',
    transcript: 'Transcript',
  };

  const typeIcons: Record<ContentType, string> = {
    newsletter: '📧',
    carousel: '🎠',
    reel: '🎬',
    'static-image': '🖼',
    'email-sequence': '📨',
    'ad-creative': '📢',
    caption: '💬',
    transcript: '📝',
  };

  const frequencyOptions = [
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Per campaign',
    'As needed',
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">
          {client.name}&apos;s Deliverables
        </h2>
        <button
          onClick={onPickContentType}
          className="font-ui text-xs text-brown hover:text-brown-light transition-colors underline underline-offset-2"
        >
          One-off content instead
        </button>
      </div>

      {/* Existing deliverables */}
      {deliverables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {deliverables.map((d) => (
            <div
              key={d.id}
              className="group relative bg-white rounded-xl border border-border-light hover:border-brown/30 hover:shadow-md transition-all duration-200"
            >
              <button
                onClick={() => onSelectDeliverable(d)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcons[d.contentType]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-ui font-semibold text-sm text-text-primary truncate">
                      {d.label}
                    </h3>
                    <p className="font-ui text-xs text-text-muted mt-0.5">
                      {typeLabels[d.contentType]}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className="font-ui text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: client.brandColour + '18',
                          color: client.brandColour,
                        }}
                      >
                        {deliverablePresets
                          .find((p) => p.contentType === d.contentType)
                          ?.styles.find((s) => s.id === d.style)?.label || d.style}
                      </span>
                      {d.frequency && (
                        <span className="font-ui text-[10px] text-text-muted bg-cream-dark rounded-full px-2 py-0.5">
                          {d.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Edit / Remove buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(d);
                  }}
                  className="p-1.5 rounded-lg hover:bg-cream-dark text-text-muted hover:text-text-secondary transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(d.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red/10 text-text-muted hover:text-red transition-colors"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Add deliverable card */}
          <button
            onClick={() => {
              resetAddFlow();
              setShowAddFlow(true);
            }}
            className="flex items-center gap-3 p-5 bg-white/50 rounded-xl border border-dashed border-border hover:border-brown/40 transition-all duration-200 text-text-muted hover:text-text-secondary"
          >
            <span className="w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="font-ui font-medium text-sm">Add deliverable</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {deliverables.length === 0 && !showAddFlow && (
        <div className="bg-white rounded-xl border border-border-light p-8 text-center mb-4">
          <p className="font-ui text-sm text-text-muted mb-1">
            No deliverables configured yet
          </p>
          <p className="font-ui text-xs text-text-muted/70 mb-4">
            Set up the standard content outputs for this client — style, frequency, and format
          </p>
          <button
            onClick={() => {
              resetAddFlow();
              setShowAddFlow(true);
            }}
            className="bg-brown text-white font-ui font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-brown-light transition-colors"
          >
            Add first deliverable
          </button>
        </div>
      )}

      {/* Add flow */}
      {showAddFlow && (
        <div className="bg-white rounded-xl border border-border-light p-5 max-w-2xl">
          {/* Step: Pick content type */}
          {addStep === 'type' && (
            <div>
              <h3 className="font-ui font-semibold text-sm text-text-primary mb-3">
                What type of content?
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {deliverablePresets.map((preset) => (
                  <button
                    key={preset.contentType}
                    onClick={() => {
                      setSelectedType(preset.contentType);
                      setAddStep('style');
                    }}
                    className="text-left p-3 rounded-lg border border-border-light hover:border-brown/40 hover:bg-cream/50 transition-all"
                  >
                    <span className="text-base block mb-1">
                      {typeIcons[preset.contentType]}
                    </span>
                    <span className="font-ui text-xs font-semibold text-text-primary">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={resetAddFlow}
                className="mt-3 font-ui text-xs text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Step: Pick style */}
          {addStep === 'style' && selectedType && (
            <div>
              <button
                onClick={() => setAddStep('type')}
                className="font-ui text-xs text-text-muted hover:text-text-secondary mb-3 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h3 className="font-ui font-semibold text-sm text-text-primary mb-1">
                Pick a style for {typeLabels[selectedType]}
              </h3>
              <p className="font-ui text-xs text-text-muted mb-3">
                This sets the default output format and tone
              </p>
              <div className="space-y-2">
                {deliverablePresets
                  .find((p) => p.contentType === selectedType)
                  ?.styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setSelectedStyle(style);
                        setLabel(style.label);
                        setAddStep('details');
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedStyle?.id === style.id
                          ? 'border-brown bg-cream/50'
                          : 'border-border-light hover:border-brown/30'
                      }`}
                    >
                      <h4 className="font-ui font-semibold text-sm text-text-primary">
                        {style.label}
                      </h4>
                      <p className="font-ui text-xs text-text-muted mt-0.5">
                        {style.description}
                      </p>
                    </button>
                  ))}
              </div>
              <button
                onClick={resetAddFlow}
                className="mt-3 font-ui text-xs text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Step: Details */}
          {addStep === 'details' && selectedType && selectedStyle && (
            <div>
              <button
                onClick={() => setAddStep(editingId ? 'details' : 'style')}
                className={`font-ui text-xs text-text-muted hover:text-text-secondary mb-3 flex items-center gap-1 ${editingId ? 'hidden' : ''}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h3 className="font-ui font-semibold text-sm text-text-primary mb-3">
                {editingId ? 'Edit' : 'Configure'} deliverable
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="font-ui text-xs text-text-muted block mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={selectedStyle.label}
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
                  />
                </div>
                <div>
                  <label className="font-ui text-xs text-text-muted block mb-1">
                    Frequency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {frequencyOptions.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFrequency(frequency === f ? '' : f)}
                        className={`font-ui text-xs px-3 py-1.5 rounded-full border transition-all ${
                          frequency === f
                            ? 'border-brown bg-brown text-white'
                            : 'border-border-light text-text-secondary hover:border-brown/30'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-ui text-xs text-text-muted block mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Always include product photos, keep under 500 words"
                    className="w-full px-4 py-2.5 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20"
                  />
                </div>

                {/* Style preview */}
                <div className="bg-cream/50 rounded-lg p-3 border border-border-light">
                  <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Style
                  </p>
                  <p className="font-ui text-sm font-semibold text-text-primary">
                    {selectedStyle.label}
                  </p>
                  <p className="font-ui text-xs text-text-muted">
                    {selectedStyle.description}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddDeliverable}
                    className="bg-brown text-white font-ui font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-brown-light transition-colors"
                  >
                    {editingId ? 'Save changes' : 'Add deliverable'}
                  </button>
                  <button
                    onClick={resetAddFlow}
                    className="font-ui text-sm text-text-muted hover:text-text-secondary px-4 py-2.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
