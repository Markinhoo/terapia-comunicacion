import { useEffect, useMemo, useState } from 'react';

export function usePaginatedList(items, pageSize = 5, resetKey = '') {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    setPage((actual) => Math.min(actual, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    hasPagination: items.length > pageSize,
    setPage
  };
}
