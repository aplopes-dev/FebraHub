-- CreateIndex
CREATE INDEX "idx_appointments_fts" ON "appointments" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "idx_leads_fts" ON "leads" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "idx_properties_fts" ON "properties" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "idx_transactions_fts" ON "transactions" USING GIN ("search_vector");
