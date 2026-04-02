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
  return {
    id,
    source,
    target,
    data: { connectionType, validationStatus: 'valid' },
  } as VexoEdge;
}

export const ADVANCED_SCENARIOS: InterviewScenario[] = [
  // ── 01 Instagram / Photo Sharing at Scale ────────────────────────────────
  {
    id: 'instagram',
    title: 'Instagram / Photo Sharing at Scale',
    description:
      'Design a photo-sharing platform at Instagram scale where users upload images, follow each other, receive a personalised home feed, and interact via likes and comments in near-real-time.',
    difficulty: 'advanced',
    category: 'social',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can upload photos and short videos (up to 60 seconds)',
      'Each media upload is processed into multiple resolutions (thumbnail, medium, full)',
      'Users can follow/unfollow other users; follower graph is bidirectional',
      'Home feed shows the latest posts from followed accounts, ranked by recency and engagement',
      'Users can like and comment on posts; counts update in near-real-time',
      'Hashtag search returns posts tagged with a given term, sorted by relevance',
      'Push and in-app notifications are delivered when someone likes or comments on a user\'s post',
      'User profiles display post count, follower count, and a grid of recent posts',
      'Media is served via CDN with global low-latency delivery',
    ],
    nonFunctionalRequirements: [
      '500M DAU, 5B photos viewed per day',
      'Feed read latency < 200ms at p99',
      'Photo upload end-to-end processing < 5 seconds',
      '99.99% availability on read paths; 99.9% on write paths',
      'Storage: 100 TB new media ingested per day',
      'Notification delivery < 3 seconds for high-priority events',
    ],
    constraints: [
      'Read-to-write ratio is approximately 100:1',
      'Celebrity accounts (>10M followers) require a push-on-read fanout strategy',
      'Media originals are never deleted; only soft-delete is allowed',
    ],
    hints: [
      'Separate the upload pipeline from the serving path — uploads write to object storage and trigger async processing workers.',
      'For the home feed, consider whether you fan-out on write (pre-compute per-user feeds in a cache) or fan-out on read. What breaks at celebrity scale?',
      'Use a dedicated graph store or adjacency table in a relational DB for the follower graph; hot accounts should be cached.',
      'CDN is essential for media delivery — route all GET /media requests through a CDN layer backed by object storage as origin.',
      'Likes and comment counts are write-heavy aggregates; use a Redis counter with periodic flush to the primary DB to avoid hotspot writes.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 400),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 600),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('app', 'App Server', 'generic_app_server', ComponentCategory.Compute, 700, 300),
        node('media-svc', 'Media Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('feed-svc', 'Feed Service', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('object-store', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 200),
        node('queue', 'Media Process Queue', 'generic_message_queue', ComponentCategory.Messaging, 960, 500),
        node('media-worker', 'Media Worker', 'generic_microservice', ComponentCategory.Compute, 1180, 500),
        node('redis-feed', 'Feed Cache (Redis)', 'generic_redis', ComponentCategory.Database, 960, 700),
        node('redis-count', 'Counters (Redis)', 'generic_redis', ComponentCategory.Database, 700, 900),
        node('postgres', 'Primary DB', 'generic_postgresql', ComponentCategory.Database, 960, 350),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 1180, 700),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1180, 300),
        node('event-bus', 'Event Bus', 'generic_event_bus', ComponentCategory.Messaging, 960, 900),
        node('metrics', 'Metrics Collector', 'generic_metrics_collector', ComponentCategory.Observability, 480, 900),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.SYNC_HTTP),
        edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-app', 'lb', 'app', ConnectionType.SYNC_HTTP),
        edge('lb-media', 'lb', 'media-svc', ConnectionType.SYNC_HTTP),
        edge('lb-feed', 'lb', 'feed-svc', ConnectionType.SYNC_HTTP),
        edge('media-obj', 'media-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('media-q', 'media-svc', 'queue', ConnectionType.ASYNC_QUEUE),
        edge('q-worker', 'queue', 'media-worker', ConnectionType.ASYNC_QUEUE),
        edge('worker-obj', 'media-worker', 'object-store', ConnectionType.DB_WRITE),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('app-pg', 'app', 'postgres', ConnectionType.DB_WRITE),
        edge('app-redis-cnt', 'app', 'redis-count', ConnectionType.CACHE_WRITE),
        edge('feed-redis', 'feed-svc', 'redis-feed', ConnectionType.CACHE_READ),
        edge('feed-pg', 'feed-svc', 'postgres', ConnectionType.DB_READ),
        edge('app-evtbus', 'app', 'event-bus', ConnectionType.ASYNC_STREAM),
        edge('evtbus-notif', 'event-bus', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('media-es', 'media-worker', 'es', ConnectionType.DB_WRITE),
        edge('app-metrics', 'app', 'metrics', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Instagram-scale photo sharing system separates concerns into four major planes: the media ingestion pipeline, the feed delivery plane, the social interaction plane, and the notification plane. All client traffic enters through the API Gateway which enforces authentication via a dedicated Auth Server before forwarding requests through the L7 Load Balancer to the appropriate microservice.

## Key Design Decisions

Media uploads land in Object Storage immediately after the client uploads the raw file; a Message Queue decouples the heavyweight transcoding workers from the write path, ensuring upload acknowledgement is fast. Processed thumbnails and resolutions are written back to Object Storage and indexed in Elasticsearch for hashtag search. The home feed is served from a Redis cache (fan-out on write for regular accounts, fan-out on read for celebrity accounts), drastically reducing p99 read latency. Like and comment counters live in a separate Redis instance and are periodically flushed to PostgreSQL to avoid hot-row contention. The CDN sits in front of Object Storage for all media GET requests, absorbing the 5 billion daily reads with global edge caching.

## Scalability & Trade-offs

The primary scalability lever is the separation of read and write paths. PostgreSQL handles durable writes for user profiles and post metadata; Redis absorbs the read amplification from feed delivery and real-time counters. The biggest trade-off is feed staleness — fan-out on write pre-computes feeds but means a celebrity post could take minutes to propagate to all followers. The hybrid model (fan-out on write for regular users, fan-out on read for accounts with >1M followers) is the standard industry mitigation. The Event Bus decouples notification delivery so that a spike in engagement events does not delay the core write path.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 02 Uber / Ride Sharing ───────────────────────────────────────────────
  {
    id: 'uber-ride-sharing',
    title: 'Uber / Ride Sharing',
    description:
      'Design a ride-sharing platform where riders request trips, drivers are matched in real-time, location is tracked live throughout the ride, and dynamic pricing reflects current supply/demand.',
    difficulty: 'advanced',
    category: 'real-time',
    company: null,
    timeLimit: 50,
    requirements: [
      'Riders can request a ride by specifying pickup and drop-off locations',
      'The system finds the nearest available driver within an acceptable radius',
      'Driver location is updated every 3–5 seconds while the app is active',
      'Once matched, the rider and driver share a live map view of each other\'s position',
      'Dynamic surge pricing multiplier is calculated per geographic cell based on supply/demand ratio',
      'Estimated time of arrival (ETA) is calculated and updated in real-time',
      'Trip state machine transitions: requested → matched → en-route → in-ride → completed',
      'Payments are processed asynchronously after trip completion',
      'Drivers receive trip requests via push notification and can accept or decline',
    ],
    nonFunctionalRequirements: [
      '5M concurrent rides globally at peak',
      'Driver location update ingestion: 500K writes/sec',
      'Ride match latency < 2 seconds end-to-end',
      '99.99% availability on the matching and location services',
      'Geospatial query (find drivers in radius) < 50ms at p99',
    ],
    constraints: [
      'Location data has a retention window of 30 days for legal compliance',
      'Matching must respect driver preferences (vehicle type, max distance)',
      'Surge pricing cells use an H3 hexagonal grid at resolution 7 (~5 km² cells)',
    ],
    hints: [
      'Location updates are write-intensive and time-sensitive — consider an in-memory geospatial store (Redis GEOADD/GEORADIUS) rather than a relational DB.',
      'The matching service needs to query nearby drivers efficiently; a geospatial index on driver locations is the critical data structure.',
      'Trip state transitions should be durable — use a reliable message queue or event stream so state changes survive process crashes.',
      'Surge pricing is a read-heavy aggregation over recent supply/demand data per hex cell; a periodic compute job writing to a cache works well.',
      'WebSockets or server-sent events are needed for live location sharing between rider and driver — the API Gateway must support persistent connections.',
    ],
    starterCanvas: {
      nodes: [
        node('rider', 'Mobile Client (Rider)', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('r-apigw', 'rider', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('rider', 'Mobile Client (Rider)', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 300),
        node('driver', 'Mobile Client (Driver)', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 600),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 280, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 280, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 500, 350),
        node('match-svc', 'Matching Service', 'generic_microservice', ComponentCategory.Compute, 720, 200),
        node('location-svc', 'Location Service', 'generic_microservice', ComponentCategory.Compute, 720, 450),
        node('trip-svc', 'Trip Service', 'generic_microservice', ComponentCategory.Compute, 720, 650),
        node('surge-svc', 'Surge Pricing Service', 'generic_microservice', ComponentCategory.Compute, 720, 850),
        node('redis-geo', 'Geospatial Cache (Redis)', 'generic_redis', ComponentCategory.Database, 960, 350),
        node('redis-surge', 'Surge Cache (Redis)', 'generic_redis', ComponentCategory.Database, 960, 850),
        node('postgres', 'Trip DB', 'generic_postgresql', ComponentCategory.Database, 960, 550),
        node('kafka', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 960, 200),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1180, 200),
        node('payment-queue', 'Payment Queue', 'generic_message_queue', ComponentCategory.Messaging, 1180, 550),
        node('metrics', 'Metrics Collector', 'generic_metrics_collector', ComponentCategory.Observability, 500, 900),
      ],
      edges: [
        edge('rider-apigw', 'rider', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('driver-apigw', 'driver', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-match', 'lb', 'match-svc', ConnectionType.SYNC_HTTP),
        edge('lb-loc', 'lb', 'location-svc', ConnectionType.SYNC_HTTP),
        edge('lb-trip', 'lb', 'trip-svc', ConnectionType.SYNC_HTTP),
        edge('lb-surge', 'lb', 'surge-svc', ConnectionType.SYNC_HTTP),
        edge('loc-redis', 'location-svc', 'redis-geo', ConnectionType.CACHE_WRITE),
        edge('match-redis', 'match-svc', 'redis-geo', ConnectionType.CACHE_READ),
        edge('match-kafka', 'match-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('trip-pg', 'trip-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('trip-kafka', 'trip-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('surge-redis', 'surge-svc', 'redis-surge', ConnectionType.CACHE_WRITE),
        edge('match-surge', 'match-svc', 'redis-surge', ConnectionType.CACHE_READ),
        edge('trip-pay-q', 'trip-svc', 'payment-queue', ConnectionType.ASYNC_QUEUE),
        edge('app-metrics', 'location-svc', 'metrics', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The ride-sharing system is built around three high-velocity data flows: continuous driver location ingestion, real-time ride matching, and live trip tracking. All mobile clients (riders and drivers) connect through the API Gateway, which authenticates via the Auth Server and routes to the L7 Load Balancer before dispatching to the appropriate microservice cluster.

## Key Design Decisions

Driver location updates (500K/sec) are written directly to a Redis Geospatial index using GEOADD, which supports O(log N) radius queries. The Matching Service queries Redis for nearby available drivers and publishes match events to Kafka, which fans out to the Notification Service for driver push delivery. Trip state transitions are persisted durably in PostgreSQL; Kafka events ensure that downstream consumers (payments, analytics) receive every state change even if a service is temporarily unavailable. Surge pricing is computed by a periodic batch job over the last 5 minutes of supply/demand data per H3 cell and written to a dedicated Redis cache, making surge lookups a fast cache read at match time.

## Scalability & Trade-offs

The critical bottleneck is the geospatial write throughput. Redis single-instance GEOADD peaks around 200K ops/sec; sharding by city or geographic shard key is required to reach 500K/sec globally. The trade-off is that a cross-shard radius query (near a city boundary) requires scatter-gather across two shards. Matching latency depends heavily on the Redis read path — if Redis geo is unavailable, matching degrades to a full-scan fallback with much higher latency, which is acceptable because the system prioritises correctness over speed during degradation.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 03 YouTube / Video Streaming ─────────────────────────────────────────
  {
    id: 'youtube',
    title: 'YouTube / Video Streaming',
    description:
      'Design a video-sharing and streaming platform where users upload videos, the platform transcodes them into multiple bitrates and resolutions, and viewers stream content adaptively from a global CDN.',
    difficulty: 'advanced',
    category: 'streaming',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can upload video files up to 2 GB; upload must be resumable',
      'Uploaded videos are transcoded into multiple resolutions: 360p, 720p, 1080p, 4K',
      'Adaptive bitrate streaming (ABR) adjusts resolution based on viewer bandwidth',
      'Video search returns results ranked by relevance, view count, and recency',
      'Recommended videos are shown on the home page and sidebar, personalised per user',
      'View counts, likes, and comments are tracked per video',
      'Video playback supports seeking to arbitrary timestamps without full buffering',
      'Creators receive analytics: views over time, watch-time, audience geography',
      'Live streaming support: sub-10-second latency from camera to viewer',
    ],
    nonFunctionalRequirements: [
      '2.5B MAU; 500 hours of video uploaded per minute',
      'Streaming bandwidth: 1 Tbps aggregate peak egress',
      'Video start latency < 2 seconds at p95 globally',
      '99.95% availability on the playback path',
      'Transcoding throughput: 2,000 concurrent jobs',
      'Search index staleness < 60 seconds after upload',
    ],
    constraints: [
      'Transcoding is CPU-bound and must be horizontally scalable as a worker pool',
      'Segment-based HLS/DASH delivery; segment size 2–6 seconds',
      'Raw originals must be retained for re-transcoding if new codecs are introduced',
    ],
    hints: [
      'The upload path and the playback path are completely separate — design them independently before connecting them.',
      'Transcoding is async and long-running; use a queue to distribute jobs across a worker pool, not synchronous HTTP calls.',
      'CDN caching of video segments is the key to sustaining 1 Tbps egress — segments are immutable once produced, so cache TTLs can be very long.',
      'View count is a write-hot counter; avoid writing directly to the primary DB on every view event. Consider a streaming aggregation approach.',
      'For search, Elasticsearch with a periodic or event-driven indexing pipeline gives you full-text + faceted ranking without building a custom search engine.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('upload-svc', 'Upload Service', 'generic_microservice', ComponentCategory.Compute, 700, 200),
        node('stream-svc', 'Streaming Service', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('meta-svc', 'Metadata Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('object-store', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 100),
        node('transcode-q', 'Transcode Queue', 'generic_kafka', ComponentCategory.Messaging, 960, 300),
        node('transcode-worker', 'Transcode Workers', 'generic_microservice', ComponentCategory.Compute, 1200, 300),
        node('redis-meta', 'Metadata Cache', 'generic_redis', ComponentCategory.Database, 960, 550),
        node('postgres', 'Video Metadata DB', 'generic_postgresql', ComponentCategory.Database, 960, 750),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 1200, 550),
        node('kafka-events', 'Event Stream', 'generic_kafka', ComponentCategory.Messaging, 700, 850),
        node('analytics-svc', 'Analytics Service', 'generic_microservice', ComponentCategory.Compute, 960, 950),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 900),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-upload', 'lb', 'upload-svc', ConnectionType.SYNC_HTTP),
        edge('lb-stream', 'lb', 'stream-svc', ConnectionType.SYNC_HTTP),
        edge('lb-meta', 'lb', 'meta-svc', ConnectionType.SYNC_HTTP),
        edge('upload-obj', 'upload-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('upload-q', 'upload-svc', 'transcode-q', ConnectionType.ASYNC_QUEUE),
        edge('q-worker', 'transcode-q', 'transcode-worker', ConnectionType.ASYNC_QUEUE),
        edge('worker-obj', 'transcode-worker', 'object-store', ConnectionType.DB_WRITE),
        edge('worker-es', 'transcode-worker', 'es', ConnectionType.DB_WRITE),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('meta-redis', 'meta-svc', 'redis-meta', ConnectionType.CACHE_READ),
        edge('meta-pg', 'meta-svc', 'postgres', ConnectionType.DB_READ),
        edge('stream-redis', 'stream-svc', 'redis-meta', ConnectionType.CACHE_READ),
        edge('stream-events', 'stream-svc', 'kafka-events', ConnectionType.ASYNC_STREAM),
        edge('events-analytics', 'kafka-events', 'analytics-svc', ConnectionType.ASYNC_STREAM),
        edge('analytics-pg', 'analytics-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('svc-prom', 'stream-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The YouTube-scale video platform separates the upload/transcoding pipeline from the playback and discovery paths. Raw video uploads go directly to Object Storage through the Upload Service; the Transcode Queue distributes encoding jobs to a horizontally-scalable worker pool that produces HLS/DASH segments in multiple resolutions and writes them back to Object Storage. All video segment delivery is mediated by the CDN, which caches immutable segments with long TTLs, providing the egress capacity to sustain 1 Tbps peak without overloading origin.

## Key Design Decisions

Kafka is used for two distinct event flows: the transcoding job queue (reliable job delivery with at-least-once semantics) and the view/interaction event stream (high-throughput analytics ingestion). The Metadata Service caches video metadata in Redis to serve watch-page requests at sub-10ms latency. Elasticsearch provides the search index, updated by a transcoding-complete event, ensuring new videos appear in search within 60 seconds of upload completion. View counts are accumulated in the Analytics Service from the Kafka stream and periodically flushed to PostgreSQL, avoiding hot-row contention on the primary DB.

## Scalability & Trade-offs

The transcoding worker pool is the capacity planning lever — each 1080p encode takes roughly 2× real-time, so 2,000 concurrent jobs handle ~500 hours/minute of uploads with comfortable headroom. The CDN cache-hit ratio is the key availability lever for playback; a CDN miss falls back to Object Storage which can sustain 10K concurrent GET requests per bucket. The main trade-off is the eventual consistency of view counts in analytics — creators see counts that are up to 30 seconds stale, which is acceptable given the engineering complexity avoided by using an async aggregation pipeline instead of synchronous counter increments.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 04 Twitter / Social Feed at Scale ────────────────────────────────────
  {
    id: 'twitter-feed',
    title: 'Twitter / Social Feed at Scale',
    description:
      'Design a microblogging platform where users post short messages, follow each other, and receive a reverse-chronological or algorithmic home timeline. Handle celebrity accounts with hundreds of millions of followers.',
    difficulty: 'advanced',
    category: 'social',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can post tweets up to 280 characters, including images and links',
      'Users can follow and unfollow other users',
      'Home timeline shows tweets from followed accounts, newest-first',
      'Users can reply to, retweet, and like tweets',
      'Trending topics are computed globally and per country every 5 minutes',
      'Full-text search across all public tweets with recency-boosted ranking',
      'User mentions (@username) trigger notifications to the mentioned user',
      'Verified accounts and algorithmic amplification affect timeline ranking',
      'DM (direct messages) between users with end-to-end read receipts',
    ],
    nonFunctionalRequirements: [
      '400M DAU; 500M tweets posted per day',
      'Timeline read latency < 100ms at p99',
      'Tweet write fanout to all followers within 5 seconds for regular accounts',
      '99.99% availability on read paths',
      'Search index staleness < 30 seconds after tweet creation',
      'Trend calculation window: 5-minute rolling aggregation',
    ],
    constraints: [
      'Celebrity accounts (>1M followers) use fan-out on read to avoid write amplification',
      'Timelines are pre-computed in a Redis timeline cache for the most active users',
      'Search must support Boolean operators and phrase matching',
    ],
    hints: [
      'The home timeline is the hardest read problem — designing the fanout strategy (write vs read) is the core of this system.',
      'For celebrity fanout, pre-computing 100M feed writes per tweet is infeasible. Consider a hybrid: write fanout for regular accounts, read-time merge for celebrity tweets.',
      'Trending topics require a real-time count aggregation over a sliding window — a stream processing layer consuming tweet events works well.',
      'Redis sorted sets are a natural fit for timeline storage: tweet IDs sorted by timestamp, with O(log N) insert and O(K) range reads.',
      'DMs are a separate read/write path from the public timeline — model them as a conversation entity with message records rather than grafting them onto the tweet model.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('tweet-svc', 'Tweet Service', 'generic_microservice', ComponentCategory.Compute, 700, 200),
        node('fanout-svc', 'Fanout Service', 'generic_microservice', ComponentCategory.Compute, 700, 400),
        node('timeline-svc', 'Timeline Service', 'generic_microservice', ComponentCategory.Compute, 700, 600),
        node('search-svc', 'Search Service', 'generic_microservice', ComponentCategory.Compute, 700, 800),
        node('redis-timeline', 'Timeline Cache', 'generic_redis', ComponentCategory.Database, 960, 500),
        node('postgres', 'Tweet DB', 'generic_postgresql', ComponentCategory.Database, 960, 250),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 960, 800),
        node('kafka', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 960, 400),
        node('trend-svc', 'Trending Service', 'generic_microservice', ComponentCategory.Compute, 1200, 400),
        node('redis-trends', 'Trends Cache', 'generic_redis', ComponentCategory.Database, 1200, 600),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 200),
        node('tracing', 'Distributed Tracing', 'generic_distributed_tracing', ComponentCategory.Observability, 480, 900),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-tweet', 'lb', 'tweet-svc', ConnectionType.SYNC_HTTP),
        edge('lb-timeline', 'lb', 'timeline-svc', ConnectionType.SYNC_HTTP),
        edge('lb-search', 'lb', 'search-svc', ConnectionType.SYNC_HTTP),
        edge('tweet-pg', 'tweet-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('tweet-kafka', 'tweet-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-fanout', 'kafka', 'fanout-svc', ConnectionType.ASYNC_STREAM),
        edge('fanout-redis', 'fanout-svc', 'redis-timeline', ConnectionType.CACHE_WRITE),
        edge('timeline-redis', 'timeline-svc', 'redis-timeline', ConnectionType.CACHE_READ),
        edge('timeline-pg', 'timeline-svc', 'postgres', ConnectionType.DB_READ),
        edge('kafka-trend', 'kafka', 'trend-svc', ConnectionType.ASYNC_STREAM),
        edge('trend-redis', 'trend-svc', 'redis-trends', ConnectionType.CACHE_WRITE),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('kafka-es', 'kafka', 'es', ConnectionType.ASYNC_STREAM),
        edge('search-es', 'search-svc', 'es', ConnectionType.DB_READ),
        edge('tweet-tracing', 'tweet-svc', 'tracing', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Twitter-scale microblogging system is dominated by the fanout problem: a single write (posting a tweet) must be reflected in potentially hundreds of millions of follower timelines. The system is structured around an event-driven core — the Tweet Service writes to PostgreSQL and publishes to Kafka; all downstream side effects (fanout, search indexing, notifications, trend computation) are consumers of that stream.

## Key Design Decisions

For regular accounts (< 1M followers), the Fanout Service consumes tweet events from Kafka and writes tweet IDs into per-user Redis sorted sets (timeline caches), scored by tweet timestamp. This pre-computation means timeline reads are O(K) Redis range queries — fast enough for < 100ms p99. For celebrity accounts, the Fanout Service skips the write-time expansion; instead, the Timeline Service merges celebrity tweets at read time, fetching them from PostgreSQL and splicing into the cached timeline. Trending topics use a sliding 5-minute window over the Kafka event stream; the Trending Service maintains a count-min sketch per country and globally, writing aggregated results to a Redis hash every 5 minutes. Search is powered by Elasticsearch, updated within 30 seconds via a direct Kafka consumer.

## Scalability & Trade-offs

The fundamental trade-off is write amplification vs read latency. Fan-out on write delivers sub-100ms timelines but makes celebrity tweets expensive to distribute. The hybrid model caps write fan-out at ~1M followers per tweet; beyond that, read-time merging adds ~20ms of latency but is far cheaper. The Redis timeline cache is the biggest operational risk — a cold cache after a failure means falling back to PostgreSQL for timeline assembly, which can cause a read thundering herd. Warming strategies (LRU eviction with active warm-up) and read-through caching mitigate this.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 05 Slack / Real-time Messaging ───────────────────────────────────────
  {
    id: 'slack',
    title: 'Slack / Real-time Messaging',
    description:
      'Design a team collaboration platform where users send messages in channels and DMs, receive messages in real-time, search across message history, and receive notifications across devices.',
    difficulty: 'advanced',
    category: 'real-time',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can send and receive messages in channels (public and private) and DMs',
      'Messages are delivered in real-time to all online channel members',
      'Message history is searchable across all channels a user has access to',
      'Users can upload files and share them in channels; previews are shown inline',
      'Reactions (emoji) can be added to any message',
      'Users can set status (active, away, DND) visible to workspace members',
      'Push notifications for mentions and DMs are delivered to mobile devices',
      'Message threading: users can reply in-thread without cluttering the main channel',
      'Workspace admin can configure retention policies (delete messages after N days)',
    ],
    nonFunctionalRequirements: [
      '20M DAU across 600K workspaces',
      'Message delivery latency < 100ms at p99 for online recipients',
      'Search latency < 500ms at p95',
      '99.99% availability on message delivery',
      'Message storage: 10B messages per year retained',
      'File storage: 1 PB total across all workspaces',
    ],
    constraints: [
      'Messages within a workspace are tenanted — strict data isolation per workspace',
      'WebSocket connections are maintained per client for real-time delivery',
      'E2E encryption for DMs is an optional workspace setting, not the default',
    ],
    hints: [
      'Real-time delivery requires persistent connections — WebSockets are the standard choice. How do you route a message to all WebSocket connections for a channel?',
      'A Pub/Sub system (one topic per channel) lets message servers subscribe only to channels that have active connections on that server, avoiding broadcast to all servers.',
      'Message storage is append-only with high read fan-out — a time-series partitioned table or Cassandra-style wide-row model suits this access pattern well.',
      'File uploads should follow the same pattern as photo sharing: upload to object storage, async thumbnail/preview generation, serve via CDN.',
      'Search across billions of messages requires a dedicated search index (Elasticsearch) populated asynchronously from the write path.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 600),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('msg-svc', 'Message Service', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('ws-svc', 'WebSocket Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('file-svc', 'File Service', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('search-svc', 'Search Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('kafka', 'Kafka', 'generic_kafka', ComponentCategory.Messaging, 960, 300),
        node('redis-presence', 'Presence Cache', 'generic_redis', ComponentCategory.Database, 960, 500),
        node('postgres', 'Message DB', 'generic_postgresql', ComponentCategory.Database, 960, 700),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 960, 900),
        node('object-store', 'Object Storage', 'generic_object_storage', ComponentCategory.Storage, 1200, 700),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 300),
        node('log-agg', 'Log Aggregator', 'generic_log_aggregator', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('mob-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-msg', 'lb', 'msg-svc', ConnectionType.SYNC_HTTP),
        edge('lb-ws', 'lb', 'ws-svc', ConnectionType.SYNC_HTTP),
        edge('lb-file', 'lb', 'file-svc', ConnectionType.SYNC_HTTP),
        edge('lb-search', 'lb', 'search-svc', ConnectionType.SYNC_HTTP),
        edge('msg-pg', 'msg-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('msg-kafka', 'msg-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-ws', 'kafka', 'ws-svc', ConnectionType.ASYNC_STREAM),
        edge('kafka-es', 'kafka', 'es', ConnectionType.ASYNC_STREAM),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('ws-redis', 'ws-svc', 'redis-presence', ConnectionType.CACHE_READ),
        edge('search-es', 'search-svc', 'es', ConnectionType.DB_READ),
        edge('file-obj', 'file-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('msg-log', 'msg-svc', 'log-agg', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Slack-scale real-time messaging system has two distinct delivery paths: synchronous REST for message persistence and asynchronous WebSocket delivery for real-time receipt. When a user sends a message, the Message Service writes it durably to PostgreSQL and publishes to Kafka. The WebSocket Service consumes from Kafka topic partitions corresponding to active channels and pushes the message to all open WebSocket connections on that server. User presence (online/away/DND) is maintained in a Redis cache updated via heartbeat pings.

## Key Design Decisions

Kafka topics are partitioned by workspace ID, ensuring workspace-level data locality and allowing the WebSocket Service cluster to subscribe only to partitions that have active connections. This avoids the O(N servers) broadcast problem. File uploads follow an async pattern: the File Service writes the raw file to Object Storage, returns a signed URL to the client, and enqueues a thumbnail generation job. The CDN serves all file previews. Search is powered by Elasticsearch with a near-real-time indexing pipeline: Kafka → Elasticsearch consumer, with per-workspace index routing for tenant isolation. Retention policies are enforced by a nightly TTL job that hard-deletes records from PostgreSQL past the workspace retention window.

## Scalability & Trade-offs

The WebSocket layer is the statefulness challenge — a connection to one server must receive messages from any other server. Kafka solves this via Pub/Sub: all WebSocket servers subscribe to all relevant Kafka partitions. The trade-off is Kafka consumer lag; at very high write throughput (>100K msg/sec per workspace), lag can push delivery beyond the 100ms SLA. Kafka consumer group partitioning limits parallelism, so workspaces with extreme throughput need their own dedicated Kafka partition set. The presence cache using Redis is eventually consistent — a user who closes their laptop without sending a goodbye heartbeat will appear online for up to 30 seconds, which is an acceptable UX trade-off.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 06 Google Docs / Collaborative Editing ───────────────────────────────
  {
    id: 'google-docs',
    title: 'Google Docs / Collaborative Editing',
    description:
      'Design a real-time collaborative document editor where multiple users can edit the same document simultaneously, see each other\'s cursors and changes instantly, and maintain a consistent document state without conflicts.',
    difficulty: 'advanced',
    category: 'real-time',
    company: null,
    timeLimit: 50,
    requirements: [
      'Multiple users can edit the same document simultaneously with < 100ms perceived latency',
      'Changes from one user are propagated to all other editors in real-time',
      'Operational Transformation (OT) or CRDT ensures convergent document state across all clients',
      'Full document revision history is maintained and any version can be restored',
      'Documents support rich text: bold, italic, headings, lists, tables, images',
      'Offline editing is supported; changes sync when connectivity is restored',
      'Document access control: owner, editor, commenter, viewer roles',
      'Comments and suggestions can be added inline without modifying the base text',
      'Documents can be exported as PDF, DOCX, and plain text',
    ],
    nonFunctionalRequirements: [
      '1B documents; 50M concurrent editing sessions at peak',
      'Operation propagation latency < 100ms at p99',
      '99.99% availability on document reads',
      'Document storage: average 100 KB per document, 100 TB total',
      'Revision history retained indefinitely; snapshot compression after 30 days',
      'Conflict resolution must converge to identical state across all clients',
    ],
    constraints: [
      'Operational Transformation requires a central server to sequence operations — purely peer-to-peer is not viable at this scale',
      'Document state must not be lost even if a user\'s browser crashes mid-edit',
      'Export operations are CPU-intensive and must be queued, not inline',
    ],
    hints: [
      'The core challenge is convergence — two users typing at position 5 simultaneously. Operational Transformation transforms operations relative to each other before applying.',
      'A single OT server per document shard provides the total ordering needed for OT; CRDT-based approaches can distribute ordering but are more complex to implement.',
      'Revision history can be stored as a sequence of operations (op log) rather than full document snapshots — snapshots are created periodically for fast restore.',
      'WebSockets per document session are needed for sub-100ms propagation; a Pub/Sub layer routes operations from the OT server to all connected clients.',
      'Access control checks happen at the API Gateway layer before any operation is accepted; role resolution can be cached in Redis per (user, document) pair.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('ot-svc', 'OT Server', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('doc-svc', 'Document Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('export-svc', 'Export Service', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('collab-svc', 'Collab Session Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('redis-session', 'Session Cache', 'generic_redis', ComponentCategory.Database, 960, 400),
        node('redis-doc', 'Doc State Cache', 'generic_redis', ComponentCategory.Database, 960, 600),
        node('postgres', 'Document DB', 'generic_postgresql', ComponentCategory.Database, 960, 800),
        node('object-store', 'Op Log Storage', 'generic_object_storage', ComponentCategory.Storage, 1200, 800),
        node('export-q', 'Export Queue', 'generic_message_queue', ComponentCategory.Messaging, 960, 250),
        node('kafka', 'Kafka (Op Stream)', 'generic_kafka', ComponentCategory.Messaging, 1200, 400),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-ot', 'lb', 'ot-svc', ConnectionType.SYNC_HTTP),
        edge('lb-doc', 'lb', 'doc-svc', ConnectionType.SYNC_HTTP),
        edge('lb-export', 'lb', 'export-svc', ConnectionType.SYNC_HTTP),
        edge('lb-collab', 'lb', 'collab-svc', ConnectionType.SYNC_HTTP),
        edge('ot-redis-session', 'ot-svc', 'redis-session', ConnectionType.CACHE_READ),
        edge('ot-redis-doc', 'ot-svc', 'redis-doc', ConnectionType.CACHE_WRITE),
        edge('ot-kafka', 'ot-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-collab', 'kafka', 'collab-svc', ConnectionType.ASYNC_STREAM),
        edge('doc-pg', 'doc-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('doc-obj', 'doc-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('export-q-svc', 'export-svc', 'export-q', ConnectionType.ASYNC_QUEUE),
        edge('export-obj', 'export-svc', 'object-store', ConnectionType.DB_READ),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('ot-prom', 'ot-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

Collaborative editing requires a central sequencing authority — the OT Server — that receives all edit operations for a document shard, applies them in order using Operational Transformation, and fans out the transformed operations to all connected clients via Kafka. Each client maintains a local shadow copy of the document and applies incoming operations in the order the OT Server assigns them, guaranteeing convergence.

## Key Design Decisions

The OT Server holds an in-memory copy of the active document state in Redis (Doc State Cache) for fast sequential operation application. Operations are also written to an op log in Object Storage as the source of truth for revision history. Full document snapshots are written to PostgreSQL periodically (every 100 operations) to allow fast document loads without replaying the entire op log. Collaborative session metadata (who is in which document, cursor positions) is maintained in a separate Redis instance. Export requests are queued via a Message Queue and processed by the Export Service asynchronously, reading the current document snapshot from PostgreSQL and returning a signed Object Storage URL when complete.

## Scalability & Trade-offs

The OT Server is stateful by design — each document is pinned to one OT server instance for the lifetime of the editing session. This limits horizontal scalability to the number of document shards, not the number of requests. At 50M concurrent sessions, 10K OT server instances each handling 5K active sessions is achievable with careful resource allocation (each session uses < 1 MB of memory for the in-flight op buffer). The key risk is OT server failure mid-session; Redis persistence and a warm-standby OT replica ensure that on failover, in-flight operations are not lost and the new primary can resume from the last committed state.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 07 Spotify / Music Streaming ─────────────────────────────────────────
  {
    id: 'spotify',
    title: 'Spotify / Music Streaming',
    description:
      'Design a music streaming platform where users discover and listen to songs, albums, and playlists, receive personalised recommendations, and enjoy offline playback, all while artists can access streaming analytics.',
    difficulty: 'advanced',
    category: 'streaming',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can search for songs, albums, artists, and playlists',
      'Audio streams are delivered with gapless playback and adaptive bitrate (96/160/320 kbps)',
      'Users can create, edit, and share playlists',
      'Personalised "Discover Weekly" recommendations are generated weekly per user',
      'Offline mode: users can download up to 10,000 tracks for offline listening',
      'Artist profiles show bio, discography, and monthly listener counts',
      'Lyrics are displayed in sync with playback (time-synced LRC format)',
      'Social features: follow friends, see what they\'re listening to (Friend Activity)',
      'Podcast support: episode streaming, progress tracking, and new-episode notifications',
    ],
    nonFunctionalRequirements: [
      '456M MAU, 206M Premium subscribers',
      'Audio stream start latency < 500ms at p95',
      'CDN cache-hit rate > 95% for top 10K tracks',
      '99.95% availability on the streaming path',
      'Recommendation pipeline: weekly batch for all users, completed within 24 hours',
      'Search response time < 200ms at p99',
    ],
    constraints: [
      'Audio files are DRM-encrypted per-user session for Premium content',
      'Free-tier users receive audio ads injected between tracks server-side',
      'Recommendation model training runs on the data warehouse, not the production DB',
    ],
    hints: [
      'Audio streaming and metadata serving are completely separate concerns — design them independently.',
      'The CDN is the critical piece for < 500ms stream start: pre-warm the top 10K tracks at all edges. What happens on a CDN miss?',
      'Recommendations at 456M user scale require an offline batch pipeline — a streaming real-time model is not cost-effective for weekly personalization.',
      'Offline downloads are essentially a sync problem: the client requests a list of encrypted audio files and tracks which ones are cached locally.',
      'For DRM, the client requests a per-session decryption key from a license server after authentication; the audio file itself is stored encrypted in object storage.',
    ],
    starterCanvas: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('stream-svc', 'Streaming Service', 'generic_microservice', ComponentCategory.Compute, 700, 200),
        node('catalog-svc', 'Catalog Service', 'generic_microservice', ComponentCategory.Compute, 700, 400),
        node('rec-svc', 'Recommendation Service', 'generic_microservice', ComponentCategory.Compute, 700, 600),
        node('search-svc', 'Search Service', 'generic_microservice', ComponentCategory.Compute, 700, 800),
        node('object-store', 'Audio Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 200),
        node('redis-catalog', 'Catalog Cache', 'generic_redis', ComponentCategory.Database, 960, 450),
        node('postgres', 'Catalog DB', 'generic_postgresql', ComponentCategory.Database, 960, 650),
        node('es', 'Elasticsearch', 'generic_elasticsearch', ComponentCategory.Database, 960, 850),
        node('kafka-events', 'Play Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 450),
        node('data-wh', 'Data Warehouse', 'generic_data_warehouse', ComponentCategory.Database, 1200, 650),
        node('grafana', 'Grafana', 'generic_grafana', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('m-cdn', 'mobile', 'cdn', ConnectionType.SYNC_HTTP),
        edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-stream', 'lb', 'stream-svc', ConnectionType.SYNC_HTTP),
        edge('lb-catalog', 'lb', 'catalog-svc', ConnectionType.SYNC_HTTP),
        edge('lb-rec', 'lb', 'rec-svc', ConnectionType.SYNC_HTTP),
        edge('lb-search', 'lb', 'search-svc', ConnectionType.SYNC_HTTP),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('stream-obj', 'stream-svc', 'object-store', ConnectionType.DB_READ),
        edge('catalog-redis', 'catalog-svc', 'redis-catalog', ConnectionType.CACHE_READ),
        edge('catalog-pg', 'catalog-svc', 'postgres', ConnectionType.DB_READ),
        edge('search-es', 'search-svc', 'es', ConnectionType.DB_READ),
        edge('stream-kafka', 'stream-svc', 'kafka-events', ConnectionType.ASYNC_STREAM),
        edge('kafka-dw', 'kafka-events', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('rec-dw', 'rec-svc', 'data-wh', ConnectionType.DB_READ),
        edge('rec-redis', 'rec-svc', 'redis-catalog', ConnectionType.CACHE_WRITE),
        edge('svc-grafana', 'stream-svc', 'grafana', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Spotify-scale music streaming system is divided into the hot path (streaming + catalog lookups) and the cold path (recommendations + analytics). The hot path must deliver audio bytes to 456M users with < 500ms start latency; the cold path runs batch jobs weekly to generate personalised playlists. All audio delivery is via CDN-backed Object Storage; the CDN serves as both a cache and the primary delivery network for top tracks.

## Key Design Decisions

Audio files are stored encrypted in Object Storage. On play request, the Streaming Service validates the user's subscription tier via the Auth Server, generates a time-limited signed URL (or a DRM session key for Premium), and returns it to the client. The client fetches audio directly from CDN, not through the application servers, eliminating the streaming service as a bandwidth bottleneck. Play events are published to Kafka and consumed by both the Data Warehouse (for artist analytics) and the Recommendation Service offline batch pipeline. Catalog metadata (track info, artwork URLs) is cached in Redis with a 24-hour TTL to absorb the high read fan-out without hitting PostgreSQL on every request.

## Scalability & Trade-offs

The CDN cache-hit rate for audio is the most critical performance metric. With a Zipf distribution of listening patterns, the top 10K tracks represent ~80% of all plays. Pre-warming these tracks at all CDN edges ensures near-100% cache hits for the majority of traffic. Cache misses (new or rare tracks) fall back to Object Storage with a ~50ms origin fetch penalty, acceptable given the pre-buffering the client performs. The recommendation batch pipeline reads from the Data Warehouse, not from the production PostgreSQL, ensuring that heavy ML workloads do not impact serving latency.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 08 Amazon / E-commerce Checkout at Scale ─────────────────────────────
  {
    id: 'amazon-checkout',
    title: 'Amazon / E-commerce Checkout at Scale',
    description:
      'Design the checkout and order processing system for a large e-commerce platform, handling cart management, inventory reservation, payment processing, and order fulfillment orchestration at peak load (Prime Day).',
    difficulty: 'advanced',
    category: 'e-commerce',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can add, remove, and update items in a persistent shopping cart',
      'Checkout flow: cart review → address selection → payment → order confirmation',
      'Inventory is reserved at checkout initiation and released if payment fails',
      'Payment processing supports credit/debit cards, gift cards, and stored payment methods',
      'Order is created and a confirmation with estimated delivery date is returned within 3 seconds',
      'Order status transitions: placed → payment-confirmed → picking → shipped → delivered',
      'Customers can cancel an order before it enters the picking state',
      'Fraud detection runs synchronously before payment confirmation',
      'Inventory levels are updated in real-time and show as "X left in stock" on product pages',
    ],
    nonFunctionalRequirements: [
      'Peak: 1M orders per hour (Prime Day surge)',
      'Checkout latency < 3 seconds end-to-end at p95',
      '99.999% durability on order records',
      '99.99% availability on the checkout path',
      'Inventory update propagation < 1 second to product pages',
      'Payment processing idempotency: exactly-once semantics despite retries',
    ],
    constraints: [
      'Inventory reservation must use optimistic locking to avoid overselling',
      'Payment processing is delegated to an external payment gateway; the system must handle gateway timeouts gracefully',
      'Order state machine transitions must be durable and recoverable after crashes',
    ],
    hints: [
      'The checkout flow is a distributed transaction — cart, inventory, payment, and order creation must all succeed or all roll back. Saga pattern is the standard solution.',
      'Inventory reservation with optimistic locking: read the current stock count, attempt an update with a WHERE quantity >= requested condition, retry on conflict.',
      'Payment idempotency requires a unique idempotency key per checkout attempt so that network retries do not result in double charges.',
      'Order state machine persistence in a durable queue (Kafka or a transactional outbox) ensures that a crash mid-fulfillment does not lose the order.',
      'Fraud detection is on the critical path — it must be fast (< 500ms) or it will blow the 3-second SLA. Pre-computed risk scores cached per user help.',
    ],
    starterCanvas: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('browser', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('rate-limiter', 'Rate Limiter', 'generic_rate_limiter', ComponentCategory.Security, 260, 650),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 800),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('cart-svc', 'Cart Service', 'generic_microservice', ComponentCategory.Compute, 700, 200),
        node('checkout-svc', 'Checkout Orchestrator', 'generic_microservice', ComponentCategory.Compute, 700, 400),
        node('inventory-svc', 'Inventory Service', 'generic_microservice', ComponentCategory.Compute, 700, 600),
        node('order-svc', 'Order Service', 'generic_microservice', ComponentCategory.Compute, 700, 800),
        node('fraud-svc', 'Fraud Detection', 'generic_microservice', ComponentCategory.Compute, 700, 1000),
        node('redis-cart', 'Cart Cache', 'generic_redis', ComponentCategory.Database, 960, 200),
        node('postgres-inv', 'Inventory DB', 'generic_postgresql', ComponentCategory.Database, 960, 500),
        node('postgres-ord', 'Order DB', 'generic_postgresql', ComponentCategory.Database, 960, 750),
        node('kafka', 'Order Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 300),
        node('tracing', 'Distributed Tracing', 'generic_distributed_tracing', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-rl', 'api-gw', 'rate-limiter', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-cart', 'lb', 'cart-svc', ConnectionType.SYNC_HTTP),
        edge('lb-checkout', 'lb', 'checkout-svc', ConnectionType.SYNC_HTTP),
        edge('cart-redis', 'cart-svc', 'redis-cart', ConnectionType.CACHE_WRITE),
        edge('checkout-inv', 'checkout-svc', 'inventory-svc', ConnectionType.SYNC_GRPC),
        edge('checkout-fraud', 'checkout-svc', 'fraud-svc', ConnectionType.SYNC_GRPC),
        edge('checkout-order', 'checkout-svc', 'order-svc', ConnectionType.SYNC_GRPC),
        edge('inv-pg', 'inventory-svc', 'postgres-inv', ConnectionType.DB_WRITE),
        edge('order-pg', 'order-svc', 'postgres-ord', ConnectionType.DB_WRITE),
        edge('order-kafka', 'order-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('checkout-tracing', 'checkout-svc', 'tracing', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Amazon-scale checkout system is structured as a Saga orchestration pattern: the Checkout Orchestrator drives a sequence of compensating transactions across the Cart, Inventory, Fraud Detection, and Order services. Each step is executed synchronously via gRPC for low latency; if any step fails, the orchestrator issues compensating calls (e.g., release the inventory reservation) to maintain consistency without a distributed two-phase commit.

## Key Design Decisions

The Cart Service stores cart state in Redis for fast read/write at high concurrency; carts are also persisted to a backing store for cross-device sync. Inventory reservation uses optimistic locking in PostgreSQL: the Inventory Service issues an UPDATE SET quantity = quantity - N WHERE quantity >= N, which atomically fails if stock is insufficient. This avoids pessimistic locks that would serialize all checkout attempts. Fraud Detection is a synchronous gRPC call from the Checkout Orchestrator with a 500ms timeout; a timeout triggers a fallback to a lower-confidence pre-computed risk score from cache. Order records are written to PostgreSQL and an event is published to Kafka, which triggers the notification pipeline and downstream fulfillment systems. The Rate Limiter protects the checkout path from bot-driven surge abuse during flash sales.

## Scalability & Trade-offs

The primary scalability lever during Prime Day is horizontal scaling of the Checkout Orchestrator and per-service replicas behind the Load Balancer. The Inventory DB is the most likely bottleneck: hot-item checkouts create write contention on the same row. Mitigation strategies include inventory partitioning (splitting stock across multiple rows and aggregating on read) and write coalescing (batching decrement operations). The trade-off is slightly stale inventory counts on product pages, acceptable given a 1-second propagation SLA. Payment idempotency is enforced by embedding the checkout session ID as the idempotency key in payment gateway requests, ensuring retries after gateway timeouts do not result in duplicate charges.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 09 Zoom / Video Conferencing ─────────────────────────────────────────
  {
    id: 'zoom',
    title: 'Zoom / Video Conferencing',
    description:
      'Design a video conferencing platform supporting large meetings (up to 1,000 participants), real-time audio/video mixing, screen sharing, chat, and recording, with low-latency media delivery across geographically distributed participants.',
    difficulty: 'advanced',
    category: 'real-time',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can start or join a meeting via a unique meeting ID or link',
      'Real-time audio and video streams from up to 1,000 participants',
      'The platform performs Selective Forwarding Unit (SFU) routing — media is forwarded, not decoded/re-encoded centrally',
      'Screen sharing is supported with full 30fps resolution',
      'In-meeting chat with file sharing',
      'Meeting recording is available, stored to cloud, and downloadable after the meeting',
      'Waiting room holds participants until the host admits them',
      'Breakout rooms: participants can be split into sub-meetings and recalled',
      'Meeting transcription is generated asynchronously after the meeting ends',
    ],
    nonFunctionalRequirements: [
      '300M DAU, 3.3 trillion minutes of meetings per year',
      'Audio latency < 150ms end-to-end between participants',
      'Video latency < 400ms for active speaker delivery',
      '99.9% availability on meeting join',
      'SFU must handle 10,000 concurrent meeting rooms per media server cluster',
      'Recording storage: 500 TB/day',
    ],
    constraints: [
      'UDP is used for media transport (WebRTC); TCP fallback for restrictive networks',
      'Media servers must be co-located near participants to minimise latency',
      'E2E encryption is optional; SFU-based E2E encryption requires per-participant key negotiation',
    ],
    hints: [
      'Media routing and signalling are separate concerns — design the signalling plane (meeting join/leave, participant list) before the media plane.',
      'SFU vs MCU: SFU forwards individual streams to each subscriber; MCU mixes them server-side. SFU scales better because it avoids transcoding on the server.',
      'Media servers need to be geographically distributed — a participant in Tokyo should connect to a Tokyo media server, not one in Virginia.',
      'Meeting state (participant list, host, waiting room) needs to be shared across signalling servers — Redis is a natural fit for this ephemeral shared state.',
      'Recording is async: media is captured by the SFU, written to object storage as raw segments, and assembled/transcoded after the meeting ends.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 400),
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 600),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('signal-svc', 'Signalling Service', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('meeting-svc', 'Meeting Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('sfu', 'SFU Media Server', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('record-svc', 'Recording Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('redis-meeting', 'Meeting State Cache', 'generic_redis', ComponentCategory.Database, 960, 400),
        node('postgres', 'Meeting DB', 'generic_postgresql', ComponentCategory.Database, 960, 600),
        node('object-store', 'Recording Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 900),
        node('transcode-q', 'Transcode Queue', 'generic_message_queue', ComponentCategory.Messaging, 1200, 800),
        node('kafka', 'Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.SYNC_HTTP),
        edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('mob-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-signal', 'lb', 'signal-svc', ConnectionType.SYNC_HTTP),
        edge('lb-meeting', 'lb', 'meeting-svc', ConnectionType.SYNC_HTTP),
        edge('signal-redis', 'signal-svc', 'redis-meeting', ConnectionType.CACHE_READ),
        edge('meeting-redis', 'meeting-svc', 'redis-meeting', ConnectionType.CACHE_WRITE),
        edge('meeting-pg', 'meeting-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('signal-sfu', 'signal-svc', 'sfu', ConnectionType.SYNC_GRPC),
        edge('meeting-kafka', 'meeting-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('sfu-record', 'sfu', 'record-svc', ConnectionType.SYNC_GRPC),
        edge('record-obj', 'record-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('record-q', 'record-svc', 'transcode-q', ConnectionType.ASYNC_QUEUE),
        edge('svc-prom', 'signal-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Zoom-scale video conferencing system separates two planes: the signalling plane (meeting creation, join/leave events, participant state) and the media plane (real-time audio/video forwarding via SFU). The signalling plane uses standard HTTP/WebSocket via the API Gateway and Load Balancer; the media plane uses WebRTC over UDP directly between clients and geographically-local SFU servers, bypassing the application servers entirely.

## Key Design Decisions

Meeting state (participant list, host, waiting room, breakout assignments) is maintained in Redis for fast read/write by multiple signalling server instances. The SFU (Selective Forwarding Unit) receives each participant's media stream and forwards it to all other subscribers without decoding or re-encoding — this means the server CPU cost scales with bandwidth, not with participant count squared. Recording is handled by a dedicated Recording Service that receives a copy of each media stream from the SFU, writes raw segments to Object Storage, and after the meeting ends, enqueues a transcoding job to produce the final MP4. The Event Stream (Kafka) captures meeting lifecycle events for analytics and downstream billing.

## Scalability & Trade-offs

The SFU is the hardest scaling challenge: 10,000 concurrent rooms with an average of 10 participants each means 100K concurrent WebRTC connections per media server cluster. SFU servers are horizontally scaled but are not stateless — each meeting is pinned to one SFU instance or a small cluster for the meeting duration. SFU failure mid-meeting causes a brief reconnection (5–10 seconds), which is the availability trade-off accepted by avoiding a more complex distributed SFU with state replication. Geo-distributed SFU deployment reduces media latency from 200ms+ (cross-continent) to < 50ms (local datacenter), which is the dominant factor in the 150ms audio latency budget.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 10 Google Maps / Location Services ───────────────────────────────────
  {
    id: 'google-maps',
    title: 'Google Maps / Location Services',
    description:
      'Design a global mapping and navigation platform that serves map tiles, provides turn-by-turn routing, shows real-time traffic conditions, and supports place search with reviews and business information.',
    difficulty: 'advanced',
    category: 'infrastructure',
    company: null,
    timeLimit: 50,
    requirements: [
      'Serve raster and vector map tiles at zoom levels 0–22 globally',
      'Provide turn-by-turn routing between two points with real-time traffic influence',
      'Display real-time traffic conditions (colour-coded speed on road segments)',
      'Place search: find businesses by name, category, and proximity',
      'Show business details: opening hours, photos, ratings, reviews',
      'ETA recalculation if user deviates from the planned route',
      'Offline maps: users can download a regional map for offline navigation',
      'Street View: 360° panoramic imagery at selected road locations',
      'Crowdsourced traffic updates: speed data from GPS-enabled users (15-second intervals)',
    ],
    nonFunctionalRequirements: [
      '1B MAU; 100M route requests per day',
      'Map tile serve latency < 50ms at p99 globally',
      'Route calculation latency < 500ms at p95',
      '99.999% availability on tile serving',
      'Traffic data ingestion: 500M GPS pings per day from active navigation sessions',
      'Place search latency < 200ms at p99',
    ],
    constraints: [
      'Map tile dataset is ~10 TB; served entirely from CDN edge caches',
      'Road graph has 1 billion edges; route calculation uses a variant of Dijkstra/A* with contraction hierarchies',
      'GPS probe data is anonymised before storage (no user-identifiable trajectories)',
    ],
    hints: [
      'Map tiles are static once generated — they are the most CDN-friendly content that exists. Focus on the tile generation and cache invalidation pipeline.',
      'Route calculation cannot run in a single process at 1B-edge graph scale; contraction hierarchies pre-process the graph into a hierarchy that makes queries fast.',
      'Traffic ingestion (500M pings/day) is a write-heavy stream — Kafka is ideal for ingestion with a stream processor computing speed aggregates per road segment.',
      'Place search requires both geospatial proximity queries and full-text matching — Elasticsearch with a geo_point field handles both in one query.',
      'Offline maps are large binary downloads (1–5 GB per region) — treat them like video: upload to object storage, serve via CDN with range requests.',
    ],
    starterCanvas: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('tile-svc', 'Tile Service', 'generic_microservice', ComponentCategory.Compute, 700, 200),
        node('route-svc', 'Routing Service', 'generic_microservice', ComponentCategory.Compute, 700, 400),
        node('traffic-svc', 'Traffic Service', 'generic_microservice', ComponentCategory.Compute, 700, 600),
        node('place-svc', 'Place Search Service', 'generic_microservice', ComponentCategory.Compute, 700, 800),
        node('object-store', 'Tile & Map Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 200),
        node('redis-route', 'Route Cache', 'generic_redis', ComponentCategory.Database, 960, 400),
        node('postgres-place', 'Place DB', 'generic_postgresql', ComponentCategory.Database, 960, 700),
        node('es', 'Place Search Index', 'generic_elasticsearch', ComponentCategory.Database, 960, 900),
        node('kafka-gps', 'GPS Ping Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('redis-traffic', 'Traffic Cache', 'generic_redis', ComponentCategory.Database, 1200, 700),
        node('metrics', 'Metrics Collector', 'generic_metrics_collector', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('m-cdn', 'mobile', 'cdn', ConnectionType.SYNC_HTTP),
        edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-tile', 'lb', 'tile-svc', ConnectionType.SYNC_HTTP),
        edge('lb-route', 'lb', 'route-svc', ConnectionType.SYNC_HTTP),
        edge('lb-traffic', 'lb', 'traffic-svc', ConnectionType.SYNC_HTTP),
        edge('lb-place', 'lb', 'place-svc', ConnectionType.SYNC_HTTP),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('tile-obj', 'tile-svc', 'object-store', ConnectionType.DB_READ),
        edge('route-redis', 'route-svc', 'redis-route', ConnectionType.CACHE_READ),
        edge('route-traffic', 'route-svc', 'redis-traffic', ConnectionType.CACHE_READ),
        edge('traffic-kafka', 'traffic-svc', 'kafka-gps', ConnectionType.ASYNC_STREAM),
        edge('kafka-redis-t', 'kafka-gps', 'redis-traffic', ConnectionType.CACHE_WRITE),
        edge('place-es', 'place-svc', 'es', ConnectionType.DB_READ),
        edge('place-pg', 'place-svc', 'postgres-place', ConnectionType.DB_READ),
        edge('svc-metrics', 'route-svc', 'metrics', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Google Maps platform is architecturally dominated by three distinct data sets with very different access patterns: static map tiles (read-only, CDN-served), the road graph (read-heavy, in-memory on routing servers), and real-time traffic (high write ingestion, low-latency read). Each is handled by a dedicated service with its own data layer, preventing the high write throughput of GPS ingestion from interfering with the low-latency read path for tile and route serving.

## Key Design Decisions

Map tiles are pre-rendered at all zoom levels and stored in Object Storage, served entirely through the CDN with cache-hit rates above 99%. The Routing Service loads a contraction hierarchy of the road graph into memory at startup; this allows sub-500ms route calculations on a 1-billion-edge graph by pre-computing shortcut edges offline. Real-time traffic data arrives as GPS pings via the Traffic Service into a Kafka stream; a stream processor aggregates pings by road segment every 30 seconds and writes speed scores to Redis. The Routing Service reads traffic scores from Redis at route calculation time to produce traffic-influenced ETAs. Place search combines Elasticsearch (for full-text + geo proximity) with PostgreSQL (for structured business data and reviews).

## Scalability & Trade-offs

Tile serving scales horizontally via CDN — the Tile Service itself rarely receives cache misses at zoom levels > 10. The Routing Service has a cold-start penalty of 2–5 minutes to load the road graph into memory; this means routing servers cannot be rapidly scaled during traffic spikes, so over-provisioning is the standard approach. The GPS ping ingestion pipeline is the write-heavy component: 500M pings/day = ~6K pings/sec, well within Kafka's capacity. The trade-off is that traffic scores are 30–60 seconds stale, which is acceptable for routing but means ETA predictions during rapidly changing conditions (accidents, events) can be off by 2–5 minutes.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 11 Dropbox / File Sync ────────────────────────────────────────────────
  {
    id: 'dropbox',
    title: 'Dropbox / File Sync',
    description:
      'Design a cloud file storage and synchronisation platform where users can upload files, sync them across multiple devices, share folders with collaborators, and access files via web and mobile.',
    difficulty: 'advanced',
    category: 'storage',
    company: null,
    timeLimit: 50,
    requirements: [
      'Users can upload files of any size (up to 1 TB per file) via chunked upload',
      'Files sync automatically across all devices when changes are detected',
      'File versioning: the last 180 days of file history is recoverable',
      'Folder sharing: users can share folders with view or edit permissions',
      'Deduplication: identical file content (by hash) is stored only once across all users',
      'Delta sync: only changed blocks of a file are uploaded on modification',
      'Conflict resolution: if two devices modify the same file offline, a conflict copy is created',
      'Selective sync: users can choose which folders to sync to each device',
      'File search by name across the user\'s entire Dropbox',
    ],
    nonFunctionalRequirements: [
      '700M registered users, 500M files stored',
      'Sync latency: file change reflected on all devices within 30 seconds',
      'Upload throughput: 1 Gbps aggregate across all clients',
      '99.99% durability on stored files (geo-replicated)',
      'Deduplication saves: target 30% storage reduction',
      'Metadata operation latency < 100ms at p99',
    ],
    constraints: [
      'Files are split into 4 MB blocks; each block is addressed by its SHA-256 hash',
      'Metadata (file tree, version history) is separate from block storage',
      'Sync protocol uses long-polling or WebSocket for change notifications to clients',
    ],
    hints: [
      'Split the problem into two planes: the metadata plane (file tree, version records) and the block plane (actual file content). They have very different access patterns.',
      'Content-addressable storage by block hash is the foundation of deduplication — if a block with hash X already exists, you skip the upload.',
      'Delta sync requires the client to compute a block-level diff between the old and new file versions; only changed blocks are uploaded.',
      'Change notification to online devices can use WebSockets or long-polling from the client to a notification service that receives events from the metadata write path.',
      'File versioning stores pointers to the block list for each version, not full copies — the block data is shared across versions.',
    ],
    starterCanvas: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('client', 'Web Browser', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 350),
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 550),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('upload-svc', 'Upload Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('meta-svc', 'Metadata Service', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('sync-svc', 'Sync Notification Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('share-svc', 'Sharing Service', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('object-store', 'Block Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 250),
        node('redis-meta', 'Metadata Cache', 'generic_redis', ComponentCategory.Database, 960, 500),
        node('postgres', 'Metadata DB', 'generic_postgresql', ComponentCategory.Database, 960, 700),
        node('kafka', 'Change Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 450),
        node('es', 'File Search Index', 'generic_elasticsearch', ComponentCategory.Database, 1200, 700),
        node('grafana', 'Grafana', 'generic_grafana', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.SYNC_HTTP),
        edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('mob-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-upload', 'lb', 'upload-svc', ConnectionType.SYNC_HTTP),
        edge('lb-meta', 'lb', 'meta-svc', ConnectionType.SYNC_HTTP),
        edge('lb-sync', 'lb', 'sync-svc', ConnectionType.SYNC_HTTP),
        edge('lb-share', 'lb', 'share-svc', ConnectionType.SYNC_HTTP),
        edge('upload-obj', 'upload-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('upload-meta', 'upload-svc', 'meta-svc', ConnectionType.SYNC_GRPC),
        edge('meta-pg', 'meta-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('meta-redis', 'meta-svc', 'redis-meta', ConnectionType.CACHE_WRITE),
        edge('meta-kafka', 'meta-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-sync', 'kafka', 'sync-svc', ConnectionType.ASYNC_STREAM),
        edge('kafka-es', 'kafka', 'es', ConnectionType.ASYNC_STREAM),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('meta-grafana', 'meta-svc', 'grafana', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

The Dropbox file sync system cleanly separates block storage from metadata management. Blocks (4 MB chunks of file content, addressed by SHA-256 hash) are stored in Object Storage; file metadata (file tree structure, version history, block manifests) is stored in PostgreSQL with a Redis cache in front for fast lookups. This separation allows the high-bandwidth block upload path to scale independently of the metadata path.

## Key Design Decisions

Content-addressable block storage enables global deduplication: before uploading a block, the client sends its hash to the Upload Service, which checks Object Storage. If the block already exists (as determined by the hash), the upload is skipped — the metadata record simply points to the existing block. This is the foundation of the 30% storage reduction target. When a file is modified, the client computes a block-level diff and uploads only changed blocks. The Metadata Service updates the file's block manifest and publishes a change event to Kafka. The Sync Notification Service consumes these events and pushes change notifications to all devices that have the affected folder in their sync scope (via WebSocket connections). File search is powered by Elasticsearch, populated asynchronously from the Kafka change stream.

## Scalability & Trade-offs

The deduplication check adds one round trip before each block upload, which slows upload throughput by ~20ms per block (for a typical file: ~5 ms overhead). The trade-off is justified by the storage savings and reduced bandwidth for re-uploads of the same content. The metadata DB (PostgreSQL) is the scalability bottleneck for large folder trees — a user with 10M files in a single account creates deep tree traversal queries. Sharding by user ID and aggressive Redis caching of frequently-accessed directory listings are the standard mitigations. Version history retains pointers to block manifests for 180 days; old block data is moved to cold storage after 6 months to reduce costs.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 12 WhatsApp / Encrypted Messaging ────────────────────────────────────
  {
    id: 'whatsapp',
    title: 'WhatsApp / Encrypted Messaging',
    description:
      'Design an end-to-end encrypted messaging platform supporting 1:1 and group chats, media sharing, voice and video calls, and reliable message delivery with offline queuing.',
    difficulty: 'advanced',
    category: 'real-time',
    company: null,
    timeLimit: 50,
    requirements: [
      'End-to-end encrypted 1:1 and group messaging using the Signal Protocol',
      'Messages are delivered in order; undelivered messages are queued for up to 30 days',
      'Read receipts: single tick (sent), double tick (delivered), blue ticks (read)',
      'Group chats support up to 1,024 members',
      'Voice and video calls with E2E encryption',
      'Media sharing: photos, videos, documents up to 100 MB',
      'Message status is synchronised across multiple devices per account (multi-device)',
      'Last seen and online status visible to contacts',
      'Disappearing messages: configurable auto-delete after 24h/7d/90d',
    ],
    nonFunctionalRequirements: [
      '2.5B MAU; 100B messages per day',
      'Message delivery latency < 100ms for online recipients',
      'Offline message queue: store undelivered messages for 30 days',
      '99.99% availability on message delivery',
      'End-to-end encrypted: server never has access to plaintext message content',
      'Push notification delivery within 5 seconds for offline users',
    ],
    constraints: [
      'Because messages are E2E encrypted, server-side search of message content is impossible',
      'WhatsApp\'s architecture avoids a relational DB for message storage; Erlang-based Ejabberd served as the original XMPP backbone',
      'Phone number is the primary identity; no username/password login',
    ],
    hints: [
      'E2E encryption means the server stores ciphertext only — design for this from the start. The server\'s job is delivery, not content processing.',
      'For offline message queuing, a per-user message queue (can be modelled as a list in Redis or a Cassandra partition) holds messages until the recipient device ACKs them.',
      'Group message fanout: for a 1,024-member group, one message creates 1,023 delivery tasks. The server must fan this out efficiently without blocking the sender.',
      'Multi-device sync requires a separate message copy per device, not per account — each device has its own key pair and receives its own encrypted copy.',
      'Read receipts create a write for every message read on the recipient side — these are high-frequency writes that should be batched and sent asynchronously.',
    ],
    starterCanvas: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 400),
        node('mobile2', 'Mobile Client (Recipient)', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 600),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Server', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('msg-svc', 'Message Service', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('delivery-svc', 'Delivery Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('group-svc', 'Group Service', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('media-svc', 'Media Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('key-svc', 'Key Distribution Service', 'generic_microservice', ComponentCategory.Compute, 700, 1100),
        node('redis-queue', 'Offline Queue (Redis)', 'generic_redis', ComponentCategory.Database, 960, 400),
        node('redis-presence', 'Presence Cache', 'generic_redis', ComponentCategory.Database, 960, 600),
        node('postgres', 'Account & Group DB', 'generic_postgresql', ComponentCategory.Database, 960, 800),
        node('object-store', 'Media Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 1000),
        node('kafka', 'Message Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 400),
        node('notif-svc', 'Push Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 600),
        node('cdn', 'CDN', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('metrics', 'Metrics Collector', 'generic_metrics_collector', ComponentCategory.Observability, 480, 1100),
      ],
      edges: [
        edge('m-cdn', 'mobile', 'cdn', ConnectionType.SYNC_HTTP),
        edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('m2-apigw', 'mobile2', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-msg', 'lb', 'msg-svc', ConnectionType.SYNC_HTTP),
        edge('lb-delivery', 'lb', 'delivery-svc', ConnectionType.SYNC_HTTP),
        edge('lb-group', 'lb', 'group-svc', ConnectionType.SYNC_HTTP),
        edge('lb-media', 'lb', 'media-svc', ConnectionType.SYNC_HTTP),
        edge('lb-key', 'lb', 'key-svc', ConnectionType.SYNC_HTTP),
        edge('msg-kafka', 'msg-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-delivery', 'kafka', 'delivery-svc', ConnectionType.ASYNC_STREAM),
        edge('delivery-redis-q', 'delivery-svc', 'redis-queue', ConnectionType.CACHE_WRITE),
        edge('delivery-redis-p', 'delivery-svc', 'redis-presence', ConnectionType.CACHE_READ),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('group-pg', 'group-svc', 'postgres', ConnectionType.DB_READ),
        edge('media-obj', 'media-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('key-pg', 'key-svc', 'postgres', ConnectionType.DB_READ),
        edge('svc-metrics', 'msg-svc', 'metrics', ConnectionType.HEALTH_CHECK),
        edge('group-kafka', 'group-svc', 'kafka', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Architecture Overview

The WhatsApp-scale E2E encrypted messaging system is designed around the invariant that the server only ever processes ciphertext. Plaintext never leaves the client device. The Message Service receives encrypted payloads and immediately publishes them to Kafka; the Delivery Service fans messages out to recipient devices, queuing in Redis when recipients are offline. The Key Distribution Service manages public key bundles (Signal Protocol pre-keys) so senders can establish E2E encryption sessions with offline recipients without waiting for a live connection.

## Key Design Decisions

Offline message queueing uses Redis lists per device ID, with a 30-day TTL. When a device comes online, it drains its queue in order, sends delivery ACKs back to the Message Service, and the server removes the messages. For group messages (up to 1,024 members), the Group Service retrieves the member list from PostgreSQL and publishes one delivery task per member to Kafka, allowing the Delivery Service to fan out asynchronously. This means a single group message creates 1,023 Kafka messages — at 100B messages/day with average group size 10, this is approximately 1T Kafka messages/day, requiring a high-throughput Kafka deployment with hundreds of partitions. Read receipts are batched by the client and sent as a single request every 5 seconds rather than per-message, reducing the write amplification on the receipt path.

## Scalability & Trade-offs

The primary scalability challenge is group message fanout. WhatsApp's approach in production uses a sender-key model for groups: one encrypted message is sent to the server per group, and the server distributes a single ciphertext to all members (since they all hold the same sender key). This reduces server fanout from O(N members) to O(1) per group message, dramatically reducing Kafka throughput requirements. The trade-off is that the sender-key model requires all group members to have received the current sender key before they can decrypt messages — a member who joins while offline misses the key rotation and must request the new key after reconnecting, causing a brief gap in message decryptability.`,
    },
    rubric: DEFAULT_RUBRIC,
  },
];
