"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Form from "@cloudscape-design/components/form";
import RadioGroup from "@cloudscape-design/components/radio-group";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Field, TextInput, Textarea } from "@/components/Field";
import { Container } from "@/components/Primitives";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useNotifications } from "@/lib/notifications";
import type { ZoneType } from "@/lib/types";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { notify } = useNotifications();

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState<ZoneType>("Public");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      setError("Domain name is required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const zone = await api.createZone({
        name: name.trim(),
        type,
        comment: comment.trim(),
      });
      notify("success", `Hosted zone ${zone.name} was created.`);
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not create hosted zone.";
      setError(message);
      notify("error", message, "Create hosted zone failed");
      setSubmitting(false);
    }
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => router.push("/hosted-zones")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={onSubmit} loading={submitting}>
                Create hosted zone
              </Button>
            </SpaceBetween>
          }
        >
          Create hosted zone
        </Header>
      }
    >
      <Breadcrumbs
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: "Create hosted zone" },
        ]}
      />

      <SpaceBetween size="l">
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}

        <Container title="Hosted zone configuration">
          <SpaceBetween size="l">
            <Field
              label="Domain name"
              description="This is the name of the domain that you want to route traffic for."
            >
              <TextInput
                placeholder="example.com"
                value={name}
                invalid={!!error && !name.trim()}
                onChange={(e) =>
                  setName((e as React.ChangeEvent<HTMLInputElement>).target.value)
                }
                autoFocus
              />
            </Field>

            <Field
              label="Description"
              optional
              description="A comment to help you identify this hosted zone (up to 256 characters)."
            >
              <Textarea
                maxLength={256}
                value={comment}
                onChange={(e) =>
                  setComment((e as React.ChangeEvent<HTMLTextAreaElement>).target.value)
                }
                placeholder="Primary corporate domain"
              />
            </Field>

            <FormField label="Type">
              <RadioGroup
                value={type}
                onChange={({ detail }) => setType(detail.value as ZoneType)}
                items={[
                  {
                    value: "Public",
                    label: "Public hosted zone",
                    description:
                      "A public hosted zone determines how traffic is routed on the internet.",
                  },
                  {
                    value: "Private",
                    label: "Private hosted zone",
                    description:
                      "A private hosted zone determines how traffic is routed within one or more VPCs.",
                  },
                ]}
              />
            </FormField>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
