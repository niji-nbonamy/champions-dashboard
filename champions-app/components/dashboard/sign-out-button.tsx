import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/sign-out-action";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Se déconnecter
      </Button>
    </form>
  );
}
