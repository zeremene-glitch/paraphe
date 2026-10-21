-- Scriptia: append the audit trail page to every sealed document by default.
ALTER TABLE "OrganisationGlobalSettings" ALTER COLUMN "includeAuditLog" SET DEFAULT true;

-- Existing organisations get the audit trail too.
UPDATE "OrganisationGlobalSettings" SET "includeAuditLog" = true;
