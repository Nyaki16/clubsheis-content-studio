'use client';

import { useState, useEffect } from 'react';
import { CanvaResult, SelectedClient, ContentType } from '@/types';

interface Props {
  client: SelectedClient;
  contentType: ContentType;
  generatedCopy: string;
  slideCount?: number;
  firstSlideHeadline?: string;
  enabled: boolean;
}

export default function CanvaOutputZone({
  client,
  contentType,
  generatedCopy,
  slideCount,
  firstSlideHeadline,
  enabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CanvaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const noBrandKit = !client.canvaBrandKitId;

  const generateDesign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/canva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designType: contentType === 'carousel' ? 'instagram_post' : 'poster',
          clientName: client.name,
          brandColour: client.brandColour,
          brandKitId: client.canvaBrandKitId,
          slideCount,
          firstSlideHeadline,
          generatedCopy,
        }),
      });

      if (!res.ok) throw new Error('Canva generation failed');
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Canva is taking longer than usual. Your copy is ready below — we\'ll keep trying to build the design.');
    } finally {
      setLoading(false);
    }
  };

  const openInCanva = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/canva/materialise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: result.jobId, candidateId: result.candidateId }),
      });
      if (!res.ok) {
        setError('Your Canva job expired. Tap \'Refresh Design\' to rebuild it in seconds.');
        return;
      }
      const data = await res.json();
      window.open(data.designUrl, '_blank');
    } catch {
      setError('Your Canva job expired. Tap \'Refresh Design\' to rebuild it in seconds.');
    }
  };

  const downloadFromCanva = async () => {
    if (!result?.designId) {
      try {
        const matRes = await fetch('/api/canva/materialise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: result?.jobId, candidateId: result?.candidateId }),
        });
        if (!matRes.ok) {
          setError('Your Canva job expired. Tap \'Refresh Design\' to rebuild it in seconds.');
          return;
        }
        const matData = await matRes.json();
        setExporting(true);
        const expRes = await fetch('/api/canva/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId: matData.designId, format: 'PNG' }),
        });
        if (expRes.ok) {
          const expData = await expRes.json();
          window.open(expData.downloadUrl, '_blank');
        }
      } catch {
        setError('Export failed. Try opening in Canva instead.');
      } finally {
        setExporting(false);
      }
    }
  };

  useEffect(() => {
    if (enabled) generateDesign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6">
      <h3 className="font-ui font-semibold text-sm text-text-primary mb-4">Canva Design</h3>

      {noBrandKit && (
        <div className="bg-orange-light rounded-lg border border-orange/20 px-4 py-2 mb-4">
          <p className="font-ui text-xs text-orange">
            No Canva Brand Kit linked for this client. Design will use default styles.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-ui text-sm text-text-muted">Creating your design in Canva...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="font-ui text-sm text-text-muted mb-4">{error}</p>
          <button
            onClick={generateDesign}
            className="px-6 py-2.5 bg-brown text-white font-ui font-semibold text-sm rounded-full hover:bg-brown-light transition-colors"
          >
            Refresh Design
          </button>
        </div>
      )}

      {result && !loading && !error && (
        <div className="space-y-4">
          {result.thumbnailUrl && (
            <div className="border border-border-light rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.thumbnailUrl} alt="Canva design preview" className="w-full h-auto" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={openInCanva}
              className="w-full px-4 py-3 bg-brown text-white font-ui font-semibold text-sm rounded-full hover:bg-brown-light transition-colors"
            >
              Open in Canva
            </button>
            <button
              onClick={downloadFromCanva}
              disabled={exporting}
              className="w-full px-4 py-3 border-2 border-brown text-brown font-ui font-semibold text-sm rounded-full hover:bg-brown hover:text-white transition-colors"
            >
              {exporting ? 'Exporting...' : 'Download from Canva'}
            </button>
            <button
              onClick={generateDesign}
              className="w-full px-4 py-2 border border-border-light text-text-muted font-ui text-sm rounded-full hover:border-brown/40 hover:text-text-secondary transition-colors"
            >
              Regenerate Design
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
