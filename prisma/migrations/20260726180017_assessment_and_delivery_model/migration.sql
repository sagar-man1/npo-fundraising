-- CreateTable
CREATE TABLE "ProspectAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notionId" TEXT NOT NULL,
    "deliveryModel" TEXT NOT NULL DEFAULT 'Unknown',
    "grantLikelihood" TEXT NOT NULL DEFAULT 'Medium',
    "rationale" TEXT,
    "pushedToNotionAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProspectAssessment_notionId_fkey" FOREIGN KEY ("notionId") REFERENCES "Prospect" ("notionId") ON DELETE CASCADE ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ResearchCompany" ("createdAt", "csrBudget", "csrFocus", "fitRationale", "hqCity", "id", "iitConnect", "name", "notes", "notionPageUrl", "priority", "sector", "sourceUrls", "status", "themes", "updatedAt", "warmPath") SELECT "createdAt", "csrBudget", "csrFocus", "fitRationale", "hqCity", "id", "iitConnect", "name", "notes", "notionPageUrl", "priority", "sector", "sourceUrls", "status", "themes", "updatedAt", "warmPath" FROM "ResearchCompany";
DROP TABLE "ResearchCompany";
ALTER TABLE "new_ResearchCompany" RENAME TO "ResearchCompany";
CREATE UNIQUE INDEX "ResearchCompany_name_key" ON "ResearchCompany"("name");
CREATE INDEX "ResearchCompany_sector_idx" ON "ResearchCompany"("sector");
CREATE INDEX "ResearchCompany_status_idx" ON "ResearchCompany"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProspectAssessment_notionId_key" ON "ProspectAssessment"("notionId");
