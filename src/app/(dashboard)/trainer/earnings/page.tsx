import { getEarningsData } from "@/lib/earnings-demo";
import { EarningsView } from "@/components/earnings/earnings-view";

// ⚠️ Area Guadagni con DATI DIMOSTRATIVI (vedi src/lib/earnings-demo.ts).
// Per azzerare dopo il collaudo: in earnings-demo.ts → getEarningsData() ritorna EMPTY.
export default function Page() {
  return <EarningsView data={getEarningsData()} />;
}
