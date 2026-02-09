-- Добавление колонки commissionPaid в таблицу responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS "commissionPaid" DECIMAL(10, 2) DEFAULT 0;

-- Обновление существующих записей (если есть)
UPDATE responses SET "commissionPaid" = 0 WHERE "commissionPaid" IS NULL;

