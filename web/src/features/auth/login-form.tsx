"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { continueAsGuest, login, type AuthError } from "./actions";
import { PasswordInput } from "./password-input";
import { loginSchema, type LoginInput } from "./schemas";

const messages: Record<AuthError, string> = {
  "invalid-credentials":
    "Email or password is incorrect. Check both and try again.",
  "email-taken": "An account with this email already exists.",
  "guest-overlap":
    "Some of your guest meetings overlap meetings in this account. Change or cancel them, then log in again.",
  "guest-emails-taken":
    "Some of your guest candidates have the same email as candidates in this account. Change their emails, then log in again.",
  unknown: "Something went wrong. Try again.",
};

export function LoginForm() {
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoggingIn, startLogin] = useTransition();
  const [isStartingGuest, startGuest] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) =>
    startLogin(async () => setError(await login(values)));
  const onGuest = () =>
    startGuest(async () => setError(await continueAsGuest()));

  return (
    <div className="flex flex-col gap-6">
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{messages[error]}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" size="lg" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging In…" : "Login"}
        </Button>
      </form>
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          disabled={isStartingGuest}
          onClick={onGuest}
        >
          {isStartingGuest ? "Starting…" : "Continue as Guest"}
        </Button>
        <Link href="/signup" className={buttonVariants({ variant: "link" })}>
          Create an Account
        </Link>
      </div>
    </div>
  );
}
