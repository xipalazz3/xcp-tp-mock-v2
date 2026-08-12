import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

/**
 * Voice Agent using Nova Sonic 2
 *
 * Architecture:
 * - Nova Sonic 2 acts as the voice agent (speech-to-text + text-to-speech)
 * - It has a single tool available: `text_agent`
 * - When the user speaks, Nova Sonic transcribes and invokes text_agent
 * - text_agent processes the query (comp search, analysis, etc.)
 * - Nova Sonic synthesizes the response back as speech
 *
 * For this mock, we simulate the full flow:
 * 1. Click mic → listening (capture audio via Web Audio API)
 * 2. After silence detection → processing (simulated transcription + text_agent call)
 * 3. Response ready → speaking (simulated TTS playback)
 * 4. Done → back to idle/listening
 */

const SYSTEM_PROMPT =
  'You are a voice assistant for a transfer pricing reviewer. You have one tool: text_agent. ' +
  'Use it for ALL user requests. Keep spoken responses concise — under 3 sentences. ' +
  'Summarize data tables verbally rather than reading every row.';

const TEXT_AGENT_TOOL = {
  toolSpec: {
    name: 'text_agent',
    description:
      'Send a text query to the TP Reviewer AI agent. The agent can search for comparables, ' +
      'compute quartiles, fetch customer data, and answer transfer pricing questions.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: "The text query to send to the agent, transcribed from the user's speech",
          },
        },
        required: ['query'],
      },
    },
  },
};

// Mock transcriptions for demo
const MOCK_TRANSCRIPTIONS = [
  'Run a comparable search for this company using the recommended criteria',
  'What is the interquartile range for the current comp set?',
  'Show me the prior year comparison for this entity',
  'Are there any companies outside the arm\'s length range?',
  'Summarize the economic analysis findings',
  'How many comparables were rejected and why?',
];

// Mock voice responses
const MOCK_VOICE_RESPONSES = [
  'I\'ve initiated a comparable search using the AI-recommended criteria. The search found 10 companies in the Western Europe region with operating margins between 4 and 9 percent. You can review them in the Economics tab.',
  'The current interquartile range based on accepted comparables is Q1 at 5.05%, median at 6.25%, and Q3 at 7.65%. The tested party\'s margin of 7.0% falls within this range.',
  'The prior year comparison shows all transactions remained within arm\'s length range. Revenue increased 8% year-over-year while operating margin remained stable at 7%.',
  'Based on the current comparable set, all accepted companies have PLI values within the interquartile range. Two companies were flagged for proximity to the boundary.',
  'The economic analysis confirms arm\'s length pricing. Six comparables were accepted with a healthy IQR spread. The tested party\'s operating margin is in the upper quartile.',
  'Three comparables were rejected: one for insufficient independence below 25%, one as a persistent loss-maker, and one due to SIC code mismatch.',
];

/** PCM 16-bit 16kHz for input */
const INPUT_SAMPLE_RATE = 16000;
/** PCM 16-bit 24kHz output from Nova Sonic */
const OUTPUT_SAMPLE_RATE = 24000;

export interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export function VoiceButton({ onTranscript, onResponse }: VoiceButtonProps) {
  const voiceState = useAppStore((s) => s.voiceState);
  const setVoiceState = useAppStore((s) => s.setVoiceState);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const activate = useCallback(async () => {
    try {
      setVoiceState('listening');
      setTranscript(null);
      setResponse(null);

      // Request microphone (shows browser permission prompt)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, sampleRate: INPUT_SAMPLE_RATE, echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        setError('Microphone permission denied');
        setVoiceState('idle');
        return;
      }
      mediaStreamRef.current = stream;

      // Simulate silence detection after 3 seconds → process
      silenceTimerRef.current = setTimeout(() => {
        processVoice();
      }, 3000);
    } catch (err) {
      setError(`Voice activation failed: ${err instanceof Error ? err.message : 'unknown'}`);
      setVoiceState('idle');
    }
  }, [setVoiceState]);

  const processVoice = useCallback(async () => {
    // Stop recording
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    setVoiceState('processing');

    // Simulate Nova Sonic transcription (500ms)
    await new Promise((r) => setTimeout(r, 500));
    const mockTranscript = MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)];
    setTranscript(mockTranscript);
    onTranscript?.(mockTranscript);

    // Simulate text_agent tool call (1-2s)
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    // Simulate Nova Sonic TTS response
    setVoiceState('speaking');
    const mockResponse = MOCK_VOICE_RESPONSES[Math.floor(Math.random() * MOCK_VOICE_RESPONSES.length)];
    setResponse(mockResponse);
    onResponse?.(mockResponse);

    // Simulate speech duration (2-3s based on response length)
    const speakDuration = Math.min(4000, 1500 + mockResponse.length * 15);
    await new Promise((r) => setTimeout(r, speakDuration));

    setVoiceState('idle');
  }, [setVoiceState, onTranscript, onResponse]);

  const deactivate = useCallback(() => {
    cleanup();
    setVoiceState('idle');
  }, [cleanup, setVoiceState]);

  const handleClick = useCallback(() => {
    if (voiceState === 'idle') {
      activate();
    } else {
      deactivate();
    }
  }, [voiceState, activate, deactivate]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          'relative h-8 w-8 rounded-full transition-all',
          voiceState === 'listening' && 'text-red-500',
          voiceState === 'processing' && 'text-amber-500',
          voiceState === 'speaking' && 'text-green-500',
        )}
        aria-label={
          voiceState === 'idle'
            ? 'Activate voice mode (Nova Sonic 2)'
            : voiceState === 'listening'
              ? 'Listening... Click to stop'
              : voiceState === 'processing'
                ? 'Processing via text_agent...'
                : 'Speaking... Click to stop'
        }
        title={
          voiceState === 'idle'
            ? 'Voice mode (Nova Sonic 2)'
            : voiceState === 'listening'
              ? 'Listening'
              : voiceState === 'processing'
                ? 'Calling text_agent'
                : 'Speaking'
        }
      >
        {voiceState === 'idle' && <Mic className="h-4 w-4" />}
        {voiceState === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <Mic className="h-4 w-4" />
          </>
        )}
        {voiceState === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
        {voiceState === 'speaking' && <SoundWaveIcon className="h-4 w-4" />}
      </Button>

      {/* Voice interaction overlay */}
      {voiceState !== 'idle' && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <div className={cn(
              'h-2 w-2 rounded-full',
              voiceState === 'listening' && 'bg-red-500 animate-pulse',
              voiceState === 'processing' && 'bg-amber-500 animate-pulse',
              voiceState === 'speaking' && 'bg-green-500 animate-pulse',
            )} />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-fg">
              {voiceState === 'listening' && 'Listening…'}
              {voiceState === 'processing' && 'Processing via text_agent…'}
              {voiceState === 'speaking' && 'Speaking…'}
            </span>
          </div>

          {/* Architecture note */}
          <div className="mb-2 rounded bg-muted px-2 py-1 text-[9px] text-muted-fg">
            Nova Sonic 2 → text_agent (only tool) → Response
          </div>

          {transcript && (
            <div className="mb-2">
              <div className="text-[10px] font-medium text-muted-fg">You said:</div>
              <div className="mt-0.5 text-xs text-fg">{transcript}</div>
            </div>
          )}

          {response && (
            <div>
              <div className="text-[10px] font-medium text-muted-fg">Agent response:</div>
              <div className="mt-0.5 text-xs text-fg leading-relaxed">{response}</div>
            </div>
          )}

          {voiceState === 'listening' && !transcript && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-red-400"
                    style={{
                      height: `${8 + Math.random() * 12}px`,
                      animation: `soundbar 0.6s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-fg">Speak now…</span>
            </div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute top-full right-0 mt-2 z-50 whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs text-white shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

function SoundWaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="8" x2="4" y2="16" className="animate-[soundbar_0.6s_ease-in-out_infinite]" />
      <line x1="8" y1="5" x2="8" y2="19" className="animate-[soundbar_0.6s_ease-in-out_0.1s_infinite]" />
      <line x1="12" y1="3" x2="12" y2="21" className="animate-[soundbar_0.6s_ease-in-out_0.2s_infinite]" />
      <line x1="16" y1="5" x2="16" y2="19" className="animate-[soundbar_0.6s_ease-in-out_0.3s_infinite]" />
      <line x1="20" y1="8" x2="20" y2="16" className="animate-[soundbar_0.6s_ease-in-out_0.4s_infinite]" />
    </svg>
  );
}
