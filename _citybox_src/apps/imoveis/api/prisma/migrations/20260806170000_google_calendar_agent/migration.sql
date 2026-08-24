-- Google Calendar OAuth2 per agent + event link on appointments

ALTER TABLE "imoveis"."agent_profiles"
  ADD COLUMN "google_calendar_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "google_refresh_token" TEXT,
  ADD COLUMN "google_calendar_id" TEXT DEFAULT 'primary';

ALTER TABLE "imoveis"."appointments"
  ADD COLUMN "google_event_id" TEXT;

CREATE UNIQUE INDEX "appointments_google_event_id_key"
  ON "imoveis"."appointments"("google_event_id");
