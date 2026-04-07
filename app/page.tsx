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
  StaticImageConfig,
} from '@/types';
import ClientSelector from '@/components/dashboard/ClientSelector';
import ContentTypeGrid from '@/components/dashboard/ContentTypeGrid';
import ConfigForm from '@/components/dashboard/ConfigForm';
import LoadingState from '@/components/dashboard/LoadingState';
import OutputPanel from '@/components/dashboard/OutputPanel';
import CanvaOutputZone from '@/components/dashboard/CanvaOutputZone';

export default function Dashboard() {
  const [step, setStep] = useState<DashboardStep>(1);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lastUniversal, setLastUniversal] = useState<UniversalConfig | null>(null);
  const [lastTypeConfig, setLastTypeConfig] = useState<TypeSpecificConfig | null>(null);

  const handleClientSelect = (client: SelectedClient) => {
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

      try {
        const firstFile = universal.inspirationFiles[0];
        const body = {
          client: selectedClient,
          topic: universal.topic,
          tone: universal.toneOverride,
          typeConfig: typeSpecific.config,
          inspirationBase64: firstFile?.base64,
          inspirationMediaType: firstFile?.mediaType,
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

        setOutput({
          content: data.content,
          rawJson,
          contentType: selectedType,
          clientName: selectedClient.name,
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

  const handleChangeClient = () => {
    setStep(1);
    setSelectedClient(null);
    setSelectedType(null);
    setOutput(null);
    setError(null);
  };

  const showCanva =
    output &&
    (selectedType === 'carousel' || selectedType === 'static-image') &&
    lastTypeConfig &&
    ((lastTypeConfig.type === 'carousel' &&
      (lastTypeConfig.config as CarouselConfig).canvaOutput) ||
      (lastTypeConfig.type === 'static-image' &&
        (lastTypeConfig.config as StaticImageConfig).canvaOutput));

  let firstSlideHeadline: string | undefined;
  if (output?.rawJson && selectedType === 'carousel') {
    try {
      const slides = JSON.parse(output.rawJson);
      firstSlideHeadline = slides[0]?.headline;
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Top Nav */}
      <nav className="px-6 py-4 flex items-center justify-between bg-cream sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-ui text-sm font-semibold text-brown border border-brown/30 rounded-full px-4 py-1.5 tracking-wide">
            CONTENT STUDIO
          </span>
        </div>

        {selectedClient && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border-light">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedClient.brandColour }}
            />
            <span className="font-ui text-sm font-medium text-text-primary">
              {selectedClient.name}
            </span>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary">Content Studio</h1>
          <p className="font-ui text-text-secondary mt-1">Create on-brand content for ClubSheIs and clients</p>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <section
            className={`transition-all duration-300 ${
              step > 1 ? 'opacity-50 hover:opacity-100' : ''
            }`}
          >
            <ClientSelector
              selectedClient={selectedClient}
              onSelect={handleClientSelect}
            />
          </section>

          {/* Step 2 */}
          {step >= 2 && selectedClient && (
            <section
              className={`transition-all duration-300 ${
                step > 2 ? 'opacity-50 hover:opacity-100' : ''
              }`}
            >
              <ContentTypeGrid
                selectedType={selectedType}
                onSelect={handleTypeSelect}
              />
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && selectedClient && selectedType && (
            <section>
              <ConfigForm
                contentType={selectedType}
                client={selectedClient}
                onGenerate={handleGenerate}
              />
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
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className={showCanva ? 'lg:w-3/5' : 'w-full'}>
                    <OutputPanel
                      output={output}
                      onRegenerate={handleRegenerate}
                      onStartNew={handleStartNew}
                      onChangeClient={handleChangeClient}
                    />
                  </div>

                  {showCanva && selectedClient && selectedType && (
                    <div className="lg:w-2/5">
                      <CanvaOutputZone
                        client={selectedClient}
                        contentType={selectedType}
                        generatedCopy={output.content}
                        slideCount={
                          lastTypeConfig?.type === 'carousel'
                            ? (lastTypeConfig.config as CarouselConfig).slideCount
                            : undefined
                        }
                        firstSlideHeadline={firstSlideHeadline}
                        enabled={true}
                      />
                    </div>
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
