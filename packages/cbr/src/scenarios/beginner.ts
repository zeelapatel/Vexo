import type { InterviewScenario, VexoNode, VexoEdge } from '@vexo/types';
import { ComponentCategory, ConnectionType, SystemStatus } from '@vexo/types';
import { BEGINNER_RUBRIC } from '@vexo/types';

function node(
  id: string,
  label: string,
  componentId: string,
  category: ComponentCategory,
  x: number,
  y: number,
): VexoNode {
  return {
    id,
    type: 'vexo',
    position: { x, y },
    data: {
      componentId,
      label,
      category,
      cloudVariant: null,
      iconType: 'custom',
      iconSrc: componentId,
      status: SystemStatus.Idle,
      metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
    },
  };
}

function edge(id: string, source: string, target: string, connectionType: ConnectionType): VexoEdge {
  return {
    id,
    source,
    target,
    data: { connectionType, validationStatus: 'valid' },
  } as VexoEdge;
}

export const BEGINNER_SCENARIOS: InterviewScenario[] = [
  // ── 01 URL Shortener ──────────────────────────────────────────────────────
  {
    id: 'url-shortener',
    title: 'URL Shortener',
    description:
      'Design a URL shortening service like bit.ly or TinyURL. Users submit a long URL and get back a short code (e.g. bit.ly/xyz). Visiting the short URL redirects to the original.',
    difficulty: 'beginner',
    category: 'storage',
    company: null,
    timeLimit: 25,
    requirements: [
      'Users can shorten a long URL and receive a unique short code',
      'Visiting the short URL redirects to the original URL',
      'Short codes are unique and do not collide',
      'Basic click analytics are tracked per short URL',
    ],
    nonFunctionalRequirements: [
      'Handle 1,000 writes/sec and 100,000 reads/sec',
      'Redirect latency < 10ms at p99',
    ],
    constraints: ['URLs should not expire', 'Short codes are 6–8 alphanumeric characters'],
    hints: [
      'Start with the read path — most traffic is redirects, not writes. Where would caching help most?',
      'A cache hit rate above 90% is critical for < 10ms redirect latency. What should you cache and for how long?',
      'Think about how to generate unique short codes without collisions at 1000 writes/sec.',
      'Click analytics can be decoupled from the redirect path using async processing.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 300, 250),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 520, 150),
        node('api2', 'App Server', 'generic_app_server', ComponentCategory.Compute, 520, 350),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 750, 150),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 750, 350),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 520, 500),
        node('worker', 'Analytics Worker', 'generic_app_server', ComponentCategory.Compute, 750, 500),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-api', 'lb', 'api', ConnectionType.SYNC_HTTP),
        edge('lb-api2', 'lb', 'api2', ConnectionType.SYNC_HTTP),
        edge('api-cache', 'api', 'cache', ConnectionType.CACHE_READ),
        edge('api-db', 'api', 'db', ConnectionType.DB_READ),
        edge('api2-cache', 'api2', 'cache', ConnectionType.CACHE_WRITE),
        edge('api2-db', 'api2', 'db', ConnectionType.DB_WRITE),
        edge('api-queue', 'api', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('queue-worker', 'queue', 'worker', ConnectionType.ASYNC_QUEUE),
        edge('worker-db', 'worker', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## URL Shortener Reference Solution

**Data Layer:** PostgreSQL stores the URL mapping (short_code → long_url, created_at, user_id). Redis caches the hot mappings — since reads far outnumber writes and the working set fits in memory, a 90%+ cache hit rate is achievable, keeping redirects well under 10ms.

**Compute Layer:** Two App Server instances behind an L7 Load Balancer handle read (redirect) and write (shorten) paths. Horizontally scaling app servers is trivial since all state lives in Redis and PostgreSQL.

**Analytics:** Click events are enqueued asynchronously rather than blocking the redirect. A dedicated Analytics Worker drains the queue and writes to PostgreSQL. This decouples the hot redirect path from analytics writes.

**Trade-offs:** This design keeps it simple — a relational DB is appropriate since URLs have a fixed schema and write volume is low. For 10× scale, consider a dedicated NoSQL store for the mapping and a columnar store for analytics.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 02 Paste Bin ─────────────────────────────────────────────────────────
  {
    id: 'paste-bin',
    title: 'Paste Bin',
    description:
      'Design a text snippet sharing service like Pastebin.com. Users paste text and get a unique URL to share. Pastes may be public or private and can optionally expire.',
    difficulty: 'beginner',
    category: 'storage',
    company: null,
    timeLimit: 20,
    requirements: [
      'Users can create a text paste and receive a shareable URL',
      'Pastes support optional expiry (1h, 1d, 1w, never)',
      'Pastes can be public (anyone can read) or private (only with exact URL)',
      'Users can view a paste via its URL',
    ],
    nonFunctionalRequirements: [
      'Handle 100 writes/sec and 10,000 reads/sec',
      'Paste size limit: 10 MB',
    ],
    constraints: ['No authentication required to create a paste', 'Expired pastes should be deleted within 1 hour of expiry'],
    hints: [
      'Paste content is a blob — a relational DB is fine for small pastes but object storage is more cost-effective for large ones.',
      'A CDN can serve popular public pastes without hitting your origin servers.',
      'How will you clean up expired pastes? Think about a background job.',
      'Generating unique paste IDs is easier than URL shorteners — the collision risk at this scale is low.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 300, 100),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 300, 350),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 520, 250),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 720, 150),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 720, 300),
        node('obj', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 720, 450),
        node('worker', 'Cleanup Worker', 'generic_serverless', ComponentCategory.Compute, 520, 450),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.CDN_ORIGIN),
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-api', 'lb', 'api', ConnectionType.SYNC_HTTP),
        edge('api-cache', 'api', 'cache', ConnectionType.CACHE_READ),
        edge('api-db', 'api', 'db', ConnectionType.DB_READ),
        edge('api-obj', 'api', 'obj', ConnectionType.SYNC_HTTP),
        edge('api-cache-w', 'api', 'cache', ConnectionType.CACHE_WRITE),
        edge('api-db-w', 'api', 'db', ConnectionType.DB_WRITE),
        edge('worker-db', 'worker', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## Paste Bin Reference Solution

**Storage Split:** Paste metadata (id, owner, expiry, visibility, content_url) lives in PostgreSQL. Paste content is stored in Object Storage (S3-compatible). This is more cost-effective for large pastes and removes size pressure from the database.

**Read Optimisation:** A CDN serves public pastes with high cache hit rates — popular pastes get served at the edge. Redis caches paste metadata so the app server doesn't hit PostgreSQL on every read.

**Expiry Cleanup:** A serverless cleanup worker runs on a schedule (e.g., every 5 minutes) to delete expired paste rows from PostgreSQL and objects from storage. This is simpler than TTL-based deletion which can be inconsistent.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 03 Rate Limiter ───────────────────────────────────────────────────────
  {
    id: 'rate-limiter',
    title: 'Rate Limiter',
    description:
      'Design a rate limiting service that can be embedded in an API gateway or called as a sidecar. It should throttle clients that exceed a defined request budget within a time window.',
    difficulty: 'beginner',
    category: 'infrastructure',
    company: null,
    timeLimit: 20,
    requirements: [
      'Limit requests per client (by API key or IP) within a sliding or fixed time window',
      'Return 429 Too Many Requests when the limit is exceeded',
      'Support configurable limits per endpoint and per client tier',
      'Limits are enforced across multiple app server instances',
    ],
    nonFunctionalRequirements: [
      'Decision latency < 1ms (must not slow down the request path)',
      'Handle 50,000 rate limit checks/sec',
    ],
    constraints: [
      'The rate limiter must be distributed — a single in-process counter breaks under horizontal scaling',
    ],
    hints: [
      'Redis is the canonical solution for distributed rate limiting — its atomic INCR + EXPIRE commands prevent race conditions.',
      'Token bucket and sliding window log are two common algorithms. Which one is simpler to implement?',
      'Where does the rate limiter sit in the request path? API gateway, load balancer, or app server sidecar?',
      'Think about what happens when Redis is unavailable — fail open or fail closed?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 300, 250),
        node('rl', 'Rate Limiter', 'generic_rate_limiter', ComponentCategory.Security, 500, 150),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 700, 150),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 500, 350),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 700, 350),
      ],
      edges: [
        edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP),
        edge('gw-rl', 'gw', 'rl', ConnectionType.SYNC_HTTP),
        edge('rl-cache', 'rl', 'cache', ConnectionType.CACHE_READ),
        edge('rl-cachew', 'rl', 'cache', ConnectionType.CACHE_WRITE),
        edge('gw-api', 'gw', 'api', ConnectionType.SYNC_HTTP),
        edge('api-db', 'api', 'db', ConnectionType.DB_READ),
      ],
      explanation: `## Rate Limiter Reference Solution

**Algorithm:** Redis is the right choice for distributed rate limiting. Use INCR + EXPIRE for fixed-window counters, or a sorted set for sliding-window logs. The atomic operations prevent race conditions across app server instances.

**Placement:** The rate limiter sits between the API Gateway and the app servers. The gateway calls the rate limiter as a synchronous check before forwarding the request — this adds < 1ms with a local Redis cluster.

**Failure Mode:** When Redis is unavailable, default to fail-open (allow requests through) with logging. Fail-closed causes an outage; the marginal risk of allowing extra requests during a cache outage is acceptable for most APIs.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 04 Key-Value Store ───────────────────────────────────────────────────
  {
    id: 'key-value-store',
    title: 'Key-Value Store',
    description:
      'Design a distributed key-value store like Redis or Memcached. Support GET, SET, DELETE operations with optional TTL. Data must survive single-node failure.',
    difficulty: 'beginner',
    category: 'databases',
    company: null,
    timeLimit: 20,
    requirements: [
      'Support GET, SET, DELETE operations',
      'Optional TTL per key',
      'Data replication for single-node fault tolerance',
      'Client can connect to any node and be routed correctly',
    ],
    nonFunctionalRequirements: [
      'GET latency < 1ms p99',
      'Handle 100,000 operations/sec',
    ],
    constraints: ['In-memory storage with optional disk persistence', 'Consistent hashing for key distribution'],
    hints: [
      'Consistent hashing distributes keys across nodes and minimises remapping when nodes are added/removed.',
      'How does a client know which node owns a given key? A coordinator or client-side routing?',
      'Think about replication: synchronous (strong consistency) vs asynchronous (higher availability).',
      'What happens during a write when the primary node is down?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 350, 200),
      ],
      edges: [edge('c-cache', 'client', 'cache', ConnectionType.CACHE_READ)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 250),
        node('lb', 'Load Balancer', 'generic_load_balancer_l4', ComponentCategory.Networking, 300, 250),
        node('kv1', 'KV Node Primary', 'generic_redis', ComponentCategory.Database, 500, 150),
        node('kv2', 'KV Node Primary', 'generic_redis', ComponentCategory.Database, 500, 350),
        node('rep1', 'KV Replica', 'generic_redis', ComponentCategory.Database, 700, 150),
        node('rep2', 'KV Replica', 'generic_redis', ComponentCategory.Database, 700, 350),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-kv1', 'lb', 'kv1', ConnectionType.CACHE_READ),
        edge('lb-kv2', 'lb', 'kv2', ConnectionType.CACHE_READ),
        edge('kv1-rep1', 'kv1', 'rep1', ConnectionType.DB_REPLICATION),
        edge('kv2-rep2', 'kv2', 'rep2', ConnectionType.DB_REPLICATION),
      ],
      explanation: `## Key-Value Store Reference Solution

**Sharding:** Two primary nodes shard the key space using consistent hashing. The load balancer (acting as a router) maps each key to the correct primary. Adding a third node only remaps ~33% of keys.

**Replication:** Each primary replicates asynchronously to one replica. Reads can be served from replicas to increase read throughput. On primary failure, the replica is promoted.

**Trade-off:** Asynchronous replication risks losing a small window of writes on failover. For stronger durability, use synchronous replication — but this doubles write latency.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 05 Task Queue ────────────────────────────────────────────────────────
  {
    id: 'task-queue',
    title: 'Task Queue',
    description:
      'Design a distributed task queue system like Celery + RabbitMQ or Amazon SQS. Producers submit jobs; workers consume and execute them asynchronously.',
    difficulty: 'beginner',
    category: 'messaging',
    company: null,
    timeLimit: 25,
    requirements: [
      'Producers enqueue tasks with a payload and optional delay',
      'Workers consume tasks and execute them exactly once',
      'Failed tasks are retried up to a configurable number of times',
      'Tasks that exceed max retries go to a dead-letter queue',
    ],
    nonFunctionalRequirements: [
      'Handle 10,000 task submissions/sec',
      'Task pickup latency < 500ms',
    ],
    constraints: ['At-least-once delivery is acceptable', 'Workers are stateless and horizontally scalable'],
    hints: [
      'The hard problem is exactly-once execution. Why is at-least-once easier and often good enough?',
      'How do you prevent two workers from picking up the same task? Message visibility timeout is a key concept.',
      'What should a dead-letter queue contain? How would you debug failed tasks?',
      'Think about task prioritisation — high-priority jobs should not wait behind a backlog of low-priority ones.',
    ],
    starterCanvas: {
      nodes: [
        node('producer', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('p-q', 'producer', 'queue', ConnectionType.ASYNC_QUEUE)],
    },
    referenceSolution: {
      nodes: [
        node('producer', 'Producer Service', 'generic_app_server', ComponentCategory.Compute, 100, 250),
        node('queue', 'Task Queue', 'generic_message_queue', ComponentCategory.Messaging, 300, 250),
        node('dlq', 'Dead-Letter Queue', 'generic_message_queue', ComponentCategory.Messaging, 300, 420),
        node('worker1', 'Worker', 'generic_app_server', ComponentCategory.Compute, 520, 150),
        node('worker2', 'Worker', 'generic_app_server', ComponentCategory.Compute, 520, 350),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 720, 250),
      ],
      edges: [
        edge('p-q', 'producer', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-w1', 'queue', 'worker1', ConnectionType.ASYNC_QUEUE),
        edge('q-w2', 'queue', 'worker2', ConnectionType.ASYNC_QUEUE),
        edge('q-dlq', 'queue', 'dlq', ConnectionType.ASYNC_QUEUE),
        edge('w1-db', 'worker1', 'db', ConnectionType.DB_WRITE),
        edge('w2-db', 'worker2', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## Task Queue Reference Solution

**At-least-once Delivery:** The queue holds a message in a "in-flight" state while a worker processes it (visibility timeout). If the worker crashes without acknowledging, the message reappears for another worker. Idempotent task implementations handle duplicate delivery safely.

**Dead-Letter Queue:** Messages that fail after N retries are moved to the DLQ for manual inspection or replay. This prevents a poison-pill message from blocking the queue indefinitely.

**Scaling Workers:** Workers are stateless — scale horizontally by adding more consumer instances. Monitor queue depth to trigger autoscaling.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 06 Simple Chat (1-to-1) ──────────────────────────────────────────────
  {
    id: 'simple-chat',
    title: 'Simple 1-to-1 Chat',
    description:
      'Design a basic real-time 1-to-1 messaging system. Users send and receive messages in real-time. Messages are persisted and users can scroll through history.',
    difficulty: 'beginner',
    category: 'real-time',
    company: null,
    timeLimit: 25,
    requirements: [
      'Users can send messages to another user in real-time',
      'Messages are delivered within 100ms when both users are online',
      'Message history is persisted and paginated (newest 50 first)',
      'Offline users receive messages when they reconnect',
    ],
    nonFunctionalRequirements: [
      'Support 100,000 concurrent connections',
      'Message delivery latency < 100ms',
    ],
    constraints: ['1-to-1 only — no group chats required', 'Read receipts are out of scope'],
    hints: [
      'Long polling, WebSockets, or Server-Sent Events — which is best for bidirectional real-time messaging?',
      'How does the server know which connection to deliver a message to when users are connected to different nodes?',
      'Think about offline delivery: if User B is not connected, where do you store the message until they reconnect?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('clientA', 'Client A', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 250),
        node('clientB', 'Client B', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 400),
        node('lb', 'Load Balancer', 'generic_load_balancer_l4', ComponentCategory.Networking, 280, 325),
        node('ws1', 'WebSocket Server', 'generic_app_server', ComponentCategory.Compute, 480, 200),
        node('ws2', 'WebSocket Server', 'generic_app_server', ComponentCategory.Compute, 480, 400),
        node('pubsub', 'Redis Pub/Sub', 'generic_redis', ComponentCategory.Database, 680, 300),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 880, 300),
      ],
      edges: [
        edge('cA-lb', 'clientA', 'lb', ConnectionType.SYNC_HTTP),
        edge('cB-lb', 'clientB', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-ws1', 'lb', 'ws1', ConnectionType.SYNC_HTTP),
        edge('lb-ws2', 'lb', 'ws2', ConnectionType.SYNC_HTTP),
        edge('ws1-ps', 'ws1', 'pubsub', ConnectionType.ASYNC_STREAM),
        edge('ws2-ps', 'ws2', 'pubsub', ConnectionType.ASYNC_STREAM),
        edge('ws1-db', 'ws1', 'db', ConnectionType.DB_WRITE),
        edge('ws2-db', 'ws2', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## Simple Chat Reference Solution

**Real-time Delivery:** WebSockets provide full-duplex connections. Each WebSocket Server maintains persistent connections from multiple clients. When Client A sends a message, the server publishes it to Redis Pub/Sub.

**Cross-Node Delivery:** Redis Pub/Sub solves the multi-node problem: every WebSocket server subscribes to a channel per user. When a message arrives on the channel, all subscribed servers check if they hold the recipient's connection and forward it.

**Persistence:** All messages are written to PostgreSQL. On reconnect, clients fetch history via a standard HTTP endpoint — no need to replay the WebSocket stream.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 07 User Authentication System ────────────────────────────────────────
  {
    id: 'user-auth',
    title: 'User Authentication System',
    description:
      'Design a user authentication service. Users register, log in with email/password, and receive a session token. The token is validated on subsequent requests.',
    difficulty: 'beginner',
    category: 'infrastructure',
    company: null,
    timeLimit: 20,
    requirements: [
      'Users register with email and password',
      'Users log in and receive a session token (JWT or opaque)',
      'Token is validated on every protected API request',
      'Logout invalidates the session',
    ],
    nonFunctionalRequirements: [
      'Token validation < 5ms',
      'Handle 10,000 auth checks/sec',
    ],
    constraints: ['Passwords must be hashed (bcrypt or argon2)', 'Tokens expire after 24 hours by default'],
    hints: [
      'JWTs are stateless — validation requires no database lookup. But how do you revoke them before expiry?',
      'Opaque tokens require a lookup on every request. Where would you store them for fast access?',
      'Think about refresh tokens — short-lived access tokens + long-lived refresh tokens is a common pattern.',
      'What is the difference between authentication and authorisation?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 350, 200),
      ],
      edges: [edge('c-auth', 'client', 'auth', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 280, 250),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 480, 150),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 680, 150),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 480, 350),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 680, 350),
      ],
      edges: [
        edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP),
        edge('gw-auth', 'gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('auth-cache', 'auth', 'cache', ConnectionType.CACHE_READ),
        edge('auth-db', 'auth', 'db', ConnectionType.DB_READ),
        edge('gw-api', 'gw', 'api', ConnectionType.SYNC_HTTP),
        edge('api-db', 'api', 'db', ConnectionType.DB_READ),
      ],
      explanation: `## User Auth Reference Solution

**Token Strategy:** Use JWTs for stateless validation — the API Gateway validates the signature on every request without a database call. Store revoked tokens in Redis (a small deny-list) to support logout before expiry.

**Password Storage:** Passwords are hashed with bcrypt (cost factor 12) and stored in PostgreSQL. The hash is never returned to the client.

**Flow:** Register → hash password → store user in PostgreSQL. Login → compare hash → issue JWT. Subsequent requests → gateway validates JWT signature (sub-millisecond) + checks Redis deny-list.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 08 File Upload Service ───────────────────────────────────────────────
  {
    id: 'file-upload',
    title: 'File Upload Service',
    description:
      'Design a file upload and retrieval service. Users upload files up to 5 GB. Files are stored durably and accessible via a URL. Support resumable uploads.',
    difficulty: 'beginner',
    category: 'storage',
    company: null,
    timeLimit: 20,
    requirements: [
      'Users can upload files up to 5 GB',
      'Files are accessible via a stable URL after upload',
      'Resumable uploads (client can continue after network interruption)',
      'Files can be deleted by the owner',
    ],
    nonFunctionalRequirements: [
      'Upload throughput: 1,000 concurrent uploads',
      '99.9% durability',
    ],
    constraints: ['Files are never transcoded or processed — raw storage only'],
    hints: [
      'Uploading a 5 GB file through your app server is wasteful. Consider pre-signed URLs to upload directly to storage.',
      'Resumable uploads work by splitting the file into chunks. How does the client know which chunks have been received?',
      'A CDN is essential for fast downloads — do not serve files directly from the origin storage.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 280, 250),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 480, 200),
        node('obj', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 700, 200),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 700, 100),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 700, 350),
      ],
      edges: [
        edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP),
        edge('gw-api', 'gw', 'api', ConnectionType.SYNC_HTTP),
        edge('api-obj', 'api', 'obj', ConnectionType.SYNC_HTTP),
        edge('obj-cdn', 'obj', 'cdn', ConnectionType.CDN_ORIGIN),
        edge('api-db', 'api', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## File Upload Reference Solution

**Pre-Signed URLs:** The App Server issues a pre-signed URL to the client. The client uploads directly to Object Storage, bypassing the app server entirely. This avoids the app server becoming a bandwidth bottleneck for large files.

**Resumable Uploads:** Split files into 5 MB chunks. The app server tracks which chunks are complete in PostgreSQL. On resume, the client queries which chunks are missing and re-uploads only those.

**Download Path:** Files are served via CDN. The CDN pulls from Object Storage on cache miss (origin fallthrough) and caches at the edge for subsequent requests.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 09 Logging System ────────────────────────────────────────────────────
  {
    id: 'logging-system',
    title: 'Logging System',
    description:
      'Design a centralised logging pipeline. Application services emit structured log events. Logs are ingested, stored, and searchable. Support alerting on error patterns.',
    difficulty: 'beginner',
    category: 'infrastructure',
    company: null,
    timeLimit: 25,
    requirements: [
      'Services ship structured logs (JSON) to a central ingestion point',
      'Logs are searchable by service, level, and time range',
      'Logs are retained for 30 days (hot) and 1 year (cold)',
      'Alerts fire when error rate exceeds a threshold',
    ],
    nonFunctionalRequirements: [
      'Ingest 1,000,000 log lines/sec at peak',
      'Search latency < 5 seconds for last 24h',
    ],
    constraints: ['Log ingestion must not block the emitting service', 'Search index can lag by up to 60 seconds'],
    hints: [
      'Log ingestion at 1M lines/sec requires a buffer — you cannot write directly to Elasticsearch at that rate.',
      'A message queue between the collector and the indexer decouples ingestion from indexing.',
      'Think about hot vs cold storage: Elasticsearch for recent logs, object storage for archival.',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('log', 'Log Aggregator', 'generic_log_aggregator', ComponentCategory.Observability, 350, 200),
      ],
      edges: [edge('a-log', 'app', 'log', ConnectionType.ASYNC_STREAM)],
    },
    referenceSolution: {
      nodes: [
        node('app1', 'Service A', 'generic_app_server', ComponentCategory.Compute, 80, 150),
        node('app2', 'Service B', 'generic_app_server', ComponentCategory.Compute, 80, 350),
        node('collector', 'Log Aggregator', 'generic_log_aggregator', ComponentCategory.Observability, 280, 250),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 480, 250),
        node('indexer', 'Log Processor', 'generic_app_server', ComponentCategory.Compute, 680, 150),
        node('search', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 880, 150),
        node('archive', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 880, 350),
        node('alerting', 'Metrics Collector', 'generic_metrics_collector', ComponentCategory.Observability, 680, 350),
      ],
      edges: [
        edge('a1-col', 'app1', 'collector', ConnectionType.ASYNC_STREAM),
        edge('a2-col', 'app2', 'collector', ConnectionType.ASYNC_STREAM),
        edge('col-q', 'collector', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-idx', 'queue', 'indexer', ConnectionType.ASYNC_STREAM),
        edge('idx-search', 'indexer', 'search', ConnectionType.DB_WRITE),
        edge('idx-arch', 'indexer', 'archive', ConnectionType.SYNC_HTTP),
        edge('q-alert', 'queue', 'alerting', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Logging System Reference Solution

**Buffering with Kafka:** The log collector batches and ships to Kafka. This absorbs traffic spikes — Kafka can buffer far more logs than Elasticsearch can ingest in real-time. The indexer drains Kafka at a controlled rate.

**Dual Write:** The indexer writes to Elasticsearch (hot, 30-day retention, searchable) and Object Storage (cold, 1-year, compressed). Elasticsearch is expensive; archiving to object storage cuts costs by 10×.

**Alerting:** A separate consumer reads from Kafka to compute sliding-window error rates. Alerting is decoupled from search — it does not query Elasticsearch.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 10 Email Service ─────────────────────────────────────────────────────
  {
    id: 'email-service',
    title: 'Email Service',
    description:
      'Design a transactional email delivery service. Applications submit email jobs (recipient, template, variables). The system renders and delivers them via SMTP/SendGrid with retry logic.',
    difficulty: 'beginner',
    category: 'messaging',
    company: null,
    timeLimit: 20,
    requirements: [
      'Applications submit email jobs via an API',
      'Emails are rendered from templates with variable substitution',
      'Delivery is attempted with exponential backoff retries (max 3)',
      'Delivery status (sent, failed, bounced) is trackable',
    ],
    nonFunctionalRequirements: [
      'Deliver 100,000 emails/hour',
      'API response time < 50ms (submission, not delivery)',
    ],
    constraints: ['Email delivery is asynchronous — the API only confirms job acceptance', 'Unsubscribe links must be included in all marketing emails'],
    hints: [
      'Email delivery is inherently async — the submission API should accept the job and return immediately.',
      'A queue between the API and the delivery workers decouples submission rate from SMTP throughput.',
      'What should happen if the SMTP provider returns a 4xx (temporary failure) vs 5xx (permanent failure)?',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('a-q', 'app', 'queue', ConnectionType.ASYNC_QUEUE)],
    },
    referenceSolution: {
      nodes: [
        node('app', 'Calling Service', 'generic_app_server', ComponentCategory.Compute, 80, 250),
        node('api', 'Email API', 'generic_app_server', ComponentCategory.Compute, 280, 250),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 480, 200),
        node('dlq', 'Dead-Letter Queue', 'generic_message_queue', ComponentCategory.Messaging, 480, 400),
        node('worker', 'Delivery Worker', 'generic_app_server', ComponentCategory.Compute, 680, 200),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 880, 250),
      ],
      edges: [
        edge('app-api', 'app', 'api', ConnectionType.SYNC_HTTP),
        edge('api-q', 'api', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-w', 'queue', 'worker', ConnectionType.ASYNC_QUEUE),
        edge('q-dlq', 'queue', 'dlq', ConnectionType.ASYNC_QUEUE),
        edge('w-db', 'worker', 'db', ConnectionType.DB_WRITE),
        edge('api-db', 'api', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## Email Service Reference Solution

**Async Pipeline:** The Email API accepts the job, writes it to the queue and PostgreSQL (status: queued), and returns immediately. Delivery Workers consume from the queue and call the SMTP provider.

**Retry Logic:** On 4xx (temporary failure), the message is re-queued with exponential backoff delay. On 5xx (permanent failure) or after 3 retries, it moves to the Dead-Letter Queue and PostgreSQL is updated (status: failed).

**Status Tracking:** Every state transition (queued → sending → sent/failed/bounced) is written to PostgreSQL. Calling services can poll the Email API for delivery status.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 11 API Gateway ───────────────────────────────────────────────────────
  {
    id: 'api-gateway',
    title: 'API Gateway',
    description:
      'Design an API gateway that sits in front of a microservices backend. It handles authentication, rate limiting, request routing, and response caching.',
    difficulty: 'beginner',
    category: 'infrastructure',
    company: null,
    timeLimit: 20,
    requirements: [
      'Route requests to the correct downstream microservice',
      'Validate authentication tokens before forwarding',
      'Enforce per-client rate limits',
      'Cache GET responses where applicable',
    ],
    nonFunctionalRequirements: [
      'Add < 5ms overhead to request latency',
      'Handle 50,000 requests/sec',
    ],
    constraints: ['The gateway must not be a single point of failure'],
    hints: [
      'Separate concerns: routing, auth validation, rate limiting are independent layers.',
      'Token validation should not hit a database on every request — use JWT or a cache.',
      'Response caching at the gateway level benefits all downstream services equally.',
      'What happens if a downstream service is down? Circuit breaker pattern applies here.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 200),
      ],
      edges: [edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 260, 250),
        node('gw1', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 460, 150),
        node('gw2', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 460, 350),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 660, 250),
        node('svc1', 'User Service', 'generic_microservice', ComponentCategory.Compute, 860, 150),
        node('svc2', 'Order Service', 'generic_microservice', ComponentCategory.Compute, 860, 350),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-gw1', 'lb', 'gw1', ConnectionType.SYNC_HTTP),
        edge('lb-gw2', 'lb', 'gw2', ConnectionType.SYNC_HTTP),
        edge('gw1-cache', 'gw1', 'cache', ConnectionType.CACHE_READ),
        edge('gw2-cache', 'gw2', 'cache', ConnectionType.CACHE_READ),
        edge('gw1-svc1', 'gw1', 'svc1', ConnectionType.SYNC_HTTP),
        edge('gw1-svc2', 'gw1', 'svc2', ConnectionType.SYNC_HTTP),
        edge('gw2-svc1', 'gw2', 'svc1', ConnectionType.SYNC_HTTP),
      ],
      explanation: `## API Gateway Reference Solution

**HA via Redundancy:** Two API Gateway instances behind a load balancer eliminate the SPOF. The load balancer performs health checks and routes around failed instances.

**Performance:** JWT validation is done in-process (cryptographic check, no I/O). Rate limiting counters live in Redis (< 1ms). Response caching also uses Redis — cache key is the request path + query string.

**Routing:** The gateway has a static routing table (path prefix → service). Dynamic service discovery (e.g., Consul) is optional at this scale.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 12 Image Thumbnail Generator ─────────────────────────────────────────
  {
    id: 'image-thumbnails',
    title: 'Image Thumbnail Generator',
    description:
      'Design a service that generates image thumbnails on demand. Users upload images; the system generates multiple thumbnail sizes asynchronously and serves them via CDN.',
    difficulty: 'beginner',
    category: 'streaming',
    company: null,
    timeLimit: 25,
    requirements: [
      'Users upload original images',
      'System generates thumbnails in 3 standard sizes (sm/md/lg) asynchronously',
      'Thumbnails are served via CDN',
      'If a thumbnail is not yet ready, serve a placeholder',
    ],
    nonFunctionalRequirements: [
      'Thumbnail generation complete within 10 seconds of upload',
      'Handle 1,000 image uploads/min',
    ],
    constraints: ['Thumbnails are cached permanently (images are immutable)', 'Support JPEG and PNG input'],
    hints: [
      'Thumbnail generation is CPU-intensive — do not do it synchronously in the upload API.',
      'A queue between the upload and the thumbnail workers decouples ingestion from processing.',
      'Serverless functions are a natural fit for stateless image processing jobs.',
      'After thumbnails are generated, how does the CDN know to invalidate the placeholder cache?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('api', 'Upload API', 'generic_app_server', ComponentCategory.Compute, 280, 250),
        node('obj', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 480, 150),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 480, 350),
        node('worker', 'Thumbnail Worker', 'generic_serverless', ComponentCategory.Compute, 680, 250),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 880, 250),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 680, 420),
      ],
      edges: [
        edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP),
        edge('api-obj', 'api', 'obj', ConnectionType.SYNC_HTTP),
        edge('api-q', 'api', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-w', 'queue', 'worker', ConnectionType.ASYNC_QUEUE),
        edge('w-obj', 'worker', 'obj', ConnectionType.SYNC_HTTP),
        edge('w-db', 'worker', 'db', ConnectionType.DB_WRITE),
        edge('obj-cdn', 'obj', 'cdn', ConnectionType.CDN_ORIGIN),
      ],
      explanation: `## Image Thumbnail Generator Reference Solution

**Async Processing:** The upload API stores the original in Object Storage, queues a thumbnail job, and returns immediately. Clients poll or use a webhook to know when thumbnails are ready.

**Serverless Workers:** A serverless function pulls jobs from the queue, downloads the original from Object Storage, generates 3 thumbnail sizes, and stores them back. Serverless naturally scales to match queue depth.

**CDN Serving:** Thumbnails are immutable once generated. The CDN caches them permanently (Cache-Control: immutable). The placeholder is also CDN-served and is replaced once the real thumbnails are written.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 13 Webhook Delivery ───────────────────────────────────────────────────
  {
    id: 'webhook-delivery',
    title: 'Webhook Delivery System',
    description:
      'Design a webhook delivery system. When an event occurs in your platform, all registered webhook subscribers for that event receive an HTTP POST to their endpoint with retry logic.',
    difficulty: 'beginner',
    category: 'messaging',
    company: null,
    timeLimit: 20,
    requirements: [
      'Subscribers register endpoints and subscribe to event types',
      'When an event fires, all matching subscribers receive an HTTP POST',
      'Failed deliveries are retried with exponential backoff (up to 24h)',
      'Delivery history (attempt log) is queryable by subscribers',
    ],
    nonFunctionalRequirements: [
      'Deliver to 1,000 subscribers per event within 5 seconds',
      'Retry for up to 24 hours before marking as failed',
    ],
    constraints: ['Delivery must not block event processing', 'HTTPS endpoints only'],
    hints: [
      'Fan-out is the key challenge: 1 event → 1,000 deliveries. How do you do this without blocking?',
      'Exponential backoff retry: 10s, 30s, 2m, 10m, 1h, ... up to 24h total.',
      'What data should the delivery attempt log include? (status code, response body, timestamp, duration)',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'Event Source', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('a-q', 'app', 'queue', ConnectionType.ASYNC_QUEUE)],
    },
    referenceSolution: {
      nodes: [
        node('app', 'Event Source', 'generic_app_server', ComponentCategory.Compute, 80, 250),
        node('fanout', 'Fan-out Service', 'generic_app_server', ComponentCategory.Compute, 280, 250),
        node('queue', 'Delivery Queue', 'generic_message_queue', ComponentCategory.Messaging, 480, 250),
        node('worker', 'Delivery Worker', 'generic_app_server', ComponentCategory.Compute, 680, 250),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 880, 250),
      ],
      edges: [
        edge('app-fan', 'app', 'fanout', ConnectionType.ASYNC_QUEUE),
        edge('fan-q', 'fanout', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-w', 'queue', 'worker', ConnectionType.ASYNC_QUEUE),
        edge('w-db', 'worker', 'db', ConnectionType.DB_WRITE),
        edge('fan-db', 'fanout', 'db', ConnectionType.DB_READ),
      ],
      explanation: `## Webhook Delivery Reference Solution

**Fan-out:** The Fan-out Service reads the event, queries PostgreSQL for all subscribers of that event type, and enqueues one delivery job per subscriber. This decouples the fan-out step from the actual HTTP delivery.

**Retry Queue:** Delivery Workers make the HTTP POST. On failure, the job is re-enqueued with a scheduled delivery time (exponential backoff). PostgreSQL tracks the attempt log (endpoint, status code, duration, retry count).

**Scalability:** Workers are stateless — add more to increase delivery throughput. The queue depth is the backpressure signal.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 14 Session Store ─────────────────────────────────────────────────────
  {
    id: 'session-store',
    title: 'Session Store',
    description:
      'Design a distributed session store for a web application. The app runs on multiple servers; user sessions must be accessible from any instance without sticky sessions.',
    difficulty: 'beginner',
    category: 'caching',
    company: null,
    timeLimit: 20,
    requirements: [
      'Store user session data (user id, preferences, cart) accessible from any app server',
      'Sessions expire after 30 minutes of inactivity',
      'Session data is updated on each request',
      'Sessions survive a single cache node failure',
    ],
    nonFunctionalRequirements: [
      'Session read/write < 1ms',
      'Handle 100,000 active sessions',
    ],
    constraints: ['Session data is < 1 KB per user on average', 'No sticky sessions allowed'],
    hints: [
      'Redis with TTL is the canonical distributed session store.',
      'Sliding expiry: reset the TTL on every request to implement 30-minute inactivity timeout.',
      'How do you survive a cache node failure? Redis Sentinel or Redis Cluster handle failover.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'App Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 280, 250),
        node('app1', 'App Server', 'generic_app_server', ComponentCategory.Compute, 480, 150),
        node('app2', 'App Server', 'generic_app_server', ComponentCategory.Compute, 480, 350),
        node('redis', 'Redis (Primary)', 'generic_redis', ComponentCategory.Database, 700, 200),
        node('replica', 'Redis (Replica)', 'generic_redis', ComponentCategory.Database, 700, 350),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 900, 250),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-a1', 'lb', 'app1', ConnectionType.SYNC_HTTP),
        edge('lb-a2', 'lb', 'app2', ConnectionType.SYNC_HTTP),
        edge('a1-redis', 'app1', 'redis', ConnectionType.CACHE_READ),
        edge('a2-redis', 'app2', 'redis', ConnectionType.CACHE_READ),
        edge('a1-rediw', 'app1', 'redis', ConnectionType.CACHE_WRITE),
        edge('redis-rep', 'redis', 'replica', ConnectionType.DB_REPLICATION),
        edge('a1-db', 'app1', 'db', ConnectionType.DB_READ),
      ],
      explanation: `## Session Store Reference Solution

**Redis + TTL:** Each session is stored as a Redis key with a 30-minute TTL. On every request, the TTL is reset (EXPIRE command) to implement sliding expiry. All app servers share the same Redis instance — no sticky sessions needed.

**Fault Tolerance:** A Redis replica provides failover. Redis Sentinel monitors the primary and promotes the replica on failure. The brief failover window (seconds) causes session lookups to fail — users see a re-login prompt, which is acceptable.

**Separation of Concerns:** Session data (transient, fast-expiry) lives in Redis. Persistent user data (profile, orders) lives in PostgreSQL. Never store session data in the primary database.`,
    },
    rubric: BEGINNER_RUBRIC,
  },

  // ── 15 Feature Flag Service ──────────────────────────────────────────────
  {
    id: 'feature-flags',
    title: 'Feature Flag Service',
    description:
      'Design a feature flag management system. Engineers define flags; the SDK in each service checks flags in real-time to enable/disable features or run A/B experiments without deploys.',
    difficulty: 'beginner',
    category: 'infrastructure',
    company: null,
    timeLimit: 20,
    requirements: [
      'Engineers create and toggle flags via an admin UI',
      'Services check flag values in real-time via an SDK',
      'Flags support targeting rules (user percentage, user ID list, environment)',
      'Flag changes propagate to all services within 30 seconds',
    ],
    nonFunctionalRequirements: [
      'Flag evaluation < 1ms (client-side SDK)',
      'Handle 1,000,000 flag evaluations/sec across all services',
    ],
    constraints: ['SDK must work if the flag service is down (cached values, fail-safe defaults)'],
    hints: [
      'The SDK should cache flag values locally — calling the flag service on every request is too slow.',
      'How do flag changes propagate to all running service instances? Push (SSE/polling) vs pull (periodic refresh).',
      'Think about targeting rules: roll out to 10% of users, specific user IDs, or specific environments.',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 350, 200),
      ],
      edges: [edge('a-db', 'app', 'db', ConnectionType.DB_READ)],
    },
    referenceSolution: {
      nodes: [
        node('admin', 'Admin UI', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 150),
        node('flagapi', 'Flag API', 'generic_app_server', ComponentCategory.Compute, 280, 250),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 480, 150),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 480, 350),
        node('sdk', 'SDK (in-process)', 'generic_app_server', ComponentCategory.Compute, 700, 250),
      ],
      edges: [
        edge('admin-api', 'admin', 'flagapi', ConnectionType.SYNC_HTTP),
        edge('api-cache', 'flagapi', 'cache', ConnectionType.CACHE_WRITE),
        edge('api-db', 'flagapi', 'db', ConnectionType.DB_WRITE),
        edge('sdk-cache', 'sdk', 'cache', ConnectionType.CACHE_READ),
        edge('sdk-api', 'sdk', 'flagapi', ConnectionType.SYNC_HTTP),
      ],
      explanation: `## Feature Flag Service Reference Solution

**Local Cache in SDK:** The SDK maintains an in-process copy of all flag configs, refreshed every 30s via polling or server-sent events. Flag evaluations are pure in-memory operations — sub-millisecond, no network call.

**Propagation:** When an engineer toggles a flag, the Flag API writes to PostgreSQL and invalidates the Redis cache. SDKs poll Redis on their refresh interval. The Redis layer prevents all SDK instances from hammering PostgreSQL simultaneously.

**Fail-safe:** If the Flag API is unreachable, the SDK serves the last cached values. Default values (hardcoded in the SDK init) are used only on first boot with no cache.`,
    },
    rubric: BEGINNER_RUBRIC,
  },
];
