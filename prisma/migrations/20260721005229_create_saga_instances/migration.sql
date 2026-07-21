-- CreateEnum
CREATE TYPE "saga_status" AS ENUM ('RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "saga_instances" (
    "work_order_id" UUID NOT NULL,
    "status" "saga_status" NOT NULL,
    "step" TEXT NOT NULL,
    "parts_reserved" BOOLEAN NOT NULL,
    "quote_generated" BOOLEAN NOT NULL,
    "payment_confirmed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saga_instances_pkey" PRIMARY KEY ("work_order_id")
);
