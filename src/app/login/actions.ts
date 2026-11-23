"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleSchema } from "@/lib/auth";
import { sampleCookie } from "@/server/sample-session";
import { sampleResources } from "@/lib/catalogue";

export async function enterSample(form: FormData) {
  const role = roleSchema.parse(form.get("role"));
  (await cookies()).set(sampleCookie, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  const resource = sampleResources.find(
    (item) => item.id === form.get("resource"),
  );
  if (resource) redirect("/workspace?resource=" + resource.id);
  redirect(role === "faculty" ? "/approvals" : "/workspace");
}
