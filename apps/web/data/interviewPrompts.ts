import type { VexoNode, VexoEdge } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

function node(id: string, label: string, componentId: string, category: ComponentCategory, x: number, y: number): VexoNode {
  return {
    id, type: 'vexo', position: { x, y },
    data: { componentId, label, category, cloudVariant: null, iconType: 'custom', iconSrc: componentId, status: SystemStatus.Idle, metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 } },
  };
}

export interface InterviewPrompt {
  id: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  starterNodes: VexoNode[];
  starterEdges: VexoEdge[];
}

export const INTERVIEW_PROMPTS: InterviewPrompt[] = [
  {
    id: 'url-shortener',
    title: 'URL Shortener',
    description: 'Design a URL shortening service like bit.ly. Support 100M shortened URLs and 1B reads/day.',
    constraints: ['100M URLs stored', '1B reads/day, 10M writes/day', '<10ms redirect latency', 'URLs never expire'],
    hints: ['Start with the read path — most traffic is redirects, not writes.', 'A cache hit rate of 90%+ is critical for achieving <10ms redirects.', 'Consider how to generate unique short codes without collisions at scale.', 'Think about how analytics (click tracking) can be decoupled from the redirect path.'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('api', 'API Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
    ],
    starterEdges: [{ id: 'c-a', source: 'client', target: 'api', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'chat-app',
    title: 'Chat Application',
    description: 'Design a real-time chat system like WhatsApp or Slack. Support 500M users, 50B messages/day.',
    constraints: ['500M monthly active users', '50B messages/day', 'Message delivery <100ms', 'Message history retained forever'],
    hints: ['WebSockets are essential for real-time delivery.', 'Messages need to be persisted even when the recipient is offline — consider a message queue.', 'For group chats, fanout delivery is the hard problem: push vs pull tradeoff.', 'Consider separate services for online/offline status vs message delivery.'],
    starterNodes: [
      node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
      node('ws', 'WebSocket Server', 'generic_websocket_server', ComponentCategory.Compute, 350, 200),
    ],
    starterEdges: [{ id: 'm-ws', source: 'mobile', target: 'ws', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'news-feed',
    title: 'News Feed',
    description: 'Design a social news feed like Twitter or Instagram. Support 500M users, 1B posts viewed/day.',
    constraints: ['500M users, 1M posting', '1B feed views/day', 'Feed refresh <500ms', 'Posts from 5000 follows max'],
    hints: ['Fan-out on write vs fan-out on read — understand the trade-offs for celebrity accounts.', 'Caching the pre-computed feed per user reduces read latency dramatically.', 'Think about how new posts appear in feeds — push (fanout) vs pull (read on demand).', 'Separate the hot path (feed read) from the cold path (post creation).'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 350, 200),
    ],
    starterEdges: [{ id: 'c-lb', source: 'client', target: 'lb', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'ecommerce-checkout',
    title: 'E-commerce Checkout',
    description: 'Design the checkout flow for an e-commerce platform like Amazon. Handle 100K checkouts/minute during peak.',
    constraints: ['100K checkouts/minute peak', 'Payment idempotency required', 'Inventory must not oversell', 'Order confirmation <2s'],
    hints: ['Inventory reservation must be atomic — consider optimistic locking or distributed locks.', 'Payment processing is synchronous but slow — decouple with a queue.', 'Idempotency keys prevent double-charging on retries.', 'Cart service, order service, and payment service should be separate.'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 200),
    ],
    starterEdges: [{ id: 'c-gw', source: 'client', target: 'gw', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'video-streaming',
    title: 'Video Streaming',
    description: 'Design a video streaming platform like Netflix or YouTube. Support 100M concurrent viewers.',
    constraints: ['100M concurrent viewers', 'Global CDN required', 'Multiple video qualities (360p–4K)', 'Upload processing <10min for 1hr video'],
    hints: ['Video storage and streaming are separate concerns — object storage for files, CDN for delivery.', 'Transcoding is CPU-intensive and async — use a job queue.', 'Adaptive bitrate streaming (HLS/DASH) handles varying network conditions.', 'Metadata (title, thumbnail, views) is a tiny fraction of the data but the most-read path.'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 350, 100),
    ],
    starterEdges: [{ id: 'c-cdn', source: 'client', target: 'cdn', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'ride-sharing',
    title: 'Ride Sharing',
    description: 'Design a ride-sharing service like Uber or Lyft. Match 10M rides/day in real-time.',
    constraints: ['10M rides/day', 'Driver location updates every 4s', 'Match driver to rider <30s', 'Real-time price surging'],
    hints: ['Location data is a stream — not a database write-heavy workload per se.', 'Driver proximity search requires geo-indexing (geohash or quadtree).', 'Matching can be async — accept the ride request, then find a driver.', 'WebSockets for real-time driver location to rider map.'],
    starterNodes: [
      node('rider', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 150),
      node('driver', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 300),
    ],
    starterEdges: [],
  },
  {
    id: 'search-engine',
    title: 'Search Engine',
    description: 'Design a search engine for a large e-commerce site. Index 1B products, 10K searches/second.',
    constraints: ['1B product documents', '10K searches/second', 'Results in <100ms', 'Near-real-time index updates'],
    hints: ['Elasticsearch or similar is the right tool for inverted index search.', 'Indexing pipeline is async — product updates flow through a queue to the index.', 'Read replicas scale search throughput horizontally.', 'Query caching for popular searches (top 10% of queries = 90% of traffic).'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('search', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 400, 200),
    ],
    starterEdges: [],
  },
  {
    id: 'rate-limiter',
    title: 'Rate Limiter',
    description: 'Design a distributed rate limiting service. Handle 1M requests/second across 100 API servers.',
    constraints: ['1M req/s total', '100 API gateway instances', 'Accuracy within 5% of limit', 'Latency overhead <5ms'],
    hints: ['Centralized rate limiting with Redis is simple but creates a bottleneck.', 'Token bucket and sliding window log are the two main algorithms.', 'For distributed rate limiting, local counters with periodic sync reduces Redis load.', 'Rate limit keys should include: user_id + API_endpoint + time_window.'],
    starterNodes: [
      node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 200),
      node('rl', 'Rate Limiter', 'generic_rate_limiter', ComponentCategory.Security, 350, 200),
    ],
    starterEdges: [{ id: 'c-rl', source: 'client', target: 'rl', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never }],
  },
  {
    id: 'notification-system',
    title: 'Notification System',
    description: 'Design a notification system supporting push, email, and SMS for 1B users.',
    constraints: ['1B users', 'Push, email, SMS channels', 'Delivery within 5s for critical alerts', 'User preference management'],
    hints: ['Notifications are async by nature — queue is the right abstraction.', 'Fan-out per channel type: push (APNs/FCM), email (SES/SendGrid), SMS (Twilio).', 'Preference service gates which notifications each user receives on which channel.', 'Rate limiting per user per channel prevents notification spam.'],
    starterNodes: [
      node('service', 'Microservice', 'generic_microservice', ComponentCategory.Compute, 100, 200),
      node('queue', 'Message Queue', 'generic_message_queue', ComponentCategory.Messaging, 350, 200),
    ],
    starterEdges: [{ id: 's-q', source: 'service', target: 'queue', data: { connectionType: 'ASYNC_QUEUE', validationStatus: 'valid' } as never }],
  },
  {
    id: 'file-storage',
    title: 'File Storage Service',
    description: 'Design a distributed file storage system like Dropbox or Google Drive. Store 1B files, 100PB total.',
    constraints: ['1B files across all users', '100PB total storage', 'File sync across devices', 'Version history per file'],
    hints: ['Block-level deduplication saves massive storage (same file uploaded by many users).', 'Chunked uploads allow resume and enable deduplication at block level.', 'Metadata (filename, size, perms) and content (bytes) should be stored separately.', 'Change notification to trigger sync uses a message queue, not polling.'],
    starterNodes: [
      node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 200),
      node('api', 'API Server', 'generic_app_server', ComponentCategory.Compute, 350, 200),
      node('storage', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 600, 200),
    ],
    starterEdges: [
      { id: 'c-a', source: 'client', target: 'api', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never },
      { id: 'a-s', source: 'api', target: 'storage', data: { connectionType: 'SYNC_HTTP', validationStatus: 'valid' } as never },
    ],
  },
];
