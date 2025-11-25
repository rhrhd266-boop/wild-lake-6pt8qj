import { FormEvent, useCallback, useMemo, useState } from "react";

type UseCheckbox = [
  checked: boolean,
  bind: {
    checked: boolean;
    onChange: (event: FormEvent<HTMLInputElement>) => void;
  },
  set: (newValue: boolean) => void,
  reset: () => void,
];

const useCheckbox = (initialChecked: boolean = false): UseCheckbox => {
  const [checked, set] = useState<boolean>(initialChecked)
  const reset = useCallback(() => set(initialChecked), [initialChecked])
  const bind = useMemo(() => ({
    checked,
    onChange: (event: FormEvent<HTMLInputElement>) => set(event.currentTarget.checked),
  }), [checked])

  return [
    checked,
    bind,
    set,
    reset,
  ]
}

export default useCheckbox;
