-- Dedupe de eventos citybox.store.* (outbox at-least-once do admin-api).
CREATE TABLE IF NOT EXISTS "beautiful"."processed_events" (
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX IF NOT EXISTS "processed_events_aggregate_id_idx"
  ON "beautiful"."processed_events"("aggregate_id");
