import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Lead, PageResponse, ApiResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ImportModal } from "@/components/ImportModal";
import { BulkEditModal } from "@/components/BulkEditModal";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Edit,
  Upload,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  RefreshCcw,
  Download,
  Users,
  Briefcase,
  Building,
  CheckCircle,
  Filter,
  Flag,
  Globe,
  Hash,
  Mail,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<PageResponse<Lead> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    country: "",
    industry: "",
    campaignOfInstantly: "",
    verifiedOn: "",
    title: "",
    website: "",
    campaignId: "",
    leadstatus: "",
    verifiedStatus: "",
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchLeadsWithFilters();
  };

  const clearAllFilters = () => {
    setFilters({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      country: "",
      industry: "",
      campaignOfInstantly: "",
      verifiedOn: "",
      title: "",
      website: "",
      campaignId: "",
      leadstatus: "",
      verifiedStatus: "",
    });
    setPage(0);
    fetchLeads(); // Reset to original fetch
  };

  const fetchLeadsWithFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build params object - only include non-empty filters
      const params: any = {
        page,
        size: pageSize,
      };

      // Add filters only if they have values
      if (filters.firstName) params.firstName = filters.firstName;
      if (filters.lastName) params.lastName = filters.lastName;
      if (filters.email) params.email = filters.email;
      if (filters.phone) params.phone = filters.phone;
      if (filters.companyName) params.companyName = filters.companyName;
      if (filters.country) params.country = filters.country;
      if (filters.industry) params.industry = filters.industry;
      if (filters.campaignOfInstantly)
        params.campaignOfInstantly = filters.campaignOfInstantly;
      if (filters.verifiedOn) params.verifiedOn = filters.verifiedOn;
      if (filters.title) params.title = filters.title;
      if (filters.website) params.website = filters.website;
      if (filters.campaignId) params.campaignId = filters.campaignId;
      if (filters.leadstatus) params.leadstatus = filters.leadstatus;
      if (filters.verifiedStatus)
        params.verifiedStatus = filters.verifiedStatus;

      const { data: response } = await api.get<ApiResponse<PageResponse<Lead>>>(
        "/lead/get",
        { params },
      );

      if (response.success) {
        setData(response.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(
      (v) => v && v.trim() !== "",
    );
    if (hasActiveFilters) {
      fetchLeadsWithFilters();
    } else {
      fetchLeads();
    }
  }, [
    filters.firstName,
    filters.lastName,
    filters.email,
    filters.phone,
    filters.companyName,
    filters.country,
    filters.industry,
    filters.campaignOfInstantly,
    filters.verifiedOn,
    filters.title,
    filters.website,
    filters.campaignId,
    filters.leadstatus,
    filters.verifiedStatus,
    page,
    pageSize,
  ]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: response } = await api.get<ApiResponse<PageResponse<Lead>>>(
        "/lead/get",
        {
          params: { page, size: pageSize, search },
        },
      );
      if (response.success) {
        setData(response.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  const currentIds = data?.content?.map((lead) => lead.id) || [];
  const isAllSelected =
    currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select leads");
      return;
    }
    try {
      const { data: response } = await api.delete("/lead/bulk-delete", {
        data: { ids: selectedIds },
      });
      toast.success(response?.data || "Leads deleted successfully");
      setSelectedIds([]);
      fetchLeads();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Bulk delete failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Preparing export...", { id: "export" });
      const firstRes = await api.get<ApiResponse<PageResponse<Lead>>>(
        "/lead/get",
        {
          params: { page: 0, size: 100, search },
        },
      );
      if (!firstRes.data.success || !firstRes.data.data) {
        toast.error(firstRes.data?.message || "Export failed", {
          id: "export",
        });
        return;
      }
      const totalPages = firstRes.data.data.totalPages || 1;
      let leads: Lead[] = firstRes.data.data.content || [];
      for (let p = 1; p < totalPages; p++) {
        const res = await api.get<ApiResponse<PageResponse<Lead>>>(
          "/lead/get",
          {
            params: { page: p, size: 100, search },
          },
        );
        if (res.data.success && res.data.data?.content) {
          leads = [...leads, ...res.data.data.content];
        }
      }
      if (leads.length === 0) {
        toast.error("No leads found to export", { id: "export" });
        return;
      }
      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Company Name",
        "Country",
        "Industry",
        "Title",
        "Website",
        "Campaign ID",
        "Campaign Of Instantly",
        "Verified Status",
        "Verified On",
        "Lead Status",
      ];
      const csvRows = leads.map((lead) => [
        lead.firstName || "",
        lead.lastName || "",
        lead.email || "",
        lead.phone || "",
        lead.companyName || "",
        lead.country || "",
        lead.industry || "",
        lead.title || "",
        lead.website || "",
        lead.campaignId || "",
        lead.campaignOfInstantly || "",
        lead.verifiedStatus || "",
        lead.verifiedOn || "",
        lead.leadstatus || "",
      ]);
      const csvContent = [headers, ...csvRows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute(
        "download",
        `leads_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${leads.length} leads successfully`, {
        id: "export",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Export failed", {
        id: "export",
      });
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchLeads();
  };

  const totalPages = data?.totalPages || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header - Reduced padding for more density */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold text-base text-slate-900">
            Lead Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium text-blue-600">
                Total Leads:
              </span>
              <span className="text-sm font-bold text-slate-800">
                {data?.totalElements || 0}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="h-8 bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - Fluid width */}
      <main className="p-4 w-full flex-grow">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-t-2xl"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-slate-700">Advanced Filters</h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="text-slate-500 hover:text-red-600"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>

              {isFiltersOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>
          {isFiltersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* First Name Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  First Name
                </label>
                <input
                  type="text"
                  value={filters.firstName}
                  onChange={(e) =>
                    handleFilterChange("firstName", e.target.value)
                  }
                  placeholder="Search by first name..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Last Name Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Last Name
                </label>
                <input
                  type="text"
                  value={filters.lastName}
                  onChange={(e) =>
                    handleFilterChange("lastName", e.target.value)
                  }
                  placeholder="Search by last name..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <input
                  type="email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                  placeholder="Search by email..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </label>
                <input
                  type="text"
                  value={filters.phone}
                  onChange={(e) => handleFilterChange("phone", e.target.value)}
                  placeholder="Search by phone..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Company Name Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Company
                </label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) =>
                    handleFilterChange("companyName", e.target.value)
                  }
                  placeholder="Search by company..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Country Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Country
                </label>
                <input
                  type="text"
                  value={filters.country}
                  onChange={(e) =>
                    handleFilterChange("country", e.target.value)
                  }
                  placeholder="Search by country..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Industry Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Industry
                </label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) =>
                    handleFilterChange("industry", e.target.value)
                  }
                  placeholder="Search by industry..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Title Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Title
                </label>
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => handleFilterChange("title", e.target.value)}
                  placeholder="Search by job title..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Website Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Website
                </label>
                <input
                  type="text"
                  value={filters.website}
                  onChange={(e) =>
                    handleFilterChange("website", e.target.value)
                  }
                  placeholder="Search by website..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Campaign ID Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Campaign ID
                </label>
                <input
                  type="text"
                  value={filters.campaignId}
                  onChange={(e) =>
                    handleFilterChange("campaignId", e.target.value)
                  }
                  placeholder="Search by campaign ID..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lead Status Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Lead Status
                </label>
                <input
                  type="text"
                  value={filters.leadstatus}
                  onChange={(e) =>
                    handleFilterChange("leadstatus", e.target.value)
                  }
                  placeholder="Search by lead status..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Verified Status Filter - Changed to search input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified Status
                </label>
                <input
                  type="text"
                  value={filters.verifiedStatus}
                  onChange={(e) =>
                    handleFilterChange("verifiedStatus", e.target.value)
                  }
                  placeholder="Search by verified status..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Campaign Of Instantly Filter - NEW FIELD */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Campaign Of Instantly
                </label>
                <input
                  type="text"
                  value={filters.campaignOfInstantly}
                  onChange={(e) =>
                    handleFilterChange("campaignOfInstantly", e.target.value)
                  }
                  placeholder="Search by campaign instantly..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Verified On Filter - NEW FIELD */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  Verified On
                </label>
                <input
                  type="text"
                  value={filters.verifiedOn}
                  onChange={(e) =>
                    handleFilterChange("verifiedOn", e.target.value)
                  }
                  placeholder="Search by verified date..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
        <div className="mb-4 flex flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                <span className="text-sm text-slate-500 px-2">
                  {selectedIds.length} selected
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table Container - Compact & Fluid */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 w-10 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  {[
                    "First Name",
                    "Last Name",
                    "Email",
                    "Phone",
                    "Company",
                    "Country",
                    "Industry",
                    "Title",
                    "Website",
                    "Campaign ID",
                    "Instantly",
                    "Verified Status",
                    "Verified On",
                    "Lead Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="p-8 text-center text-slate-400 text-sm"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : data?.content?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="p-8 text-center text-slate-400 text-sm"
                    >
                      No records
                    </td>
                  </tr>
                ) : (
                  data?.content?.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-center">
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={() => toggleSelectRow(lead.id)}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {lead.firstName || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {lead.lastName || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.email || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.phone || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.companyName || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.country || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.industry || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.title || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.website || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.campaignId || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.campaignOfInstantly || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.verifiedStatus || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {lead.verifiedOn || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                          {lead.leadstatus || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer - Compact */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
            {/* Current Status */}
            <div className="text-xs text-slate-500 font-medium">
              Page{" "}
              <span className="text-slate-900 font-semibold">{page + 1}</span>{" "}
              of{" "}
              <span className="text-slate-900 font-semibold">
                {totalPages || 1}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Page Size Dropdown */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={fetchLeads}
      />
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([]);
          fetchLeads();
        }}
      />
    </div>
  );
}
