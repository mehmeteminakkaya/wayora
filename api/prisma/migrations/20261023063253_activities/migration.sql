-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('SIGHTSEEING', 'MUSEUM', 'FOOD', 'NATURE', 'SHOPPING', 'NIGHTLIFE', 'TRANSPORT', 'OTHER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "tripDayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'OTHER',
    "startTime" TEXT,
    "endTime" TEXT,
    "estimatedCost" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_tripDayId_idx" ON "Activity"("tripDayId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
