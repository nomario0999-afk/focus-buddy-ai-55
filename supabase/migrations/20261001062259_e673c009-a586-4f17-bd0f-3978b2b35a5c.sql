CREATE TABLE public.app_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ref text NOT NULL,
  name text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref)
);
GRANT ALL ON public.app_activity TO service_role;
ALTER TABLE public.app_activity ENABLE ROW LEVEL SECURITY;