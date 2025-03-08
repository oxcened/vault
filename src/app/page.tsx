import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  if (session) {
    return redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <main className="grid h-screen place-content-center">
        <div className="flex gap-5">
          <h1 className="text-2xl">Vault</h1>
          <Link href="/api/auth/signin" className={buttonVariants()}>
            Sign in
          </Link>
        </div>
      </main>
    </HydrateClient>
  );
}
