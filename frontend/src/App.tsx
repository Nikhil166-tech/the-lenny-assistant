import React, { useState, useEffect } from 'react';
import { Session, Message, Artifact, HealthStatus } from './types';
import { fetchHealth, fetchSessions, createSession, fetchSessionMessages, deleteSession } from './lib/api';
import { useChatStream } from './hooks/useChatStream';
import { ChatPane } from './components/Chat/ChatPane';
import { ArtifactViewer } from './components/Artifact/ArtifactViewer';
import {
  MessageSquare,
  Plus,
  Trash2,
  Cpu,
  Activity,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Database,
  Radio
} from 'lucide-react';

export function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [provider, setProvider] = useState<'ollama' | 'openai' | 'claude'>('ollama');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { isStreaming, currentStatus, sendMessage } = useChatStream();

  // Load initial health & sessions
  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setHealth(h);
        if (h.ollama_status === 'online') {
          setProvider('ollama');
        }
      })
      .catch((err) => console.error('Health probe error', err));

    fetchSessions()
      .then((loadedSessions) => {
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          selectSession(loadedSessions[0].id);
        } else {
          handleNewChat();
        }
      })
      .catch((err) => {
        console.error('Failed loading sessions', err);
        handleNewChat();
      });
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K for New Chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [sessions]);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const msgs = await fetchSessionMessages(sessionId);
      setMessages(msgs);
      const lastArtifactMsg = msgs.slice().reverse().find((m) => m.artifact);
      if (lastArtifactMsg?.artifact) {
        setActiveArtifact(lastArtifactMsg.artifact);
      }
    } catch (err) {
      console.error('Error fetching session messages', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createSession("New Growth Session");
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setActiveArtifact(null);
    } catch (err) {
      const offlineId = 'offline-' + Date.now();
      setActiveSessionId(offlineId);
      setMessages([]);
      setActiveArtifact(null);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Error deleting session', err);
    }
  };

  const handleSendMessage = (text: string, mode: 'default' | 'ship30') => {
    if (!activeSessionId) return;
    sendMessage(
      {
        sessionId: activeSessionId,
        message: text,
        provider,
        mode,
        onArtifactGenerated: (artifact) => {
          setActiveArtifact(artifact);
        },
      },
      setMessages
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 font-sans antialiased selection:bg-emerald-500/30">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* ChatGPT Collapsible Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 bg-[#0d121c] border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Top Branding & New Chat */}
        <div className="p-3 border-b border-slate-800/70">
          <div className="flex items-center justify-between px-2 py-1 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-emerald-500/20">
                L
              </div>
              <div>
                <h1 className="text-xs font-bold text-slate-100 tracking-tight">Lenny Growth AI</h1>
                <p className="text-[10px] text-emerald-400 font-mono">FDE Take-Home Demo</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-medium text-xs flex items-center justify-between border border-slate-800 shadow-sm hover:border-slate-700 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>New Thread</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
              ⌘K
            </span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-grow overflow-y-auto px-2 py-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Your Conversations
          </div>
          {sessions.length === 0 ? (
            <div className="text-xs text-slate-400 p-3 italic text-center">No previous threads</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  activeSessionId === s.id
                    ? 'bg-slate-800/90 text-white font-medium shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeSessionId === s.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{s.title || 'Growth Session'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom System Diagnostics Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transcript Index</span>
            </span>
            <span className="font-mono text-emerald-400 font-medium">
              {health?.vector_index_count ?? 15} segments
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Engine</span>
            </span>
            <span className="font-mono text-slate-300">
              {health?.ollama_model ?? 'llama3.2:3b'}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 truncate">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>{health?.database ?? 'PostgreSQL/SQLite'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Main Area: Chat Pane + Claude Artifact Canvas */}
      <main className="flex-grow flex flex-col md:flex-row min-w-0 h-full overflow-hidden">
        {/* Center Chat View */}
        <div
          className={`flex-grow h-full min-w-0 transition-all duration-300 ${
            activeArtifact ? 'md:w-1/2 lg:w-3/5' : 'w-full'
          }`}
        >
          <ChatPane
            messages={messages}
            isStreaming={isStreaming}
            currentStatus={currentStatus}
            provider={provider}
            onProviderChange={setProvider}
            ollamaStatus={health?.ollama_status}
            onSendMessage={handleSendMessage}
            onNewChat={handleNewChat}
            onOpenArtifact={setActiveArtifact}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        {/* Right Side-by-Side Canvas (Claude 3.5 Artifacts style) */}
        {activeArtifact && (
          <div className="w-full md:w-1/2 lg:w-2/5 h-full z-20 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300">
            <ArtifactViewer
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
