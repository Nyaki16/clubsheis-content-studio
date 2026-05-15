'use client';

import { useEffect, useState } from 'react';
import { GeneratedOutput } from '@/types';

export interface SavedItem {
  id: string;
  title: string;
  contentType: string;
  clientName: string;
  brandColour?: string;
  content: string;
  rawJson?: string;
  slideImages?: GeneratedOutput['slideImages'];
  productImages?: GeneratedOutput['productImages'];
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (item: SavedItem) => void;
}

const TYPE_LABELS: Record<string, string> = {
  newsletter: 'Newsletter',
  carousel: 'Carousel',
  reel: 'Reel',
  'static-image': 'Static',
  'email-sequence': 'Email Sequence',
  'ad-creative': 'Ad',
  caption: 'Caption',
  transcript: 'Transcript',
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function SavedContentLibrary({ open, onClose, onLoad }: Props) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/saved-content');
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setItems(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/saved-content?id=${id}`, { method: 'DELETE' });
      setItems((curr) => curr.filter((i) => i.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const clients = Array.from(new Set(items.map((i) => i.clientName).filter(Boolean)));
  const types = Array.from(new Set(items.map((i) => i.contentType)));
  const filtered = items.filter((i) =>
    (filterType === 'all' || i.contentType === filterType) &&
    (filterClient === 'all' || i.clientName === filterClient)
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-cream rounded-2xl border border-border-light max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light bg-white">
          <div>
            <h3 className="font-display text-xl font-bold text-text-primary">Library</h3>
            <p className="font-ui text-xs text-text-muted">Saved content you can come back to</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border-light bg-cream/40 flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-border-light rounded-full font-ui text-xs bg-white"
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-1.5 border border-border-light rounded-full font-ui text-xs bg-white"
          >
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="ml-auto font-ui text-xs text-text-muted self-center">
            {filtered.length} item{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="font-ui text-sm text-text-muted text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="font-ui text-sm text-text-muted text-center py-8">
              {items.length === 0
                ? 'Nothing saved yet. Generate some content and tap Save.'
                : 'No items match these filters.'}
            </p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-border-light p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {TYPE_LABELS[item.contentType] || item.contentType}
                      </span>
                      {item.clientName && (
                        <span className="font-ui text-[10px] text-text-muted">
                          · {item.clientName}
                        </span>
                      )}
                      <span className="font-ui text-[10px] text-text-muted">
                        · {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="font-ui text-sm font-semibold text-text-primary truncate">{item.title}</p>
                    <p className="font-ui text-xs text-text-secondary mt-1 line-clamp-2">
                      {item.content.slice(0, 200)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onLoad(item)}
                      className="px-3 py-1.5 bg-brown text-white font-ui text-xs font-semibold rounded-full hover:bg-brown-light"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={busyId === item.id}
                      className="px-3 py-1.5 border border-border-light text-text-secondary font-ui text-xs font-semibold rounded-full hover:border-red hover:text-red disabled:opacity-40"
                    >
                      {busyId === item.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
