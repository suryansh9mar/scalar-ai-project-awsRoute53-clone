"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Box from "@cloudscape-design/components/box";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Select, Textarea } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  Badge,
  Container,
  EmptyState,
  LoadingBlock,
} from "@/components/Primitives";
import { Column, Table } from "@/components/Table";
import { Tabs } from "@/components/Tabs";
import { useSplitPanel } from "@/lib/split-panel-context";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { useNotifications } from "@/lib/notifications";
import { RECORD_TYPES } from "@/lib/types";
import type { DnsRecord, Zone } from "@/lib/types";

const PAGE_SIZE = 10;

export default function ZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  const zoneId = params.zoneId;
  const { notify } = useNotifications();

  const [zone, setZone] = useState<Zone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [tab, setTab] = useState("records");

  const loadZone = useCallback(async () => {
    try {
      setZone(await api.getZone(zoneId));
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        notify("error", err.message, "Could not load hosted zone");
      }
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId, notify]);

  useEffect(() => { loadZone(); }, [loadZone]);

  if (zoneLoading) {
    return (
      <ContentLayout header={<Header variant="h1">Hosted zone</Header>}>
        <LoadingBlock label="Loading hosted zone" />
      </ContentLayout>
    );
  }

  if (!zone) {
    return (
      <ContentLayout header={<Header variant="h1">Hosted zone not found</Header>}>
        <Breadcrumbs
          items={[
            { label: "Route 53", href: "/hosted-zones" },
            { label: "Hosted zones", href: "/hosted-zones" },
            { label: "Not found" },
          ]}
        />
        <EmptyState
          title="Hosted zone not found"
          message="It may have been deleted."
          action={
            <a className="btn btn--primary" href="/hosted-zones">
              Back to hosted zones
            </a>
          }
        />
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={
            <>
              <Badge color={zone.type === "Public" ? "green" : "grey"}>
                {zone.type} hosted zone
              </Badge>{" "}
              <span className="mono">{zone.id}</span>
            </>
          }
        >
          {zone.name}
        </Header>
      }
    >
      <Breadcrumbs
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone.name },
        ]}
      />

      <SpaceBetween size="l">
        <Tabs
          tabs={[
            { id: "records", label: "Records" },
            { id: "details", label: "Hosted zone details" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "records" ? (
          <RecordsTab zone={zone} onZoneChange={loadZone} />
        ) : (
          <DetailsTab zone={zone} onUpdated={loadZone} />
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Records tab                                                         */
/* ------------------------------------------------------------------ */

function RecordsTab({
  zone,
  onZoneChange,
}: {
  zone: Zone;
  onZoneChange: () => void;
}) {
  const { notify } = useNotifications();

  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { setSplitPanelOpen, setSplitPanelContent, setSplitPanelHeader } = useSplitPanel();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listRecords(zone.id, {
        search: debouncedSearch,
        type: typeFilter,
        page,
        page_size: PAGE_SIZE,
      });
      setRecords(res.items);
      setTotal(res.total);
      setSelected(new Set());
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        notify("error", err.message, "Could not load records");
      }
    } finally {
      setLoading(false);
    }
  }, [zone.id, debouncedSearch, typeFilter, page, notify]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const refresh = () => { load(); onZoneChange(); };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(records.map((r) => r.id)) : new Set());

  const selectedRecords = records.filter((r) => selected.has(r.id));

  // Sync SplitPanel with selected records
  useEffect(() => {
    if (selectedRecords.length === 1) {
      const r = selectedRecords[0];
      setSplitPanelHeader("Record details");
      setSplitPanelContent(
        <SpaceBetween size="l">
          <KeyValuePairs
            columns={2}
            items={[
              { label: "Record name", value: r.name },
              { label: "Type", value: r.type },
              { label: "Routing policy", value: r.routing_policy },
              { label: "TTL", value: `${r.ttl} seconds` },
            ]}
          />
          <Box>
            <Box variant="awsui-key-label">Value / Route traffic to</Box>
            <div className="value-cell" style={{ marginTop: 4 }}>{r.value}</div>
          </Box>
        </SpaceBetween>
      );
      setSplitPanelOpen(true);
    } else if (selectedRecords.length > 1) {
      setSplitPanelHeader(`${selectedRecords.length} records selected`);
      setSplitPanelContent(null);
      setSplitPanelOpen(true);
    } else {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    }
  }, [selected.size, records]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => router.push(`/hosted-zones/${zone.id}/records/create`);
  const openEdit = () => {
    if (selectedRecords.length === 1) {
      router.push(`/hosted-zones/${zone.id}/records/${selectedRecords[0].id}/edit`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      for (const record of selectedRecords) {
        await api.deleteRecord(zone.id, record.id);
      }
      notify("success", `Deleted ${selectedRecords.length} record${selectedRecords.length > 1 ? "s" : ""}.`);
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Delete failed", "Could not delete record");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<DnsRecord>[] = [
    { key: "name", header: "Record name", render: (r) => r.name },
    { key: "type", header: "Type", render: (r) => <Badge color="grey">{r.type}</Badge> },
    { key: "routing_policy", header: "Routing policy", render: (r) => r.routing_policy },
    { key: "value", header: "Value/Route traffic to", render: (r) => <div className="value-cell">{r.value}</div> },
    { key: "ttl", header: "TTL (seconds)", render: (r) => r.ttl },
  ];

  return (
    <>
      <Container title="Records" count={total} flush
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refresh} disabled={loading}>Refresh</Button>
            <Button disabled={selectedRecords.length !== 1} onClick={openEdit}>Edit</Button>
            <Button variant="danger" disabled={selected.size === 0} onClick={() => setConfirmOpen(true)}>Delete</Button>
            <Button variant="primary" onClick={openCreate}>Create record</Button>
          </SpaceBetween>
        }
      >
        <div className="filter-row">
          <TextFilter
            filteringText={search}
            filteringPlaceholder="Search records by name or value"
            onChange={({ detail }) => setSearch(detail.filteringText)}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter((e as React.ChangeEvent<HTMLSelectElement>).target.value)}
            aria-label="Filter by record type"
          >
            <option value="">All types</option>
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <LoadingBlock label="Loading records" />
        ) : (
          <>
            <Table
              columns={columns}
              rows={records}
              rowKey={(r) => r.id}
              selectable
              selectedIds={selected}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              empty={
                <EmptyState
                  title="No records"
                  message={search || typeFilter ? "No records match your filters." : "Create a record to route traffic for this domain."}
                  action={<Button variant="primary" onClick={openCreate}>Create record</Button>}
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
        title="Delete record"
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
            {selectedRecords.length === 1
              ? `${selectedRecords[0].name} (${selectedRecords[0].type})`
              : `${selectedRecords.length} records`}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Details tab                                                         */
/* ------------------------------------------------------------------ */

function DetailsTab({
  zone,
  onUpdated,
}: {
  zone: Zone;
  onUpdated: () => void;
}) {
  const { notify } = useNotifications();
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(zone.comment);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateZone(zone.id, comment.trim());
      notify("success", "Hosted zone description updated.");
      setEditing(false);
      onUpdated();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Update failed", "Could not update hosted zone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container
      title="Hosted zone details"
      actions={
        !editing && (
          <Button onClick={() => setEditing(true)}>Edit description</Button>
        )
      }
    >
      <SpaceBetween size="l">
        <KeyValuePairs
          columns={3}
          items={[
            { label: "Hosted zone name", value: zone.name },
            { label: "Type", value: `${zone.type} hosted zone` },
            { label: "Hosted zone ID", value: <span className="mono">{zone.id}</span> },
            { label: "Record count", value: zone.record_count },
            { label: "Created", value: new Date(zone.created_at).toLocaleString() },
          ]}
        />

        <Box>
          <Box variant="awsui-key-label">Description</Box>
          {editing ? (
            <SpaceBetween size="s">
              <Textarea
                value={comment}
                onChange={(e) =>
                  setComment((e as React.ChangeEvent<HTMLTextAreaElement>).target.value)
                }
                rows={3}
              />
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => { setComment(zone.comment); setEditing(false); }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={save} loading={saving}>
                  Save
                </Button>
              </SpaceBetween>
            </SpaceBetween>
          ) : (
            <Box color="text-body-secondary">
              {zone.comment || <span style={{ color: "var(--color-text-empty)" }}>-</span>}
            </Box>
          )}
        </Box>
      </SpaceBetween>
    </Container>
  );
}
