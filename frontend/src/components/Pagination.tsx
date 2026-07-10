"use client";

import CPagination from "@cloudscape-design/components/pagination";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
      <CPagination
        currentPageIndex={page}
        pagesCount={pageCount}
        onChange={({ detail }) => onPageChange(detail.currentPageIndex)}
        ariaLabels={{
          nextPageLabel: "Next page",
          previousPageLabel: "Previous page",
          pageLabel: (pageNumber) => `Page ${pageNumber}`,
        }}
      />
    </div>
  );
}
