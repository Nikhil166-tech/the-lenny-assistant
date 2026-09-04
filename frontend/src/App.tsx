import React, { useState, useEffect } from 'react';
import { Session, Message, Artifact, HealthStatus } from './types';
import { fetchHealth, fetchSessions, createSession, fetchSessionMessages, deleteSession } from './lib/api';
import { useChatStream } from './hooks/useChatStream';
import { ChatPane } from './components/Chat/ChatPane';
import { ArtifactViewer } from './components/Artifact/ArtifactViewer';
import { MessageSquare, Plus, Trash2, Cpu, CheckCircle2, ShieldCheck, Activity, Menu, X } from 'lucide-react';

export function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [provider, setProvider] = useState<'ollama' | 'openai' | 'claude'>('openai');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { isStreaming, currentStatus, sendMessage } = useChatStream();

  // Load initial health & sessions
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
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

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const msgs = await fetchSessionMessages(sessionId);
      setMessages(msgs);
      // If any message in this session has an artifact, set it as active
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
      setSidebarOpen(false);
    } catch (err) {
      // Offline fallback session id
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
              L
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Lenny Assistant</h1>
              <p className="text-[10px] text-emerald-400 font-mono">FDE Assessment Demo</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-grow overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
            Recent Sessions
          </div>
          {sessions.length === 0 ? (
            <div className="text-xs text-slate-400 p-2 italic">No previous sessions</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  selectSession(s.id);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  activeSessionId === s.id
                    ? 'bg-slate-800 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{s.title || 'Growth Session'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete session"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom System Diagnostics Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>RAG Index</span>
            </span>
            <span className="font-mono text-emerald-400">
              {health?.vector_index_count ?? 15} chunks
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>Engine</span>
            </span>
            <span className="font-mono text-slate-300">
              {health?.ollama_model ?? 'llama3.2:3b'}
            </span>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="truncate">{health?.database ?? 'PostgreSQL/SQLite'}</span>
            <span className="text-emerald-400">Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area: Chat Pane + Artifact Drawer */}
      <main className="flex-grow flex flex-col md:flex-row min-w-0 h-full overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="md:hidden h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-white">The Lenny Growth Assistant</span>
          <div className="w-5" />
        </div>

        {/* Center: Chat Interface */}
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
          />
        </div>

        {/* Right: Side-by-Side Artifact Canvas (Claude Artifacts style) */}
        {activeArtifact && (
          <div className="w-full md:w-1/2 lg:w-2/5 h-full z-30">
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
