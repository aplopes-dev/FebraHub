-- Dedupe de eventos citybox.store.* (outbox at-least-once do admin-api)

CREATE TABLE "imoveis"."processed_events" (
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "processed_events_aggregate_id_idx"
  ON "imoveis"."processed_events"("aggregate_id");
