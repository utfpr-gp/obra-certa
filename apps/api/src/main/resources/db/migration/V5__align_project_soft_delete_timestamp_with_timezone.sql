-- Alinha o carimbo de exclusão lógica da obra ao tipo temporal da arquitetura.
ALTER TABLE projects
    ALTER COLUMN deleted_at TYPE timestamptz(6)
    USING deleted_at AT TIME ZONE 'UTC';
