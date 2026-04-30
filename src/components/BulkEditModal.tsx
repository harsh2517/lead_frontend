import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type BulkEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  onSuccess: () => void;
};

export function BulkEditModal({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
}: BulkEditModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    country: "",
    industry: "",
    title: "",
    website: "",
    campaignId: "",
    campaignOfInstantly: "",
    verifiedStatus: "",
    verifiedOn: "",
    leadstatus: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const payload: any = {
      ids: selectedIds,
    };

    Object.entries(form).forEach(([key, value]) => {
      if (value.trim() !== "") {
        payload[key] = value.trim();
      }
    });

    if (Object.keys(payload).length === 1) {
      toast.error("Please enter at least one field to update");
      return;
    }

    try {
      setIsUpdating(true);

      const { data } = await api.put("/lead/bulk-edit", payload);

      toast.success(data?.data || "Leads updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Bulk edit failed",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";

  const labelClass =
    "text-[11px] font-bold text-slate-400 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            Bulk Edit {selectedIds.length} leads
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-orange-700">
            ONLY FIELDS YOU MODIFY WILL BE UPDATED ACROSS ALL{" "}
            {selectedIds.length} SELECTED LEADS.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                className={inputClass}
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Last Name</label>
              <input
                className={inputClass}
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Company Name</label>
              <input
                className={inputClass}
                placeholder="Company name"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Country</label>
              <input
                className={inputClass}
                placeholder="e.g. India, USA"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Industry</label>
              <input
                className={inputClass}
                placeholder="e.g. Software, Finance"
                value={form.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                placeholder="Job title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Website</label>
              <input
                className={inputClass}
                placeholder="Website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Campaign ID</label>
              <input
                className={inputClass}
                placeholder="Campaign ID"
                value={form.campaignId}
                onChange={(e) => handleChange("campaignId", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Campaign Of Instantly</label>
              <input
                className={inputClass}
                placeholder="Campaign name"
                value={form.campaignOfInstantly}
                onChange={(e) =>
                  handleChange("campaignOfInstantly", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Verified Status</label>
              <input
                className={inputClass}
                placeholder="Verified status"
                value={form.verifiedStatus}
                onChange={(e) => handleChange("verifiedStatus", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Verified On</label>
              <input
                className={inputClass}
                placeholder="Verified on"
                value={form.verifiedOn}
                onChange={(e) => handleChange("verifiedOn", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Lead Status</label>
              <input
                className={inputClass}
                placeholder="Lead status"
                value={form.leadstatus}
                onChange={(e) => handleChange("leadstatus", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Leads"}
          </Button>
        </div>
      </div>
    </div>
  );
}
