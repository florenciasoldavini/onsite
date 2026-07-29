import type { Worker, WorkerFormValues } from "@/features/workers/types/worker";

export function getWorkerFormValues(worker: Worker): WorkerFormValues {
  return {
    contractor_id: worker.contractor_id,
    email: worker.email ?? "",
    first_name: worker.first_name,
    last_name: worker.last_name ?? "",
    phone_number: worker.phone_number ?? "",
    trade_category_ids: worker.trade_categories.map((category) => category.id)
  };
}
