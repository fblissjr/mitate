Below is the timeline from last night's outage, straight from our incident channel. I want a short silent animated film that shows what happened, in order, so someone who wasn't there understands it without reading the log: which systems were involved, how the failure spread, what people did and when, and when it was actually over. The times matter — show them. Around 30–45 seconds, no narration.

```
21:02:10  deploy bot     release 4.12 rolled to 10% of api hosts
21:04:45  monitor        p95 latency on api rises from 180ms to 1.9s
21:05:30  monitor        cache hit rate drops from 94% to 31%
21:06:02  on-call (A)    paged
21:09:15  on-call (A)    rollback started on the 10%
21:11:40  monitor        db connection pool at 100% on primary
21:12:05  monitor        api errors spread to hosts NOT on 4.12
21:13:30  on-call (A)    paged database on-call (B)
21:16:50  on-call (B)    cache cluster found cold after 4.12 flushed keys on startup
21:18:20  deploy bot     rollback complete, 0% on 4.12
21:19:00  monitor        errors continue: rollback did not refill the cache
21:21:45  on-call (B)    read traffic shed to replica, rate limit raised on cache warmer
21:27:10  monitor        cache hit rate back to 88%
21:29:30  monitor        p95 latency back under 250ms
21:35:00  on-call (A)    incident closed
```
