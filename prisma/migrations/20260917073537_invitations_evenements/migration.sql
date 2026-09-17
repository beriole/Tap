-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'BIRTHDAY', 'CORPORATE', 'MEMORIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventMemberRole" AS ENUM ('OWNER', 'COORGANIZER');

-- CreateEnum
CREATE TYPE "GuestAgeCategory" AS ENUM ('ADULT', 'CHILD', 'BABY');

-- CreateEnum
CREATE TYPE "InvitationState" AS ENUM ('CREATED', 'SHARED', 'OPENED', 'RESPONDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'ATTENDING', 'DECLINED', 'MAYBE');

-- CreateEnum
CREATE TYPE "RsvpQuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('QR', 'MANUAL');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "hosts" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Douala',
    "capacity" INTEGER,
    "defaultCountry" TEXT NOT NULL DEFAULT 'CM',
    "themeKey" TEXT NOT NULL DEFAULT 'royal-ivory',
    "themeSettings" JSONB NOT NULL DEFAULT '{}',
    "rsvpSettings" JSONB NOT NULL DEFAULT '{}',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "heroImageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "contentUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMember" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventMemberRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSection" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestGroup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "internalNote" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneE164" TEXT,
    "phoneRaw" TEXT,
    "email" TEXT,
    "ageCategory" "GuestAgeCategory" NOT NULL DEFAULT 'ADULT',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "attending" BOOLEAN,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestPreference" (
    "guestId" TEXT NOT NULL,
    "mealOptionId" TEXT,
    "allergies" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestPreference_pkey" PRIMARY KEY ("guestId")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "state" "InvitationState" NOT NULL DEFAULT 'CREATED',
    "sharedAt" TIMESTAMP(3),
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpResponse" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "sensitiveConsentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RsvpResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpQuestion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "RsvpQuestionType" NOT NULL,
    "label" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "perGuest" BOOLEAN NOT NULL DEFAULT false,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RsvpQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "guestId" TEXT,
    "value" JSONB NOT NULL,

    CONSTRAINT "RsvpAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpHistory" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RsvpHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealOption" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "forChildren" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInStation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "stationId" TEXT,
    "operatorName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "override" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");

-- CreateIndex
CREATE INDEX "EventMember_userId_idx" ON "EventMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventMember_eventId_userId_key" ON "EventMember"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Venue_eventId_position_idx" ON "Venue"("eventId", "position");

-- CreateIndex
CREATE INDEX "EventSection_eventId_position_idx" ON "EventSection"("eventId", "position");

-- CreateIndex
CREATE INDEX "GuestGroup_eventId_idx" ON "GuestGroup"("eventId");

-- CreateIndex
CREATE INDEX "Guest_groupId_idx" ON "Guest"("groupId");

-- CreateIndex
CREATE INDEX "Guest_phoneE164_idx" ON "Guest"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_groupId_key" ON "Invitation"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_state_idx" ON "Invitation"("state");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpResponse_invitationId_key" ON "RsvpResponse"("invitationId");

-- CreateIndex
CREATE INDEX "RsvpResponse_status_idx" ON "RsvpResponse"("status");

-- CreateIndex
CREATE INDEX "RsvpQuestion_eventId_position_idx" ON "RsvpQuestion"("eventId", "position");

-- CreateIndex
CREATE INDEX "RsvpAnswer_responseId_idx" ON "RsvpAnswer"("responseId");

-- CreateIndex
CREATE INDEX "RsvpAnswer_questionId_idx" ON "RsvpAnswer"("questionId");

-- CreateIndex
CREATE INDEX "RsvpHistory_responseId_createdAt_idx" ON "RsvpHistory"("responseId", "createdAt");

-- CreateIndex
CREATE INDEX "MealOption_eventId_position_idx" ON "MealOption"("eventId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_invitationId_key" ON "Ticket"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInStation_token_key" ON "CheckInStation"("token");

-- CreateIndex
CREATE INDEX "CheckInStation_eventId_idx" ON "CheckInStation"("eventId");

-- CreateIndex
CREATE INDEX "CheckIn_ticketId_idx" ON "CheckIn"("ticketId");

-- CreateIndex
CREATE INDEX "CheckIn_stationId_createdAt_idx" ON "CheckIn"("stationId", "createdAt");

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSection" ADD CONSTRAINT "EventSection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestGroup" ADD CONSTRAINT "GuestGroup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestPreference" ADD CONSTRAINT "GuestPreference_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestPreference" ADD CONSTRAINT "GuestPreference_mealOptionId_fkey" FOREIGN KEY ("mealOptionId") REFERENCES "MealOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GuestGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpQuestion" ADD CONSTRAINT "RsvpQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpAnswer" ADD CONSTRAINT "RsvpAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "RsvpResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpAnswer" ADD CONSTRAINT "RsvpAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RsvpQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpAnswer" ADD CONSTRAINT "RsvpAnswer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpHistory" ADD CONSTRAINT "RsvpHistory_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "RsvpResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealOption" ADD CONSTRAINT "MealOption_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInStation" ADD CONSTRAINT "CheckInStation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "CheckInStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
