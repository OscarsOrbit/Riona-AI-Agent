import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { runInstagram } from '../src/client/Instagram';
import { AgentRules, AgentStats, WebSocketUpdate } from '../shared/types';
import { Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let currentRules: AgentRules | null = null;
let agentStatus: 'running' | 'stopped' = 'stopped';
let agentStats: AgentStats = {
  postsScanned: 0,
  postsInteracted: 0,
  likesGiven: 0,
  commentsPosted: 0,
  lastInteraction: '-'
};

// WebSocket connection handling
io.on('connection', (socket: Socket) => {
  console.log('Client connected');
  
  socket.emit('update', {
    type: 'status',
    data: { status: agentStatus, currentRules, stats: agentStats }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API Routes
app.get('/api/agent/status', (req, res) => {
  res.json({
    status: agentStatus,
    currentRules,
    stats: agentStats
  });
});

app.post('/api/agent/start', async (req: express.Request, res: express.Response) => {
  try {
    const rules: AgentRules = req.body;
    currentRules = rules;
    agentStatus = 'running';

    // Start the Instagram automation in a separate process
    runInstagram().catch((error: Error) => {
      console.error('Error running Instagram automation:', error);
      agentStatus = 'stopped';
      io.emit('update', {
        type: 'status',
        data: { status: 'stopped', error: error.message }
      });
    });

    res.json({ status: 'running', message: 'Agent started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start agent' });
  }
});

app.post('/api/agent/stop', (req: express.Request, res: express.Response) => {
  try {
    agentStatus = 'stopped';
    // TODO: Implement proper shutdown of Instagram automation
    res.json({ status: 'stopped', message: 'Agent stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop agent' });
  }
});

app.put('/api/agent/rules', (req: express.Request, res: express.Response) => {
  try {
    const rules: AgentRules = req.body;
    currentRules = rules;
    res.json({ message: 'Rules updated successfully', rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rules' });
  }
});

// Update stats and emit to connected clients
export function updateStats(newStats: Partial<AgentStats>) {
  agentStats = { ...agentStats, ...newStats };
  io.emit('update', {
    type: 'stats',
    data: agentStats
  });
}

// Log messages and emit to connected clients
export function logMessage(message: string) {
  io.emit('update', {
    type: 'log',
    data: message
  });
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
