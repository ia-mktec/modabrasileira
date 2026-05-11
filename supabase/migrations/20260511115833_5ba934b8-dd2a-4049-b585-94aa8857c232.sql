UPDATE ordens_corte oc
SET quantidade_pecas = g.total
FROM (
  SELECT ordem_corte_id,
         SUM(COALESCE(pp,0)+COALESCE(p,0)+COALESCE(m,0)+COALESCE(g,0)+COALESCE(gg,0)+COALESCE(g1,0)+COALESCE(g2,0)+COALESCE(g3,0)) AS total
  FROM grade_corte
  GROUP BY ordem_corte_id
) g
WHERE oc.id = g.ordem_corte_id
  AND oc.quantidade_pecas <> g.total;