"use client";

import { Breadcrumbs } from "./Breadcrumbs";
import { Badge, Container } from "./Primitives";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

/** Placeholder page for the mocked (non-functional) Route 53 sections. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Box padding={{ horizontal: "xl", vertical: "xl" }}>
      <Breadcrumbs items={[{ label: "Route 53", href: "/hosted-zones" }, { label: title }]} />
      <SpaceBetween size="l">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{title}</h1>
        </div>
        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m" alignItems="center">
              <Badge color="blue">Coming soon</Badge>
              <Box variant="h2">{title} is not available yet</Box>
              <Box color="text-status-inactive">
                This section is a placeholder in the Route 53 clone. Hosted zones and
                DNS records are fully functional — use the navigation to manage them.
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </Box>
  );
}
