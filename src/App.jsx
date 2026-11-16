import { useState, useCallback, useEffect } from 'react';
import ChatLayout from './components/ChatLayout';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import SettingsModal from './components/SettingsModal';
import { IconSprite } from './components/KurageIcons';
import { v4 as uuidv4 } from 'uuid';
import { deleteMedia } from './utils/db';

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    return Object.values(storedChats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const savedId = localStorage.getItem('current_session_id');
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    if (savedId && storedChats[savedId]) {
      return savedId;
    }
    const loadedSessions = Object.values(storedChats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (loadedSessions.length > 0) {
      return loadedSessions[0].id;
    }
    const newId = uuidv4();
    localStorage.setItem('current_session_id', newId);
    return newId;
  });

  // Default to collapsed rail (72px) matching Kurage design (Image 2)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('kurage:rail');
    return saved !== null ? saved === 'true' : true;
  });

  const [mode, setMode] = useState(() => {
    return localStorage.getItem('kurage:mode') || 'auto';
  });

  const [isMotionPlaying, setIsMotionPlaying] = useState(() => {
    const saved = localStorage.getItem('kurage:motion');
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });

  const [isWebSearchOn, setIsWebSearchOn] = useState(false);
  const [chipSetIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User display name (defaults to 'User', editable by user)
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('spaceai_user_name') || 'User';
  });

  const handleUpdateUserName = useCallback((newName) => {
    const trimmed = (newName || '').trim();
    const finalName = trimmed || 'User';
    setUserName(finalName);
    localStorage.setItem('spaceai_user_name', finalName);
  }, []);

  // Sync document motion attribute
  useEffect(() => {
    document.documentElement.dataset.motion = isMotionPlaying ? 'on' : 'off';
    localStorage.setItem('kurage:motion', String(isMotionPlaying));
  }, [isMotionPlaying]);

  const handleSelectMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('kurage:mode', newMode);
  };

  const toggleMotion = () => {
    setIsMotionPlaying((prev) => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem('kurage:rail', String(newVal));
      return newVal;
    });
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    localStorage.setItem('current_session_id', id);
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    setCurrentSessionId(newId);
    localStorage.setItem('current_session_id', newId);
    setStatusMessage({ tone: 'ok', title: 'New chat', msg: 'The composer is clear.' });
  };

  const handleUpdateSessions = useCallback((updatedList) => {
    const sortedList = [...updatedList].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setSessions(sortedList);
  }, []);

  const handleRenameSession = (id, newTitle) => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    if (storedChats[id]) {
      storedChats[id].title = newTitle;
      storedChats[id].updatedAt = Date.now();
      localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      handleUpdateSessions(Object.values(storedChats));
    }
  };

  const handleDeleteSession = async (id) => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    const sessionToDelete = storedChats[id];

    if (sessionToDelete && sessionToDelete.messages) {
      for (const msg of sessionToDelete.messages) {
        if (msg.mediaId) {
          await deleteMedia(msg.mediaId);
        }
      }
    }

    delete storedChats[id];
    localStorage.setItem('ai_chats', JSON.stringify(storedChats));

    const remainingSessions = Object.values(storedChats);
    handleUpdateSessions(remainingSessions);

    if (currentSessionId === id) {
      if (remainingSessions.length > 0) {
        handleSelectSession(remainingSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleClearAllChats = async () => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    for (const session of Object.values(storedChats)) {
      if (session.messages) {
        for (const msg of session.messages) {
          if (msg.mediaId) {
            await deleteMedia(msg.mediaId);
          }
        }
      }
    }

    localStorage.removeItem('ai_chats');
    localStorage.removeItem('current_session_id');
    setSessions([]);
    handleNewChat();
  };

  // Global hotkeys (⌘K, ?, /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput =
        e.target &&
        (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));

      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        setIsShortcutsOpen(false);
        return;
      }

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(false);
        setIsSettingsOpen(false);
        setStatusMessage(null);
        return;
      }

      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('prompt')?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Kurage SVG Icons Sprite */}
      <IconSprite />

      {/* Shell Layout with Rail & Workspace */}
      <ChatLayout
        isCollapsed={isSidebarCollapsed}
        onOpenHistory={() => setIsCommandPaletteOpen(true)}
        mode={mode}
        isMotionPlaying={isMotionPlaying}
        sidebar={({ isMobileDrawer, onCloseMobileDrawer }) => (
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onOpenHistory={() => setIsCommandPaletteOpen(true)}
            onOpenLibrary={() => setIsCommandPaletteOpen(true)}
            isMotionPlaying={isMotionPlaying}
            onToggleMotion={toggleMotion}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            userName={userName}
            isMobileDrawer={isMobileDrawer}
            onCloseMobileDrawer={onCloseMobileDrawer}
          />
        )}
      >
        <ChatPage
          key={currentSessionId}
          sessionId={currentSessionId}
          onUpdateSessions={handleUpdateSessions}
          userName={userName}
          onUpdateUserName={handleUpdateUserName}
          mode={mode}
          onSelectMode={handleSelectMode}
          isWebSearchOn={isWebSearchOn}
          onToggleWebSearch={() => setIsWebSearchOn((prev) => !prev)}
          chipSetIndex={chipSetIndex}
          statusMessage={statusMessage}
          setStatusMessage={setStatusMessage}
          isMotionPlaying={isMotionPlaying}
        />
      </ChatLayout>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onFillPrompt={(promptText) => {
          const textarea = document.getElementById('prompt');
          if (textarea) {
            textarea.value = promptText;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
          }
        }}
        mode={mode}
        onSelectMode={handleSelectMode}
        isMotionPlaying={isMotionPlaying}
        onToggleMotion={toggleMotion}
        isWebSearchOn={isWebSearchOn}
        onToggleWebSearch={() => setIsWebSearchOn((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearAllChats={handleClearAllChats}
        userName={userName}
        onUpdateUserName={handleUpdateUserName}
      />
    </>
  );
}
