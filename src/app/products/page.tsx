import { AdminView } from "@/components/admin-view";
export const metadata = { title: "Manage demo products" };
export default function Page() {
  return <AdminView screen="products" />;
}
