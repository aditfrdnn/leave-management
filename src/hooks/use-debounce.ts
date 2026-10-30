"use client"
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { useRef } from "react";

const useDebounce = () => {
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const debounce = (func: Function, delay: number) => {
    // Jika user sedang mengetik, maka clearTimeout nya
    if (timeout.current) clearTimeout(timeout.current);

    // Jika user sudah tidak mengetik selama waktu delay, maka jalankan function nya
    timeout.current = setTimeout(() => {
      func();
      timeout.current = null;
    }, delay);
  };

  return debounce;
};

export default useDebounce;
