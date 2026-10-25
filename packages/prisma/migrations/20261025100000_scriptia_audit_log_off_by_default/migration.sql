-- Scriptia: the signed PDF ends with the Certificate of Completion only; the audit trail page is opt-in.
ALTER TABLE "OrganisationGlobalSettings" ALTER COLUMN "includeAuditLog" SET DEFAULT false;

UPDATE "OrganisationGlobalSettings" SET "includeAuditLog" = false;
