import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { KurageIcon } from './KurageIcons';
import { Camera, X, Square } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { compressImage } from '../utils/imageCompressor';
import { OceanEvent } from '../utils/oceanEvents';

export default function ChatInputBar({
  onSendMessage,
  isProcessing,
  isStreaming,
  onStopStreaming,
  mode = 'auto',
  onSelectMode,
  isWebSearchOn = false,
  onToggleWebSearch,
  setStatusMessage,
  ref,
}) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const composerRef = useRef(null);
  const { videoRef, startCamera, stopCamera, captureFrame } = useCamera();
  const recognitionRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setText: (val) => {
      setText(val);
      OceanEvent.typing();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 224)}px`;
        }
      }, 20);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  // Track composer bounding box for ocean jellyfish target
  useEffect(() => {
    const updateTarget = () => {
      if (composerRef.current) {
        const r = composerRef.current.getBoundingClientRect();
        OceanEvent.setTarget(r.left + r.width / 2, r.top + r.height / 2);
      }
    };
    updateTarget();
    window.addEventListener('resize', updateTarget);
    return () => window.removeEventListener('resize', updateTarget);
  }, []);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');

        if (event.results[0].isFinal) {
          setText((prev) => prev + (prev.length > 0 ? ' ' : '') + transcript);
          OceanEvent.typing();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setStatusMessage?.({ tone: 'ok', title: 'Voice ended', msg: 'Audio transcribed.' });
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        setStatusMessage?.({ tone: 'ok', title: 'Listening', msg: 'Speak your query clearly.' });
      } else {
        setStatusMessage?.({ tone: 'error', title: 'Voice unsupported', msg: 'Browser does not support speech recognition.' });
      }
    }
  };

  const handleCameraToggle = () => {
    if (isCameraActive) {
      stopCamera();
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
      startCamera();
    }
  };

  const takePhoto = async () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const compressedFile = await compressImage(file);
        handleFileAttachment(compressedFile);
        handleCameraToggle();
        setStatusMessage?.({ tone: 'ok', title: 'Photo captured', msg: 'Added to your prompt.' });
      } catch (err) {
        console.error('Failed to capture and compress camera image:', err);
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedFile = file.type.startsWith('image') ? await compressImage(file) : file;
        handleFileAttachment(compressedFile);
        setStatusMessage?.({ tone: 'ok', title: 'File attached', msg: `${file.name} ready with prompt.` });
      } catch {
        handleFileAttachment(file);
      }
    }
  };

  const handleFileAttachment = (file) => {
    setMediaFile(file);
  };

  const clearAttachment = () => {
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMessage?.({ tone: 'ok', title: 'File removed', msg: 'Composer reset.' });
  };

  const formatFileSize = (b) => {
    return b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    OceanEvent.typing();
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 224)}px`;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const cleanText = text.trim();
    if (!cleanText && !mediaFile) {
      OceanEvent.dim();
      setStatusMessage?.({ tone: 'error', title: 'Write a prompt first', msg: 'Type a question or select a starting point below.' });
      return;
    }
    if (isProcessing) return;

    OceanEvent.pulse();
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 1200);

    onSendMessage({
      text: cleanText,
      media: mediaFile,
      mode,
      webSearch: isWebSearchOn,
    });

    setText('');
    clearAttachment();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasContent = text.trim().length > 0 || !!mediaFile;

  return (
    <div className="relative w-full">
      {/* Live Webcam Modal / Overlay */}
      {isCameraActive && (
        <div className="absolute bottom-full left-4 right-4 sm:left-auto sm:right-4 mb-3 p-3 bg-[var(--ink-850)] rounded-2xl border border-[var(--border-strong)] shadow-2xl z-40 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-2 px-1 text-xs text-[var(--mist-400)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--mist-50)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
              Camera Live
            </span>
            <button
              onClick={handleCameraToggle}
              className="text-[var(--mist-400)] hover:text-white p-1 rounded-md hover:bg-white/[0.08] transition-colors"
              aria-label="Close camera"
            >
              <X size={15} />
            </button>
          </div>
          <video
            ref={videoRef}
            className="w-full sm:w-80 h-auto rounded-xl bg-black object-cover aspect-video border border-[var(--border)]"
            autoPlay
            playsInline
            muted
          />
          <button
            onClick={takePhoto}
            className="w-full mt-2.5 py-2 bg-gradient-to-r from-[var(--cyan-200)] to-[var(--violet-200)] text-[var(--ink-950)] text-xs font-semibold rounded-xl transition-all hover:brightness-110 cursor-pointer shadow-md"
          >
            Capture Frame
          </button>
        </div>
      )}

      {/* Kurage Exact Composer Form */}
      <form
        ref={composerRef}
        onSubmit={handleSubmit}
        className="composer"
        id="composer"
        data-ready={hasContent ? '' : undefined}
        noValidate
      >
        <label htmlFor="prompt" className="sr-only">
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={12000}
          placeholder="Ask SpaceAI anything…"
          autoComplete="off"
          spellCheck="true"
          style={{ outline: 'none', boxShadow: 'none' }}
        />

        {/* Attachment Card */}
        {mediaFile && (
          <div className="attachment" id="attachment">
            <KurageIcon name="file" className="i i-sm" />
            <span className="name">{mediaFile.name}</span>
            <span className="size">{formatFileSize(mediaFile.size)}</span>
            <button
              type="button"
              onClick={clearAttachment}
              aria-label={`Remove ${mediaFile.name}`}
            >
              <KurageIcon name="x" className="i i-sm" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="tools">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="sr-only"
              id="file"
              tabIndex={-1}
              aria-hidden="true"
              accept="image/*,video/*,.pdf,.txt,.md,.json"
            />

            {/* Attach button */}
            <button
              type="button"
              className="tool"
              id="attach"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a file"
            >
              <KurageIcon name="plus" className="i" />
            </button>

            {/* Camera capture button */}
            <button
              type="button"
              className="tool"
              onClick={handleCameraToggle}
              aria-pressed={isCameraActive}
              aria-label="Camera capture"
              title="Camera capture"
            >
              <Camera className="i" />
            </button>

            {/* Response Mode Dropdown */}
            <div className="mode">
              <KurageIcon
                name={mode === 'fast' ? 'fast' : mode === 'think' ? 'think' : 'auto'}
                className="i i-sm mode-icon"
              />
              <label htmlFor="mode" className="sr-only">
                Response mode
              </label>
              <select
                id="mode"
                name="mode"
                value={mode}
                onChange={(e) => {
                  const m = e.target.value;
                  onSelectMode(m);
                  setStatusMessage?.({
                    tone: 'ok',
                    title: `${m[0].toUpperCase() + m.slice(1)} mode`,
                    msg:
                      m === 'fast'
                        ? 'Shorter answers, sooner. The jellyfish swim quicker too.'
                        : m === 'think'
                        ? 'Slower and more thorough, working through the problem step by step.'
                        : 'SpaceAI picks how deep to go for each prompt.',
                  });
                }}
              >
                <option value="auto">Auto</option>
                <option value="fast">Fast</option>
                <option value="think">Think</option>
              </select>
              <KurageIcon name="chevron" className="i i-sm chev" />
            </div>

            {/* Web Search Button */}
            <button
              type="button"
              className="tool"
              id="web"
              aria-pressed={isWebSearchOn}
              onClick={() => {
                const next = !isWebSearchOn;
                onToggleWebSearch?.();
                setStatusMessage?.({
                  tone: 'ok',
                  title: next ? 'Web search on' : 'Web search off',
                  msg: next
                    ? 'Your next prompts can include fresh pages from the web.'
                    : 'SpaceAI will answer from what it already knows.',
                });
              }}
              aria-label="Search the web"
            >
              <KurageIcon name="globe" className="i" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              className="tool"
              id="mic"
              onClick={handleMicClick}
              aria-label="Voice input"
            >
              <KurageIcon name="mic" className="i" />
            </button>
          </div>

          {/* Right Toolbar / Send Button */}
          <div className="tools tools-right">
            <p className="hint" aria-hidden="true">
              <kbd>↵</kbd> save · <kbd>⇧↵</kbd> new line
            </p>

            {isStreaming ? (
              <button
                type="button"
                className="send"
                onClick={onStopStreaming}
                aria-label="Stop generating"
                title="Stop generating"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                className={`send ${isSavedFeedback ? 'is-saved' : ''}`}
                id="send"
                aria-label="Send prompt"
                disabled={!hasContent || isProcessing}
              >
                <KurageIcon name="arrow" className="i i-arrow" />
                <KurageIcon name="check" className="i i-check" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
