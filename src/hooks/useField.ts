import { FormEvent, useCallback, useMemo, useState } from "react";

type UseField = [
  value: string,
  bind: {
    value: string;
    onChange: (event: FormEvent<HTMLInputElement>) => void;
  },
  set: (newValue: string) => void,
  reset: () => void,
];

const useField = (initialValue: string = ''): UseField => {
  const [value, set] = useState<string>(initialValue)
  const reset = useCallback(() => set(initialValue), [initialValue])
  const bind = useMemo(() => ({
    value,
    onChange: (event: FormEvent<HTMLInputElement>) => set(event.currentTarget.value),
  }), [value])

  return [
    value,
    bind,
    set,
    reset,
  ]
}

export default useField;
