import { SignIn } from "@clerk/nextjs";
import { clerkTheme } from "../../../../frontend/lib/clerkTheme";

export default function SignInPage() {
  return (
    <SignIn
      routing="hash"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
      appearance={clerkTheme}
    />
  );
}
