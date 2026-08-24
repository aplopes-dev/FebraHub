-- Add CREFITO to professional council enum (Parte 6 — vertentes fisio)
ALTER TYPE "clinica"."ProfessionalCouncilType" ADD VALUE IF NOT EXISTS 'CREFITO';
