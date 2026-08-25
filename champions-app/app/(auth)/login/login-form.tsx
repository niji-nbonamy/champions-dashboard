"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "./actions";
import { LoginFormFields } from "./login-form-fields";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <LoginFormFields
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}
