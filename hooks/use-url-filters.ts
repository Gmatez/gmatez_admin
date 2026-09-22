'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useUrlFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function setParams(next: Record<string, string | null>, resetPage = false) {
    const current = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) current.delete(key);
      else current.set(key, value);
    }
    if (resetPage) current.set('page', '1');
    if (!current.get('page')) current.set('page', '1');
    router.replace(`${pathname}?${current.toString()}`);
  }

  return {
    params,
    page: Number(params.get('page') ?? '1') || 1,
    pageSize: Number(params.get('pageSize') ?? '25') || 25,
    setParams,
  };
}

export function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
