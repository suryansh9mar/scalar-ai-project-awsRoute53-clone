"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Select } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { Container, EmptyState, LoadingBlock } from "@/components/Primitives";
import { Column, Table } from "@/components/Table";
import { useSplitPanel } from "@/lib/split-panel-context";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setSplitPanelOpen, setSplitPanelContent, setSplitPanelHeader } = useSplitPanel();

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
      setSelected(new Set());
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

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(zones.map((z) => z.id)) : new Set());

  const selectedZones = zones.filter((z) => selected.has(z.id));

  // Sync SplitPanel with selected zones
  useEffect(() => {
    if (selectedZones.length === 1) {
      const z = selectedZones[0];
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
    } else if (selectedZones.length > 1) {
      setSplitPanelHeader(`${selectedZones.length} zones selected`);
      setSplitPanelContent(null);
      setSplitPanelOpen(true);
    } else {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    }
  }, [selected.size, zones]); // eslint-disable-line react-hooks/exhaustive-deps

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
      for (const zone of selectedZones) {
        await api.deleteZone(zone.id);
      }
      notify(
        "success",
        `Deleted ${selectedZones.length} hosted zone${selectedZones.length > 1 ? "s" : ""}.`
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

  const columns: Column<Zone>[] = [
    {
      key: "name",
      header: "Hosted zone name",
      render: (z) => (
        <Link href={`/hosted-zones/${z.id}`} className="table__link">
          {z.name}
        </Link>
      ),
    },
    { key: "type", header: "Type", render: (z) => `${z.type} hosted zone` },
    { key: "created_by", header: "Created by", render: () => "Route 53" },
    { key: "record_count", header: "Record count", render: (z) => z.record_count },
    {
      key: "description",
      header: "Description",
      render: (z) => z.comment || <span className="text-secondary">-</span>,
    },
    { key: "id", header: "Hosted zone ID", render: (z) => <span className="mono">{z.id}</span> },
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
                disabled={selected.size === 0}
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

      <Container title="Hosted zones" count={total} flush>
        <div className="filter-row">
          <TextFilter
            filteringText={search}
            filteringPlaceholder="Search hosted zones by domain name"
            onChange={({ detail }) => setSearch(detail.filteringText)}
            countText={total > 0 ? `${total} match${total === 1 ? "" : "es"}` : undefined}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter((e as React.ChangeEvent<HTMLSelectElement>).target.value)}
            aria-label="Filter by type"
          >
            <option value="">Any type</option>
            <option value="Public">Public hosted zone</option>
            <option value="Private">Private hosted zone</option>
          </Select>
        </div>

        {loading ? (
          <LoadingBlock label="Loading hosted zones" />
        ) : (
          <>
            <Table
              columns={columns}
              rows={zones}
              rowKey={(z) => z.id}
              selectable
              selectedIds={selected}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              empty={
                <EmptyState
                  title="No hosted zones"
                  message={
                    search || typeFilter
                      ? "No hosted zones match your filters."
                      : "Create a hosted zone to start managing DNS records."
                  }
                  action={
                    <Button
                      variant="primary"
                      onClick={() => router.push("/hosted-zones/create")}
                    >
                      Create hosted zone
                    </Button>
                  }
                />
              }
            />
            {total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )}
          </>
        )}
      </Container>

      <Modal
        title="Delete hosted zone"
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p>
          Delete{" "}
          <strong>
            {selectedZones.length === 1
              ? selectedZones[0].name
              : `${selectedZones.length} hosted zones`}
          </strong>
          ? This permanently removes the zone and all of its DNS records. This action cannot be undone.
        </p>
        {selectedZones.length > 1 && (
          <ul>
            {selectedZones.map((z) => (
              <li key={z.id} className="mono">{z.name}</li>
            ))}
          </ul>
        )}
      </Modal>
    </ContentLayout>
  );
}
