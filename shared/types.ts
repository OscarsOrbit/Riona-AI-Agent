export interface AgentRules {
  allowedHashtags: string[];
  blockedHashtags: string[];
  allowedKeywords: string[];
  blockedKeywords: string[];
  maxPostsPerSession: number;
  interactionDelay: {
    min: number;
    max: number;
  };
  commentStyle: string;
  commentTopics: string[];
  avoidTopics: string[];
}

export interface AgentStats {
  postsScanned: number;
  postsInteracted: number;
  likesGiven: number;
  commentsPosted: number;
  lastInteraction: string;
}

export interface AgentStatus {
  status: 'running' | 'stopped';
  currentRules: AgentRules | null;
  stats: AgentStats;
  lastUpdate: string;
}

export interface WebSocketUpdate {
  type: 'status' | 'stats' | 'log';
  data: any;
}

export interface AgentConfig {
  rules: AgentRules;
  credentials: {
    username: string;
    password: string;
  };
}
