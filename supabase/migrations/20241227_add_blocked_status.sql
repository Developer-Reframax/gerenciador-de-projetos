-- Adicionar o status 'blocked' à constraint de check da tabela projects
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status::text = ANY (ARRAY[
    'planning'::character varying, 
    'active'::character varying, 
    'on_hold'::character varying, 
    'completed'::character varying, 
    'cancelled'::character varying, 
    'archived'::character varying,
    'blocked'::character varying
]::text[]));