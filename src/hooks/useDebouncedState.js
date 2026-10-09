import { useState, useMemo, useEffect } from 'react';
import { debounce } from 'lodash-es';

// Immediate value for the controlled input + a debounced value for filtering/API calls.
// Returns [inputValue, debouncedValue, setInputValue]
const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetter = useMemo(() => debounce(setDebouncedValue, delay), [delay]);
  useEffect(() => () => debouncedSetter.cancel(), [debouncedSetter]);

  const setInputValue = (next) => {
    const v = next && typeof next === 'object' && 'target' in next ? next.target.value : next;
    setValue(v);
    debouncedSetter(v);
  };

  return [value, debouncedValue, setInputValue];
};

export default useDebouncedState;
