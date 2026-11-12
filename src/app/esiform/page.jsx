import EmployeeESIForm from "./EsiForm";
import EsiFormNotFound from "./not-found";
import { getEsiFormEnabled } from "@/lib/esiFormSettings";

export const dynamic = "force-dynamic";

export default async function EsiFormPage() {
  const isEnabled = await getEsiFormEnabled();
  return isEnabled ? <EmployeeESIForm /> : <EsiFormNotFound />;
}
