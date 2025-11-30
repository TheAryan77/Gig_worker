// Dashboard page - redirects to appropriate dashboard based on user role
import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to home - users should go to /client/dashboard, /freelancer/dashboard, or /worker/dashboard
  redirect("/");
}
