import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AdminPanel from "@/components/AdminPanel";

export const metadata = {
  title: "Member management — EduPlatform",
  description: "Owner-only user management.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.access_level !== 1) {
    redirect("/");
  }

  return (
    <div className="page-shell">
      <section className="content-section" style={{ maxWidth: 960, margin: "2rem auto" }}>
        <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Member management</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          Approve, reject, hold, or change the tier of any member.
        </p>
        <AdminPanel />
      </section>
    </div>
  );
}
