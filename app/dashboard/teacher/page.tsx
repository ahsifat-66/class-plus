import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TeacherDashboard() {
  redirect("/dashboard?view=teaching");
}
