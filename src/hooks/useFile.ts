import { FormEvent, useCallback, useMemo, useState } from "react";

type UseField = [
  value: FileList | null,
  bind: {
    onChange: (event: FormEvent<HTMLInputElement>) => void;
  },
  reset: () => void,
];

const useField = (): UseField => {
  const [value, set] = useState<FileList | null>(null)
  const reset = useCallback(() => set(null), [])
  const bind = useMemo(() => ({
    onChange: (event: FormEvent<HTMLInputElement>) => set(event.currentTarget.files),
  }), [])

  return [
    value,
    bind,
    reset,
  ]
}

export default useField;
