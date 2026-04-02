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

export const COMPANY_SCENARIOS: InterviewScenario[] = [
  // ── 01 Netflix: Video Streaming CDN ──────────────────────────────────────
  {
    id: 'netflix-streaming-cdn',
    title: 'Netflix: Video Streaming CDN',
    description:
      'At Netflix scale: 230M subscribers in 190 countries, 15,000+ titles, 15% of global internet traffic during peak. Design Netflix\'s content delivery network and adaptive video streaming infrastructure, accounting for their Open Connect appliance (OCA) programme which deploys CDN hardware directly inside ISP networks, and their multi-bitrate encoding pipeline.',
    difficulty: 'expert',
    category: 'streaming',
    company: 'netflix',
    timeLimit: 55,
    requirements: [
      'Encode each title into 120+ bitrate/resolution combinations (100 kbps to 16 Mbps) using a per-title encoding model',
      'Distribute encoded files to Open Connect Appliances (OCA) embedded in ISPs before peak viewing hours',
      'Serve video segments adaptively (Netflix\'s DASH variant) based on client-measured bandwidth',
      'Support smooth bitrate switching mid-stream without buffering stalls',
      'Dynamic ABR algorithm on the client selects the optimal bitrate every 4 seconds',
      'Playback license (DRM — Widevine, FairPlay) issued per session before first segment is requested',
      'Startup latency < 2 seconds on first play from a cold start',
      'Support 4K HDR, Dolby Vision, and Dolby Atmos for Premium subscribers',
      'Fallback to central CDN if OCA does not have the requested title',
    ],
    nonFunctionalRequirements: [
      '230M subscribers; peak concurrent streams: 15M+',
      'CDN cache-hit rate on OCAs: > 99% for top 1,000 titles',
      'Stream start latency < 2 seconds at p95 globally',
      '99.99% availability on the streaming path',
      'Peak egress: 300 Gbps per major ISP OCA cluster',
      'Encoding pipeline: new title ready for global distribution within 48 hours of master file delivery',
    ],
    constraints: [
      'Netflix deploys Open Connect Appliances (custom Linux servers with 100 TB of SSD) inside ISP PoPs — this is different from a traditional third-party CDN',
      'All video is DRM-protected; Widevine (Android/Chrome), FairPlay (Apple), PlayReady (Windows) must all be supported',
      'Netflix uses a per-title encoding model ("Dynamic Optimizer") that produces variable-bitrate ladders based on content complexity rather than fixed resolution tiers',
    ],
    hints: [
      'Netflix\'s OCA programme is the key differentiator — think of it as a CDN that Netflix owns and deploys inside ISPs. How do you decide which titles to cache on which OCAs?',
      'The encoding pipeline has two phases: chunked parallel encoding on a GPU/CPU farm, followed by a quality validation step. Both are async and can be parallelised per title segment.',
      'DRM license issuance is on the critical path for first play latency — the license server must respond in < 500ms or the 2-second startup SLA is at risk.',
      'ABR algorithm state lives on the client (buffer level + bandwidth estimate). The server serves whichever segment the client requests — no server-side ABR orchestration.',
      'OCA pre-positioning: Netflix uses a push model overnight. A proactive fill agent reads the daily top-N popularity predictions and pushes those segments to relevant OCAs before peak hours.',
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
        node('client', 'Web Browser / App', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 450),
        node('cdn', 'Open Connect CDN', 'generic_cdn', ComponentCategory.Networking, 260, 250),
        node('api-gw', 'API Gateway (Zuul)', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('playback-svc', 'Playback Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('drm-svc', 'DRM License Service', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('catalog-svc', 'Catalog Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('encode-orchestrator', 'Encoding Orchestrator', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('object-store', 'Encoded Segment Store', 'generic_object_storage', ComponentCategory.Storage, 960, 250),
        node('redis-session', 'Session Cache', 'generic_redis', ComponentCategory.Database, 960, 450),
        node('postgres-catalog', 'Content Catalog DB', 'generic_postgresql', ComponentCategory.Database, 960, 700),
        node('encode-q', 'Encode Job Queue', 'generic_kafka', ComponentCategory.Messaging, 960, 900),
        node('encode-worker', 'Encode Workers', 'generic_microservice', ComponentCategory.Compute, 1200, 900),
        node('redis-catalog', 'Catalog Cache', 'generic_redis', ComponentCategory.Database, 1200, 700),
        node('oca-fill-svc', 'OCA Fill Agent', 'generic_microservice', ComponentCategory.Compute, 1200, 500),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 1000),
        node('data-wh', 'Data Warehouse (Iceberg)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 300),
      ],
      edges: [
        edge('c-cdn', 'client', 'cdn', ConnectionType.SYNC_HTTP),
        edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-playback', 'lb', 'playback-svc', ConnectionType.SYNC_HTTP),
        edge('lb-drm', 'lb', 'drm-svc', ConnectionType.SYNC_HTTP),
        edge('lb-catalog', 'lb', 'catalog-svc', ConnectionType.SYNC_HTTP),
        edge('playback-redis', 'playback-svc', 'redis-session', ConnectionType.CACHE_READ),
        edge('playback-obj', 'playback-svc', 'object-store', ConnectionType.DB_READ),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('drm-redis', 'drm-svc', 'redis-session', ConnectionType.CACHE_READ),
        edge('catalog-redis', 'catalog-svc', 'redis-catalog', ConnectionType.CACHE_READ),
        edge('catalog-pg', 'catalog-svc', 'postgres-catalog', ConnectionType.DB_READ),
        edge('encode-orch-q', 'encode-orchestrator', 'encode-q', ConnectionType.ASYNC_QUEUE),
        edge('q-worker', 'encode-q', 'encode-worker', ConnectionType.ASYNC_QUEUE),
        edge('worker-obj', 'encode-worker', 'object-store', ConnectionType.DB_WRITE),
        edge('oca-fill-obj', 'oca-fill-svc', 'object-store', ConnectionType.DB_READ),
        edge('playback-dw', 'playback-svc', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('svc-prom', 'playback-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
        edge('worker-pg', 'encode-worker', 'postgres-catalog', ConnectionType.DB_WRITE),
      ],
      explanation: `## Architecture Overview

Netflix's streaming CDN is built around the Open Connect Appliance (OCA) programme — a proprietary CDN where Netflix deploys commodity Linux servers (100 TB SSD) directly inside ISP data centres worldwide. This allows Netflix to serve > 99% of video traffic from within the subscriber's ISP, eliminating expensive peering charges and dramatically reducing latency. The architecture has three major pipelines: the encoding pipeline (pre-production), the OCA fill pipeline (nightly proactive distribution), and the playback pipeline (real-time client requests).

## Key Design Decisions

Per-title encoding (Netflix's "Dynamic Optimizer") analyses each title's visual complexity and produces a variable bitrate ladder rather than fixed tiers. A slow-motion documentary needs different encoding parameters than a high-action superhero film. Encoding is parallelised across thousands of EC2 instances using the Encode Job Queue (Kafka), with workers writing finished segments to S3-backed Object Storage. The OCA Fill Agent runs nightly: it reads popularity predictions from the Data Warehouse (Netflix uses Apache Iceberg on S3 for their data lake), ranks titles by ISP-level expected viewership, and pushes the top segments to each OCA before the evening viewing peak. DRM license issuance (Widevine/FairPlay/PlayReady) is served from the DRM License Service with session state cached in Redis — license issuance must be < 500ms to protect the 2-second startup SLA.

## Scalability & Trade-offs

The OCA model shifts the scalability challenge from the application layer to the logistics layer: instead of adding CDN capacity reactively, Netflix fills OCAs proactively based on predictions. A misprediction (a title goes viral that wasn't pre-positioned) causes a cache miss fallback to the Netflix-owned central CDN — expensive but rare. The DRM service is a potential bottleneck for simultaneous premiere events (a major show release at midnight can create millions of concurrent license requests); pre-fetching license keys into client-side secure storage in the hour before a premiere is Netflix's mitigation. The encoding pipeline's 48-hour SLA is achieved by parallelising encoding across thousands of spot instances, using the encode queue as a work-stealing scheduler.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 02 Netflix: Recommendation Engine at Scale ───────────────────────────
  {
    id: 'netflix-recommendation',
    title: 'Netflix: Recommendation Engine at Scale',
    description:
      'At Netflix scale: 230M subscribers, 80% of viewing driven by algorithmic recommendations, 15,000+ titles. Design the recommendation system that powers Netflix\'s homepage rows ("Because you watched X", "Top 10 in your country", "New Releases"), combining offline collaborative filtering, near-real-time event processing, and a low-latency serving layer.',
    difficulty: 'expert',
    category: 'e-commerce',
    company: 'netflix',
    timeLimit: 55,
    requirements: [
      'Generate personalised homepage rows for each of 230M subscribers',
      'Recommendations update in near-real-time based on the current session\'s viewing behaviour',
      'Support multiple recommendation algorithms: collaborative filtering, content-based, trending, country-specific',
      'Each homepage row is a different algorithm or context (e.g., continue watching, top 10, similar titles)',
      'A/B testing framework: different recommendation algorithms are tested against each other with statistical significance tracking',
      'Cold-start handling for new subscribers: use demographic and geo-based fallbacks',
      'Diversity constraints: no more than N consecutive titles from the same genre in a row',
      'Candidate retrieval → ranking → filtering pipeline with latency budget allocation',
      'Row order on the homepage is itself personalised (ranked by predicted engagement)',
    ],
    nonFunctionalRequirements: [
      '230M users; homepage load must serve personalised recommendations < 200ms at p99',
      'Offline model training: full collaborative filtering model retrained every 24 hours',
      'Near-real-time signal processing: session events update recommendation scores within 60 seconds',
      '99.9% availability on the recommendation serving path',
      'A/B test allocation is deterministic per user per experiment',
      'Candidate pool: retrieve top 500 candidates per row, rank to top 50, display top 20',
    ],
    constraints: [
      'Netflix uses a two-tower neural network for candidate retrieval and a separate ranking model (gradient boosted trees) for the final re-ranking step',
      'Pre-computed recommendations are stored per user in a fast key-value store (Netflix uses EVCache, a Memcached variant) to serve at < 20ms',
      'Real-time personalisation only adjusts the ranking of pre-computed candidates — it does not re-run the full retrieval pipeline live',
    ],
    hints: [
      'Split the problem into three phases: offline training, near-real-time candidate pre-computation, and online serving. Latency budgets are very different for each.',
      'Pre-computing all 230M user recommendation lists overnight in the Data Warehouse and caching them in EVCache (Redis in our model) is the foundation of < 200ms serving.',
      'Near-real-time updates: stream view events into Kafka, a stream processor updates session-level signals, and the serving layer blends pre-computed + real-time scores at request time.',
      'A/B testing requires deterministic assignment — a hash of (user_id, experiment_id) determines which variant a user sees, enabling reproducible analysis without a live lookup.',
      'Cold-start: for a new user with 0 viewing history, fall back to country-level trending titles and demographic cohort-level recommendations pre-computed in the Data Warehouse.',
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
        node('client', 'Web Browser / App', 'generic_web_browser', ComponentCategory.ClientEdge, 60, 450),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('rec-serving', 'Recommendation Serving Layer', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('ranking-svc', 'Ranking Service', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('ab-svc', 'A/B Test Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('event-svc', 'Event Ingest Service', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('redis-recs', 'Pre-computed Recs Cache (EVCache)', 'generic_redis', ComponentCategory.Database, 960, 250),
        node('redis-session', 'Session Signal Cache', 'generic_redis', ComponentCategory.Database, 960, 500),
        node('redis-ab', 'A/B Config Cache', 'generic_redis', ComponentCategory.Database, 960, 700),
        node('kafka', 'View Event Stream', 'generic_kafka', ComponentCategory.Messaging, 960, 900),
        node('stream-proc', 'Stream Processor (Flink)', 'generic_microservice', ComponentCategory.Compute, 1200, 900),
        node('data-wh', 'Data Warehouse (Iceberg)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 600),
        node('model-trainer', 'Model Training Pipeline', 'generic_microservice', ComponentCategory.Compute, 1200, 400),
        node('postgres', 'Experiment Config DB', 'generic_postgresql', ComponentCategory.Database, 1200, 200),
        node('tracing', 'Distributed Tracing', 'generic_distributed_tracing', ComponentCategory.Observability, 480, 1000),
      ],
      edges: [
        edge('c-apigw', 'client', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-rec', 'lb', 'rec-serving', ConnectionType.SYNC_HTTP),
        edge('lb-event', 'lb', 'event-svc', ConnectionType.SYNC_HTTP),
        edge('rec-redis-recs', 'rec-serving', 'redis-recs', ConnectionType.CACHE_READ),
        edge('rec-redis-sess', 'rec-serving', 'redis-session', ConnectionType.CACHE_READ),
        edge('rec-ranking', 'rec-serving', 'ranking-svc', ConnectionType.SYNC_GRPC),
        edge('rec-ab', 'rec-serving', 'ab-svc', ConnectionType.SYNC_GRPC),
        edge('ab-redis', 'ab-svc', 'redis-ab', ConnectionType.CACHE_READ),
        edge('ab-pg', 'ab-svc', 'postgres', ConnectionType.DB_READ),
        edge('event-kafka', 'event-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-stream', 'kafka', 'stream-proc', ConnectionType.ASYNC_STREAM),
        edge('stream-redis-sess', 'stream-proc', 'redis-session', ConnectionType.CACHE_WRITE),
        edge('kafka-dw', 'kafka', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('dw-trainer', 'data-wh', 'model-trainer', ConnectionType.DB_READ),
        edge('trainer-redis-recs', 'model-trainer', 'redis-recs', ConnectionType.CACHE_WRITE),
        edge('rec-tracing', 'rec-serving', 'tracing', ConnectionType.HEALTH_CHECK),
        edge('ranking-dw', 'ranking-svc', 'data-wh', ConnectionType.DB_READ),
        edge('trainer-dw', 'model-trainer', 'data-wh', ConnectionType.DB_WRITE),
      ],
      explanation: `## Architecture Overview

Netflix's recommendation system is a three-tier pipeline: offline model training (daily), near-real-time signal processing (seconds to minutes), and online serving (< 200ms). The offline tier runs nightly collaborative filtering and two-tower neural retrieval models on the Data Warehouse (Apache Iceberg on S3), producing pre-computed recommendation lists per user stored in EVCache (modelled as Redis). The near-real-time tier uses a Kafka + Flink stream processor to translate session events (play, pause, thumbs-up) into session-level signals that update the Redis session cache within 60 seconds. The online serving layer blends pre-computed lists with real-time session signals at request time, achieving sub-200ms latency without re-running the full retrieval pipeline.

## Key Design Decisions

Netflix's production architecture separates candidate retrieval (two-tower neural network, offline) from ranking (gradient boosted trees, near-real-time). The Recommendation Serving Layer pulls the top 500 pre-computed candidates from EVCache, calls the Ranking Service for real-time re-scoring using session signals from Redis, and returns the top 20 per row. This architecture means a cold cache (new deployment, cache failure) causes latency spikes as the serving layer must wait for batch re-computation; pre-warming EVCache during deployment is a critical operational step. A/B tests are allocated deterministically via a hash function in the A/B Service, with experiment configurations served from a PostgreSQL DB and cached in Redis. This ensures the same user sees the same variant across devices and sessions without a live lookup.

## Scalability & Trade-offs

The primary trade-off is offline freshness vs real-time cost. Running full collaborative filtering on 230M users requires 10K+ GPU-hours per daily run. Netflix mitigates cost by using two-tower embedding models that are cheaper to run incrementally — only users whose viewing history changed significantly require a full embedding recomputation. The real-time Flink stream processor updates only session-level signals, not the full recommendation list, keeping the real-time compute load proportional to active sessions (~15M peak), not total users. The A/B testing framework adds one Redis lookup per request; at 230M users loading homepages, experiment config caching is critical to avoid the PostgreSQL experiment DB becoming a bottleneck.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 03 Uber: Ride Matching Service ────────────────────────────────────────
  {
    id: 'uber-ride-matching',
    title: 'Uber: Ride Matching Service',
    description:
      'At Uber scale: 131M MAU, 28M trips per day, 5M+ active drivers across 70 countries. Design the core ride matching service that pairs incoming ride requests with nearby available drivers in < 2 seconds, accounts for driver preferences and vehicle types, and handles real-world constraints like traffic, cancellations, and partial matches during supply-demand imbalances.',
    difficulty: 'expert',
    category: 'real-time',
    company: 'uber',
    timeLimit: 55,
    requirements: [
      'Ingest real-time driver location updates every 4 seconds for 5M+ active drivers',
      'Find the top-K nearest available drivers to a rider\'s pickup location within 500ms',
      'Rank candidate drivers by ETA (not pure distance), accounting for live traffic',
      'Offer the trip sequentially to the top-ranked driver; if declined, move to the next',
      'Support multiple vehicle categories: UberX, UberXL, Uber Black, Uber Pool',
      'Match multiple riders to the same driver for UberPool (shared rides) within a time window',
      'Automatically expand the search radius if no drivers are found within the first pass',
      'Track match outcome metrics: match rate, average ETA, driver acceptance rate',
      'Gracefully degrade if geospatial index is temporarily unavailable (e.g., serve cached driver positions)',
    ],
    nonFunctionalRequirements: [
      '28M trips/day; peak matching rate: ~2,000 ride requests/second',
      'Driver location ingest: 5M drivers × 4-second update interval = 1.25M location writes/second at peak',
      'Match latency: end-to-end < 2 seconds from rider request to driver notification',
      '99.99% availability on the matching path',
      'Geospatial radius query (find all drivers within 2 km): < 50ms at p99',
      'Location data retention: 30 days for compliance, then anonymised',
    ],
    constraints: [
      'Uber uses H3 hexagonal grid (Uber open-source) at resolution 9 (~0.1 km² cells) for geospatial indexing, not a traditional R-tree',
      'The matching service is implemented in Go and uses in-process H3 geospatial index sharded by city',
      'Driver supply and rider demand are asymmetric; the matching system must handle both extreme oversupply (empty streets at 3 AM) and undersupply (surge events)',
    ],
    hints: [
      'Model driver location as a stream: every 4 seconds, a location event arrives per active driver. The geospatial index must support high-frequency upserts without degrading read performance.',
      'H3 hexagonal cells give you O(1) lookup for neighbours at any resolution — a ring of adjacent cells is a fast geospatial lookup primitive. How do you expand the search radius using H3 rings?',
      'ETA-ranked matching requires a routing call for each candidate driver — this is expensive. How do you limit the candidate set before invoking routing?',
      'For UberPool matching, you need to find not just the nearest driver but the driver whose route can accommodate both riders with minimal detour.',
      'When supply is low, the system must expand the search radius — but an unlimited radius causes drivers to be dispatched from very far away, creating a bad experience. Model a max-radius cap with queue overflow signalling to the surge pricing system.',
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
        node('rider', 'Mobile Client (Rider)', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 350),
        node('driver', 'Mobile Client (Driver)', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 550),
        node('api-gw', 'API Gateway (NGINX)', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('location-svc', 'Location Ingest Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('match-svc', 'Matching Service (Go)', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('dispatch-svc', 'Dispatch Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('trip-svc', 'Trip Service', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('eta-svc', 'ETA Service', 'generic_microservice', ComponentCategory.Compute, 700, 1050),
        node('redis-geo', 'H3 Geo Index (Redis)', 'generic_redis', ComponentCategory.Database, 960, 350),
        node('redis-driver', 'Driver State Cache', 'generic_redis', ComponentCategory.Database, 960, 550),
        node('postgres', 'Trip DB', 'generic_postgresql', ComponentCategory.Database, 960, 800),
        node('kafka', 'Location & Match Events', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('notif-svc', 'Push Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 300),
        node('data-wh', 'Data Warehouse', 'generic_data_warehouse', ComponentCategory.Database, 1200, 800),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 1100),
      ],
      edges: [
        edge('rider-apigw', 'rider', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('driver-apigw', 'driver', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-location', 'lb', 'location-svc', ConnectionType.SYNC_HTTP),
        edge('lb-match', 'lb', 'match-svc', ConnectionType.SYNC_HTTP),
        edge('lb-dispatch', 'lb', 'dispatch-svc', ConnectionType.SYNC_HTTP),
        edge('lb-trip', 'lb', 'trip-svc', ConnectionType.SYNC_HTTP),
        edge('location-redis-geo', 'location-svc', 'redis-geo', ConnectionType.CACHE_WRITE),
        edge('location-redis-driver', 'location-svc', 'redis-driver', ConnectionType.CACHE_WRITE),
        edge('location-kafka', 'location-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('match-redis-geo', 'match-svc', 'redis-geo', ConnectionType.CACHE_READ),
        edge('match-redis-driver', 'match-svc', 'redis-driver', ConnectionType.CACHE_READ),
        edge('match-eta', 'match-svc', 'eta-svc', ConnectionType.SYNC_GRPC),
        edge('match-dispatch', 'match-svc', 'dispatch-svc', ConnectionType.SYNC_GRPC),
        edge('dispatch-notif', 'dispatch-svc', 'notif-svc', ConnectionType.ASYNC_QUEUE),
        edge('trip-pg', 'trip-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('trip-kafka', 'trip-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-dw', 'kafka', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('match-prom', 'match-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
        edge('notif-kafka', 'notif-svc', 'kafka', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Architecture Overview

Uber's matching service is architecturally centred on a high-frequency geospatial write-then-read cycle: 1.25M driver location writes per second flow through the Location Ingest Service into a Redis-backed H3 geospatial index, and the Matching Service performs H3 ring queries to find nearby available drivers within 50ms. The matching pipeline then calls the ETA Service for routing-based ranking, selects the top driver, and dispatches a trip offer via the Dispatch Service and Push Notification Service — all within the 2-second match SLA.

## Key Design Decisions

Uber's production system (circa 2018–2022) uses a per-city in-memory H3 geospatial index within the Matching Service process, not an external Redis GEORADIUS query. In our model we use Redis as a proxy for this index. The key insight is sharding the geo index by city: the Tokyo matching service only holds Tokyo driver positions, making the index small enough to fit in memory and allowing O(1) H3 ring lookups without network round-trips. Driver state (availability, vehicle type, current trip) is maintained in a separate Redis cache keyed by driver ID, updated on every status change. ETA computation is a gRPC call to the ETA Service, which wraps a routing engine that reads live traffic data. The ETA call is the latency bottleneck; Uber mitigates this by pre-computing ETAs for the top-20 candidate drivers in parallel (fan-out), then selecting the minimum.

## Scalability & Trade-offs

The 1.25M location writes/second is the most demanding write requirement. Redis at this write rate requires careful pipelining and a sharded deployment (one Redis shard per city cluster). A city like New York with 50K active drivers contributes ~12,500 writes/second to a single shard — well within Redis's 100K ops/second per shard capacity. The driver state cache (availability, vehicle type) is read on every matching query and must have sub-millisecond read latency; Redis in-process memory would be ideal but Redis over the network is acceptable given typical 1–2ms LAN latency. The main availability risk is a Redis geo index failure: the Dispatch Service falls back to a stale cached copy of driver positions (last known positions, up to 30 seconds stale), allowing degraded matching to continue during a brief cache outage.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 04 Uber: Surge Pricing Engine ─────────────────────────────────────────
  {
    id: 'uber-surge-pricing',
    title: 'Uber: Surge Pricing Engine',
    description:
      'At Uber scale: 28M trips/day across 10,000+ cities. Design the surge pricing (dynamic pricing) engine that computes real-time supply/demand multipliers per geographic cell, applies them to ride price estimates, and provides a fair and transparent pricing experience while maximising driver supply in high-demand areas.',
    difficulty: 'expert',
    category: 'real-time',
    company: 'uber',
    timeLimit: 55,
    requirements: [
      'Compute a surge multiplier (1.0×–5.0×) per H3 hexagonal cell (resolution 7) every 30 seconds',
      'Multiplier is based on the ratio of active ride requests to available drivers in each cell',
      'Multiplier changes are propagated to the rider app and driver app within 5 seconds',
      'Estimated price shown to rider reflects the current surge multiplier at ETA',
      'Surge multiplier is locked in at the time the rider confirms the trip (not at driver arrival)',
      'Surge heatmap is displayed on the rider and driver apps in real-time',
      'Surge decay model: as more drivers move into a surge zone, the multiplier decreases',
      'Regulatory compliance: maximum allowed multiplier varies by city/region (configurable)',
      'Surge events are logged for regulatory audits and a/b testing of decay models',
    ],
    nonFunctionalRequirements: [
      'Surge computation covers 10,000+ active cities; 500K H3 cells updated every 30 seconds',
      'Multiplier propagation to all active app clients within 5 seconds of computation',
      'Surge compute latency: aggregate supply/demand per city and compute multipliers in < 10 seconds',
      '99.9% availability on price estimation',
      'Audit log: every surge multiplier change is durably recorded',
      'Config update (max multiplier per city) takes effect within 60 seconds globally',
    ],
    constraints: [
      'Surge pricing is NOT a real-time per-request calculation; it is a batch job running every 30 seconds per city, with results cached',
      'The supply signal (available drivers) is read from the same H3 geo index used by the matching service — surge must not interfere with matching latency',
      'Demand signal (recent ride requests) is computed from a sliding 5-minute window, not instantaneous counts',
    ],
    hints: [
      'The core compute is a periodic batch: read supply (available drivers per cell from geo index) + demand (ride requests in last 5 minutes from event stream) → compute ratio → apply policy → publish multipliers.',
      'A stream processing job (e.g. Flink, Kafka Streams) can maintain sliding-window request counts per H3 cell, writing to a Redis cache that the surge compute job reads.',
      'Propagation to 100M+ active app clients cannot be a push from the server — clients poll a cached surge heatmap endpoint; CDN-cached responses at the cell level work well.',
      'The regulatory maximum multiplier is a per-city configuration — a Config Service backed by a DB and cached in Redis gives sub-60-second propagation.',
      'Surge auditing requires an immutable append-only log — Kafka with a long retention policy (or an OLAP data warehouse) is the standard approach.',
    ],
    starterCanvas: {
      nodes: [
        node('mobile', 'Mobile Client (Rider)', 'generic_mobile_client', ComponentCategory.ClientEdge, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('mobile', 'Mobile Client', 'generic_mobile_client', ComponentCategory.ClientEdge, 60, 400),
        node('cdn', 'CDN (Surge Heatmap)', 'generic_cdn', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('price-svc', 'Price Estimate Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('surge-compute', 'Surge Compute Job', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('config-svc', 'Surge Config Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('demand-stream', 'Demand Stream Processor', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('kafka-requests', 'Ride Request Events', 'generic_kafka', ComponentCategory.Messaging, 960, 800),
        node('redis-surge', 'Surge Multiplier Cache', 'generic_redis', ComponentCategory.Database, 960, 400),
        node('redis-demand', 'Demand Count Cache', 'generic_redis', ComponentCategory.Database, 960, 650),
        node('redis-config', 'Config Cache', 'generic_redis', ComponentCategory.Database, 960, 250),
        node('postgres-config', 'Surge Config DB', 'generic_postgresql', ComponentCategory.Database, 1200, 250),
        node('data-wh', 'Data Warehouse (Audit Log)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 600),
        node('kafka-audit', 'Surge Audit Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 450),
        node('grafana', 'Grafana', 'generic_grafana', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('m-cdn', 'mobile', 'cdn', ConnectionType.SYNC_HTTP),
        edge('m-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-price', 'lb', 'price-svc', ConnectionType.SYNC_HTTP),
        edge('lb-config', 'lb', 'config-svc', ConnectionType.SYNC_HTTP),
        edge('price-redis-surge', 'price-svc', 'redis-surge', ConnectionType.CACHE_READ),
        edge('surge-redis-demand', 'surge-compute', 'redis-demand', ConnectionType.CACHE_READ),
        edge('surge-redis-config', 'surge-compute', 'redis-config', ConnectionType.CACHE_READ),
        edge('surge-redis-out', 'surge-compute', 'redis-surge', ConnectionType.CACHE_WRITE),
        edge('surge-audit', 'surge-compute', 'kafka-audit', ConnectionType.ASYNC_STREAM),
        edge('kafka-audit-dw', 'kafka-audit', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('demand-kafka', 'demand-stream', 'kafka-requests', ConnectionType.ASYNC_STREAM),
        edge('demand-redis', 'demand-stream', 'redis-demand', ConnectionType.CACHE_WRITE),
        edge('config-pg', 'config-svc', 'postgres-config', ConnectionType.DB_READ),
        edge('config-redis', 'config-svc', 'redis-config', ConnectionType.CACHE_WRITE),
        edge('cdn-redis-surge', 'cdn', 'redis-surge', ConnectionType.CDN_ORIGIN),
        edge('surge-grafana', 'surge-compute', 'grafana', ConnectionType.HEALTH_CHECK),
        edge('price-redis-config', 'price-svc', 'redis-config', ConnectionType.CACHE_READ),
      ],
      explanation: `## Architecture Overview

Uber's surge pricing engine is a periodic batch compute system, not a per-request calculation. Every 30 seconds, the Surge Compute Job reads supply (available drivers per H3 cell from the geo index) and demand (ride requests in the last 5 minutes from a Redis demand cache) per cell, applies the surge multiplier formula and regulatory caps from the Config Cache, writes updated multipliers to the Surge Multiplier Cache (Redis), and publishes a change record to the Surge Audit Stream (Kafka). The Price Estimate Service reads the current multiplier from Redis on every price estimate request, keeping price estimate latency low without adding compute load to the surge pipeline.

## Key Design Decisions

The demand signal is maintained by a Stream Processor that consumes ride request events from the Ride Request Events Kafka topic and maintains a 5-minute sliding-window count per H3 cell in the Demand Count Cache (Redis). This decouples the high-frequency event ingestion from the 30-second surge compute cycle. The surge heatmap (a grid of multiplier values by cell) is written to Redis and served via CDN for client map rendering — the CDN caches the heatmap for up to 30 seconds, matching the compute cadence and serving millions of concurrent client polls without saturating the Price Estimate Service. Config changes (e.g., the City of New York mandates a 2.5× cap during emergencies) are written to PostgreSQL, propagated to Redis by the Config Service within 60 seconds, and picked up on the next surge compute cycle.

## Scalability & Trade-offs

500K H3 cells × 30-second compute cadence = 16,667 cell updates per second. Each cell update is a Redis write, comfortably within Redis cluster throughput. The biggest scalability risk is Kafka consumer lag in the demand stream processor: if the lag grows beyond 5 minutes, the demand signal becomes stale and surge multipliers underestimate true demand. Auto-scaling the stream processor based on Kafka consumer group lag is the standard mitigation. The main product trade-off is that the multiplier is locked in at trip confirmation, not pickup — this protects riders from multiplier changes during wait time but means Uber absorbs the pricing risk if demand drops between confirmation and pickup.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 05 Stripe: Payment Processing Pipeline ────────────────────────────────
  {
    id: 'stripe-payment-pipeline',
    title: 'Stripe: Payment Processing Pipeline',
    description:
      'At Stripe scale: 500M+ API requests/day, $640B+ payment volume processed annually, 3.1M active businesses as customers. Design Stripe\'s payment processing pipeline that accepts a charge request, validates and routes it through card networks (Visa, Mastercard), handles authorisation and capture, manages idempotency, and provides real-time webhooks to merchants.',
    difficulty: 'expert',
    category: 'e-commerce',
    company: 'stripe',
    timeLimit: 55,
    requirements: [
      'Expose a POST /charges API that initiates a synchronous card authorisation and returns a result',
      'Support the full payment lifecycle: authorise → capture → refund → dispute',
      'Idempotency: each API request includes an idempotency key; duplicate requests return the original response',
      'Route payment to the appropriate card network (Visa, MC, Amex) based on card BIN range',
      'Handle network timeouts from card networks gracefully (retry with exponential back-off)',
      'Emit real-time webhooks to the merchant\'s endpoint for all payment events',
      'Store payment records with full PCI-DSS compliance (card numbers tokenised at ingress)',
      'Dashboard API: merchants can query their payment history with filtering and pagination',
      'Dispute handling: merchants can respond to chargebacks by submitting evidence',
    ],
    nonFunctionalRequirements: [
      '500M API requests/day; peak: 100K payment requests/second',
      'Authorisation latency < 500ms at p95 end-to-end (including card network round-trip)',
      '99.9999% durability on payment records (6 nines)',
      '99.99% availability on the charge API',
      'Webhook delivery: at-least-once, within 30 seconds of event creation',
      'Idempotency key deduplication window: 24 hours',
    ],
    constraints: [
      'Card numbers (PANs) must be tokenised using Stripe\'s vault at the API ingress layer; raw PANs never touch application servers',
      'Payment state machine transitions must be atomic and durable — a crash between authorise and capture must not result in a phantom authorisation',
      'Stripe\'s architecture uses a distributed ID generation system (based on Twitter\'s Snowflake) for all payment IDs — IDs encode creation time and shard',
    ],
    hints: [
      'The charge API is synchronous from the merchant\'s perspective but involves an async external call (card network). How do you model the waiting and timeout gracefully?',
      'Idempotency at this scale requires a distributed lock or a DB check on the idempotency key before processing — the key maps to the stored response, returned directly on a duplicate.',
      'PCI compliance requires that raw card data is tokenised at the ingress point (API Gateway or a dedicated vault service) before any other service touches the request.',
      'Webhook delivery is at-least-once — use a durable queue with retry logic. The merchant\'s endpoint may be down; exponential back-off with a max retry window of 72 hours is standard.',
      'Dispute handling is a long-running state machine spanning days to weeks — model it as a separate entity in the DB with its own state transitions, not a sub-state of the payment.',
    ],
    starterCanvas: {
      nodes: [
        node('merchant', 'Merchant App', 'generic_web_server', ComponentCategory.Compute, 100, 250),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 350, 250),
      ],
      edges: [edge('m-apigw', 'merchant', 'api-gw', ConnectionType.SYNC_HTTP)],
    },
    referenceSolution: {
      nodes: [
        node('merchant', 'Merchant App', 'generic_web_server', ComponentCategory.Compute, 60, 450),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 350),
        node('rate-limiter', 'Rate Limiter', 'generic_rate_limiter', ComponentCategory.Security, 260, 550),
        node('auth', 'API Key Auth', 'generic_auth_server', ComponentCategory.Security, 260, 750),
        node('vault', 'Card Vault (Tokenisation)', 'generic_microservice', ComponentCategory.Compute, 480, 250),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 500),
        node('charge-svc', 'Charge Service', 'generic_microservice', ComponentCategory.Compute, 700, 350),
        node('idempotency-svc', 'Idempotency Service', 'generic_microservice', ComponentCategory.Compute, 700, 550),
        node('network-svc', 'Card Network Gateway', 'generic_microservice', ComponentCategory.Compute, 700, 750),
        node('webhook-svc', 'Webhook Service', 'generic_microservice', ComponentCategory.Compute, 700, 950),
        node('redis-idempotency', 'Idempotency Cache', 'generic_redis', ComponentCategory.Database, 960, 450),
        node('postgres-payments', 'Payment DB (sharded)', 'generic_postgresql', ComponentCategory.Database, 960, 650),
        node('kafka-events', 'Payment Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('webhook-q', 'Webhook Delivery Queue', 'generic_message_queue', ComponentCategory.Messaging, 960, 900),
        node('redis-routing', 'BIN Routing Cache', 'generic_redis', ComponentCategory.Database, 960, 250),
        node('tracing', 'Distributed Tracing', 'generic_distributed_tracing', ComponentCategory.Observability, 480, 1050),
        node('data-wh', 'Data Warehouse', 'generic_data_warehouse', ComponentCategory.Database, 1200, 750),
      ],
      edges: [
        edge('m-apigw', 'merchant', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-rl', 'api-gw', 'rate-limiter', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-vault', 'api-gw', 'vault', ConnectionType.SYNC_HTTP),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-charge', 'lb', 'charge-svc', ConnectionType.SYNC_HTTP),
        edge('charge-idempotency', 'charge-svc', 'idempotency-svc', ConnectionType.SYNC_GRPC),
        edge('idempotency-redis', 'idempotency-svc', 'redis-idempotency', ConnectionType.CACHE_READ),
        edge('charge-routing', 'charge-svc', 'redis-routing', ConnectionType.CACHE_READ),
        edge('charge-network', 'charge-svc', 'network-svc', ConnectionType.SYNC_GRPC),
        edge('charge-pg', 'charge-svc', 'postgres-payments', ConnectionType.DB_WRITE),
        edge('charge-kafka', 'charge-svc', 'kafka-events', ConnectionType.ASYNC_STREAM),
        edge('kafka-webhook', 'kafka-events', 'webhook-svc', ConnectionType.ASYNC_STREAM),
        edge('webhook-q-svc', 'webhook-svc', 'webhook-q', ConnectionType.ASYNC_QUEUE),
        edge('kafka-dw', 'kafka-events', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('charge-tracing', 'charge-svc', 'tracing', ConnectionType.HEALTH_CHECK),
        edge('idempotency-write', 'idempotency-svc', 'redis-idempotency', ConnectionType.CACHE_WRITE),
        edge('pg-repl', 'postgres-payments', 'data-wh', ConnectionType.DB_REPLICATION),
      ],
      explanation: `## Architecture Overview

Stripe's payment processing pipeline is structured around two critical invariants: idempotency (every API call with the same idempotency key returns the same result) and durability (a payment record is never lost once created). The Charge Service is the core orchestrator: it checks the Idempotency Service (backed by Redis) before processing, tokenises card data through the Card Vault at the API Gateway ingress, looks up the card network routing from BIN cache, makes a synchronous call to the Card Network Gateway, writes the result to the sharded Payment DB, and publishes a payment event to Kafka.

## Key Design Decisions

Card tokenisation happens at the API Gateway / Vault layer — raw PANs are replaced with a Stripe-internal token before the request reaches the Charge Service. This means no application server ever sees a raw card number, satisfying PCI-DSS scope reduction. The Idempotency Service uses a two-phase check: first a Redis cache read (for recent keys), then a PostgreSQL write with a unique constraint on the idempotency key (for durability). On a duplicate request, the stored response is returned immediately without re-processing. Webhook delivery is handled asynchronously: the Webhook Service consumes payment events from Kafka and pushes them to a Webhook Delivery Queue with retry semantics (exponential back-off, 72-hour max window). The merchant's endpoint being down does not block payment processing.

## Scalability & Trade-offs

At 100K payment requests/second, the Payment DB is the primary write bottleneck. Stripe shards PostgreSQL by merchant ID (using their Vitess-based architecture internally) so that one merchant's high volume does not impact others. The 500ms authorisation SLA includes the card network round-trip (~200ms typical), leaving only 300ms for internal processing — every internal hop must be fast. The Rate Limiter is critical to protect the pipeline from a single merchant's traffic spike (bug in merchant code causing a runaway charge loop is a real production scenario at Stripe's scale). The idempotency Redis cache reduces DB contention for duplicate requests: the expected duplicate rate is < 0.1%, but on retries during network instability it can temporarily spike to 10%, making the Redis cache essential.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 06 Stripe: Fraud Detection System ────────────────────────────────────
  {
    id: 'stripe-fraud-detection',
    title: 'Stripe: Fraud Detection System',
    description:
      'At Stripe scale: $640B+ payment volume, fraud rate target < 0.1%, detecting fraud across 3.1M businesses and their end-customers. Design Stripe\'s Radar fraud detection system that runs synchronously on every charge request, evaluating hundreds of signals to produce a fraud risk score and block or flag suspicious transactions in < 100ms.',
    difficulty: 'expert',
    category: 'infrastructure',
    company: 'stripe',
    timeLimit: 55,
    requirements: [
      'Score every charge request with a fraud risk probability (0–100) in < 100ms',
      'Evaluate 500+ signals per transaction: card velocity, device fingerprint, IP risk, merchant history, user history',
      'Block transactions above a configurable threshold; flag for 3DS step-up above a lower threshold',
      'Machine learning model updated daily from the previous day\'s labelled transactions (confirmed fraud/non-fraud)',
      'Merchants can write custom Radar Rules (e.g., "block if country != US AND amount > $500") that evaluate in addition to the ML score',
      'Real-time card velocity tracking: count transactions per card in last 1h/24h/7d',
      'IP geolocation mismatch detection: card billing country vs transaction IP country',
      'Device fingerprint tracking across sessions (persistent fingerprint per device)',
      'Fraud case management: analysts review flagged transactions and label outcomes',
    ],
    nonFunctionalRequirements: [
      '100K transaction evaluations/second; fraud score must be returned in < 100ms at p99',
      'ML model inference latency < 20ms (excluding signal retrieval)',
      'Signal retrieval (card history, device history) < 50ms at p99',
      '99.99% availability on the fraud scoring path — a fraud service outage means all charges pass through, incurring fraud losses',
      'Model training pipeline: retrain and deploy a new model within 4 hours of a major fraud pattern emerging',
      'False positive rate target: < 0.5% of legitimate transactions blocked',
    ],
    constraints: [
      'The fraud score is on the synchronous critical path of every charge — any latency added by fraud detection directly increases payment authorisation latency',
      'Stripe\'s Radar uses gradient boosted trees (XGBoost) for the base model, not a deep neural network — this enables sub-20ms inference',
      'Merchant custom rules are evaluated after the ML score and use a fast rule engine (not a general-purpose scripting sandbox) for safety and latency',
    ],
    hints: [
      'The hardest constraint is 100ms total budget including all signal retrieval — sketch the latency budget: signal reads (50ms) + ML inference (20ms) + rule eval (10ms) + overhead (20ms).',
      'Card velocity signals (count of transactions on this card in last 1h) must be pre-computed in Redis counters, not computed on-the-fly from DB queries.',
      'Device fingerprint persistence requires a lookup table keyed by fingerprint hash to a device risk profile — this is a Redis GET with sub-millisecond latency.',
      'ML model deployment should be blue/green: the new model runs in shadow mode (scoring but not blocking) for 1 hour before promotion to production.',
      'Merchant custom rules need a low-latency rule engine — storing rules as compiled predicates in Redis and evaluating them in the fraud service process (not via HTTP) is the standard pattern.',
    ],
    starterCanvas: {
      nodes: [
        node('charge-svc', 'Charge Service', 'generic_microservice', ComponentCategory.Compute, 100, 250),
        node('fraud-svc', 'Fraud Detection Service', 'generic_microservice', ComponentCategory.Compute, 350, 250),
      ],
      edges: [edge('c-fraud', 'charge-svc', 'fraud-svc', ConnectionType.SYNC_GRPC)],
    },
    referenceSolution: {
      nodes: [
        node('charge-svc', 'Charge Service', 'generic_microservice', ComponentCategory.Compute, 60, 450),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 300),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 300),
        node('fraud-svc', 'Fraud Scoring Service', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('signal-svc', 'Signal Retrieval Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('rule-svc', 'Radar Rule Engine', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('case-svc', 'Fraud Case Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('redis-velocity', 'Card Velocity Cache', 'generic_redis', ComponentCategory.Database, 960, 300),
        node('redis-device', 'Device Fingerprint Cache', 'generic_redis', ComponentCategory.Database, 960, 500),
        node('redis-rules', 'Merchant Rules Cache', 'generic_redis', ComponentCategory.Database, 960, 700),
        node('postgres-cases', 'Fraud Case DB', 'generic_postgresql', ComponentCategory.Database, 960, 900),
        node('kafka-txn', 'Transaction Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('model-trainer', 'ML Training Pipeline', 'generic_microservice', ComponentCategory.Compute, 1200, 300),
        node('data-wh', 'Data Warehouse (Labels)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 750),
        node('object-store', 'Model Artefact Storage', 'generic_object_storage', ComponentCategory.Storage, 960, 100),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('charge-fraud', 'charge-svc', 'fraud-svc', ConnectionType.SYNC_GRPC),
        edge('fraud-signal', 'fraud-svc', 'signal-svc', ConnectionType.SYNC_GRPC),
        edge('fraud-rules', 'fraud-svc', 'rule-svc', ConnectionType.SYNC_GRPC),
        edge('signal-velocity', 'signal-svc', 'redis-velocity', ConnectionType.CACHE_READ),
        edge('signal-device', 'signal-svc', 'redis-device', ConnectionType.CACHE_READ),
        edge('rule-redis', 'rule-svc', 'redis-rules', ConnectionType.CACHE_READ),
        edge('fraud-obj', 'fraud-svc', 'object-store', ConnectionType.DB_READ),
        edge('fraud-kafka', 'fraud-svc', 'kafka-txn', ConnectionType.ASYNC_STREAM),
        edge('kafka-velocity', 'kafka-txn', 'redis-velocity', ConnectionType.CACHE_WRITE),
        edge('kafka-device', 'kafka-txn', 'redis-device', ConnectionType.CACHE_WRITE),
        edge('kafka-dw', 'kafka-txn', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('dw-trainer', 'data-wh', 'model-trainer', ConnectionType.DB_READ),
        edge('trainer-obj', 'model-trainer', 'object-store', ConnectionType.DB_WRITE),
        edge('case-pg', 'case-svc', 'postgres-cases', ConnectionType.DB_WRITE),
        edge('kafka-case', 'kafka-txn', 'case-svc', ConnectionType.ASYNC_STREAM),
        edge('fraud-prom', 'fraud-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
        edge('fraud-lb', 'lb', 'fraud-svc', ConnectionType.SYNC_HTTP),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
      ],
      explanation: `## Architecture Overview

Stripe's Radar fraud detection system sits on the synchronous critical path of every charge request. The Charge Service makes a synchronous gRPC call to the Fraud Scoring Service with a 100ms timeout budget. The Fraud Scoring Service retrieves signals in parallel from the Signal Retrieval Service (card velocity, device history via Redis), loads the current ML model (XGBoost) from the Model Artefact Storage (cached in-process), runs inference, then calls the Rule Engine for merchant-configured custom rules. The final score and block/pass/3DS decision is returned to the Charge Service within the budget.

## Key Design Decisions

Card velocity signals are pre-computed: every transaction event published to Kafka increments Redis counters for (card, 1h), (card, 24h), and (card, 7d) windows using Redis' INCR with TTL expiry. This means velocity reads are O(1) Redis GETs at sub-millisecond latency, not database aggregations. The ML model is loaded into the Fraud Scoring Service's in-process memory at startup and updated via a blue/green deployment pattern: a new model file is written to Object Storage, a background thread in the scoring service reloads it, and a shadow-scoring period compares the new model's outputs before promotion. This eliminates model loading latency from the request path. Merchant custom rules are compiled into fast predicate objects and cached in Redis (keyed by merchant ID), loaded into the rule engine at request time without a DB round-trip.

## Scalability & Trade-offs

At 100K evaluations/second with a 100ms budget, the Fraud Scoring Service must run inference on 100K model evaluations per second. A single XGBoost model can evaluate 50K–200K rows/second on a single CPU core; with 20 fraud service instances, this is easily achievable. The primary scalability risk is the Signal Retrieval Service: if Redis velocity counters are unavailable, fraud scores degrade to model-only scores (without velocity signals), increasing both false positive and false negative rates. Graceful degradation (return a default medium-risk score on signal retrieval timeout) is preferable to failing open (blocking all charges) or failing closed (letting all charges through). The false positive budget (0.5% of legitimate transactions) means the ML model threshold and rule thresholds must be continuously monitored and adjusted as fraud patterns evolve.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 07 Google: Distributed Search Index ──────────────────────────────────
  {
    id: 'google-search-index',
    title: 'Google: Distributed Search Index',
    description:
      'At Google scale: 8.5 billion searches/day, 130 trillion pages indexed, 100K queries/second per datacenter. Design the distributed inverted index and query serving system that underpins web search — covering crawl ingestion, index construction, index serving (doc sharding + term sharding), and sub-500ms query execution across a multi-tier index.',
    difficulty: 'expert',
    category: 'search',
    company: 'google',
    timeLimit: 55,
    requirements: [
      'Crawl and ingest web pages, extracting text and building an inverted index',
      'Assign each document a document ID and store forward index (docID → content) and inverted index (term → posting list)',
      'Query execution: for a multi-term query, retrieve posting lists for each term and compute intersection/union',
      'Rank results using BM25 + PageRank + freshness signals; return top-K in order',
      'Tiered index: a small hot-tier index for recently crawled pages, a large cold-tier index for the full web',
      'Support phrase queries and proximity ranking (terms near each other rank higher)',
      'Index update pipeline: newly crawled pages are available in the hot tier within 10 minutes',
      'Spelling correction and query suggestion are served in < 100ms alongside search results',
      'Personalisation: signed-in users receive results influenced by their search history',
    ],
    nonFunctionalRequirements: [
      '100K queries/second per datacenter; 8.5B queries/day globally',
      'Search result latency < 500ms at p99 (including ranking)',
      'Index size: 100 PB total across all shards',
      '99.999% availability on query serving',
      'Crawl throughput: 5B pages/day re-crawled for freshness',
      'Hot-tier index update latency: new page indexed within 10 minutes of crawl',
    ],
    constraints: [
      'Google\'s production index uses a multi-shard architecture: doc shards (each shard has all terms for a subset of documents) and term shards (each shard has all documents for a subset of terms). The choice has latency implications.',
      'Posting lists for common terms (e.g., "the") can be billions of entries — they are truncated to the top-K by PageRank before storage',
      'The freshness index (hot tier) is a separate in-memory index updated every few minutes, merged with the full index at query time',
    ],
    hints: [
      'Start with the index architecture choice: doc sharding vs term sharding. Doc sharding requires scatter-gather across all shards for every query; term sharding allows one shard per term but requires joins across shards for multi-term queries.',
      'The query execution model for multi-term queries: retrieve posting lists for each term (in parallel, one request per term shard), then intersect posting lists on a merge server, then rank the resulting doc IDs.',
      'PageRank is a property of each document, stored alongside the posting list entry. You do not need to compute it at query time.',
      'The hot-tier index is a small, fast, in-memory index updated frequently. At query time, the query fan-out hits both the hot tier and cold tier; results are merged before ranking.',
      'Spelling correction uses a character n-gram index or a pre-computed correction table — it does not require a full search index query and should be computed in parallel with the main search.',
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
        node('dns', 'DNS (Anycast)', 'generic_dns', ComponentCategory.Networking, 260, 200),
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 450),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('query-svc', 'Query Parsing Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('index-serving', 'Index Serving (Leaf Servers)', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('merge-rank', 'Merge & Ranking Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('spell-svc', 'Spell Correct / Suggest', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('hot-index', 'Hot Tier Index (in-memory)', 'generic_redis', ComponentCategory.Database, 960, 350),
        node('cold-index', 'Cold Tier Index (Bigtable-style)', 'generic_data_warehouse', ComponentCategory.Database, 960, 600),
        node('crawl-queue', 'Crawl Job Queue', 'generic_kafka', ComponentCategory.Messaging, 960, 850),
        node('crawler', 'Web Crawler Workers', 'generic_microservice', ComponentCategory.Compute, 1200, 850),
        node('index-builder', 'Index Builder Pipeline', 'generic_microservice', ComponentCategory.Compute, 1200, 600),
        node('doc-store', 'Document Store', 'generic_object_storage', ComponentCategory.Storage, 1200, 400),
        node('redis-spell', 'Spell Correction Cache', 'generic_redis', ComponentCategory.Database, 960, 200),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
        node('es', 'Elasticsearch (Logs)', 'generic_elasticsearch', ComponentCategory.Database, 1200, 200),
      ],
      edges: [
        edge('b-dns', 'browser', 'dns', ConnectionType.DNS_RESOLUTION),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-query', 'lb', 'query-svc', ConnectionType.SYNC_HTTP),
        edge('lb-spell', 'lb', 'spell-svc', ConnectionType.SYNC_HTTP),
        edge('query-index', 'query-svc', 'index-serving', ConnectionType.SYNC_GRPC),
        edge('query-merge', 'query-svc', 'merge-rank', ConnectionType.SYNC_GRPC),
        edge('index-hot', 'index-serving', 'hot-index', ConnectionType.CACHE_READ),
        edge('index-cold', 'index-serving', 'cold-index', ConnectionType.DB_READ),
        edge('merge-doc', 'merge-rank', 'doc-store', ConnectionType.DB_READ),
        edge('spell-redis', 'spell-svc', 'redis-spell', ConnectionType.CACHE_READ),
        edge('crawl-q-crawler', 'crawl-queue', 'crawler', ConnectionType.ASYNC_QUEUE),
        edge('crawler-doc', 'crawler', 'doc-store', ConnectionType.DB_WRITE),
        edge('crawler-q', 'crawler', 'crawl-queue', ConnectionType.ASYNC_QUEUE),
        edge('doc-builder', 'doc-store', 'index-builder', ConnectionType.ASYNC_STREAM),
        edge('builder-hot', 'index-builder', 'hot-index', ConnectionType.CACHE_WRITE),
        edge('builder-cold', 'index-builder', 'cold-index', ConnectionType.DB_WRITE),
        edge('query-prom', 'query-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
        edge('index-es', 'index-serving', 'es', ConnectionType.ASYNC_STREAM),
      ],
      explanation: `## Architecture Overview

Google's distributed search index is structured as a multi-tier architecture: a small hot-tier in-memory index (recently crawled pages, updated every 10 minutes) and a large cold-tier index (the full web, updated over days). At query time, the Query Parsing Service fans out to Index Serving Leaf Servers that query both tiers in parallel, the Merge & Ranking Service combines posting lists from multiple shards and ranks using BM25 + PageRank + freshness, and the final top-K results are returned. The crawl and indexing pipeline is entirely decoupled from the serving path.

## Key Design Decisions

Index sharding in our model uses term sharding (each index shard serves a subset of terms, holding posting lists for all documents for those terms). This means a multi-term query fans out to N term shards in parallel, each returning a posting list, and the Merge & Ranking Service intersects them. Doc sharding (the alternative) would require scatter-gather across all shards for every query, which is worse at Google's index size. The hot-tier index is modelled as Redis (standing in for Google's Caffeine / in-memory serving layer), updated by the Index Builder Pipeline within 10 minutes of a new crawl. The cold-tier index is modelled as a Data Warehouse (standing in for Google's Bigtable-based serving layer). PageRank is pre-computed offline and stored as a score per docID in the Document Store; it is retrieved at ranking time from the doc store, not recomputed live.

## Scalability & Trade-offs

Serving 100K queries/second with < 500ms latency requires massive parallelism. Google's production system uses thousands of leaf servers per datacenter, each holding a partition of the index in memory for low-latency reads. The merge server is the latency bottleneck: it must wait for all N term shard responses before producing ranked results. Hedged requests (sending the same query to two shard replicas and using whichever responds first) are Google's primary tail-latency mitigation. The hot-tier index adds complexity: index correctness requires that a document appearing in the hot tier is excluded from the cold-tier results for the same query, requiring a docID exclusion list at merge time.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 08 Google: Docs Real-time Collaboration ───────────────────────────────
  {
    id: 'google-docs-collab',
    title: 'Google: Docs Real-time Collaboration',
    description:
      'At Google scale: 1B+ Google Docs documents, 2B Workspace users, concurrent collaborative editing sessions in the hundreds of millions. Design the real-time collaboration backend for Google Docs — specifically, the Operational Transformation sequencing server, the operation log, and the session presence system — referencing Google\'s published Wave OT protocol and the actual Jupiter collaboration system.',
    difficulty: 'expert',
    category: 'real-time',
    company: 'google',
    timeLimit: 55,
    requirements: [
      'Multiple clients can edit the same document simultaneously with convergence guaranteed',
      'Each client operation (insert, delete, format) is transformed and broadcast to all other clients within 100ms',
      'OT server assigns a total order to operations using a monotonically increasing revision number',
      'Clients maintain a local shadow copy and apply incoming operations in revision order',
      'Cursor positions from all collaborators are broadcast in real-time with < 50ms latency',
      'The operation log is the source of truth — document state can be reconstructed from the op log at any revision',
      'Periodic snapshots (every 100 revisions) allow fast document load without replaying the full op log',
      'Collaborators list is shown in real-time; joining/leaving is reflected within 2 seconds',
      'Offline edits are batched locally and replayed against the server state upon reconnection',
    ],
    nonFunctionalRequirements: [
      '1B documents; 200M concurrent active editing sessions at peak',
      'Operation commit and broadcast latency < 100ms at p99',
      'Cursor broadcast latency < 50ms at p99',
      '99.99% availability on the document editing path',
      'Op log storage: average 50K operations per document × 1B documents = 50T operation records',
      'Document load time (from snapshot + recent ops): < 1 second for documents with < 10K revisions',
    ],
    constraints: [
      'Google\'s Jupiter collaboration system pins each active document session to a single OT server instance for the session duration — no distributed OT is used in production',
      'The operation log is stored in Google\'s Bigtable (wide-row format: row key = docID, column = revisionNumber), enabling fast range scans for recent ops',
      'Cursor positions are ephemeral — they are NOT persisted to the op log, only broadcast via a Pub/Sub channel',
    ],
    hints: [
      'The OT server is the most critical component: it must be a single sequencer per document to ensure total operation ordering. How do you route clients to the correct OT server for their document?',
      'A consistent-hashing ring over document ID maps each document to one OT server shard. A request for document D always goes to the same OT server unless that server fails.',
      'Cursor broadcast is latency-sensitive but not durable — model it as a separate Pub/Sub channel (Redis Pub/Sub per document) entirely decoupled from the OT op log.',
      'Snapshot creation is a background task triggered every 100 ops: apply ops 1..100 to an empty document, serialise the result, write to object storage. Loading a document at revision 350 means loading snapshot at 300 + replaying ops 301..350.',
      'Offline reconnection replay: the client sends its buffered operations with a base revision number; the OT server transforms them against the operations that occurred since that revision and applies them in order.',
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
        node('auth', 'Auth Service (OAuth)', 'generic_auth_server', ComponentCategory.Security, 260, 650),
        node('lb', 'L7 Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 350),
        node('doc-router', 'Document Router Service', 'generic_microservice', ComponentCategory.Compute, 700, 250),
        node('ot-server', 'OT Server (Jupiter)', 'generic_microservice', ComponentCategory.Compute, 700, 450),
        node('presence-svc', 'Presence & Cursor Service', 'generic_microservice', ComponentCategory.Compute, 700, 650),
        node('snapshot-svc', 'Snapshot Service', 'generic_microservice', ComponentCategory.Compute, 700, 850),
        node('redis-routing', 'Doc Routing Cache', 'generic_redis', ComponentCategory.Database, 960, 250),
        node('redis-presence', 'Presence Pub/Sub (Redis)', 'generic_redis', ComponentCategory.Database, 960, 600),
        node('postgres', 'Document Metadata DB', 'generic_postgresql', ComponentCategory.Database, 960, 800),
        node('object-store', 'Snapshot Storage', 'generic_object_storage', ComponentCategory.Storage, 1200, 800),
        node('op-log', 'Operation Log (Bigtable-style)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 500),
        node('kafka', 'Op Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 300),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
        node('tracing', 'Distributed Tracing', 'generic_distributed_tracing', ComponentCategory.Observability, 700, 1050),
      ],
      edges: [
        edge('b-cdn', 'browser', 'cdn', ConnectionType.SYNC_HTTP),
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-router', 'lb', 'doc-router', ConnectionType.SYNC_HTTP),
        edge('lb-presence', 'lb', 'presence-svc', ConnectionType.SYNC_HTTP),
        edge('router-redis', 'doc-router', 'redis-routing', ConnectionType.CACHE_READ),
        edge('router-ot', 'doc-router', 'ot-server', ConnectionType.SYNC_GRPC),
        edge('ot-oplog', 'ot-server', 'op-log', ConnectionType.DB_WRITE),
        edge('ot-kafka', 'ot-server', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-presence', 'kafka', 'presence-svc', ConnectionType.ASYNC_STREAM),
        edge('presence-redis', 'presence-svc', 'redis-presence', ConnectionType.CACHE_WRITE),
        edge('ot-snapshot', 'ot-server', 'snapshot-svc', ConnectionType.ASYNC_QUEUE),
        edge('snapshot-obj', 'snapshot-svc', 'object-store', ConnectionType.DB_WRITE),
        edge('snapshot-oplog', 'snapshot-svc', 'op-log', ConnectionType.DB_READ),
        edge('doc-pg', 'doc-router', 'postgres', ConnectionType.DB_READ),
        edge('cdn-obj', 'cdn', 'object-store', ConnectionType.CDN_ORIGIN),
        edge('ot-prom', 'ot-server', 'prometheus', ConnectionType.HEALTH_CHECK),
        edge('ot-tracing', 'ot-server', 'tracing', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

Google's Docs real-time collaboration system (internally called Jupiter) is built around a single-sequencer OT server per document. The Document Router Service maps each document ID to the authoritative OT Server instance using consistent hashing over document ID, ensuring all clients editing the same document connect to the same sequencer. Operations are applied by the OT Server in total order, written to the Operation Log (Bigtable-style wide-row store keyed by docID + revisionNumber), and broadcast to other clients via a Kafka event stream. Cursor positions are handled entirely separately through Redis Pub/Sub channels per document, bypassing the OT path entirely for < 50ms latency.

## Key Design Decisions

The Op Log uses a wide-row storage model (docID as the row key, revisionNumber as the column qualifier) which allows range scans for "all operations from revision R1 to R2" in a single I/O operation. This makes the "load document at current revision" query efficient even for documents with hundreds of thousands of revisions. Snapshots are triggered asynchronously by the OT Server every 100 operations: the Snapshot Service reads the full op log for the document up to the current revision, applies all operations to an empty document model, serialises the result, and writes it to Object Storage. The snapshot manifest (docID → snapshot revision → object storage path) is stored in PostgreSQL. On document load, the client receives the latest snapshot from CDN-backed Object Storage plus any operations from snapshot revision to current revision — minimising the ops-to-replay on the client.

## Scalability & Trade-offs

The OT server's single-sequencer model is the fundamental scalability constraint. With 200M active sessions and documents averaging ~5 concurrent editors, approximately 40M active OT server sessions are needed at peak. At 5K sessions per OT server instance, this requires ~8K OT server processes — achievable with small (1 vCPU, 4 GB RAM) instances. OT server failure is the primary availability risk: when an OT server crashes, its active document sessions must be re-routed to a new instance, which must replay the op log to reconstruct the in-memory document state before accepting operations. This cold-start takes 1–5 seconds for typical documents, which is the basis for the 99.99% (not 99.999%) availability SLA — occasional brief interruptions on failover are acceptable.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 09 Meta: Social Graph Service ─────────────────────────────────────────
  {
    id: 'meta-social-graph',
    title: 'Meta: Social Graph Service',
    description:
      'At Meta scale: 3B MAU on Facebook, 2B on Instagram, 1.5B on WhatsApp. Design the social graph service that powers friend/follower relationships across Meta\'s family of apps — storing the directed and undirected friendship graph, serving fast degree-1 and degree-2 neighbour lookups, and supporting privacy-aware edge queries — referencing Meta\'s TAO (The Associations and Objects) system.',
    difficulty: 'expert',
    category: 'social',
    company: 'meta',
    timeLimit: 55,
    requirements: [
      'Store friendship (undirected) and follow (directed) edges between user IDs',
      'Retrieve the friend list for a user (degree-1 neighbours) in < 20ms',
      'Check whether two users are friends or if user A follows user B in < 5ms',
      'Mutual friends: compute the intersection of two users\' friend lists efficiently',
      'Friend-of-friend (degree-2) traversal for friend suggestions: find all users within 2 hops',
      'Privacy-aware queries: filter edge results by visibility settings (Public, Friends, Only Me)',
      'Friend requests: create a pending edge that becomes a bidirectional friendship on acceptance',
      'Block relationships: prevent any content or connection between two users',
      'Cross-app social graph: a follow on Instagram should optionally surface as a friend suggestion on Facebook',
    ],
    nonFunctionalRequirements: [
      '3B users; average friend count: 200 → 600B total friendship edges',
      'Edge read latency < 5ms at p99 for is_friend() checks',
      'Friend list read latency < 20ms at p99 for lists up to 5,000 friends',
      '99.999% availability on graph read operations',
      'Write throughput: 1M edge writes per second (new friendships, blocks, follows)',
      'Privacy filter evaluation: < 2ms overhead per edge returned',
    ],
    constraints: [
      'Meta\'s production system (TAO) uses a two-tier cache architecture: L1 cache (per-region, in-process) and L2 cache (per-region, shared) backed by MySQL with a custom sharding layer',
      'The social graph is NOT stored in a native graph database (like Neo4j) at Meta scale — it uses sharded MySQL with association tables, with heavy caching',
      'Shard key for edges is the source user ID — all edges for user X are on the same shard, making friend list reads a single-shard scan',
    ],
    hints: [
      'TAO\'s key insight: model the graph as (Object, Association) pairs. Objects are entities (users, posts), associations are typed edges (friend, follows, likes). This generalises the graph beyond just friendship.',
      'Shard by source user ID — storing all outgoing edges for a user on the same shard makes friend list reads fast (no scatter-gather). The trade-off: bidirectional edges are stored twice (once per direction).',
      'The L1/L2 cache hierarchy is critical for < 5ms reads: L1 is an in-process cache per web server (hot for the current server\'s active users), L2 is a shared Redis-like cache per datacenter region.',
      'Mutual friends (intersection of two friend lists) is O(N) per list; for users with 5,000 friends each, this is 5,000 set lookups. Sorted friend lists allow merge-based intersection in O(N log N) but cache warming is key.',
      'Friend-of-friend for suggestions: do NOT traverse the full degree-2 neighbourhood for all 3B users. Pre-compute a "you might know" candidate list offline for each user daily and serve it from cache.',
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
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('graph-svc', 'Graph Service (TAO)', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('privacy-svc', 'Privacy Filter Service', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('suggest-svc', 'Friend Suggestion Service', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('request-svc', 'Friend Request Service', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('redis-l2', 'L2 Graph Cache (TAO Leader)', 'generic_redis', ComponentCategory.Database, 960, 350),
        node('redis-suggest', 'Suggestion Cache', 'generic_redis', ComponentCategory.Database, 960, 650),
        node('postgres', 'Social Graph DB (sharded MySQL)', 'generic_postgresql', ComponentCategory.Database, 960, 850),
        node('kafka', 'Graph Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 500),
        node('privacy-pg', 'Privacy Settings DB', 'generic_postgresql', ComponentCategory.Database, 1200, 700),
        node('data-wh', 'Data Warehouse (Suggestion Batch)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 300),
        node('notif-svc', 'Notification Service', 'generic_microservice', ComponentCategory.Compute, 1200, 900),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 950),
      ],
      edges: [
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('mob-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-graph', 'lb', 'graph-svc', ConnectionType.SYNC_HTTP),
        edge('lb-suggest', 'lb', 'suggest-svc', ConnectionType.SYNC_HTTP),
        edge('lb-request', 'lb', 'request-svc', ConnectionType.SYNC_HTTP),
        edge('graph-redis', 'graph-svc', 'redis-l2', ConnectionType.CACHE_READ),
        edge('graph-pg', 'graph-svc', 'postgres', ConnectionType.DB_READ),
        edge('graph-privacy', 'graph-svc', 'privacy-svc', ConnectionType.SYNC_GRPC),
        edge('privacy-pg', 'privacy-svc', 'privacy-pg', ConnectionType.DB_READ),
        edge('graph-kafka', 'graph-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('redis-l2-pg', 'redis-l2', 'postgres', ConnectionType.DB_READ),
        edge('suggest-redis', 'suggest-svc', 'redis-suggest', ConnectionType.CACHE_READ),
        edge('suggest-dw', 'data-wh', 'redis-suggest', ConnectionType.CACHE_WRITE),
        edge('kafka-dw', 'kafka', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('request-pg', 'request-svc', 'postgres', ConnectionType.DB_WRITE),
        edge('request-kafka', 'request-svc', 'kafka', ConnectionType.ASYNC_STREAM),
        edge('kafka-notif', 'kafka', 'notif-svc', ConnectionType.ASYNC_STREAM),
        edge('graph-prom', 'graph-svc', 'prometheus', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

Meta's social graph service is modelled after TAO (The Associations and Objects), Meta's production graph serving system. TAO generalises the social graph into Objects (users, pages, posts) and Associations (typed edges: friend, follows, likes, blocks). The architecture is a two-tier cache in front of a sharded MySQL backend: the L2 Graph Cache (Redis in our model, representing TAO Leaders in production) holds hot association lists per user; a cache miss falls through to the sharded PostgreSQL (representing MySQL) where all edges for a given user ID are co-located on one shard.

## Key Design Decisions

Sharding by source user ID ensures that reading all friends of user X is a single-shard scan of the association table. Bidirectional friendship edges are stored twice (as X→Y and Y→X on their respective shards) so that both "get X's friends" and "get Y's friends" are single-shard operations. Privacy filtering is enforced by a dedicated Privacy Filter Service that takes the raw edge list from the Graph Service and filters edges based on per-edge and per-user visibility settings fetched from the Privacy Settings DB. This keeps the Graph Service stateless with respect to privacy logic. Friend suggestions are pre-computed offline: a nightly batch job in the Data Warehouse computes degree-2 candidate lists per user (union of friends-of-friends minus existing friends), ranks them by mutual friend count, and writes top-50 candidates to the Suggestion Cache (Redis). The Suggest Service serves these at < 5ms without any live graph traversal.

## Scalability & Trade-offs

At 600B edges and 1M edge writes/second, the primary bottleneck is cache write-through and database replication. TAO uses a write-around cache pattern: writes go directly to the DB (bypassing the cache), and the cache is invalidated. This simplifies consistency but means cache misses spike briefly after high-write events (e.g., a celebrity adds millions of followers). The two-tier cache (L1 in-process per web server + L2 shared Redis) mitigates this: L1 absorbs reads for the web server's active users, and L2 absorbs cross-server reads. The main data consistency trade-off is that bidirectional edge writes are not atomic: X→Y is written, then Y→X. A crash between them leaves a one-directional friendship, which is resolved by an async consistency checker that runs every 5 minutes scanning for asymmetric edges.`,
    },
    rubric: DEFAULT_RUBRIC,
  },

  // ── 10 Meta: Ad Targeting Pipeline ────────────────────────────────────────
  {
    id: 'meta-ad-targeting',
    title: 'Meta: Ad Targeting Pipeline',
    description:
      'At Meta scale: $116B in annual ad revenue, 10M active advertisers, 7M ads served per second across Facebook, Instagram, and Messenger. Design the ad targeting pipeline that receives an ad request (with user context), runs a multi-stage funnel (retrieval → scoring → auction → rendering), and returns a ranked list of ads within 50ms.',
    difficulty: 'expert',
    category: 'e-commerce',
    company: 'meta',
    timeLimit: 55,
    requirements: [
      'Receive an ad request containing user ID, placement context, and page content signals',
      'Retrieve candidate ads from an index of 30M+ active ad creatives matching the user\'s targeting criteria',
      'Score each candidate ad using a multi-layer ML model (CTR prediction → CVR prediction → value model)',
      'Run a generalised second-price (GSP) auction over the scored candidates to determine winners',
      'Return the top-K ranked ads with their bid prices and creative metadata within 50ms',
      'Pacing: ensure each campaign\'s daily budget is spent smoothly across the day, not exhausted in the first hour',
      'Frequency capping: respect per-user per-campaign impression limits (e.g., max 3 impressions per day)',
      'User interest targeting: ads target users by interest categories derived from user behaviour',
      'Advertiser audience targeting: custom audiences (lookalike, retargeting) defined by advertisers',
    ],
    nonFunctionalRequirements: [
      '7M ad decisions/second; ad request latency < 50ms at p99',
      'Candidate retrieval: return top 3,000 candidates from 30M active ads in < 10ms',
      'CTR prediction model inference: score 3,000 ads in < 15ms',
      '99.999% availability on the ad serving path',
      'Pacing update frequency: budget consumption updated every 1 second per campaign',
      'User interest profile freshness: updated within 5 minutes of a user action',
    ],
    constraints: [
      'Meta\'s ad stack uses a custom inverted index (FBLearner Feature Store as signal, FBVector for ANN retrieval) for candidate retrieval — not Elasticsearch',
      'CTR models are deep neural networks (DLRM — Deep Learning Recommendation Model) trained on petabytes of interaction data',
      'The auction winner is determined by eCPM (effective CPM) = bid × predicted CTR × quality score, not raw bid alone',
    ],
    hints: [
      'Model the ad pipeline as a three-stage funnel: retrieval (30M → 3,000 candidates), scoring (3,000 → ranked list), auction (pick winners). Each stage has a strict latency budget.',
      'Candidate retrieval uses an approximate nearest-neighbour (ANN) index over user interest embeddings — think vector similarity search, not keyword matching.',
      'Pacing requires knowing current budget spend in real-time. A Redis counter per campaign updated on every ad win, with a periodic flush to the campaign DB, is the standard approach.',
      'Frequency capping requires a per-user impression counter per campaign. At 7M ad decisions/second, this is a very high-frequency Redis write; batching impression increments is essential.',
      'The CTR model is a deep neural network with billions of parameters — it runs on GPU-accelerated inference servers, not CPU. Batching multiple requests together (micro-batching) maximises GPU utilisation.',
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
        node('api-gw', 'API Gateway', 'generic_api_gateway', ComponentCategory.Networking, 260, 500),
        node('auth', 'Auth Service', 'generic_auth_server', ComponentCategory.Security, 260, 700),
        node('lb', 'Load Balancer', 'generic_load_balancer_l7', ComponentCategory.Networking, 480, 400),
        node('ad-server', 'Ad Server (Orchestrator)', 'generic_microservice', ComponentCategory.Compute, 700, 300),
        node('retrieval-svc', 'Candidate Retrieval (ANN)', 'generic_microservice', ComponentCategory.Compute, 700, 500),
        node('scoring-svc', 'CTR/CVR Scoring (GPU)', 'generic_microservice', ComponentCategory.Compute, 700, 700),
        node('auction-svc', 'Auction Service (GSP)', 'generic_microservice', ComponentCategory.Compute, 700, 900),
        node('pacing-svc', 'Pacing Service', 'generic_microservice', ComponentCategory.Compute, 700, 1100),
        node('vector-index', 'Vector Ad Index (ANN)', 'generic_vector_database', ComponentCategory.Database, 960, 400),
        node('redis-freq', 'Frequency Cap Cache', 'generic_redis', ComponentCategory.Database, 960, 600),
        node('redis-pacing', 'Budget Pacing Cache', 'generic_redis', ComponentCategory.Database, 960, 800),
        node('postgres-ads', 'Campaign & Creative DB', 'generic_postgresql', ComponentCategory.Database, 960, 1000),
        node('kafka-impressions', 'Impression Event Stream', 'generic_kafka', ComponentCategory.Messaging, 1200, 600),
        node('data-wh', 'Data Warehouse (Training)', 'generic_data_warehouse', ComponentCategory.Database, 1200, 400),
        node('user-profile', 'User Interest Profile Cache', 'generic_redis', ComponentCategory.Database, 1200, 900),
        node('prometheus', 'Prometheus', 'generic_prometheus', ComponentCategory.Observability, 480, 1150),
      ],
      edges: [
        edge('b-apigw', 'browser', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('mob-apigw', 'mobile', 'api-gw', ConnectionType.SYNC_HTTP),
        edge('apigw-auth', 'api-gw', 'auth', ConnectionType.AUTH_CHECK),
        edge('apigw-lb', 'api-gw', 'lb', ConnectionType.SYNC_HTTP),
        edge('lb-ad', 'lb', 'ad-server', ConnectionType.SYNC_HTTP),
        edge('ad-retrieval', 'ad-server', 'retrieval-svc', ConnectionType.SYNC_GRPC),
        edge('retrieval-vector', 'retrieval-svc', 'vector-index', ConnectionType.DB_READ),
        edge('retrieval-user', 'retrieval-svc', 'user-profile', ConnectionType.CACHE_READ),
        edge('ad-scoring', 'ad-server', 'scoring-svc', ConnectionType.SYNC_GRPC),
        edge('scoring-dw', 'scoring-svc', 'data-wh', ConnectionType.DB_READ),
        edge('ad-auction', 'ad-server', 'auction-svc', ConnectionType.SYNC_GRPC),
        edge('auction-pacing', 'auction-svc', 'pacing-svc', ConnectionType.SYNC_GRPC),
        edge('pacing-redis', 'pacing-svc', 'redis-pacing', ConnectionType.CACHE_READ),
        edge('ad-freq', 'ad-server', 'redis-freq', ConnectionType.CACHE_READ),
        edge('auction-pg', 'auction-svc', 'postgres-ads', ConnectionType.DB_READ),
        edge('ad-kafka', 'ad-server', 'kafka-impressions', ConnectionType.ASYNC_STREAM),
        edge('kafka-freq', 'kafka-impressions', 'redis-freq', ConnectionType.CACHE_WRITE),
        edge('kafka-pacing', 'kafka-impressions', 'redis-pacing', ConnectionType.CACHE_WRITE),
        edge('kafka-dw', 'kafka-impressions', 'data-wh', ConnectionType.ASYNC_STREAM),
        edge('ad-prom', 'ad-server', 'prometheus', ConnectionType.HEALTH_CHECK),
      ],
      explanation: `## Architecture Overview

Meta's ad targeting pipeline is a three-stage funnel executed within a 50ms latency budget. The Ad Server orchestrates the three stages synchronously via gRPC: (1) Candidate Retrieval — the Retrieval Service queries the Vector Ad Index with the user's interest embedding (from the User Interest Profile Cache) to retrieve the top 3,000 nearest-neighbour ads matching the user's targeting criteria; (2) CTR/CVR Scoring — the Scoring Service runs the DLRM (Deep Learning Recommendation Model) on the 3,000 candidates on GPU inference servers, producing a predicted click-through rate per ad; (3) Auction — the Auction Service computes eCPM = bid × CTR × quality for each candidate, runs a GSP auction to determine winners, checks pacing and frequency caps, and returns the top-K ad creatives.

## Key Design Decisions

The Vector Ad Index (modelled as a vector database) uses approximate nearest-neighbour search over 30M ad creatives indexed by targeting embedding vectors. At query time, the user's interest embedding (a 256-dimensional vector computed from their recent behaviour) is used as the query vector; ads whose targeting criteria match are pre-indexed into the ANN structure. This retrieves 3,000 candidates in < 10ms. Pacing is enforced by the Pacing Service reading current budget consumption from the Budget Pacing Cache (Redis counters updated on every impression event via Kafka). A campaign that has exhausted its daily budget is excluded from the auction by the Pacing Service before scoring, avoiding wasted scoring compute. Frequency capping uses per-user per-campaign impression counters in a Redis hash, incremented asynchronously via the Kafka impression stream (not in the critical path), and read synchronously before serving.

## Scalability & Trade-offs

The 50ms latency budget with GPU-based CTR scoring is the primary engineering challenge. GPU inference servers benefit from micro-batching: instead of running inference on one ad request at a time, the scoring service batches 50–100 concurrent requests and runs inference once, amortising the GPU kernel launch overhead. This reduces per-request scoring time from ~15ms to ~3ms at high load, but introduces a micro-batch assembly delay (~2ms). At low load, the batch doesn't fill, so scoring latency increases — a timeout-based batching strategy (send after 2ms or when batch is full) balances throughput and latency. The Vector Ad Index is the other latency risk: approximate nearest-neighbour search has non-deterministic latency depending on graph traversal depth; a timeout with a fallback to a smaller, exact-search sub-index is the standard mitigation for tail latency outliers.`,
    },
    rubric: DEFAULT_RUBRIC,
  },
];
