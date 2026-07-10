"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Box from "@cloudscape-design/components/box";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Badge from "@cloudscape-design/components/badge";
import CButton from "@cloudscape-design/components/button";
import CTabs from "@cloudscape-design/components/tabs";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import PropertyFilter, {
  type PropertyFilterProps,
} from "@cloudscape-design/components/property-filter";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Modal } from "@/components/Modal";
import { Select, Textarea } from "@/components/Field";
import { EmptyState, LoadingBlock } from "@/components/Primitives";
import { useSplitPanel } from "@/lib/split-panel-context";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import { useNotifications } from "@/lib/notifications";
import { RECORD_TYPES } from "@/lib/types";
import type { DnsRecord, Zone } from "@/lib/types";

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Property filter configuration                                       */
/* ------------------------------------------------------------------ */

const FILTER_PROPERTIES: PropertyFilterProps.FilteringProperty[] = [
  {
    key: "name",
    propertyLabel: "Record name",
    groupValuesLabel: "Record name values",
    operators: ["=", "!=", ":", "!:"],
  },
  {
    key: "type",
    propertyLabel: "Type",
    groupValuesLabel: "Type values",
    operators: ["=", "!="],
  },
  {
    key: "routing_policy",
    propertyLabel: "Routing policy",
    groupValuesLabel: "Routing policy values",
    operators: ["=", "!="],
  },
  {
    key: "alias",
    propertyLabel: "Alias",
    groupValuesLabel: "Alias values",
    operators: ["=", "!="],
  },
];

/* ------------------------------------------------------------------ */
/* Root page                                                           */
/* ------------------------------------------------------------------ */

export default function ZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  const zoneId = params.zoneId;
  const { notify } = useNotifications();

  const [zone, setZone] = useState<Zone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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
      disableOverlap
      header={
        <Header
          variant="h1"
          description={
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <Badge color="blue">Public</Badge>
              <span style={{ fontWeight: 400, fontSize: "1rem" }}>{zone.name}</span>
              <CButton variant="inline-link" iconAlign="right">
                Info
              </CButton>
            </SpaceBetween>
          }
          // actions={
          //   <SpaceBetween direction="horizontal" size="xs">
          //     <CButton variant="normal">Delete zone</CButton>
          //     <CButton variant="normal">Test record</CButton>
          //     <CButton variant="normal">Configure query logging</CButton>
          //     <CButton variant="normal">Edit hosted zone</CButton>
          //   </SpaceBetween>
          // }
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

      <SpaceBetween size="m">
        {/* ── Expandable "Hosted zone details" (replaces the old tab) ── */}
        <ExpandableSection
          headerText="Hosted zone details"
          variant="container"
          expanded={detailsExpanded}
          onChange={({ detail }) => setDetailsExpanded(detail.expanded)}
          headerActions={
            <CButton variant="normal">Edit hosted zone</CButton>
          }
        >
          <DetailsContent zone={zone} onUpdated={loadZone} />
        </ExpandableSection>

        {/* ── Tabs ── */}
        <CTabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: "records",
              label: `Records (${zone.record_count})`,
              content: (
                <RecordsTab zone={zone} onZoneChange={loadZone} />
              ),
            },
            {
              id: "accelerated",
              label: "Accelerated recovery",
              content: (
                <Box padding="l" color="text-status-inactive" textAlign="center">
                  Accelerated recovery is not configured for this hosted zone.
                </Box>
              ),
            },
            {
              id: "dnssec",
              label: "DNSSEC signing",
              content: (
                <Box padding="l" color="text-status-inactive" textAlign="center">
                  DNSSEC signing is not enabled for this hosted zone.
                </Box>
              ),
            },
            {
              id: "tags",
              label: "Hosted zone tags (0)",
              content: (
                <Box padding="l" color="text-status-inactive" textAlign="center">
                  No tags associated with this hosted zone.
                </Box>
              ),
            },
          ]}
        />
      </SpaceBetween>
    </ContentLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Hosted zone details content (used inside ExpandableSection)        */
/* ------------------------------------------------------------------ */

function DetailsContent({
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
              <CButton
                onClick={() => { setComment(zone.comment); setEditing(false); }}
                disabled={saving}
              >
                Cancel
              </CButton>
              <CButton variant="primary" onClick={save} loading={saving}>
                Save
              </CButton>
            </SpaceBetween>
          </SpaceBetween>
        ) : (
          <SpaceBetween direction="horizontal" size="xs" alignItems="center">
            <Box color="text-body-secondary">
              {zone.comment || <span style={{ color: "var(--color-text-empty)" }}>-</span>}
            </Box>
            <CButton variant="inline-link" onClick={() => setEditing(true)}>
              Edit description
            </CButton>
          </SpaceBetween>
        )}
      </Box>
    </SpaceBetween>
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
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DnsRecord[]>([]);
  const { setSplitPanelOpen, setSplitPanelContent, setSplitPanelHeader } = useSplitPanel();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Property filter state
  const [filterQuery, setFilterQuery] = useState<PropertyFilterProps.Query>({
    tokens: [],
    operation: "and",
  });

  // Derive simple search + type from PropertyFilter tokens for the API call
  const searchToken = filterQuery.tokens.find((t) => t.propertyKey === "name" || !t.propertyKey);
  const typeToken = filterQuery.tokens.find((t) => t.propertyKey === "type");
  const debouncedSearch = useDebounce(searchToken?.value ?? "", 300);
  const typeFilter = typeToken?.value ?? "";

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
      setSelectedItems([]);
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

  // Sync SplitPanel with selected records
  useEffect(() => {
    if (selectedItems.length === 1) {
      const r = selectedItems[0];
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
    } else if (selectedItems.length > 1) {
      setSplitPanelHeader(`${selectedItems.length} records selected`);
      setSplitPanelContent(null);
      setSplitPanelOpen(true);
    } else {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    }
  }, [selectedItems.length, records]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSplitPanelContent(null);
      setSplitPanelOpen(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => router.push(`/hosted-zones/${zone.id}/records/create`);
  const openEdit = () => {
    if (selectedItems.length === 1) {
      router.push(`/hosted-zones/${zone.id}/records/${selectedItems[0].id}/edit`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      for (const record of selectedItems) {
        await api.deleteRecord(zone.id, record.id);
      }
      notify("success", `Deleted ${selectedItems.length} record${selectedItems.length > 1 ? "s" : ""}.`);
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Delete failed", "Could not delete record");
    } finally {
      setDeleting(false);
    }
  };

  // Apply client-side filtering for alias and routing_policy tokens
  const aliasToken = filterQuery.tokens.find((t) => t.propertyKey === "alias");
  const routingToken = filterQuery.tokens.find((t) => t.propertyKey === "routing_policy");

  const visibleRecords = records.filter((r) => {
    if (aliasToken) {
      const isAlias = (r.type === "A" || r.type === "AAAA" || r.type === "CNAME") ? "Yes" : "No";
      if (aliasToken.operator === "=" && isAlias !== aliasToken.value) return false;
      if (aliasToken.operator === "!=" && isAlias === aliasToken.value) return false;
    }
    if (routingToken) {
      if (routingToken.operator === "=" && r.routing_policy !== routingToken.value) return false;
      if (routingToken.operator === "!=" && r.routing_policy === routingToken.value) return false;
    }
    return true;
  });

  return (
    <>
      <Table
        variant="container"
        loading={loading}
        loadingText="Loading records"
        items={visibleRecords}
        trackBy="id"
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        columnDefinitions={[
          {
            id: "name",
            header: "Record name",
            cell: (r) => r.name,
            sortingField: "name",
            isRowHeader: true,
          },
          {
            id: "type",
            header: "Type",
            cell: (r) => (
              <Badge color="grey">{r.type}</Badge>
            ),
            sortingField: "type",
          },
          {
            id: "routing_policy",
            header: "Routing policy",
            cell: (r) => r.routing_policy,
            sortingField: "routing_policy",
          },
          {
            id: "differentiator",
            header: "Differentiator",
            cell: () => "-",
            sortingField: "differentiator",
          },
          {
            id: "alias",
            header: "Alias",
            cell: (r) =>
              r.type === "A" || r.type === "AAAA" || r.type === "CNAME" ? "Yes" : "No",
            sortingField: "alias",
          },
          {
            id: "value",
            header: "Value/Route traffic to",
            cell: (r) => <div className="value-cell">{r.value}</div>,
            sortingField: "value",
          },
          {
            id: "ttl",
            header: "TTL (seconds)",
            cell: (r) => r.ttl,
            sortingField: "ttl",
          },
          {
            id: "health_check",
            header: "Health check",
            cell: () => "-",
            sortingField: "health_check",
          },
          {
            id: "evaluate_target_health",
            header: "Evaluate target health",
            cell: () => "-",
            sortingField: "evaluate_target_health",
          },
        ]}
        sortingDisabled={false}
        header={
          <Header
            variant="h2"
            counter={`(${total})`}
            info={<CButton variant="inline-link">Info</CButton>}
            description="Automatic mode is the current search behavior optimized for best filter results."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <CButton
                  iconName="refresh"
                  variant="icon"
                  ariaLabel="Refresh records"
                  onClick={refresh}
                  disabled={loading}
                />
                <CButton
                  disabled={selectedItems.length === 0}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete record
                </CButton>
                <CButton onClick={openCreate}>Import zone file</CButton>
                <CButton variant="primary" onClick={openCreate}>
                  Create record
                </CButton>
              </SpaceBetween>
            }
          >
            Records
          </Header>
        }
        filter={
          <PropertyFilter
            query={filterQuery}
            onChange={({ detail }) => setFilterQuery(detail)}
            filteringProperties={FILTER_PROPERTIES}
            filteringPlaceholder="Filter records by property or value"
            i18nStrings={{
              filteringAriaLabel: "Filter records",
              dismissAriaLabel: "Dismiss",
              filteringPlaceholder: "Filter records by property or value",
              groupValuesText: "Values",
              groupPropertiesText: "Properties",
              operatorsText: "Operators",
              operationAndText: "and",
              operationOrText: "or",
              operatorLessText: "Less than",
              operatorLessOrEqualText: "Less than or equal",
              operatorGreaterText: "Greater than",
              operatorGreaterOrEqualText: "Greater than or equal",
              operatorContainsText: "Contains",
              operatorDoesNotContainText: "Does not contain",
              operatorEqualsText: "Equals",
              operatorDoesNotEqualText: "Does not equal",
              editTokenHeader: "Edit filter",
              propertyText: "Property",
              operatorText: "Operator",
              valueText: "Value",
              cancelActionText: "Cancel",
              applyActionText: "Apply",
              allPropertiesLabel: "All properties",
              tokenLimitShowMore: "Show more",
              tokenLimitShowFewer: "Show fewer",
              clearFiltersText: "Clear filters",
              removeTokenButtonAriaLabel: (token) =>
                `Remove token ${token.propertyKey} ${token.operator} ${token.value}`,
              enteredTextLabel: (text) => `Use: "${text}"`,
            }}
          />
        }
        pagination={
          total > 0 ? (
            <Pagination
              currentPageIndex={page}
              pagesCount={Math.ceil(total / PAGE_SIZE)}
              onChange={({ detail }) => setPage(detail.currentPageIndex)}
            />
          ) : undefined
        }
        empty={
          <Box textAlign="center" color="inherit" padding="l">
            <Box variant="strong" textAlign="center" color="inherit" padding="s">
              No records
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filterQuery.tokens.length > 0
                ? "No records match your filters."
                : "Create a record to route traffic for this domain."}
            </Box>
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <CButton variant="primary" onClick={openCreate}>
                Create record
              </CButton>
            </SpaceBetween>
          </Box>
        }
      />

      <Modal
        title="Delete record"
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        footer={
          <>
            <CButton onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </CButton>
            <CButton variant="primary" onClick={handleDelete} loading={deleting}>
              Delete
            </CButton>
          </>
        }
      >
        <p>
          Delete{" "}
          <strong>
            {selectedItems.length === 1
              ? `${selectedItems[0].name} (${selectedItems[0].type})`
              : `${selectedItems.length} records`}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
