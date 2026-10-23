import { redirect } from "next/navigation"

// Sign-up is closed: the app is for Threecolts staff, who are invited from the Team page.
export default function SignupPage() {
  redirect("/login")
}
