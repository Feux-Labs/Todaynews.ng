import { redirect } from "next/navigation";

export default function AdminLegacyRedirect() {
  redirect("/ng-admin/dashboard");
}
