import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { InterviewEditor } from "@/components/interview-editor";
import { canEdit } from "@/lib/access";
import { getInterview, getMe, listClients, listMembers } from "@/lib/store";
import { WORKS_URL } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "인터뷰" };

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  const interview = await getInterview(me, id);
  if (!interview) notFound();
  const [members, clients] = await Promise.all([listMembers(), listClients()]);

  return (
    <InterviewEditor
      key={interview.id}
      initial={interview}
      me={me}
      members={members}
      clients={clients}
      editable={canEdit(interview, me)}
      canDelete={interview.createdBy === me.id || me.role !== "user"}
      worksUrl={WORKS_URL}
    />
  );
}
