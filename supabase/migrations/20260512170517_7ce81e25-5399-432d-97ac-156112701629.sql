ALTER TABLE public.ordens_corte ADD COLUMN IF NOT EXISTS enfestador text;

UPDATE public.ordens_corte
SET enfestador = NULLIF(trim(regexp_replace(observacoes, '^\s*Enfestador\s*:\s*', '', 'i')), ''),
    observacoes = NULL
WHERE observacoes ~* '^\s*Enfestador\s*:';