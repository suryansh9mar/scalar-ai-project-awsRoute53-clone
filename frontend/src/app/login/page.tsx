"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import CButton from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@route53.local");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/hosted-zones");
  }, [loading, user, router]);

  const onSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/hosted-zones");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background-home-header)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* AWS-style top bar */}
      <div
        style={{
          height: 40,
          background: "#232f3e",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>
          aws<span style={{ color: "#ff9900" }}>.</span>
        </span>
      </div>

      {/* Login card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "48px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <Box textAlign="center" margin={{ bottom: "l" }}>
            <Box variant="h1" fontSize="heading-xl">
              Route 53 <Box variant="span" color="text-status-inactive">Console</Box>
            </Box>
          </Box>

          <Container
            header={<Header variant="h2">Sign in</Header>}
          >
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <CButton
                    variant="primary"
                    onClick={onSubmit}
                    loading={submitting}
                    disabled={submitting}
                    fullWidth
                  >
                    Sign in
                  </CButton>
                </SpaceBetween>
              }
            >
              <SpaceBetween size="m">
                {error ? (
                  <Alert type="error">{error}</Alert>
                ) : null}

                <FormField label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={({ detail }) => setEmail(detail.value)}
                    autoComplete="username"
                  />
                </FormField>

                <FormField label="Password">
                  <Input
                    type="password"
                    value={password}
                    onChange={({ detail }) => setPassword(detail.value)}
                    autoComplete="current-password"
                    onKeyDown={({ detail }) => {
                      if (detail.key === "Enter") onSubmit();
                    }}
                  />
                </FormField>

                <Alert type="info" header="Demo credentials">
                  admin@route53.local / password
                  <br />
                  (any email + password also works — accounts are mocked)
                </Alert>
              </SpaceBetween>
            </Form>
          </Container>
        </div>
      </div>
    </div>
  );
}
