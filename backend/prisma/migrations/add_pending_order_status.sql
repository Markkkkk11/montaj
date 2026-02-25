-- Добавление статуса PENDING в enum OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'PUBLISHED';

