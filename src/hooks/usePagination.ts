'use client';

import { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => { setPage(1); }, [pageSize]);

  const { paginatedItems, currentPage, totalPages } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    return { paginatedItems: items.slice(start, start + pageSize), currentPage, totalPages };
  }, [items, page, pageSize]);

  return {
    paginatedItems,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: items.length,
  };
}
