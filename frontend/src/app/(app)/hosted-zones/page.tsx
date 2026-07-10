"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import CTable, { type TableProps } from "@cloudscape-design/components/table";
import CPagination from "@cloudscape-design/components/pagination";
import CButton from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Select } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { EmptyState, LoadingBlock } from "@/components/Primitives";
import { useSplitPanel } from "@/lib/split-panel-context";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { useNotifications } from "@/lib/notifications";
import type { Zone } from "@/lib/types";

const PAGE_SIZE = 10;

export default function HostedZonesPage() {
  const router = useRouter();
  const { notify } = useNotifications();

  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Zone[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setSplitPanelOpen, setSplitPanelContent, setSplitPanelHeader } = useSplitPanel();

  // Sorting state
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<Zone> | undefined>();
  const [sortingDescending, setSortingDescending] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listZones({
        search: debouncedSearch,
        type: typeFilter,
        page,
        page_size: PAGE_SIZE,
      });
      setZones(res.items);
      setTotal(res.total);
      setSelectedItems([]);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        notify("error", err.message, "Could not load hosted zones");
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, page, notify]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  // Sync SplitPanel with selected zones
  useEffect(() => {
    if (selectedItems.length === 1) {
      const z = selectedItems[0];
      setSplitPanelHeader("Hosted zone details");
      setSplitPanelContent(
        <SpaceBetween size="l">
          <KeyValuePairs
            columns={2}
            items={[
              { label: "Hosted zone name", value: z.name },
              { label: "Type", value: `${z.type} hosted zone` },
              { label: "Hosted zone ID", value: <span className="mono">{z.id}</span> },
              { label: "Record count", value: z.record_count },
              { label: "Description", value: z.comment || "-" },
            ]}
          />
        </SpaceBetween>
      );
      setSplitPanelOpen(true);
    } else if (selectedItems.length > 1) {
      setSplitPanelHeader(`${selectedItems.length} zones selected`);
      setSplitPanelContent(null);
      setSplitPanelOpen(true);
    } else {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    }
  }, [selectedItems.length, zones]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    setDeleting(true);
    try {
      for (const zone of selectedItems) {
        await api.deleteZone(zone.id);
      }
      notify(
        "success",
        `Deleted ${selectedItems.length} hosted zone${selectedItems.length > 1 ? "s" : ""}.`
      );
      setConfirmOpen(false);
      await load();
    } catch (err) {
      notify(
        "error",
        err instanceof ApiError ? err.message : "Delete failed",
        "Could not delete hosted zone"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Client-side sort
  const sortField = sortingColumn?.sortingField as keyof Zone | undefined;
  const sortedZones = sortField
    ? [...zones].sort((a, b) => {
        const aVal = String(a[sortField] ?? "");
        const bVal = String(b[sortField] ?? "");
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
        return sortingDescending ? -cmp : cmp;
      })
    : zones;

  const columnDefinitions: TableProps.ColumnDefinition<Zone>[] = [
    {
      id: "name",
      header: "Hosted zone name",
      cell: (z) => (
        <Link href={`/hosted-zones/${z.id}`} className="table__link">
          {z.name}
        </Link>
      ),
      sortingField: "name",
      isRowHeader: true,
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => `${z.type} hosted zone`,
      sortingField: "type",
    },
    {
      id: "created_by",
      header: "Created by",
      cell: () => "Route 53",
    },
    {
      id: "record_count",
      header: "Record count",
      cell: (z) => z.record_count,
      sortingField: "record_count",
    },
    {
      id: "description",
      header: "Description",
      cell: (z) => z.comment || <span className="text-secondary">-</span>,
      sortingField: "comment",
    },
    {
      id: "id",
      header: "Hosted zone ID",
      cell: (z) => <span className="mono">{z.id}</span>,
      sortingField: "id",
    },
  ];

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} disabled={loading}>Refresh</Button>
              <Button
                variant="danger"
                disabled={selectedItems.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Delete zone
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push("/hosted-zones/create")}
              >
                Create hosted zone
              </Button>
            </SpaceBetween>
          }
        >
          Hosted zones
        </Header>
      }
    >
      <Breadcrumbs items={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Hosted zones" }]} />

      <CTable
        variant="container"
        loading={loading}
        loadingText="Loading hosted zones"
        items={sortedZones}
        trackBy="id"
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        sortingColumn={sortingColumn}
        sortingDescending={sortingDescending}
        onSortingChange={({ detail }) => {
          setSortingColumn(detail.sortingColumn);
          setSortingDescending(detail.isDescending ?? false);
        }}
        columnDefinitions={columnDefinitions}
        header={
          <Header
            variant="h2"
            counter={`(${total})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <CButton
                  iconName="refresh"
                  variant="icon"
                  ariaLabel="Refresh"
                  onClick={load}
                  disabled={loading}
                />
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
        filter={
          <div className="filter-row">
            <TextFilter
              filteringText={search}
              filteringPlaceholder="Search hosted zones by domain name"
              onChange={({ detail }) => setSearch(detail.filteringText)}
              countText={total > 0 ? `${total} match${total === 1 ? "" : "es"}` : undefined}
            />
            <Select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter((e as React.ChangeEvent<HTMLSelectElement>).target.value)
              }
              aria-label="Filter by type"
            >
              <option value="">Any type</option>
              <option value="Public">Public hosted zone</option>
              <option value="Private">Private hosted zone</option>
            </Select>
          </div>
        }
        pagination={
          total > 0 ? (
            <CPagination
              currentPageIndex={page}
              pagesCount={Math.ceil(total / PAGE_SIZE)}
              onChange={({ detail }) => setPage(detail.currentPageIndex)}
            />
          ) : undefined
        }
        empty={
          <Box textAlign="center" color="inherit" padding="l">
            <Box variant="strong" textAlign="center" color="inherit" padding="s">
              No hosted zones
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {search || typeFilter
                ? "No hosted zones match your filters."
                : "Create a hosted zone to start managing DNS records."}
            </Box>
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <CButton
                variant="primary"
                onClick={() => router.push("/hosted-zones/create")}
              >
                Create hosted zone
              </CButton>
            </SpaceBetween>
          </Box>
        }
        stickyHeader
      />

      <Modal
        title="Delete hosted zone"
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete{" "}
          <strong>
            {selectedItems.length === 1
              ? selectedItems[0].name
              : `${selectedItems.length} hosted zones`}
          </strong>
          ? This permanently removes the zone and all of its DNS records. This action cannot be
          undone.
        </p>
        {selectedItems.length > 1 && (
          <ul>
            {selectedItems.map((z) => (
              <li key={z.id} className="mono">
                {z.name}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </ContentLayout>
  );
}
