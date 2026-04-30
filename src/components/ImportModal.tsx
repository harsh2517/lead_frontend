import * as React from "react";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FileUp, Info, Sparkles } from "lucide-react";

const BACKEND_FIELDS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
  { key: "industry", label: "Industry" },
  { key: "phone", label: "Phone" },
  { key: "companyName", label: "Company Name" },
  { key: "verifiedStatus", label: "Verified Status" },
  { key: "verifiedOn", label: "Verified On" },
  { key: "campaignId", label: "Campaign ID" },
  { key: "campaignOfInstantly", label: "Campaign Of Instantly" },
  { key: "title", label: "Title" },
  { key: "website", label: "Website" },
  { key: "leadstatus", label: "Lead Status" },
];

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Auto-mapping function that matches CSV headers to backend fields
const autoMapFields = (
  csvHeaders: string[],
  backendFields: typeof BACKEND_FIELDS,
) => {
  const mapping: Record<string, string> = {};

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  // Common field name variations for matching
  const fieldVariations: Record<string, string[]> = {
    firstName: [
      "firstname",
      "first_name",
      "first",
      "fname",
      "givenname",
      "first name",
      "first-name",
    ],
    lastName: [
      "lastname",
      "last_name",
      "last",
      "lname",
      "surname",
      "familyname",
      "last name",
      "last-name",
    ],
    email: [
      "email",
      "e-mail",
      "mail",
      "emailaddress",
      "email address",
      "primaryemail",
    ],
    country: ["country", "nation", "countryname", "country name"],
    industry: [
      "industry",
      "sector",
      "business",
      "industrytype",
      "industry type",
      "vertical",
    ],
    phone: [
      "phone",
      "telephone",
      "mobile",
      "cell",
      "phonenumber",
      "phone number",
      "contactnumber",
    ],
    companyName: [
      "company",
      "companyname",
      "company_name",
      "organization",
      "businessname",
      "company name",
      "org",
    ],
    verifiedStatus: [
      "verifiedstatus",
      "verified_status",
      "verified",
      "isverified",
      "verification",
      "verified status",
    ],
    verifiedOn: [
      "verifiedon",
      "verified_on",
      "verifieddate",
      "verified date",
      "verification date",
      "verified at",
    ],
    campaignId: [
      "campaignid",
      "campaign_id",
      "campaign",
      "campaignid",
      "campaign id",
    ],
    campaignOfInstantly: [
      "campaignofinstantly",
      "campaign_of_instantly",
      "instantlycampaign",
      "instantly campaign",
      "campaign instantly",
    ],
    title: [
      "title",
      "jobtitle",
      "job_title",
      "position",
      "role",
      "designation",
      "job title",
    ],
    website: [
      "website",
      "url",
      "domain",
      "site",
      "web",
      "companywebsite",
      "company website",
    ],
    leadstatus: ["leadstatus", "lead_status", "status", "lead status", "stage"],
  };

  csvHeaders.forEach((header) => {
    const normalizedHeader = normalize(header);

    for (const field of backendFields) {
      const fieldKey = field.key;
      const variations = fieldVariations[fieldKey] || [fieldKey.toLowerCase()];

      if (
        variations.includes(normalizedHeader) ||
        variations.some((v) => normalizedHeader.includes(v)) ||
        normalizedHeader.includes(fieldKey.toLowerCase())
      ) {
        mapping[fieldKey] = header;
        break;
      }
    }
  });

  return mapping;
};

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [autoMapped, setAutoMapped] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        preview: 1,
        complete: (results) => {
          if (results.data.length > 0) {
            const headers = Object.keys(results.data[0] as object);
            setCsvHeaders(headers);

            const autoMapping = autoMapFields(headers, BACKEND_FIELDS);
            setMapping(autoMapping);
            setAutoMapped(true);

            const mappedCount = Object.keys(autoMapping).filter(
              (key) => autoMapping[key],
            ).length;
            if (mappedCount > 0) {
              toast.success(`Auto-mapped ${mappedCount} fields successfully!`);
            }
          }
        },
      });
    }
  };

  const handleAutoMap = () => {
    const autoMapping = autoMapFields(csvHeaders, BACKEND_FIELDS);
    setMapping(autoMapping);
    setAutoMapped(true);
    const mappedCount = Object.keys(autoMapping).filter(
      (key) => autoMapping[key],
    ).length;
    toast.success(`Auto-mapped ${mappedCount} fields`);
  };

  const handleResetMapping = () => {
    setMapping({});
    setAutoMapped(false);
    toast.info("Mapping reset");
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    // Check if at least email is mapped (required field)
    if (!mapping.email) {
      toast.error(
        "Email field mapping is required. Please map the email column.",
      );
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    // BACKEND REQUIREMENT: 14 columns in exact order
    BACKEND_FIELDS.forEach((field) => {
      formData.append("columns", mapping[field.key] || "");
    });

    try {
      const { data } = await api.post("/lead/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Backend returns plain text message on success
      const message = typeof data === "string" ? data : "Import completed";
      toast.success(message);
      onSuccess();
      onClose();
      // Reset state
      setFile(null);
      setMapping({});
      setCsvHeaders([]);
      setAutoMapped(false);
    } catch (err: any) {
      toast.error(
        err.response?.data ||
          "Failed to import leads. Ensure all columns are mapped.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate mapping statistics
  const mappedFieldsCount = Object.keys(mapping).filter(
    (key) => mapping[key],
  ).length;
  const totalFields = BACKEND_FIELDS.length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import Leads from CSV"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-200 transition-all group">
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="csv-file"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all border border-slate-100">
              <FileUp className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : "Choose a CSV file"}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Drag and drop or click to browse
              </p>
            </div>
          </label>
        </div>

        {csvHeaders.length > 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            {/* Mapping progress indicator */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex justify-between text-xs text-slate-600 mb-2">
                <span className="font-medium">Mapping Progress</span>
                <span className="font-mono">
                  {mappedFieldsCount}/{totalFields} fields mapped
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(mappedFieldsCount / totalFields) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 max-h-[40vh] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
              {BACKEND_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-0.5 flex items-center justify-between">
                    <span>{field.label}</span>

                    {field.key === "email" &&
                      !mapping.email &&
                      csvHeaders.length > 0 && (
                        <span className="text-[8px] text-red-500 font-normal bg-red-50 px-1.5 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                  </label>
                  <Select
                    options={[
                      { label: "None (Empty)", value: "" },
                      ...csvHeaders.map((h) => ({ label: h, value: h })),
                    ]}
                    placeholder="Select CSV column"
                    value={mapping[field.key] || ""}
                    onChange={(e) => {
                      setMapping({ ...mapping, [field.key]: e.target.value });
                      if (autoMapped) setAutoMapped(false);
                    }}
                    className={`bg-slate-50/50 border-slate-200 h-9 text-xs ${
                      field.key === "email" && !mapping[field.key]
                        ? "border-red-200 bg-red-50/30"
                        : ""
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Smart suggestion for unmapped required fields */}
            {!mapping.email && csvHeaders.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Email field is required</strong> - Please map the email
                column from your CSV to continue.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading || !mapping.email}
            className="rounded-xl px-8 shadow-lg shadow-blue-100"
          >
            {isUploading ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
