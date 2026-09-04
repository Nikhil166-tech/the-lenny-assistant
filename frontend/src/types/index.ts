export interface CitationSource {
  episode: string;
  guest: string;
  topic?: string;
  timestamp?: string;
  text: string;
  score: number;
}

export interface Artifact {
  artifact_type: string;
  title: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: CitationSource[];
  artifact?: Artifact;
  provider?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface HealthStatus {
  status: string;
  database: string;
  vector_index_count: number;
  ollama_status: string;
  ollama_model: string;
  cloud_provider: string;
}
