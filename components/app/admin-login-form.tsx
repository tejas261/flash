"use client";

import { useActionState } from "react";

import { loginAdminAction, type AuthActionState } from "@/lib/actions/admin-auth";

import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type AdminLoginFormProps = {
  defaultEmail?: string;
  defaultPassword?: string;
};

export function AdminLoginForm({ defaultEmail, defaultPassword }: AdminLoginFormProps) {
  const [state, formAction] = useActionState(loginAdminAction, initialState);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin login</CardTitle>
        <CardDescription>Use the seeded restaurant owner credentials to manage orders and menus.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" defaultValue={defaultPassword} required />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <SubmitButton type="submit" className="flex-1">
              Sign in
            </SubmitButton>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const emailInput = document.getElementById("email") as HTMLInputElement | null;
                const passwordInput = document.getElementById("password") as HTMLInputElement | null;

                if (emailInput) emailInput.value = defaultEmail ?? "";
                if (passwordInput) passwordInput.value = defaultPassword ?? "";
              }}
            >
              Use demo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
