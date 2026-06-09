import { Eye } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export function ViewOnlyBanner() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border text-muted-foreground text-sm mb-4">
      <Eye className="w-4 h-4 shrink-0" />
      <span>
        <Trans
          i18nKey="common.viewOnlyBanner"
          t={t}
          components={{ 1: <strong /> }}
        />
      </span>
    </div>
  );
}
