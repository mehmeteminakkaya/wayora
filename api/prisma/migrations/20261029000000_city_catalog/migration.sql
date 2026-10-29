-- Keşif rehberi: 10 şehir ve detaylı deneyim kataloğu.

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "bestSeason" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityExperience" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "neighborhood" TEXT,
    "address" TEXT,
    "rating" DOUBLE PRECISION,
    "durationMinutes" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "priceNote" TEXT,
    "description" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openingHours" TEXT,
    "bookingUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityExperience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CityExperience_googlePlaceId_key" ON "CityExperience"("googlePlaceId");

-- CreateIndex
CREATE INDEX "CityExperience_cityId_category_idx" ON "CityExperience"("cityId", "category");

-- CreateIndex
CREATE INDEX "CityExperience_cityId_sortOrder_idx" ON "CityExperience"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CityExperience_cityId_slug_key" ON "CityExperience"("cityId", "slug");

-- AddForeignKey
ALTER TABLE "CityExperience" ADD CONSTRAINT "CityExperience_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

