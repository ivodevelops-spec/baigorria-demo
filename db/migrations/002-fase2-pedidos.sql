-- Fase 2 — campos nuevos en pedidos. Idempotente (seguro sobre una DB ya poblada).
-- tipo_entrega, cantidad_bultos → los edita LOGÍSTICA (el sync ISIS NO los pisa).
-- fecha_factura → viene de ISIS (para calcular el lead time de entrega).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_entrega    TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cantidad_bultos INTEGER;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_factura   DATE;
