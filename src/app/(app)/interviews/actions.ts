"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createInterview, getMe } from "@/lib/store";

export async function createInterviewAction() {
  const me = await getMe();
  if (!me) redirect("/login");
  const id = await createInterview(me);
  revalidatePath("/interviews");
  redirect(`/interviews/${id}`);
}
