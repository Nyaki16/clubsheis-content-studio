'use client';

import { useState, useCallback } from 'react';
import {
  SelectedClient,
  ContentType,
  DashboardStep,
  UniversalConfig,
  TypeSpecificConfig,
  GeneratedOutput,
  CarouselConfig,
} from '@/types';
import { hardcodedClients } from '@/lib/clients';
import ClientDropdown from '@/components/dashboard/ClientDropdown';
import ContentTypeGrid from '@/components/dashboard/ContentTypeGrid';
import ConfigForm from '@/components/dashboard/ConfigForm';
import TranscriptStudio from '@/components/dashboard/TranscriptStudio';
import TranscriptResultsFlow from '@/components/dashboard/TranscriptResultsFlow';
import VideoAnimationStudio from '@/components/video/VideoAnimationStudio';
import VideoEditStudio from '@/components/video/VideoEditStudio';
import LoadingState from '@/components/dashboard/LoadingState';
import OutputPanel from '@/components/dashboard/OutputPanel';
import SavedContentLibrary, { type SavedItem } from '@/components/dashboard/SavedContentLibrary';

export default function Dashboard() {
  // The content-type picker is always the starting point. A client is always
  // selected (default: the first client); switching happens via the top-right
  // dropdown. Steps: 2 = pick content type, 3 = config, 4 = output.
  const [step, setStep] = useState<DashboardStep>(2);
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(hardcodedClients[0]);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lastUniversal, setLastUniversal] = useState<UniversalConfig | null>(null);
  const [lastTypeConfig, setLastTypeConfig] = useState<TypeSpecificConfig | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleLoadSaved = useCallback((item: SavedItem) => {
    setOutput({
      content: item.content,
      rawJson: item.rawJson,
      contentType: item.contentType as ContentType,
      clientName: item.clientName,
      brandColour: item.brandColour,
      slideImages: item.slideImages,
      productImages: item.productImages,
    });
    setSelectedType(item.contentType as ContentType);
    setStep(4);
    setLibraryOpen(false);
    setError(null);
  }, []);

  const handleClientChange = (client: SelectedClient) => {
    setSelectedClient(client);
    setStep(2);
    setSelectedType(null);
    setOutput(null);
    setError(null);
  };

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type);
    setStep(3);
    setOutput(null);
    setError(null);
  };

  const handleGenerate = useCallback(
    async (universal: UniversalConfig, typeSpecific: TypeSpecificConfig) => {
      if (!selectedClient || !selectedType) return;

      setLastUniversal(universal);
      setLastTypeConfig(typeSpecific);
      setStep(4);
      setGenerating(true);
      setError(null);
      setOutput(null);

      // Transcript: split into one analysis call + N piece calls in parallel.
      // Each call is small and fast, well under the serverless timeout.
      if (selectedType === 'transcript' && typeSpecific.type === 'transcript') {
        try {
          const cfg = typeSpecific.config;
          const transcriptText = (cfg.transcriptText || '').trim();
          if (!transcriptText) throw new Error('Please paste a transcript before generating.');

          const callApi = async (payload: Record<string, unknown>) => {
            const res = await fetch('/api/generate/transcript', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ client: selectedClient, tone: universal.toneOverride, ...payload }),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || 'Generation failed.');
            }
            const d = await res.json();
            return (d.content || '') as string;
          };

          const analysisCall = callApi({
            transcriptMode: 'analysis',
            transcriptText,
            transcriptKeyThemes: cfg.keyThemes,
          });

          type PieceMeta = { format: string; index: number; total: number };
          const pieceMetas: PieceMeta[] = [];
          for (const [format, count] of Object.entries(cfg.outputCounts || {})) {
            const n = Number(count) || 0;
            for (let i = 1; i <= n; i++) {
              pieceMetas.push({ format, index: i, total: n });
            }
          }
          const pieceCalls = pieceMetas.map((m) =>
            callApi({
              transcriptMode: 'piece',
              transcriptText,
              transcriptKeyThemes: cfg.keyThemes,
              transcriptFormat: m.format,
              variationIndex: m.index,
              totalForFormat: m.total,
            })
          );

          const results = await Promise.allSettled([analysisCall, ...pieceCalls]);
          const analysisResult = results[0];
          const pieceResults = results.slice(1);

          const analysisText = analysisResult.status === 'fulfilled' ? analysisResult.value : '';
          const piecesText = pieceResults.map((r) => (r.status === 'fulfilled' ? r.value : '')).filter(Boolean).join('\n\n');

          const firstFailure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
          if (!analysisText && !piecesText && firstFailure) {
            throw firstFailure.reason instanceof Error ? firstFailure.reason : new Error(String(firstFailure.reason));
          }

          const combined = [analysisText, piecesText].filter(Boolean).join('\n\n');

          setOutput({
            content: combined,
            contentType: 'transcript',
            clientName: selectedClient.name,
            brandColour: selectedClient.brandColour,
          });

          if (firstFailure) {
            const reason = firstFailure.reason instanceof Error ? firstFailure.reason.message : String(firstFailure.reason);
            setError(`Some pieces failed to generate: ${reason}. The successful pieces are shown below — tap Retry to try the failed ones again.`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Something went wrong on our end. Your brief is saved — tap Retry to try again.');
        } finally {
          setGenerating(false);
        }
        return;
      }

      try {
        const firstFile = universal.inspirationFiles[0];
        const apiConfig = { ...typeSpecific.config };
        if ('slideImages' in apiConfig) {
          delete (apiConfig as Record<string, unknown>).slideImages;
        }
        if ('productImages' in apiConfig) {
          delete (apiConfig as Record<string, unknown>).productImages;
        }

        let carouselRefBase64: string | undefined;
        let carouselRefMediaType: string | undefined;
        if ('referenceImages' in apiConfig) {
          const refs = (apiConfig as Record<string, unknown>).referenceImages as { base64: string; mediaType: string; name: string }[] | undefined;
          if (refs && refs.length > 0) {
            carouselRefBase64 = refs[0].base64;
            carouselRefMediaType = refs[0].mediaType;
          }
          delete (apiConfig as Record<string, unknown>).referenceImages;
        }

        const inspirationBase64 = firstFile?.base64 || carouselRefBase64;
        const inspirationMediaType = firstFile?.mediaType || carouselRefMediaType;

        const body = {
          client: selectedClient,
          topic: universal.topic,
          tone: universal.toneOverride,
          typeConfig: apiConfig,
          inspirationBase64: inspirationBase64,
          inspirationMediaType: inspirationMediaType,
          inspirationUrl: universal.inspirationUrl,
        };

        const res = await fetch(`/api/generate/${selectedType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || 'Something went wrong on our end. Your brief is saved — tap Retry to try again.'
          );
        }

        const data = await res.json();

        let rawJson: string | undefined;
        try {
          JSON.parse(data.content);
          rawJson = data.content;
        } catch {
          // Not JSON
        }

        const carouselImages = selectedType === 'carousel' && typeSpecific.type === 'carousel'
          ? (typeSpecific.config as CarouselConfig).slideImages
          : undefined;

        const newsletterImages = selectedType === 'newsletter' && typeSpecific.type === 'newsletter'
          ? (typeSpecific.config as import('@/types').NewsletterConfig).productImages
          : undefined;

        setOutput({
          content: data.content,
          rawJson,
          contentType: selectedType,
          clientName: selectedClient.name,
          brandColour: selectedClient.brandColour,
          slideImages: carouselImages,
          productImages: newsletterImages,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong on our end. Your brief is saved — tap Retry to try again.'
        );
      } finally {
        setGenerating(false);
      }
    },
    [selectedClient, selectedType]
  );

  const handleRegenerate = () => {
    if (lastUniversal && lastTypeConfig) {
      handleGenerate(lastUniversal, lastTypeConfig);
    }
  };

  const handleStartNew = () => {
    setStep(2);
    setSelectedType(null);
    setOutput(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Top Nav */}
      <nav className="px-6 py-4 flex items-center justify-between bg-cream sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-ui text-sm font-semibold text-brown border border-brown/30 rounded-full px-4 py-1.5 tracking-wide">
            CONTENT STUDIO
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-border-light hover:border-brown text-text-secondary hover:text-brown font-ui text-sm font-medium transition-colors"
            title="Saved content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Library
          </button>

          <ClientDropdown selectedClient={selectedClient} onSelect={handleClientChange} />
        </div>
      </nav>

      <SavedContentLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onLoad={handleLoadSaved}
      />

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary">Content Studio</h1>
          <p className="font-ui text-text-secondary mt-1">Create on-brand content for ClubSheIs and clients</p>
        </div>

        <div className="space-y-8">
          {/* Step 2: Content Type picker — always the starting point */}
          <section
            className={`transition-all duration-300 ${
              step > 2 ? 'opacity-50 hover:opacity-100' : ''
            }`}
          >
            <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">
              What do you want to build?
            </h2>
            <ContentTypeGrid
              selectedType={selectedType}
              onSelect={handleTypeSelect}
            />
          </section>

          {/* Step 3 */}
          {step === 3 && selectedType && (
            <section>
              {selectedType === 'transcript' ? (
                <TranscriptStudio
                  client={selectedClient}
                  onGenerate={handleGenerate}
                  onBack={handleStartNew}
                />
              ) : selectedType === 'video-animation' ? (
                <VideoAnimationStudio
                  client={selectedClient}
                  onBack={handleStartNew}
                />
              ) : selectedType === 'video-edit' ? (
                <VideoEditStudio
                  client={selectedClient}
                  onBack={handleStartNew}
                />
              ) : (
                <ConfigForm
                  contentType={selectedType}
                  client={selectedClient}
                  onGenerate={handleGenerate}
                />
              )}
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section>
              {generating && <LoadingState />}

              {error && !generating && (
                <div className="text-center py-12 bg-white rounded-2xl border border-border-light">
                  <p className="font-ui text-sm text-red mb-4">{error}</p>
                  <button
                    onClick={handleRegenerate}
                    className="px-8 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {output && !generating && (
                <div className="w-full">
                  {output.contentType === 'transcript' ? (
                    <TranscriptResultsFlow
                      output={output}
                      client={selectedClient}
                      onStartNew={handleStartNew}
                      onChangeClient={handleStartNew}
                    />
                  ) : (
                    <OutputPanel
                      output={output}
                      onRegenerate={handleRegenerate}
                      onStartNew={handleStartNew}
                      onChangeClient={handleStartNew}
                    />
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Mobile sticky hint */}
      {step === 3 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border-light z-50">
          <p className="font-ui text-xs text-text-muted text-center">
            Fill in the details above and tap Generate
          </p>
        </div>
      )}
    </div>
  );
}
