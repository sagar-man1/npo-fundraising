-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "found" INTEGER NOT NULL DEFAULT 0,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResearchCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "hqCity" TEXT,
    "csrBudget" TEXT,
    "csrFocus" TEXT,
    "themes" TEXT NOT NULL DEFAULT '[]',
    "iitConnect" TEXT,
    "warmPath" TEXT,
    "fitRationale" TEXT,
    "deliveryModel" TEXT NOT NULL DEFAULT 'Unknown',
    "grantLikelihood" TEXT NOT NULL DEFAULT 'Medium',
    "externalGrantEvidence" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Tier 3',
    "status" TEXT NOT NULL DEFAULT 'New',
    "sourceUrls" TEXT,
    "notes" TEXT,
    "notionPageUrl" TEXT,
    "discoveredBy" TEXT NOT NULL DEFAULT 'manual',
    "notifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ResearchCompany" ("createdAt", "csrBudget", "csrFocus", "deliveryModel", "externalGrantEvidence", "fitRationale", "grantLikelihood", "hqCity", "id", "iitConnect", "name", "notes", "notionPageUrl", "priority", "sector", "sourceUrls", "status", "themes", "updatedAt", "warmPath") SELECT "createdAt", "csrBudget", "csrFocus", "deliveryModel", "externalGrantEvidence", "fitRationale", "grantLikelihood", "hqCity", "id", "iitConnect", "name", "notes", "notionPageUrl", "priority", "sector", "sourceUrls", "status", "themes", "updatedAt", "warmPath" FROM "ResearchCompany";
DROP TABLE "ResearchCompany";
ALTER TABLE "new_ResearchCompany" RENAME TO "ResearchCompany";
CREATE UNIQUE INDEX "ResearchCompany_name_key" ON "ResearchCompany"("name");
CREATE INDEX "ResearchCompany_sector_idx" ON "ResearchCompany"("sector");
CREATE INDEX "ResearchCompany_status_idx" ON "ResearchCompany"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JobRun_job_startedAt_idx" ON "JobRun"("job", "startedAt");
