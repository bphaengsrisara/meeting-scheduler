import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { dashboardHref, type DashboardParams } from "./dashboard-params";
import { pageNumbers } from "./page-numbers";

// Links to the same page with another ?page=, so each page has a URL. On a
// phone: Previous, "Page 2 of 3", Next (a missing one keeps its space);
// the numbers show from sm up.
export function MeetingsPagination({
  params,
  totalPages,
}: Readonly<{
  params: DashboardParams;
  totalPages: number;
}>) {
  if (totalPages <= 1) return null;
  const page = Math.min(params.page, totalPages);
  const href = (to: number) => dashboardHref(params, { page: to });

  return (
    <Pagination>
      <PaginationContent className="w-full justify-between sm:w-auto sm:justify-center">
        <PaginationItem className={page > 1 ? "" : "invisible sm:hidden"}>
          <PaginationPrevious href={href(Math.max(page - 1, 1))} />
        </PaginationItem>
        {pageNumbers(page, totalPages).map((number, i) => (
          <PaginationItem
            key={number === "…" ? `gap-${i}` : number}
            className="hidden sm:list-item"
          >
            {number === "…" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(number)} isActive={number === page}>
                {number}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem className="text-sm text-muted-foreground tabular-nums sm:order-last sm:ml-2">
          Page {page} of {totalPages}
        </PaginationItem>
        <PaginationItem
          className={page < totalPages ? "" : "invisible sm:hidden"}
        >
          <PaginationNext href={href(Math.min(page + 1, totalPages))} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
