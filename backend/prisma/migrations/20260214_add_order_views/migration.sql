-- CreateTable
CREATE TABLE "order_views" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_views_orderId_idx" ON "order_views"("orderId");

-- CreateIndex
CREATE INDEX "order_views_executorId_idx" ON "order_views"("executorId");

-- CreateIndex
CREATE UNIQUE INDEX "order_views_orderId_executorId_key" ON "order_views"("orderId", "executorId");

-- AddForeignKey
ALTER TABLE "order_views" ADD CONSTRAINT "order_views_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_views" ADD CONSTRAINT "order_views_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

