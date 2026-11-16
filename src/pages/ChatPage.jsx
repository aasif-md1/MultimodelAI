import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ChatInputBar from '../components/ChatInputBar';
import RotatingHeadline from '../components/RotatingHeadline';
import { KurageAvatar } from '../components/KurageIcons';
import { askChat, uploadImageAndAsk } from '../api/aiService';
import { User, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getMedia, storeMedia } from '../utils/db';
import StreamingText from '../components/StreamingText';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage({
  sessionId,
  onUpdateSessions,
  userName = 'User',
  onUpdateUserName,
  mode = 'auto',
  onSelectMode,
  isWebSearchOn = false,
  onToggleWebSearch,
  chipSetIndex = 0,
  statusMessage,
  setStatusMessage,
  isMotionPlaying = true,
}) {
  const [messages, setMessages] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState(null);
  const [isStoppedStreaming, setIsStoppedStreaming] = useState(false);
  const [activeMediaFile, setActiveMediaFile] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || 'User');
  const [prevUserName, setPrevUserName] = useState(userName);
  const nameInputRef = useRef(null);

  if (prevUserName !== userName) {
    setPrevUserName(userName);
    setNameInput(userName || 'User');
  }

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateUserName?.(trimmed);
    } else {
      setNameInput(userName || 'User');
    }
    setIsEditingName(false);
  };

  const inputBarRef = useRef(null);
  const scrollRef = useRef(null);

  const isProcessing = isFetching || !!streamingResponse;

  const CHIP_SETS = [
    [
      { cmd: 'explore', rest: 'ideas', prompt: 'Give me five weekend side-project ideas I could ship by Sunday night, with the first step for each.' },
      { cmd: 'refine', rest: 'my writing', prompt: 'Tighten this paragraph without losing my voice. Show the edit, then list what you changed:\n\n' },
      { cmd: 'plan', rest: 'a project', prompt: 'Turn this goal into a two-week plan with milestones, owners and risks: ' },
      { cmd: 'research', rest: 'a topic', prompt: 'Research this topic and give me the three strongest sources, each with a one-line summary: ' },
    ],
    [
      { cmd: 'compare', rest: 'two options', prompt: 'Compare these two options side by side and recommend one, including the trade-off I would be accepting: ' },
      { cmd: 'summarize', rest: 'my notes', prompt: 'Summarize these notes into decisions, open questions and next steps:\n\n' },
      { cmd: 'analyze', rest: 'visual data', prompt: 'Analyze this image and describe the key patterns, composition, and objects in detail: ' },
      { cmd: 'explain', rest: 'simply', prompt: 'Explain this like I am smart but new to the field, with one everyday analogy: ' },
    ],
    [
      { cmd: 'name', rest: 'something', prompt: 'Brainstorm ten names for this, short and easy to say, and mark your three favourites: ' },
      { cmd: 'critique', rest: 'a draft', prompt: 'Be a tough but fair editor. What is the weakest part of this, and how would you fix it?\n\n' },
      { cmd: 'outline', rest: 'a talk', prompt: 'Outline a 10-minute talk on this topic with a strong opening line and three key points: ' },
      { cmd: 'decide', rest: 'with me', prompt: 'Help me decide. Ask me the three questions that matter most, one at a time, about: ' },
    ],
  ];

  const currentChips = CHIP_SETS[chipSetIndex % CHIP_SETS.length];

  // Dynamic Daypart Greeting
  const daypart = (() => {
    const h = new Date().getHours();
    return h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  // Load session from storage
  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
        if (storedChats[sessionId]) {
          const loadedMessages = storedChats[sessionId].messages || [];

          const hydratedMessages = await Promise.all(
            loadedMessages.map(async (msg) => {
              if (msg.mediaId) {
                const blob = await getMedia(msg.mediaId);
                if (blob) {
                  return {
                    ...msg,
                    _mediaUrl: URL.createObjectURL(blob),
                  };
                }
              }
              return msg;
            })
          );

          setMessages(hydratedMessages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    loadSession();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing, streamingResponse]);

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Save to local storage whenever messages change
  const onUpdateSessionsRef = useRef(onUpdateSessions);
  useEffect(() => {
    onUpdateSessionsRef.current = onUpdateSessions;
  });

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
      let titleText = '';
      const firstContent = messages[0]?.content;
      if (typeof firstContent === 'string') {
        titleText = firstContent;
      } else if (Array.isArray(firstContent)) {
        titleText = firstContent.find((c) => c.type === 'text')?.text || 'New Chat';
      }
      const title = titleText.substring(0, 32) + (titleText.length > 32 ? '...' : '') || 'New Chat';

      const existingSession = storedChats[sessionId];
      const updatedAt = existingSession?.updatedAt || Date.now();

      storedChats[sessionId] = { id: sessionId, title, messages, updatedAt };
      localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      if (onUpdateSessionsRef.current) {
        onUpdateSessionsRef.current(Object.values(storedChats));
      }
    }
  }, [messages, sessionId]);

  const handleSendMessage = async ({ text, media }) => {
    if (!text && !media) return;

    let outgoingContent = text || 'Attached media file';
    let mediaId = null;
    let localMediaUrl = null;

    if (media) {
      mediaId = uuidv4();
      await storeMedia(mediaId, media);
      localMediaUrl = URL.createObjectURL(media);
      setActiveMediaFile(media);
    } else {
      setActiveMediaFile(null);
    }

    const newMessageObj = {
      role: 'user',
      content: outgoingContent,
      mediaId: mediaId,
      _mediaUrl: localMediaUrl,
      _mediaType: media ? media.type : null,
    };

    const updatedMessages = [...messages, newMessageObj];
    setMessages(updatedMessages);
    setIsFetching(true);
    setIsStoppedStreaming(false);

    try {
      let res;
      if (media && media.type.startsWith('image')) {
        res = await uploadImageAndAsk(media, text || '');
      } else {
        const backendPayload = updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        res = await askChat(backendPayload);
      }

      if (res.updatedMessages && res.updatedMessages.length === updatedMessages.length) {
        updatedMessages[updatedMessages.length - 1].content =
          res.updatedMessages[res.updatedMessages.length - 1].content;
      }

      const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
      if (storedChats[sessionId]) {
        storedChats[sessionId].updatedAt = Date.now();
        localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      }

      setStreamingResponse(res.answer);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `**Error:** ${err}` },
      ]);
      setStatusMessage?.({ tone: 'error', title: 'Request failed', msg: String(err) });
    } finally {
      setIsFetching(false);
      setActiveMediaFile(null);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setStatusMessage?.({ tone: 'ok', title: 'Copied to clipboard', msg: 'Prompt response copied.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRegenerate = async (idx) => {
    if (isProcessing) return;

    let precedingUserMsg = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        precedingUserMsg = messages[i];
        break;
      }
    }
    if (!precedingUserMsg) return;

    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    setIsFetching(true);
    setIsStoppedStreaming(false);

    try {
      let res;
      if (precedingUserMsg.mediaId) {
        const blob = await getMedia(precedingUserMsg.mediaId);
        if (blob && blob.type.startsWith('image')) {
          res = await uploadImageAndAsk(blob, precedingUserMsg.content || '');
        } else {
          res = await askChat(trimmed.map((m) => ({ role: m.role, content: m.content })));
        }
      } else {
        res = await askChat(trimmed.map((m) => ({ role: m.role, content: m.content })));
      }

      setStreamingResponse(res.answer);
    } catch (err) {
      setMessages([
        ...trimmed,
        { role: 'assistant', content: `**Error:** ${err}` },
      ]);
      setStatusMessage?.({ tone: 'error', title: 'Regeneration failed', msg: String(err) });
    } finally {
      setIsFetching(false);
    }
  };

  const handleStopStreaming = () => {
    setIsStoppedStreaming(true);
  };

  const handleCompleteStreaming = (finalText) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: finalText }]);
    setStreamingResponse(null);
    setIsStoppedStreaming(false);
  };

  return (
    <>
      {messages.length === 0 ? (
        /* Kurage Exact Welcome Stage */
        <>
          <section className="stage" aria-labelledby="headline">
            <div className="core">
              <div className="intro">
                <div className="halo" aria-hidden="true" />
                <p className="eyebrow flex items-center justify-center gap-1.5 flex-wrap">
                  <span id="greeting">{daypart},</span>
                  {isEditingName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') {
                            setNameInput(userName || 'User');
                            setIsEditingName(false);
                          }
                        }}
                        onBlur={handleSaveName}
                        maxLength={32}
                        className="bg-white/[0.08] border border-white/[0.2] focus:border-[var(--cyan-300)] rounded px-2.5 py-0.5 text-base text-[var(--mist-50)] font-mono outline-none focus:outline-none w-32 text-center"
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="p-1 text-[var(--cyan-300)] hover:text-white rounded"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="inline-flex items-center px-1.5 py-0.5 -my-0.5 rounded hover:bg-white/[0.08] transition-colors cursor-pointer text-inherit"
                      title="Click to edit name"
                    >
                      <span className="text-[var(--mist-100)] font-medium">
                        {userName}
                      </span>
                    </button>
                  )}
                </p>
                <RotatingHeadline isPlaying={isMotionPlaying} />
              </div>

              {/* Kurage Exact Glass Composer */}
              <ChatInputBar
                ref={inputBarRef}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                isStreaming={!!streamingResponse}
                onStopStreaming={handleStopStreaming}
                mode={mode}
                onSelectMode={onSelectMode}
                isWebSearchOn={isWebSearchOn}
                onToggleWebSearch={onToggleWebSearch}
                setStatusMessage={setStatusMessage}
              />
            </div>

            {/* Starting points chips */}
            <ul className="chips" id="chips" aria-label="Starting points">
              {currentChips.map((chip, idx) => (
                <li key={chip.cmd + idx}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      inputBarRef.current?.setText(chip.prompt);
                      setStatusMessage?.({
                        tone: 'ok',
                        title: 'Starting point',
                        msg: `/${chip.cmd} loaded into composer.`,
                      });
                    }}
                  >
                    <span className="slash" aria-hidden="true">
                      /
                    </span>
                    {chip.cmd} {chip.rest}
                  </button>
                </li>
              ))}
            </ul>

            {/* Status message pill */}
            {statusMessage && (
              <div
                className="status"
                id="status"
                role="status"
                data-tone={statusMessage.tone}
              >
                <span>
                  <strong>{statusMessage.title}.</strong> {statusMessage.msg}
                </span>
              </div>
            )}
          </section>

          <p className="footnote">
            SpaceAI · Multimodal AI workspace for text, vision, audio and documents
          </p>
        </>
      ) : (
        /* Active Chat Stream View */
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            <div className="max-w-3xl mx-auto w-full space-y-6 pb-24">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';

                let textToRender = msg.content;
                if (Array.isArray(msg.content)) {
                  textToRender = msg.content.find((c) => c.type === 'text')?.text || '';
                }
                if (typeof textToRender !== 'string') {
                  textToRender = String(textToRender || '');
                }

                return (
                  <div
                    key={idx}
                    className={`flex gap-3.5 animate-message ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-solid)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--mist-400)]">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="shrink-0 mt-0.5">
                        <KurageAvatar size={28} />
                      </div>
                    )}

                    {/* Bubble Container */}
                    <div
                      className={`flex flex-col gap-1.5 max-w-[85%] ${
                        isUser ? 'items-end' : 'items-start group'
                      }`}
                    >
                      {/* Media Attachments */}
                      {msg._mediaUrl &&
                        (msg._mediaType?.startsWith('video') ? (
                          <video
                            src={msg._mediaUrl}
                            controls
                            className="max-w-md rounded-xl overflow-hidden border border-[var(--border)] shadow-lg"
                          />
                        ) : msg._mediaType?.startsWith('image') ? (
                          <img
                            src={msg._mediaUrl}
                            alt="attachment"
                            onClick={() => setLightboxUrl(msg._mediaUrl)}
                            className="max-w-md rounded-xl overflow-hidden border border-[var(--border)] shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        ) : null)}

                      {/* Bubble Content */}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed break-words shadow-md border backdrop-blur-md ${
                          isUser
                            ? 'bg-[var(--surface-solid)] text-[var(--mist-50)] rounded-tr-sm border-[var(--border)]'
                            : 'bg-[var(--surface)] text-[var(--mist-50)] rounded-tl-sm border-[var(--border)]'
                        }`}
                      >
                        <ErrorBoundary>
                          <div className="markdown-body">
                            <ReactMarkdown>{textToRender}</ReactMarkdown>
                          </div>
                        </ErrorBoundary>
                      </div>

                      {/* Assistant Action Toolbar */}
                      {!isUser && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 px-1 font-sans">
                          <button
                            type="button"
                            onClick={() => handleCopy(textToRender, idx)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--mist-400)] hover:text-[var(--mist-50)] rounded-md hover:bg-white/[0.06] transition-colors"
                            title="Copy response"
                          >
                            {copiedIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-[var(--accent)]" />
                                <span className="text-[10px] text-[var(--accent)]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRegenerate(idx)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--mist-400)] hover:text-[var(--mist-50)] rounded-md hover:bg-white/[0.06] transition-colors"
                            title="Regenerate response"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-[10px]">Regenerate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackState((prev) => ({
                                ...prev,
                                [idx]: prev[idx] === 'up' ? null : 'up',
                              }))
                            }
                            className={`p-1 rounded-md transition-colors ${
                              feedbackState[idx] === 'up'
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--mist-500)] hover:text-[var(--mist-50)]'
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackState((prev) => ({
                                ...prev,
                                [idx]: prev[idx] === 'down' ? null : 'down',
                              }))
                            }
                            className={`p-1 rounded-md transition-colors ${
                              feedbackState[idx] === 'down'
                                ? 'text-[var(--danger)]'
                                : 'text-[var(--mist-500)] hover:text-[var(--mist-50)]'
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isFetching && <ThinkingIndicator hasMedia={!!activeMediaFile} mode={mode} />}

              {streamingResponse && (
                <div className="flex gap-3.5 animate-message">
                  <div className="shrink-0 mt-0.5">
                    <KurageAvatar size={28} />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-[85%] items-start">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--surface)] text-[var(--mist-50)] shadow-md border border-[var(--border)] backdrop-blur-md">
                      <StreamingText
                        content={streamingResponse}
                        onIteration={handleScroll}
                        isStopped={isStoppedStreaming}
                        onComplete={handleCompleteStreaming}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </div>

          {/* Floating Bottom Input Area for active chats */}
          <div className="relative z-20 pb-4 pt-2 max-w-[700px] w-full mx-auto px-4">
            <ChatInputBar
              ref={inputBarRef}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              isStreaming={!!streamingResponse}
              onStopStreaming={handleStopStreaming}
              mode={mode}
              onSelectMode={onSelectMode}
              isWebSearchOn={isWebSearchOn}
              onToggleWebSearch={onToggleWebSearch}
              setStatusMessage={setStatusMessage}
            />
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxUrl}
              alt="expanded preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-[var(--border)]"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-[var(--ink-900)]/80 hover:bg-[var(--ink-900)] text-[var(--mist-50)] rounded-lg border border-white/[0.1] transition-colors"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
