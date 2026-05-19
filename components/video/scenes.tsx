import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';
import type { VideoColors, VideoScene } from '@/types';
import { enter, countUp, draw, type SafeInsets } from './animation';

const FONT = 'Inter, "DM Sans", sans-serif';

export interface SceneProps {
  scene: VideoScene;
  palette: VideoColors;
  safe: SafeInsets;
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatNum(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US');
}

function Shell({
  palette,
  safe,
  children,
  justify = 'center',
}: {
  palette: VideoColors;
  safe: SafeInsets;
  children: React.ReactNode;
  justify?: React.CSSProperties['justifyContent'];
}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.background,
        fontFamily: FONT,
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function SceneHeader({
  scene,
  palette,
  baseDelay = 0,
  compact = false,
}: {
  scene: VideoScene;
  palette: VideoColors;
  baseDelay?: number;
  compact?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eb = enter(frame, fps, baseDelay);
  const hl = enter(frame, fps, baseDelay + 8);
  const bd = enter(frame, fps, baseDelay + 18);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      {scene.eyebrow ? (
        <div
          style={{
            opacity: eb.opacity,
            transform: `translateY(${eb.translateY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span style={{ width: 40, height: 4, borderRadius: 4, background: palette.accent }} />
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: palette.accent,
            }}
          >
            {scene.eyebrow}
          </span>
          <span style={{ width: 40, height: 4, borderRadius: 4, background: palette.accent }} />
        </div>
      ) : null}
      <h1
        style={{
          margin: 0,
          fontSize: compact ? 64 : 78,
          lineHeight: 1.08,
          fontWeight: 800,
          color: palette.primaryText,
          opacity: hl.opacity,
          transform: `translateY(${hl.translateY}px)`,
          maxWidth: 920,
        }}
      >
        {scene.headline}
      </h1>
      {scene.body ? (
        <p
          style={{
            margin: 0,
            fontSize: 40,
            lineHeight: 1.4,
            fontWeight: 400,
            color: withAlpha(palette.primaryText, 0.66),
            opacity: bd.opacity,
            transform: `translateY(${bd.translateY}px)`,
            maxWidth: 820,
          }}
        >
          {scene.body}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Scene 1: Title ---------- */
export function TitleScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = draw(frame, 30, 30);
  const dot = enter(frame, fps, 40);

  return (
    <Shell palette={palette} safe={safe}>
      <SceneHeader scene={scene} palette={palette} />
      <div
        style={{
          marginTop: 44,
          width: 320 * line,
          height: 8,
          borderRadius: 8,
          background: palette.accent,
        }}
      />
      <div
        style={{
          marginTop: 36,
          display: 'flex',
          gap: 16,
          opacity: dot.opacity,
          transform: `translateY(${dot.translateY}px)`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 16,
              background: i === 0 ? palette.accent : withAlpha(palette.emphasis, 0.9),
            }}
          />
        ))}
      </div>
    </Shell>
  );
}

/* ---------- Scene: Flowchart ---------- */
export function FlowchartScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = (scene.steps && scene.steps.length > 0 ? scene.steps : ['Step one', 'Step two', 'Step three']).slice(0, 5);

  return (
    <Shell palette={palette} safe={safe} justify="center">
      <SceneHeader scene={scene} palette={palette} compact />
      <div style={{ marginTop: 56, width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => {
          const delay = 30 + i * 12;
          const e = enter(frame, fps, delay);
          const connector = i < steps.length - 1 ? draw(frame, delay + 8, 14) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 96 }}>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 92,
                    flexShrink: 0,
                    background: palette.accent,
                    color: palette.background,
                    fontSize: 44,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: e.opacity,
                    transform: `scale(${0.6 + e.progress * 0.4})`,
                  }}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 ? (
                  <div
                    style={{
                      width: 6,
                      flex: 1,
                      minHeight: 36,
                      background: withAlpha(palette.accent, 0.85),
                      transformOrigin: 'top',
                      transform: `scaleY(${connector})`,
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 28,
                  marginBottom: i < steps.length - 1 ? 28 : 0,
                  padding: '30px 36px',
                  borderRadius: 24,
                  background: withAlpha(palette.emphasis, 0.32),
                  border: `3px solid ${withAlpha(palette.emphasis, 0.9)}`,
                  textAlign: 'left',
                  fontSize: 38,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: palette.primaryText,
                  opacity: e.opacity,
                  transform: `translateX(${(1 - e.progress) * 36}px)`,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ---------- Scene: Stat ---------- */
export function StatScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stat = scene.stat || { value: 100, label: '' };
  const current = countUp(frame, 26, stat.value || 0);
  const ring = draw(frame, 24, 52);
  const labelE = enter(frame, fps, 60);
  const display = `${stat.prefix || ''}${formatNum(stat.value || 0)}${stat.suffix || ''}`;
  const statFont = Math.min(132, Math.round(660 / Math.max(display.length, 5)));

  return (
    <Shell palette={palette} safe={safe}>
      <SceneHeader scene={scene} palette={palette} compact />
      <div style={{ marginTop: 60, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={460} height={460} viewBox="0 0 460 460" style={{ position: 'absolute' }}>
          <circle cx={230} cy={230} r={210} fill="none" stroke={withAlpha(palette.emphasis, 0.5)} strokeWidth={14} />
          <circle
            cx={230}
            cy={230}
            r={210}
            fill="none"
            stroke={palette.accent}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 210}
            strokeDashoffset={2 * Math.PI * 210 * (1 - ring)}
            transform="rotate(-90 230 230)"
          />
        </svg>
        <div style={{ width: 460, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: statFont,
              fontWeight: 800,
              color: palette.primaryText,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {stat.prefix || ''}
            {formatNum(current)}
            {stat.suffix || ''}
          </span>
        </div>
      </div>
      {stat.label ? (
        <p
          style={{
            marginTop: 44,
            fontSize: 38,
            fontWeight: 600,
            color: palette.accent,
            opacity: labelE.opacity,
            transform: `translateY(${labelE.translateY}px)`,
            maxWidth: 760,
          }}
        >
          {stat.label}
        </p>
      ) : null}
    </Shell>
  );
}

/* ---------- Scene: Icon Grid ---------- */
export function IconGridScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = (scene.items && scene.items.length > 0
    ? scene.items
    : [
        { icon: '✨', label: 'Point one' },
        { icon: '⚡', label: 'Point two' },
      ]
  ).slice(0, 4);

  return (
    <Shell palette={palette} safe={safe}>
      <SceneHeader scene={scene} palette={palette} compact />
      <div
        style={{
          marginTop: 56,
          width: '100%',
          maxWidth: 880,
          display: 'grid',
          gridTemplateColumns: items.length <= 2 ? '1fr' : '1fr 1fr',
          gap: 28,
        }}
      >
        {items.map((item, i) => {
          const e = enter(frame, fps, 30 + i * 10);
          return (
            <div
              key={i}
              style={{
                padding: '40px 32px',
                borderRadius: 28,
                background: withAlpha(palette.emphasis, 0.3),
                border: `3px solid ${withAlpha(palette.emphasis, 0.95)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                opacity: e.opacity,
                transform: `translateY(${e.translateY}px) scale(${0.85 + e.progress * 0.15})`,
              }}
            >
              <div
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 116,
                  background: palette.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 60,
                }}
              >
                {item.icon || '•'}
              </div>
              <span style={{ fontSize: 36, fontWeight: 700, color: palette.primaryText, lineHeight: 1.25 }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ---------- Scene: Diagram ---------- */
export function DiagramScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const diagram = scene.diagram || { centerLabel: scene.headline, nodes: ['A', 'B', 'C'] };
  const nodes = (diagram.nodes && diagram.nodes.length > 0 ? diagram.nodes : ['A', 'B', 'C']).slice(0, 5);
  const SIZE = 760;
  const c = SIZE / 2;
  const radius = 250;
  const centerR = 132;
  const nodeR = 96;

  return (
    <Shell palette={palette} safe={safe}>
      <SceneHeader scene={scene} palette={palette} compact />
      <div style={{ marginTop: 30, position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', inset: 0 }}>
          {nodes.map((_, i) => {
            const angle = (-90 + (360 / nodes.length) * i) * (Math.PI / 180);
            const x = c + Math.cos(angle) * radius;
            const y = c + Math.sin(angle) * radius;
            const len = Math.hypot(x - c, y - c);
            const p = draw(frame, 34 + i * 8, 26);
            return (
              <line
                key={i}
                x1={c}
                y1={c}
                x2={x}
                y2={y}
                stroke={withAlpha(palette.accent, 0.85)}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - p)}
              />
            );
          })}
        </svg>
        {nodes.map((node, i) => {
          const angle = (-90 + (360 / nodes.length) * i) * (Math.PI / 180);
          const x = c + Math.cos(angle) * radius;
          const y = c + Math.sin(angle) * radius;
          const e = enter(frame, fps, 44 + i * 8);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - nodeR,
                top: y - nodeR,
                width: nodeR * 2,
                height: nodeR * 2,
                borderRadius: nodeR * 2,
                background: withAlpha(palette.emphasis, 0.55),
                border: `4px solid ${palette.emphasis}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                opacity: e.opacity,
                transform: `scale(${0.5 + e.progress * 0.5})`,
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: palette.primaryText, lineHeight: 1.2 }}>
                {node}
              </span>
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: c - centerR,
            top: c - centerR,
            width: centerR * 2,
            height: centerR * 2,
            borderRadius: centerR * 2,
            background: palette.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            transform: `scale(${enter(frame, fps, 24).progress})`,
          }}
        >
          <span style={{ fontSize: 34, fontWeight: 800, color: palette.background, lineHeight: 1.18 }}>
            {diagram.centerLabel}
          </span>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- Scene: Particles finale ---------- */
export function ParticlesScene({ scene, palette, safe }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const particles = Array.from({ length: 14 }, (_, i) => i);
  const cta = enter(frame, fps, 40);

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background, fontFamily: FONT }}>
      {particles.map((i) => {
        const seedX = random(`px-${i}`);
        const seedSize = random(`ps-${i}`);
        const seedSpeed = random(`pv-${i}`);
        const seedPhase = random(`pp-${i}`);
        const size = 18 + seedSize * 64;
        const speed = 0.4 + seedSpeed * 0.9;
        const x = seedX * width;
        const travel = height + size * 2;
        const y = height + size - ((frame * speed + seedPhase * travel) % travel);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: i % 2 === 0 ? palette.accent : palette.emphasis,
              opacity: 0.16 + seedSize * 0.2,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <SceneHeader scene={scene} palette={palette} />
        {scene.cta ? (
          <div
            style={{
              marginTop: 52,
              padding: '32px 64px',
              borderRadius: 100,
              background: palette.accent,
              color: palette.background,
              fontSize: 44,
              fontWeight: 800,
              opacity: cta.opacity,
              transform: `translateY(${cta.translateY}px) scale(${0.9 + cta.progress * 0.1})`,
            }}
          >
            {scene.cta}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const SCENE_COMPONENTS = {
  title: TitleScene,
  flowchart: FlowchartScene,
  stat: StatScene,
  iconGrid: IconGridScene,
  diagram: DiagramScene,
  particles: ParticlesScene,
} as const;

export function SceneRouter({ scene, palette, safe }: SceneProps) {
  const Component = SCENE_COMPONENTS[scene.template] || TitleScene;
  return <Component scene={scene} palette={palette} safe={safe} />;
}
