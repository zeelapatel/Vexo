import type { InterviewScenario, VexoNode, VexoEdge } from '@vexo/types';
import { ComponentCategory, ConnectionType, SystemStatus } from '@vexo/types';
import { DEFAULT_RUBRIC } from '@vexo/types';

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
  return { id, source, target, data: { connectionType, validationStatus: 'valid' } } as VexoEdge;
}

export const INTERMEDIATE_SCENARIOS: InterviewScenario[] = [
  // ── 01 News Feed ─────────────────────────────────────────────────────────
  {
    id: 'news-feed',
    title: 'Social News Feed',
    description:
      'Design a social news feed like Twitter/Instagram. Users follow others; their feed shows posts from people they follow, ranked by recency. Support 500M users with 1M active posters.',
    difficulty: 'intermediate',
    category: 'social',
    company: null,
    timeLimit: 35,
    requirements: [
      'Users can post text/image updates',
      'Users see a ranked feed of posts from people they follow',
      'Feed loads in < 500ms on any device',
      "New posts appear in followers' feeds within 5 seconds",
    ],
    nonFunctionalRequirements: [
      'Handle 500M DAU, 1M posts/day',
      'Feed read throughput: 10M reads/min',
      'Support users following up to 5,000 accounts',
    ],
    constraints: [
      '"Celebrity problem": some users have 100M+ followers — fan-out on write is expensive for them',
    ],
    hints: [
      'Fan-out on write (push) pre-computes feeds; fan-out on read (pull) computes at query time. What are the trade-offs?',
      'For celebrities with 100M followers, fan-out on write would create 100M write operations per post. Consider a hybrid.',
      'Caching pre-computed feeds per user is critical for < 500ms latency. What is the cache invalidation strategy?',
      'Think about the data model: how do you store a feed of 5,000 followed users efficiently?',
      'Pagination: how do you implement infinite scroll without missing or duplicating posts?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 350, 200),
      ],
      edges: [edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 300),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 260, 300),
        node('feedsvc', 'Feed Service', 'generic_app_server', ComponentCategory.Compute, 460, 200),
        node('postsvc', 'Post Service', 'generic_app_server', ComponentCategory.Compute, 460, 400),
        node('fanout', 'Fan-out Worker', 'generic_app_server', ComponentCategory.Compute, 660, 100),
        node('feedcache', 'Feed Cache (Redis)', 'generic_redis', ComponentCategory.Database, 660, 300),
        node('postdb', 'Post DB (PostgreSQL)', 'generic_postgresql', ComponentCategory.Database, 660, 450),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 460, 550),
        node('graphdb', 'Graph DB (follows)', 'generic_mongodb', ComponentCategory.Database, 860, 200),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-feed', 'lb', 'feedsvc', ConnectionType.SYNC_HTTP),
        edge('lb-post', 'lb', 'postsvc', ConnectionType.SYNC_HTTP),
        edge('feedsvc-cache', 'feedsvc', 'feedcache', ConnectionType.CACHE_READ),
        edge('postsvc-db', 'postsvc', 'postdb', ConnectionType.DB_WRITE),
        edge('postsvc-q', 'postsvc', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-fanout', 'queue', 'fanout', ConnectionType.ASYNC_STREAM),
        edge('fanout-graph', 'fanout', 'graphdb', ConnectionType.DB_READ),
        edge('fanout-cache', 'fanout', 'feedcache', ConnectionType.CACHE_WRITE),
        edge('feedsvc-post', 'feedsvc', 'postdb', ConnectionType.DB_READ),
      ],
      explanation: `## Social News Feed Reference Solution

**Hybrid Fan-out:** Regular users (< 10K followers) use fan-out on write — their posts are pushed to all followers' feed caches immediately. Celebrities (> 10K followers) use fan-out on read — their posts are fetched and merged at query time. This hybrid avoids 100M Redis writes per celebrity post.

**Feed Cache:** Each user has a Redis list of post IDs (latest 100). The Feed Service reads from cache (fast path) and hydrates post content from the Post DB. Cache miss falls through to the graph-based read path.

**Graph Storage:** The follow graph (user → [followed users]) is stored in a document store. Lookups by user ID return the follower/following list for fan-out computation.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 02 Notification System ────────────────────────────────────────────────
  {
    id: 'notification-system',
    title: 'Notification System',
    description:
      'Design a multi-channel notification system. Applications send notification requests; the system routes them to email, SMS, push, or in-app channels based on user preferences and delivers reliably.',
    difficulty: 'intermediate',
    category: 'messaging',
    company: null,
    timeLimit: 35,
    requirements: [
      'Support email, SMS, push notification, and in-app notification channels',
      'User preference controls which channels are active per notification type',
      'Deduplication: identical notifications within 1 minute are suppressed',
      'In-app notifications are delivered in real-time to connected clients',
    ],
    nonFunctionalRequirements: [
      'Handle 1M notifications/hour',
      'Delivery < 5 seconds for real-time channels',
      'Support 100M users with varied preferences',
    ],
    constraints: ['Each notification type has a priority (critical, high, normal, low)', 'Critical notifications bypass user preference (e.g., security alerts)'],
    hints: [
      'A fan-out step maps one notification event to one message per target channel.',
      'Different channels have different delivery semantics — email is fire-and-forget, push requires a registered device token.',
      'How do you prevent duplicate notifications when a retry causes a second delivery attempt?',
      'Think about priority queues — a critical security alert should not queue behind 10,000 marketing emails.',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'Calling Service', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('a-q', 'app', 'queue', ConnectionType.ASYNC_QUEUE)],
    },
    referenceSolution: {
      nodes: [
        node('caller', 'Calling Service', 'generic_app_server', ComponentCategory.Compute, 80, 300),
        node('notifapi', 'Notification API', 'generic_app_server', ComponentCategory.Compute, 280, 300),
        node('db', 'User Pref DB', 'generic_postgresql', ComponentCategory.Database, 480, 200),
        node('dedup', 'Redis (dedup)', 'generic_redis', ComponentCategory.Database, 480, 400),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 680, 300),
        node('emailw', 'Email Worker', 'generic_app_server', ComponentCategory.Compute, 880, 150),
        node('pushw', 'Push Worker', 'generic_app_server', ComponentCategory.Compute, 880, 300),
        node('inappw', 'In-App Worker', 'generic_app_server', ComponentCategory.Compute, 880, 450),
      ],
      edges: [
        edge('caller-api', 'caller', 'notifapi', ConnectionType.SYNC_HTTP),
        edge('api-db', 'notifapi', 'db', ConnectionType.DB_READ),
        edge('api-dedup', 'notifapi', 'dedup', ConnectionType.CACHE_READ),
        edge('api-q', 'notifapi', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-email', 'queue', 'emailw', ConnectionType.ASYNC_STREAM),
        edge('q-push', 'queue', 'pushw', ConnectionType.ASYNC_STREAM),
        edge('q-inapp', 'queue', 'inappw', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Notification System Reference Solution

**Fan-out by Channel:** The Notification API reads user preferences from PostgreSQL, checks Redis for deduplication (key: user_id + notification_type + content_hash, TTL 60s), then publishes one message per active channel to Kafka topic partitioned by channel type.

**Channel Workers:** Separate workers per channel (Email, Push, In-App) consume from their Kafka partition. This allows independent scaling — email volume may be 10× push volume.

**Priority:** Use separate Kafka topics per priority level. Workers consume from critical topics first, then high, then normal. This prevents low-priority messages from starving critical ones.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 03 Search Autocomplete ───────────────────────────────────────────────
  {
    id: 'search-autocomplete',
    title: 'Search Autocomplete',
    description:
      'Design a search autocomplete system like Google suggest. As the user types, display the top 10 matching suggestions in < 100ms.',
    difficulty: 'intermediate',
    category: 'search',
    company: null,
    timeLimit: 30,
    requirements: [
      'Return top 10 autocomplete suggestions as the user types (each keystroke)',
      'Suggestions are ranked by popularity (search frequency)',
      'Support 100M+ terms in the suggestion corpus',
      'New trending terms appear in suggestions within 1 hour',
    ],
    nonFunctionalRequirements: [
      'Response time < 100ms at p99',
      'Handle 50,000 queries/sec at peak',
    ],
    constraints: ['Prefix matching only (not fuzzy search)', 'Results must be censored (no offensive suggestions)'],
    hints: [
      'A trie data structure is optimal for prefix matching. How would you distribute a trie across multiple nodes?',
      'Caching the most common prefixes (the top 1% of prefixes account for 80% of queries) reduces database load.',
      'How do you update popularity scores without rewriting the entire trie?',
      'Think about the query flow: browser → CDN → autocomplete service → cache/trie.',
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
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 150),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 260, 350),
        node('svc', 'Autocomplete Service', 'generic_app_server', ComponentCategory.Compute, 460, 250),
        node('cache', 'Redis (prefix cache)', 'generic_redis', ComponentCategory.Database, 660, 150),
        node('trie', 'Trie Store', 'generic_elasticsearch', ComponentCategory.Database, 660, 350),
        node('aggregator', 'Popularity Aggregator', 'generic_app_server', ComponentCategory.Compute, 860, 250),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.CDN_ORIGIN),
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-svc', 'lb', 'svc', ConnectionType.SYNC_HTTP),
        edge('svc-cache', 'svc', 'cache', ConnectionType.CACHE_READ),
        edge('svc-trie', 'svc', 'trie', ConnectionType.DB_READ),
        edge('agg-cache', 'aggregator', 'cache', ConnectionType.CACHE_WRITE),
        edge('agg-trie', 'aggregator', 'trie', ConnectionType.DB_WRITE),
      ],
      explanation: `## Search Autocomplete Reference Solution

**Two-Layer Cache:** Redis stores the top suggestions for the most frequent prefixes (hot path, < 1ms). The trie/inverted index (Elasticsearch) handles long-tail prefixes. The CDN caches query results with short TTL (5s) for the most popular searches.

**Popularity Updates:** A background Popularity Aggregator processes query logs (batched hourly), recomputes popularity scores, and updates the trie and Redis cache. Real-time popularity updates are not needed — hourly is sufficient for trending terms.

**Sharding:** Trie nodes are sharded by first character, distributing load evenly across the cluster without cross-shard queries (prefix queries never span first characters).`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 04 Web Crawler ───────────────────────────────────────────────────────
  {
    id: 'web-crawler',
    title: 'Web Crawler',
    description:
      'Design a distributed web crawler that crawls the internet, extracts text content, and feeds a search index. Handle scale, politeness, and deduplication.',
    difficulty: 'intermediate',
    category: 'infrastructure',
    company: null,
    timeLimit: 40,
    requirements: [
      'Crawl and index 10 billion web pages',
      'Respect robots.txt and crawl-delay directives',
      'Deduplicate pages by URL and content hash',
      'Recrawl pages periodically based on change frequency',
    ],
    nonFunctionalRequirements: [
      'Crawl 10,000 pages/sec sustained',
      'Store index for 10 billion pages (estimated 10 TB)',
    ],
    constraints: ['DNS resolution is a bottleneck — cache aggressively', 'Be polite: at most 1 request/sec per domain'],
    hints: [
      'A URL frontier (priority queue of URLs to crawl) is the core data structure. How do you prioritise?',
      'How do you avoid recrawling the same URL? A Bloom filter can efficiently check if a URL has been seen.',
      'Think about the politeness constraint: multiple workers for the same domain would violate the 1 req/sec rule.',
      'What is the difference between crawling and indexing? They should be separate pipelines.',
    ],
    starterCanvas: {
      nodes: [
        node('frontier', 'URL Frontier', 'generic_message_queue', ComponentCategory.Messaging, 100, 200),
        node('worker', 'Crawler Worker', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('f-w', 'frontier', 'worker', ConnectionType.ASYNC_QUEUE)],
    },
    referenceSolution: {
      nodes: [
        node('seeds', 'Seed URLs', 'generic_app_server', ComponentCategory.Compute, 80, 250),
        node('frontier', 'URL Frontier (Redis)', 'generic_redis', ComponentCategory.Database, 280, 250),
        node('worker', 'Crawler Workers', 'generic_app_server', ComponentCategory.Compute, 480, 250),
        node('dns', 'DNS Cache', 'generic_dns', ComponentCategory.Networking, 480, 120),
        node('bloom', 'Bloom Filter', 'generic_redis', ComponentCategory.Database, 680, 150),
        node('rawstore', 'Object Storage (HTML)', 'generic_object_storage', ComponentCategory.Storage, 680, 300),
        node('queue', 'Kafka (parsed pages)', 'generic_kafka', ComponentCategory.Messaging, 680, 450),
        node('indexer', 'Indexer', 'generic_app_server', ComponentCategory.Compute, 880, 350),
        node('search', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 1080, 350),
      ],
      edges: [
        edge('seeds-f', 'seeds', 'frontier', ConnectionType.CACHE_WRITE),
        edge('f-w', 'frontier', 'worker', ConnectionType.CACHE_READ),
        edge('w-dns', 'worker', 'dns', ConnectionType.DNS_RESOLUTION),
        edge('w-bloom', 'worker', 'bloom', ConnectionType.CACHE_READ),
        edge('w-raw', 'worker', 'rawstore', ConnectionType.SYNC_HTTP),
        edge('w-q', 'worker', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-idx', 'queue', 'indexer', ConnectionType.ASYNC_STREAM),
        edge('idx-es', 'indexer', 'search', ConnectionType.DB_WRITE),
        edge('w-frontier', 'worker', 'frontier', ConnectionType.CACHE_WRITE),
      ],
      explanation: `## Web Crawler Reference Solution

**URL Frontier:** Redis sorted set acts as a priority queue for URLs (score = next crawl time). Workers pop URLs, crawl, and enqueue new discovered links. The frontier is partitioned by domain hash to enforce per-domain politeness.

**Deduplication:** A Bloom filter checks each new URL before enqueuing — if it's already seen, skip it. The false positive rate is acceptable (~1% of valid new URLs are skipped).

**Crawl-Parse Separation:** Workers store raw HTML to Object Storage and publish a parsed-content event to Kafka. The Indexer processes events, extracts text, and writes to Elasticsearch. Decoupling allows the indexer to be re-run from raw storage if the index schema changes.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 05 Group Chat ────────────────────────────────────────────────────────
  {
    id: 'group-chat',
    title: 'Group Chat Application',
    description:
      'Design a group chat system like Slack or WhatsApp groups. Support rooms with up to 1,000 members, real-time message delivery, and persistent history.',
    difficulty: 'intermediate',
    category: 'real-time',
    company: null,
    timeLimit: 35,
    requirements: [
      'Users create rooms and invite others (up to 1,000 members)',
      'Messages are delivered to all online members in real-time',
      'Message history is paginated and searchable',
      'Users see online/offline status for room members',
      'Supports message reactions and threads',
    ],
    nonFunctionalRequirements: [
      '10M concurrent users, 100K active rooms',
      'Message delivery < 200ms',
      'History search < 1 second',
    ],
    constraints: ['Fan-out to 1,000 room members is the core scaling challenge'],
    hints: [
      'With 1,000 members per room, fan-out on write would create 1,000 writes per message. Is that acceptable?',
      'How does a WebSocket server on Node A deliver a message to a user connected to Node B?',
      'Presence (online/offline) at scale requires careful design — do not store it in the primary DB.',
      'Message search requires a different data store than message persistence.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
        node('ws', 'WebSocket Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-ws', 'client', 'ws', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 300),
        node('lb', 'Load Balancer', 'generic_load_balancer_l4', ComponentCategory.Networking, 260, 300),
        node('ws1', 'WS Server', 'generic_app_server', ComponentCategory.Compute, 460, 200),
        node('ws2', 'WS Server', 'generic_app_server', ComponentCategory.Compute, 460, 400),
        node('pubsub', 'Redis Pub/Sub', 'generic_redis', ComponentCategory.Database, 660, 200),
        node('presence', 'Presence Service', 'generic_app_server', ComponentCategory.Compute, 660, 100),
        node('msgdb', 'Message DB (PostgreSQL)', 'generic_postgresql', ComponentCategory.Database, 660, 400),
        node('search', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 860, 400),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 660, 550),
      ],
      edges: [
        edge('c-lb', 'client', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-ws1', 'lb', 'ws1', ConnectionType.SYNC_HTTP),
        edge('lb-ws2', 'lb', 'ws2', ConnectionType.SYNC_HTTP),
        edge('ws1-ps', 'ws1', 'pubsub', ConnectionType.ASYNC_STREAM),
        edge('ws2-ps', 'ws2', 'pubsub', ConnectionType.ASYNC_STREAM),
        edge('ws1-pres', 'ws1', 'presence', ConnectionType.SYNC_HTTP),
        edge('ws1-db', 'ws1', 'msgdb', ConnectionType.DB_WRITE),
        edge('ws2-db', 'ws2', 'msgdb', ConnectionType.DB_WRITE),
        edge('ws1-q', 'ws1', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-search', 'queue', 'search', ConnectionType.DB_WRITE),
      ],
      explanation: `## Group Chat Reference Solution

**Fan-out via Pub/Sub:** Each room has a Redis Pub/Sub channel. When a message arrives, the WS server publishes it to the channel. All WS server instances subscribed to that channel check their connections and deliver to online members — this handles cross-node delivery without O(N) DB writes.

**Presence Service:** Online/offline status is maintained by the Presence Service using Redis TTLs (heartbeat every 30s). This avoids storing transient presence state in PostgreSQL.

**Search:** Messages are streamed to Elasticsearch via Kafka for full-text search. Kafka buffers the writes so Elasticsearch is never in the critical path.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 06 CDN Design ────────────────────────────────────────────────────────
  {
    id: 'cdn-design',
    title: 'Content Delivery Network (CDN)',
    description:
      'Design a CDN that caches and serves static assets (JS, CSS, images, video) from edge nodes close to users. Reduce origin load by 95% and serve global users with < 50ms latency.',
    difficulty: 'intermediate',
    category: 'streaming',
    company: null,
    timeLimit: 40,
    requirements: [
      'Cache static assets at edge nodes worldwide',
      'On cache miss, pull from origin and cache at edge',
      'Support cache invalidation (purge by URL or tag)',
      'HTTPS termination at the edge',
      'Support large files (up to 50 GB) with range requests',
    ],
    nonFunctionalRequirements: [
      'Cache hit rate > 90%',
      'Serve 10M requests/sec globally',
      '< 50ms edge latency for cached content',
    ],
    constraints: ['Edge nodes are in 50 PoPs globally', 'Origin-pull only — no push model'],
    hints: [
      'How does a client know which edge node is closest? Think about DNS-based routing.',
      'Cache eviction at the edge: LRU is standard. What is the cache key (URL? URL + headers?)',
      'How do you handle cache invalidation across 50 PoPs globally without a global lock?',
      'Range request support is critical for video: byte-range requests allow seek operations.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('cdn', 'CDN Edge', 'generic_cdn', ComponentCategory.Networking, 350, 200),
      ],
      edges: [edge('c-cdn', 'client', 'cdn', ConnectionType.CDN_ORIGIN)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Global Clients', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 300),
        node('dns', 'Anycast DNS', 'generic_dns', ComponentCategory.Networking, 280, 300),
        node('edge1', 'Edge PoP (US)', 'generic_cdn', ComponentCategory.Networking, 480, 200),
        node('edge2', 'Edge PoP (EU)', 'generic_cdn', ComponentCategory.Networking, 480, 400),
        node('origin', 'Origin (Object Storage)', 'generic_object_storage', ComponentCategory.Storage, 700, 300),
        node('purge', 'Purge API', 'generic_app_server', ComponentCategory.Compute, 700, 150),
        node('ctrl', 'CDN Controller', 'generic_app_server', ComponentCategory.Compute, 700, 500),
      ],
      edges: [
        edge('c-dns', 'client', 'dns', ConnectionType.DNS_RESOLUTION),
        edge('dns-e1', 'dns', 'edge1', ConnectionType.SYNC_HTTP),
        edge('dns-e2', 'dns', 'edge2', ConnectionType.SYNC_HTTP),
        edge('e1-origin', 'edge1', 'origin', ConnectionType.CDN_ORIGIN),
        edge('e2-origin', 'edge2', 'origin', ConnectionType.CDN_ORIGIN),
        edge('purge-e1', 'purge', 'edge1', ConnectionType.SYNC_HTTP),
        edge('purge-e2', 'purge', 'edge2', ConnectionType.SYNC_HTTP),
        edge('ctrl-e1', 'ctrl', 'edge1', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## CDN Reference Solution

**Routing:** Anycast DNS routes clients to the nearest PoP. Each PoP has a local DNS entry responding to the same IP range. The CDN Controller monitors PoP health and removes unhealthy PoPs from DNS.

**Cache Pull:** On miss, the edge fetches from the origin, caches with the origin's Cache-Control headers, and returns to the client. Cache key = URL normalised (protocol stripped, query string sorted).

**Invalidation:** The Purge API accepts invalidation requests and broadcasts to all PoPs via an internal API. Eventual consistency is acceptable — stale content for a few seconds is fine for most assets.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 07 Payment Processing Pipeline ───────────────────────────────────────
  {
    id: 'payment-pipeline',
    title: 'Payment Processing Pipeline',
    description:
      'Design a payment processing system that handles credit card charges, refunds, and payouts. Integrate with external card networks (Visa/Mastercard) via an acquirer.',
    difficulty: 'intermediate',
    category: 'e-commerce',
    company: null,
    timeLimit: 40,
    requirements: [
      'Accept card payments via tokenised card details',
      'Authorise and capture payments against external card networks',
      'Support refunds (full and partial)',
      'Idempotent APIs — duplicate requests must not cause double charges',
      'Webhook notifications on payment status changes',
    ],
    nonFunctionalRequirements: [
      'Handle 10,000 transactions/sec',
      'Payment latency < 2 seconds p99 (network round trip to acquirer dominates)',
      '99.99% availability',
    ],
    constraints: ['PCI-DSS compliance requires card data isolation', 'All transactions must be atomic — partial writes are not acceptable'],
    hints: [
      'Idempotency keys prevent double charges on network retries — how do you implement them?',
      'An outbox pattern ensures events (payment.charged) are reliably published even if the service crashes mid-transaction.',
      'Card tokenisation: raw card numbers never touch your servers — a third-party vault issues a token.',
      'Think about the two-phase payment flow: authorise (hold funds) then capture (settle).',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'Payment API', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 300),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 300),
        node('payapi', 'Payment API', 'generic_app_server', ComponentCategory.Compute, 460, 200),
        node('db', 'Payments DB (PostgreSQL)', 'generic_postgresql', ComponentCategory.Database, 660, 200),
        node('vault', 'Token Vault', 'generic_app_server', ComponentCategory.Compute, 460, 420),
        node('queue', 'Kafka (outbox)', 'generic_kafka', ComponentCategory.Messaging, 660, 420),
        node('worker', 'Acquirer Worker', 'generic_app_server', ComponentCategory.Compute, 860, 300),
        node('webhook', 'Webhook Service', 'generic_app_server', ComponentCategory.Compute, 1060, 300),
      ],
      edges: [
        edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP),
        edge('gw-pay', 'gw', 'payapi', ConnectionType.SYNC_HTTP),
        edge('pay-vault', 'payapi', 'vault', ConnectionType.AUTH_CHECK),
        edge('pay-db', 'payapi', 'db', ConnectionType.DB_WRITE),
        edge('pay-q', 'payapi', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-worker', 'queue', 'worker', ConnectionType.ASYNC_STREAM),
        edge('worker-db', 'worker', 'db', ConnectionType.DB_WRITE),
        edge('q-webhook', 'queue', 'webhook', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Payment Processing Reference Solution

**Idempotency:** Every payment request includes a client-supplied idempotency key. The Payment API stores (key → result) in PostgreSQL. On retry with the same key, the stored result is returned without re-processing.

**Outbox Pattern:** The payment record and the domain event (payment.authorised) are written in the same PostgreSQL transaction. A Kafka consumer reads the outbox table and publishes the event — this prevents the "write DB but event lost" failure mode.

**Token Vault:** Raw card numbers are tokenised by a PCI-compliant vault before entering the system. The Payment API only handles tokens — if the DB is breached, no card data is exposed.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 08 Distributed Cache ─────────────────────────────────────────────────
  {
    id: 'distributed-cache',
    title: 'Distributed Cache',
    description:
      'Design a distributed caching layer for a large e-commerce site. The cache sits in front of a PostgreSQL database and must handle 500,000 reads/sec with 99% hit rate.',
    difficulty: 'intermediate',
    category: 'caching',
    company: null,
    timeLimit: 35,
    requirements: [
      'Cache key-value pairs with TTL',
      'Consistent hashing for key distribution across cache nodes',
      'Handle cache node addition/removal with minimal rehashing',
      'Cache-aside pattern: app reads from cache, falls back to DB on miss',
    ],
    nonFunctionalRequirements: [
      '500,000 reads/sec with 99% cache hit rate',
      'Cache read latency < 1ms p99',
      'Handle hot keys (single key accessed 100,000×/sec)',
    ],
    constraints: ['Cache size is bounded — eviction required (LRU recommended)', 'Hot key problem: top 0.1% of keys account for 50% of traffic'],
    hints: [
      'Consistent hashing ensures a node failure only remaps its keys, not the whole cluster.',
      'Hot keys cause one cache node to be overloaded. Local in-process caching (JVM heap cache) handles the hottest keys.',
      'What happens during a cache miss stampede? Many parallel requests for the same key all hit the DB.',
      'Write-through vs write-around caching: what are the trade-offs for consistency?',
    ],
    starterCanvas: {
      nodes: [
        node('app', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 350, 200),
      ],
      edges: [edge('a-c', 'app', 'cache', ConnectionType.CACHE_READ)],
    },
    referenceSolution: {
      nodes: [
        node('app', 'App Server (×10)', 'generic_app_server', ComponentCategory.Compute, 80, 250),
        node('lb', 'Cache Proxy', 'generic_load_balancer_l4', ComponentCategory.Networking, 280, 250),
        node('c1', 'Cache Node 1', 'generic_redis', ComponentCategory.Database, 480, 150),
        node('c2', 'Cache Node 2', 'generic_redis', ComponentCategory.Database, 480, 300),
        node('c3', 'Cache Node 3', 'generic_redis', ComponentCategory.Database, 480, 450),
        node('rep1', 'Replica 1', 'generic_redis', ComponentCategory.Database, 680, 150),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 680, 350),
      ],
      edges: [
        edge('a-lb', 'app', 'lb', ConnectionType.CACHE_READ),
        edge('lb-c1', 'lb', 'c1', ConnectionType.CACHE_READ),
        edge('lb-c2', 'lb', 'c2', ConnectionType.CACHE_READ),
        edge('lb-c3', 'lb', 'c3', ConnectionType.CACHE_READ),
        edge('c1-rep', 'c1', 'rep1', ConnectionType.DB_REPLICATION),
        edge('a-db', 'app', 'db', ConnectionType.DB_READ),
      ],
      explanation: `## Distributed Cache Reference Solution

**Consistent Hashing:** A cache proxy (Twemproxy-style) maps each key to a node via consistent hashing. Adding a new node remaps only 1/N keys — the other (N-1)/N keys are unaffected.

**Hot Key Mitigation:** The application maintains a tiny local in-process LRU (200 keys) for the hottest items. The top 0.01% of keys are served from heap with zero network hop.

**Stampede Prevention:** Use a "lock + background refresh" pattern. When a key expires, one request acquires a Redis lock and fetches from DB; others wait briefly and get the refreshed value.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 09 Real-time Analytics Dashboard ─────────────────────────────────────
  {
    id: 'realtime-analytics',
    title: 'Real-time Analytics Dashboard',
    description:
      'Design a real-time analytics dashboard for an e-commerce site. Show live metrics: active users, revenue per minute, top products, and conversion funnel — all updating every 5 seconds.',
    difficulty: 'intermediate',
    category: 'real-time',
    company: null,
    timeLimit: 35,
    requirements: [
      'Ingest clickstream events (page views, add-to-cart, purchase) from the site',
      'Display live counts: active users, orders/min, revenue/min',
      'Show top 10 products by views in the last 5 minutes',
      'Conversion funnel: % of sessions reaching each step',
    ],
    nonFunctionalRequirements: [
      'Ingest 1M events/sec at peak (flash sales)',
      'Dashboard latency < 5 seconds (event → dashboard)',
    ],
    constraints: ['Dashboard is internal — 100 concurrent viewers maximum', 'Exact counts are not required — approximate within 5% is acceptable'],
    hints: [
      'Clickstream events at 1M/sec cannot be written directly to a relational DB. A streaming platform buffers them.',
      'Approximate counting algorithms (HyperLogLog for unique users, Count-Min Sketch for top products) are far more efficient than exact counts.',
      'The dashboard does not need a new DB query on every render — pre-compute metrics on an interval.',
      'Think about the event schema: user_id, session_id, event_type, product_id, timestamp.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Browser Events', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('b-q', 'browser', 'queue', ConnectionType.ASYNC_STREAM)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Browser (JS SDK)', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('collector', 'Event Collector', 'generic_app_server', ComponentCategory.Compute, 280, 250),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 480, 250),
        node('processor', 'Stream Processor', 'generic_app_server', ComponentCategory.Compute, 680, 250),
        node('ts', 'Time-Series DB', 'generic_data_warehouse', ComponentCategory.Database, 880, 150),
        node('cache', 'Redis (live metrics)', 'generic_redis', ComponentCategory.Database, 880, 350),
        node('dash', 'Dashboard API', 'generic_app_server', ComponentCategory.Compute, 1080, 250),
      ],
      edges: [
        edge('b-col', 'browser', 'collector', ConnectionType.ASYNC_STREAM),
        edge('col-q', 'collector', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-proc', 'queue', 'processor', ConnectionType.ASYNC_STREAM),
        edge('proc-ts', 'processor', 'ts', ConnectionType.DB_WRITE),
        edge('proc-cache', 'processor', 'cache', ConnectionType.CACHE_WRITE),
        edge('dash-cache', 'dash', 'cache', ConnectionType.CACHE_READ),
        edge('dash-ts', 'dash', 'ts', ConnectionType.DB_READ),
      ],
      explanation: `## Real-time Analytics Reference Solution

**Streaming Pipeline:** The JS SDK batches events and sends to the Event Collector (UDP or HTTP). The Collector validates and publishes to Kafka. A Stream Processor (Flink-style) computes windowed aggregates (5-minute sliding window) and writes to Redis.

**Approximate Structures:** The Stream Processor uses HyperLogLog for unique active users (< 1% error, 12 KB per counter vs O(N) exact), Count-Min Sketch for top products, and simple counters for revenue.

**Dashboard:** The Dashboard API reads pre-computed metrics from Redis (< 1ms). Historical trends come from the Time-Series DB. The 100 concurrent dashboard viewers never touch the hot Kafka pipeline.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 10 Event-Driven Architecture ─────────────────────────────────────────
  {
    id: 'event-driven-arch',
    title: 'Event-Driven Microservices',
    description:
      'Design an event-driven microservices architecture for an e-commerce order flow. When a user places an order, downstream services (inventory, payment, shipping, notifications) react to events.',
    difficulty: 'intermediate',
    category: 'messaging',
    company: null,
    timeLimit: 35,
    requirements: [
      'Order Service creates an order and emits an OrderPlaced event',
      'Inventory Service reserves stock on OrderPlaced',
      'Payment Service charges the card on InventoryReserved',
      'Shipping Service creates a shipment on PaymentCharged',
      'If any step fails, compensating transactions roll back prior steps',
    ],
    nonFunctionalRequirements: [
      'Handle 5,000 orders/sec',
      'Full order processing < 30 seconds end-to-end',
    ],
    constraints: ['No distributed transactions (no 2PC)', 'Each service has its own database (no shared DB)'],
    hints: [
      'The Saga pattern manages distributed transactions across services without 2PC. Choreography vs orchestration — what are the differences?',
      'What is the compensating transaction for "inventory reserved"? How do you trigger it on payment failure?',
      'Think about event idempotency: if the Inventory Service receives the same event twice, what happens?',
      'How do you debug a failed order flow when 5 services are involved?',
    ],
    starterCanvas: {
      nodes: [
        node('order', 'Order Service', 'generic_microservice', ComponentCategory.Compute, 100, 200),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 350, 200),
      ],
      edges: [edge('o-q', 'order', 'queue', ConnectionType.ASYNC_STREAM)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 300),
        node('order', 'Order Service', 'generic_microservice', ComponentCategory.Compute, 260, 300),
        node('orderdb', 'Order DB', 'generic_postgresql', ComponentCategory.Database, 260, 450),
        node('queue', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 460, 300),
        node('inventory', 'Inventory Service', 'generic_microservice', ComponentCategory.Compute, 660, 150),
        node('payment', 'Payment Service', 'generic_microservice', ComponentCategory.Compute, 660, 300),
        node('shipping', 'Shipping Service', 'generic_microservice', ComponentCategory.Compute, 660, 450),
        node('notify', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 860, 300),
      ],
      edges: [
        edge('c-order', 'client', 'order', ConnectionType.SYNC_HTTP),
        edge('order-db', 'order', 'orderdb', ConnectionType.DB_WRITE),
        edge('order-q', 'order', 'queue', ConnectionType.ASYNC_STREAM),
        edge('q-inv', 'queue', 'inventory', ConnectionType.ASYNC_STREAM),
        edge('q-pay', 'queue', 'payment', ConnectionType.ASYNC_STREAM),
        edge('q-ship', 'queue', 'shipping', ConnectionType.ASYNC_STREAM),
        edge('q-notify', 'queue', 'notify', ConnectionType.ASYNC_STREAM),
        edge('inv-q', 'inventory', 'queue', ConnectionType.ASYNC_STREAM),
        edge('pay-q', 'payment', 'queue', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Event-Driven Architecture Reference Solution

**Choreography Saga:** Services react to events published by other services. OrderPlaced → Inventory reserves stock and publishes InventoryReserved → Payment charges and publishes PaymentCharged → Shipping creates shipment. No central orchestrator.

**Compensating Transactions:** On PaymentFailed, Payment publishes PaymentFailed → Inventory listens and releases the reserved stock. Each compensating transaction is idempotent.

**Idempotency:** Each service stores processed event IDs (idempotency key = event_id). On duplicate delivery, the event is acknowledged but not re-processed.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 11 OAuth / SSO Provider ──────────────────────────────────────────────
  {
    id: 'oauth-sso',
    title: 'OAuth / SSO Provider',
    description:
      'Design a Single Sign-On (SSO) and OAuth 2.0 authorization server. Third-party apps use it to authenticate users and request access to their data via scoped tokens.',
    difficulty: 'intermediate',
    category: 'infrastructure',
    company: null,
    timeLimit: 40,
    requirements: [
      'OAuth 2.0 authorization code flow with PKCE',
      'Issue access tokens (JWT, short-lived) and refresh tokens (opaque, long-lived)',
      'Token introspection endpoint for resource servers',
      'SSO: once logged in to the IdP, subsequent apps require no re-authentication',
      'Revoke tokens on logout or security event',
    ],
    nonFunctionalRequirements: [
      'Handle 100,000 token validations/sec',
      'Token issuance < 200ms',
    ],
    constraints: ['Must support PKCE to prevent auth code interception by malicious apps'],
    hints: [
      'JWTs allow resource servers to validate tokens without calling the IdP on every request — just verify the signature.',
      'Refresh tokens must be rotated on each use (rotation prevents token replay attacks).',
      'How does SSO work across different apps? Think about the session cookie on the IdP domain.',
      'Token revocation: a deny-list in Redis (short-lived tokens) or immediate expiry (refresh token rotation) are standard approaches.',
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
        node('user', 'User Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 300),
        node('app', 'Client App', 'generic_web_server', ComponentCategory.Compute, 260, 300),
        node('idp', 'Identity Provider', 'generic_auth_server', ComponentCategory.Security, 460, 200),
        node('cache', 'Redis (tokens/sessions)', 'generic_redis', ComponentCategory.Database, 660, 150),
        node('db', 'PostgreSQL (users/clients)', 'generic_postgresql', ComponentCategory.Database, 660, 350),
        node('resource', 'Resource Server', 'generic_app_server', ComponentCategory.Compute, 860, 250),
      ],
      edges: [
        edge('user-app', 'user', 'app', ConnectionType.SYNC_HTTP),
        edge('user-idp', 'user', 'idp', ConnectionType.SYNC_HTTP),
        edge('app-idp', 'app', 'idp', ConnectionType.AUTH_CHECK),
        edge('idp-cache', 'idp', 'cache', ConnectionType.CACHE_WRITE),
        edge('idp-db', 'idp', 'db', ConnectionType.DB_READ),
        edge('app-resource', 'app', 'resource', ConnectionType.SYNC_HTTP),
        edge('resource-cache', 'resource', 'cache', ConnectionType.AUTH_CHECK),
      ],
      explanation: `## OAuth / SSO Provider Reference Solution

**Token Strategy:** Access tokens are JWTs (15-minute expiry, signed with RSA private key). Resource servers validate locally using the public key — no network hop per request. Refresh tokens are opaque (stored in Redis with 30-day TTL) and rotated on use.

**SSO:** The IdP sets an SSO session cookie (httpOnly, secure) on its own domain. When a new app redirects the user to the IdP, the existing session is detected and the auth code is issued without a login prompt.

**Token Revocation:** Access token deny-list in Redis (only needed for compromised tokens — standard rotation handles most cases). Refresh token revocation is immediate — deleting the Redis entry invalidates it.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 12 E-commerce Product Catalog ────────────────────────────────────────
  {
    id: 'product-catalog',
    title: 'E-commerce Product Catalog',
    description:
      'Design a product catalog for a large e-commerce platform (think Amazon). Support browsing, filtering, and full-text search across 100 million products.',
    difficulty: 'intermediate',
    category: 'e-commerce',
    company: null,
    timeLimit: 35,
    requirements: [
      'Browse products by category tree (up to 5 levels deep)',
      'Full-text search with filters (price range, brand, ratings, availability)',
      'Real-time inventory count per product',
      'Product detail page: title, images, variants, reviews, related products',
    ],
    nonFunctionalRequirements: [
      'Search latency < 200ms for 100M products',
      'Handle 500,000 reads/sec at peak (flash sales)',
    ],
    constraints: ['Product metadata is write-rare (1,000 updates/sec) but read-heavy (500,000 reads/sec)', 'Inventory is write-heavy (updated on every purchase)'],
    hints: [
      'Search and product metadata are two different problems — different data stores.',
      'Separate the read path (product detail, browse) from the inventory service (real-time stock counts).',
      'A CDN can cache product pages — how often do they change? What is the cache invalidation strategy?',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'Product API', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 80, 300),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 150),
        node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 350),
        node('search', 'Search Service', 'generic_app_server', ComponentCategory.Compute, 460, 250),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 660, 200),
        node('catalog', 'Catalog Service', 'generic_app_server', ComponentCategory.Compute, 460, 400),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 660, 400),
        node('cache', 'Redis', 'generic_redis', ComponentCategory.Database, 660, 550),
        node('inventory', 'Inventory Service', 'generic_microservice', ComponentCategory.Compute, 860, 300),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.CDN_ORIGIN),
        edge('c-gw', 'client', 'gw', ConnectionType.SYNC_HTTP),
        edge('gw-search', 'gw', 'search', ConnectionType.SYNC_HTTP),
        edge('gw-catalog', 'gw', 'catalog', ConnectionType.SYNC_HTTP),
        edge('search-es', 'search', 'es', ConnectionType.DB_READ),
        edge('catalog-db', 'catalog', 'db', ConnectionType.DB_READ),
        edge('catalog-cache', 'catalog', 'cache', ConnectionType.CACHE_READ),
        edge('catalog-inv', 'catalog', 'inventory', ConnectionType.SYNC_HTTP),
      ],
      explanation: `## Product Catalog Reference Solution

**Search vs Catalog Split:** Elasticsearch handles full-text search with filters (inverted index). PostgreSQL stores canonical product data (structured, ACID). These are separate read paths — a search returns product IDs, which are then hydrated from the catalog cache.

**Inventory Separation:** Real-time stock counts are a separate Inventory Service (high write rate). The Catalog Service fetches inventory asynchronously — stock counts can lag by a few seconds on product pages.

**CDN Caching:** Product detail pages are cached at the CDN with a short TTL (60s). Cache-busting on price/availability changes is handled via surrogate keys — a price update triggers invalidation of all pages with that product's key.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 13 Job Scheduling System ─────────────────────────────────────────────
  {
    id: 'job-scheduler',
    title: 'Distributed Job Scheduler',
    description:
      'Design a distributed job scheduling system like cron-as-a-service. Users define jobs with cron expressions; the system executes them reliably at the scheduled time, at-least-once.',
    difficulty: 'intermediate',
    category: 'infrastructure',
    company: null,
    timeLimit: 35,
    requirements: [
      'Define jobs with a cron schedule (down to 1-minute granularity)',
      'Jobs execute at the correct time within ±30 seconds',
      'At-least-once execution per cron tick',
      'Execution history and logs per job',
      'Retry on failure (configurable, up to 3 attempts)',
    ],
    nonFunctionalRequirements: [
      'Support 10,000 unique schedules',
      'Scale to 1,000 concurrent job executions',
    ],
    constraints: ['No cluster-wide distributed lock — leader election only for the scheduler', 'Jobs are arbitrary HTTP callbacks — the system just calls a URL'],
    hints: [
      'How do you ensure a job fires exactly once even if two scheduler nodes are running? Leader election.',
      'A naive "select all jobs due in the next minute" query on 10,000 jobs every minute is fine at this scale.',
      'Job workers are stateless — they just make an HTTP callback. Scale them independently of the scheduler.',
      "Think about what happens if a job's target URL is down: retry with backoff and mark failed after max attempts.",
    ],
    starterCanvas: {
      nodes: [
        node('scheduler', 'Scheduler', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 350, 200),
      ],
      edges: [edge('s-db', 'scheduler', 'db', ConnectionType.DB_READ)],
    },
    referenceSolution: {
      nodes: [
        node('admin', 'Admin UI', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 250),
        node('api', 'Job API', 'generic_app_server', ComponentCategory.Compute, 260, 250),
        node('db', 'PostgreSQL', 'generic_postgresql', ComponentCategory.Database, 460, 250),
        node('lock', 'Redis (leader lock)', 'generic_redis', ComponentCategory.Database, 260, 120),
        node('scheduler', 'Scheduler (leader)', 'generic_app_server', ComponentCategory.Compute, 460, 120),
        node('queue', 'Task Queue', 'generic_message_queue', ComponentCategory.Messaging, 660, 200),
        node('workers', 'Execution Workers', 'generic_app_server', ComponentCategory.Compute, 860, 200),
        node('logdb', 'Execution Log DB', 'generic_postgresql', ComponentCategory.Database, 860, 350),
      ],
      edges: [
        edge('admin-api', 'admin', 'api', ConnectionType.SYNC_HTTP),
        edge('api-db', 'api', 'db', ConnectionType.DB_WRITE),
        edge('sch-lock', 'scheduler', 'lock', ConnectionType.CACHE_READ),
        edge('sch-db', 'scheduler', 'db', ConnectionType.DB_READ),
        edge('sch-q', 'scheduler', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-workers', 'queue', 'workers', ConnectionType.ASYNC_QUEUE),
        edge('workers-log', 'workers', 'logdb', ConnectionType.DB_WRITE),
      ],
      explanation: `## Job Scheduler Reference Solution

**Leader Election:** Multiple Scheduler instances run, but only the leader (holding a Redis lock with TTL) queries for due jobs. If the leader dies, another acquires the lock within the TTL (typically 30s).

**Tick Loop:** Every 30 seconds, the Scheduler queries PostgreSQL for all jobs due in the next 60s. It enqueues them to the task queue with the scheduled execution time. Workers execute at the correct time and record results.

**Execution Workers:** Workers make the HTTP callback, record the response in the Execution Log DB, and handle retries via exponential backoff. Stateless — scale horizontally for more concurrent executions.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 14 Distributed File Storage ──────────────────────────────────────────
  {
    id: 'distributed-file-storage',
    title: 'Distributed File Storage',
    description:
      'Design a distributed file storage system like HDFS or Amazon S3. Store large files across a cluster of commodity servers with replication, fault tolerance, and high throughput.',
    difficulty: 'intermediate',
    category: 'storage',
    company: null,
    timeLimit: 40,
    requirements: [
      'Upload and download files of any size (up to 1 TB)',
      'Files are split into chunks and distributed across nodes',
      'Replicate each chunk to 3 nodes for fault tolerance',
      'Survive 2 simultaneous node failures without data loss',
      'List files and retrieve metadata (size, checksum, created_at)',
    ],
    nonFunctionalRequirements: [
      'Store 100 PB across the cluster',
      'Upload throughput: 10 GB/s cluster-wide',
    ],
    constraints: ['No POSIX filesystem semantics — simple GET/PUT/DELETE only', 'Chunk size: 64 MB'],
    hints: [
      'A master node (NameNode) tracks which chunks live on which data nodes — it never stores data itself.',
      'Clients talk directly to data nodes for upload/download — the master only handles metadata.',
      'How do you detect and recover from node failures? Heartbeat + replication factor checks.',
      'What is the consistency model? Strong consistency requires coordination; eventual consistency is simpler.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'App Server', 'generic_app_server', ComponentCategory.Compute, 100, 200),
        node('master', 'Master Node', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-m', 'client', 'master', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Client App', 'generic_app_server', ComponentCategory.Compute, 80, 300),
        node('master', 'Metadata Server', 'generic_app_server', ComponentCategory.Compute, 280, 200),
        node('metadb', 'Metadata DB', 'generic_postgresql', ComponentCategory.Database, 280, 80),
        node('dn1', 'Data Node 1', 'generic_object_storage', ComponentCategory.Storage, 480, 150),
        node('dn2', 'Data Node 2', 'generic_object_storage', ComponentCategory.Storage, 480, 300),
        node('dn3', 'Data Node 3', 'generic_object_storage', ComponentCategory.Storage, 480, 450),
        node('monitor', 'Health Monitor', 'generic_metrics_collector', ComponentCategory.Observability, 680, 300),
      ],
      edges: [
        edge('c-master', 'client', 'master', ConnectionType.SYNC_HTTP),
        edge('master-db', 'master', 'metadb', ConnectionType.DB_READ),
        edge('client-dn1', 'client', 'dn1', ConnectionType.SYNC_HTTP),
        edge('client-dn2', 'client', 'dn2', ConnectionType.SYNC_HTTP),
        edge('client-dn3', 'client', 'dn3', ConnectionType.SYNC_HTTP),
        edge('dn1-dn2', 'dn1', 'dn2', ConnectionType.DB_REPLICATION),
        edge('dn2-dn3', 'dn2', 'dn3', ConnectionType.DB_REPLICATION),
        edge('mon-dn1', 'monitor', 'dn1', ConnectionType.HEALTH_CHECK),
        edge('mon-dn2', 'monitor', 'dn2', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Distributed File Storage Reference Solution

**Metadata Separation:** The Metadata Server stores chunk locations (file → [chunk_id → [node_1, node_2, node_3]]) in PostgreSQL. It never touches data — it is a lightweight lookup service. Clients get chunk locations from the metadata server, then transfer data directly to/from data nodes.

**Replication:** On upload, the client streams to the primary data node, which replicates to 2 others synchronously (write quorum = 2). All 3 replicas must acknowledge before the upload is complete.

**Failure Recovery:** The Health Monitor heartbeats data nodes. On node loss, it detects under-replicated chunks and instructs remaining nodes to replicate to new targets to restore the replication factor.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 15 Recommendation Engine (basic) ─────────────────────────────────────
  {
    id: 'recommendation-engine-basic',
    title: 'Recommendation Engine',
    description:
      'Design a basic product recommendation engine for an e-commerce site. Show "Customers also bought" and personalised homepage recommendations based on purchase and browsing history.',
    difficulty: 'intermediate',
    category: 'e-commerce',
    company: null,
    timeLimit: 35,
    requirements: [
      '"Customers also bought" recommendations on product pages (collaborative filtering)',
      'Personalised homepage recommendations based on browsing history',
      'Real-time update: new interactions affect recommendations within 1 hour',
      'Cold start: new users without history see popular items',
    ],
    nonFunctionalRequirements: [
      'Serve recommendations to 100M users',
      'Recommendation API < 50ms',
    ],
    constraints: ['Pre-compute recommendations — do not compute at request time', 'Exact ML model details are out of scope — focus on the system architecture'],
    hints: [
      'Pre-computed recommendations stored in a key-value store (user_id → [product_ids]) give < 1ms reads.',
      'The ML pipeline (training, batch scoring) is separate from the serving layer.',
      'How do you handle 100M users × 10 recommendations × 4 bytes = 4 GB of recommendation data? Fits in Redis.',
      'Event stream of user interactions feeds the ML training pipeline.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
        node('api', 'Rec API', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      ],
      edges: [edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 80, 300),
        node('api', 'Rec API', 'generic_app_server', ComponentCategory.Compute, 280, 300),
        node('cache', 'Redis (pre-computed)', 'generic_redis', ComponentCategory.Database, 480, 200),
        node('db', 'Recommendations DB', 'generic_postgresql', ComponentCategory.Database, 480, 400),
        node('events', 'Event Stream (Kafka)', 'generic_kafka', ComponentCategory.Messaging, 680, 300),
        node('ml', 'ML Training Pipeline', 'generic_app_server', ComponentCategory.Compute, 880, 300),
        node('scorer', 'Batch Scorer', 'generic_app_server', ComponentCategory.Compute, 880, 150),
      ],
      edges: [
        edge('c-api', 'client', 'api', ConnectionType.SYNC_HTTP),
        edge('api-cache', 'api', 'cache', ConnectionType.CACHE_READ),
        edge('api-db', 'api', 'db', ConnectionType.DB_READ),
        edge('client-events', 'client', 'events', ConnectionType.ASYNC_STREAM),
        edge('events-ml', 'events', 'ml', ConnectionType.ASYNC_STREAM),
        edge('ml-scorer', 'ml', 'scorer', ConnectionType.SYNC_HTTP),
        edge('scorer-cache', 'scorer', 'cache', ConnectionType.CACHE_WRITE),
        edge('scorer-db', 'scorer', 'db', ConnectionType.DB_WRITE),
      ],
      explanation: `## Recommendation Engine Reference Solution

**Pre-computation:** The ML pipeline trains a collaborative filtering model hourly on interaction events from Kafka. The Batch Scorer applies the model to all users and writes (user_id → top-10 product IDs) to Redis and PostgreSQL. Serving is a pure cache read.

**Serving Layer:** The Rec API reads from Redis (< 1ms). Cache miss (new users or expired entries) falls through to PostgreSQL. Cold start users receive globally popular items from a separate "trending" key.

**Event Pipeline:** Browser interactions (views, clicks, purchases) stream to Kafka in real-time. The ML pipeline consumes these to keep the training data fresh. Recommendations are updated every hour.`,
    },
    rubric: DEFAULT_RUBRIC,
  },
];
