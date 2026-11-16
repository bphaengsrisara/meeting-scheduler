"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signup } from "./actions";
import { PasswordInput } from "./password-input";
import { PASSWORD_MIN, signupSchema, type SignupInput } from "./schemas";

export function SignupForm() {
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: SignupInput) =>
    startTransition(async () => {
      setFailed(false);
      const error = await signup(values);
      if (error === "email-taken") {
        form.setError("email", { type: "taken" }, { shouldFocus: true });
      } else if (error) {
        setFailed(true);
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {failed && (
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong. Try again.
            </AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Full Name (optional)</FieldLabel>
                <Input
                  {...field}
                  id="name"
                  autoComplete="name"
                  spellCheck={false}
                  placeholder="Jane Doe"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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
                  placeholder="jane@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error?.type === "taken" ? (
                  <FieldError>
                    An account with this email already exists.{" "}
                    <Link href="/login" className="underline">
                      Log in instead
                    </Link>
                  </FieldError>
                ) : (
                  fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )
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
                <FieldDescription>
                  At least {PASSWORD_MIN} characters. A short sentence works
                  well.
                </FieldDescription>
                <PasswordInput
                  {...field}
                  id="password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating Account…" : "Create Account"}
        </Button>
      </form>
      <Link href="/login" className={buttonVariants({ variant: "link" })}>
        I Already Have an Account
      </Link>
    </div>
  );
}
