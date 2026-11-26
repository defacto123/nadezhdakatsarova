-- Boutique mode: curated single-catalog feed of products.
ALTER TABLE "Product" ADD COLUMN "inBoutique" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "boutiqueSortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_inBoutique_boutiqueSortOrder_idx" ON "Product"("inBoutique", "boutiqueSortOrder");
