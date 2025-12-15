import { useI18n } from 'vue-i18n';

export function useErrorMessage() {
  const { t } = useI18n();

  const errorValue = (err: string | { key: string; values: Record<string, unknown> }) => {
    return typeof err === 'object' ? t(err.key, err.values) : t(err);
  };

  return {
    errorValue,
  };
}
