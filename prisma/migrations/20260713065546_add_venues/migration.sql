-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('CONFERENCE', 'JOURNAL');

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "type" "VenueType" NOT NULL DEFAULT 'CONFERENCE',
    "field" TEXT,
    "siteUrl" TEXT,
    "submitUrl" TEXT,
    "color" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueDate" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "note" TEXT,

    CONSTRAINT "VenueDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueDate_venueId_idx" ON "VenueDate"("venueId");

-- CreateIndex
CREATE INDEX "VenueDate_date_idx" ON "VenueDate"("date");

-- AddForeignKey
ALTER TABLE "VenueDate" ADD CONSTRAINT "VenueDate_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
