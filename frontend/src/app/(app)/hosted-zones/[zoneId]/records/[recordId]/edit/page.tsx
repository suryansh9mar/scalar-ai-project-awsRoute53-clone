"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Field, Select, TextInput, Textarea } from "@/components/Field";
import { Container, LoadingBlock } from "@/components/Primitives";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import { RECORD_TYPES } from "@/lib/types";
import type { DnsRecord, RecordType, Zone } from "@/lib/types";

const RECORD_TYPE_HINTS: Record<RecordType, string> = {
  A: "Routes traffic to an IPv4 address",
  AAAA: "Routes traffic to an IPv6 address",
  CNAME: "Maps a name to another name",
  TXT: "Holds arbitrary text",
  MX: "Mail exchange server",
  NS: "The name servers for a hosted zone",
  PTR: "Maps an IP address to a domain name",
  SRV: "Service locator",
  CAA: "Certificate authority authorization",
};

const TTL_PRESETS = [
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
  { label: "1 hr", value: 3600 },
  { label: "1 day", value: 86400 },
];

function toSubdomain(name: string, zoneName: string): string {
  if (name === zoneName) return "";
  if (name.endsWith(`.${zoneName}`)) {
    return name.slice(0, -(zoneName.length + 1));
  }
  return name;
}

export default function EditRecordPage() {
  const params = useParams<{ zoneId: string; recordId: string }>();
  const { zoneId, recordId } = params;
  const router = useRouter();
  const { notify } = useNotifications();

  const [zone, setZone] = useState<Zone | null>(null);
  const [record, setRecord] = useState<DnsRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [subdomain, setSubdomain] = useState("");
  const [type, setType] = useState<RecordType>("A");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(300);
  const [routingPolicy, setRoutingPolicy] = useState("Simple");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const fetchedZone = await api.getZone(zoneId);
      setZone(fetchedZone);
      // Use the actual getRecord endpoint instead of listing with page_size=1000 (which exceeds the max 100 limit)
      const fetchedRecord = await api.getRecord(zoneId, recordId);
      if (fetchedRecord) {
        setRecord(fetchedRecord);
        setSubdomain(toSubdomain(fetchedRecord.name, fetchedZone.name));
        setType(fetchedRecord.type);
        setValue(fetchedRecord.value);
        setTtl(fetchedRecord.ttl);
        setRoutingPolicy(fetchedRecord.routing_policy);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        notify("error", err.message, "Could not load record details");
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, recordId, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fullName = useMemo(
    () => (zone && subdomain.trim() ? `${subdomain.trim()}.${zone.name}` : zone?.name || ""),
    [subdomain, zone]
  );

  const onSubmit = async () => {
    if (!value.trim()) {
      setError("Value is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.updateRecord(zoneId, recordId, {
        name: fullName,
        type,
        value: value.trim(),
        ttl,
        routing_policy: routingPolicy,
      });
      notify("success", `Record ${fullName} was updated.`);
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the record.";
      setError(message);
      notify("error", message, "Save record failed");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ContentLayout header={<Header variant="h1">Edit record</Header>}>
        <LoadingBlock label="Loading record" />
      </ContentLayout>
    );
  }

  if (!zone || !record) {
    return (
      <ContentLayout header={<Header variant="h1">Edit record</Header>}>
        <Alert type="error" header="Not found">
          The hosted zone or record could not be found.
        </Alert>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={<Header variant="h1">Edit record</Header>}
    >
      <Breadcrumbs
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone.name, href: `/hosted-zones/${zone.id}` },
          { label: "Edit record" },
        ]}
      />

      <SpaceBetween size="l">
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}

        <Container title="Record details">
          <SpaceBetween size="l">
            <Field
              label="Record name"
              description="Keep blank to create a record for the root domain (zone apex)."
            >
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={subdomain}
                    placeholder=""
                    onChange={(e) =>
                      setSubdomain((e as React.ChangeEvent<HTMLInputElement>).target.value)
                    }
                  />
                </div>
                <span
                  style={{
                    padding: "6px 12px",
                    background: "var(--color-background-input-disabled)",
                    border: "1px solid var(--color-border-input-default)",
                    borderLeft: "none",
                    borderRadius: "0 8px 8px 0",
                    color: "var(--color-text-form-secondary)",
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  .{zone.name}
                </span>
              </div>
            </Field>

            <Field label="Record type" description={RECORD_TYPE_HINTS[type]}>
              <Select
                value={type}
                onChange={(e) =>
                  setType((e as React.ChangeEvent<HTMLSelectElement>).target.value as RecordType)
                }
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} – {RECORD_TYPE_HINTS[t]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Value"
              description="Enter multiple values on separate lines."
            >
              <Textarea
                value={value}
                invalid={!!error && !value.trim()}
                onChange={(e) =>
                  setValue((e as React.ChangeEvent<HTMLTextAreaElement>).target.value)
                }
                placeholder={type === "A" ? "192.0.2.1" : ""}
                rows={4}
              />
            </Field>

            <ColumnLayout columns={2}>
              <Field label="TTL (seconds)">
                <TextInput
                  type="number"
                  value={ttl}
                  onChange={(e) =>
                    setTtl(Number((e as React.ChangeEvent<HTMLInputElement>).target.value))
                  }
                />
              </Field>
              <Field label="Routing policy">
                <Select
                  value={routingPolicy}
                  onChange={(e) =>
                    setRoutingPolicy((e as React.ChangeEvent<HTMLSelectElement>).target.value)
                  }
                >
                  <option value="Simple">Simple routing</option>
                  <option value="Weighted">Weighted</option>
                  <option value="Latency">Latency</option>
                  <option value="Failover">Failover</option>
                  <option value="Geolocation">Geolocation</option>
                </Select>
              </Field>
            </ColumnLayout>

            <FormField label="Common TTLs">
              <SpaceBetween direction="horizontal" size="xs">
                {TTL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    small
                    onClick={() => setTtl(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Container>

        <SpaceBetween direction="horizontal" size="xs" className="form-actions">
          <Button onClick={() => router.push(`/hosted-zones/${zone.id}`)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={submitting}>
            Save changes
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </ContentLayout>
  );
}
