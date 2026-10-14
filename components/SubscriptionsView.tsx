import { ArrowDown, ArrowUp, Download, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Tooltip } from "./Tooltip";
import {
  billingCycleLabel,
  computeMonthlySpend,
  formatDate,
  getMemberName,
  isRenewalDueSoon,
  normalizedMonthlyCost,
  resourceCategoryLabel,
  resourceStatusLabel,
  type TeamMemberDef,
  type WorkspaceResource,
} from "../lib/tasks";

type SubscriptionsViewProps = {
  resources: WorkspaceResource[];
  teamMembers: TeamMemberDef[];
  onAddResource: () => void;
  onEditResource: (resource: WorkspaceResource) => void;
  onDeleteResource: (resourceId: string) => void;
};

type SortKey = "name" | "category" | "cost" | "status" | "renewalDate";

function toCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type SortHeaderProps = {
  sortKeyValue: SortKey;
  label: string;
  activeKey: SortKey;
  activeDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
};

function SortHeader({ sortKeyValue, label, activeKey, activeDir, onSort }: SortHeaderProps) {
  const isActive = activeKey === sortKeyValue;
  return (
    <th>
      <button
        className={`resource-sort-btn${isActive ? " active" : ""}`}
        type="button"
        onClick={() => onSort(sortKeyValue)}
      >
        {label}
        {isActive ? (
          activeDir === "asc" ? (
            <ArrowUp size={11} aria-hidden="true" />
          ) : (
            <ArrowDown size={11} aria-hidden="true" />
          )
        ) : null}
      </button>
    </th>
  );
}

export function SubscriptionsView({
  resources,
  teamMembers,
  onAddResource,
  onEditResource,
  onDeleteResource,
}: SubscriptionsViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const monthlySpend = computeMonthlySpend(resources);
  const activeCount = resources.filter((resource) => resource.status !== "cancelled").length;
  const dueSoonCount = resources.filter(isRenewalDueSoon).length;

  const sortedResources = useMemo(() => {
    const sorted = [...resources].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "cost":
          comparison = normalizedMonthlyCost(a) - normalizedMonthlyCost(b);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "renewalDate":
          comparison = (a.renewalDate || "9999-99-99").localeCompare(b.renewalDate || "9999-99-99");
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [resources, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleExportCsv() {
    const headers = [
      "Name",
      "Category",
      "Cost",
      "Billing Cycle",
      "Monthly Equivalent",
      "Status",
      "Renewal Date",
      "Owner",
      "URL",
      "Notes",
    ];

    const rows = resources.map((resource) => [
      resource.name,
      resourceCategoryLabel(resource.category),
      resource.cost.toFixed(2),
      billingCycleLabel(resource.billingCycle),
      normalizedMonthlyCost(resource).toFixed(2),
      resourceStatusLabel(resource.status),
      resource.renewalDate,
      resource.ownerId ? getMemberName(teamMembers, resource.ownerId) : "",
      resource.url,
      resource.notes,
    ]);

    const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().split("T")[0];

    const link = document.createElement("a");
    link.href = url;
    link.download = `subscriptions-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="projects-view" aria-label="Subscriptions">
      <div className="projects-view-header">
        <div>
          <h2 className="projects-view-title">Subscriptions</h2>
          <p className="projects-view-subtitle">
            Every tool, app, and service the agency pays for, in one place.
          </p>
        </div>
        <div className="projects-view-header-actions">
          {resources.length > 0 ? (
            <Tooltip label="Export as CSV">
              <button className="btn-secondary" type="button" onClick={handleExportCsv}>
                <Download size={14} />
                Export CSV
              </button>
            </Tooltip>
          ) : null}
          <button className="btn-primary projects-new-btn" type="button" onClick={onAddResource}>
            <Plus size={14} />
            Add Subscription
          </button>
        </div>
      </div>

      <div className="resource-summary-row">
        <div className="resource-summary-stat">
          <span className="resource-summary-value">${monthlySpend.toLocaleString()}</span>
          <span className="resource-summary-label">Est. Monthly Spend</span>
        </div>
        <div className="resource-summary-stat">
          <span className="resource-summary-value">${(monthlySpend * 12).toLocaleString()}</span>
          <span className="resource-summary-label">Est. Annual Spend</span>
        </div>
        <div className="resource-summary-stat">
          <span className="resource-summary-value">{activeCount}</span>
          <span className="resource-summary-label">Active Tools</span>
        </div>
        <div className="resource-summary-stat">
          <span className={`resource-summary-value${dueSoonCount > 0 ? " warning" : ""}`}>
            {dueSoonCount}
          </span>
          <span className="resource-summary-label">Renewals Due Soon</span>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="projects-empty">
          <p>No subscriptions tracked yet.</p>
          <button className="btn-primary" type="button" onClick={onAddResource}>
            <Plus size={14} />
            Add your first subscription
          </button>
        </div>
      ) : (
        <div className="resource-table-wrap">
          <table className="resource-table">
            <thead>
              <tr>
                <SortHeader
                  sortKeyValue="name"
                  label="Name"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  sortKeyValue="category"
                  label="Category"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  sortKeyValue="cost"
                  label="Cost"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  sortKeyValue="status"
                  label="Status"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  sortKeyValue="renewalDate"
                  label="Renewal"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                <th>Owner</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sortedResources.map((resource) => {
                const dueSoon = isRenewalDueSoon(resource);
                return (
                  <tr key={resource.id}>
                    <td>
                      <div className="resource-table-name">
                        {resource.name}
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Open ${resource.name}`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td>{resourceCategoryLabel(resource.category)}</td>
                    <td>
                      ${resource.cost.toLocaleString()}
                      <span className="resource-table-cycle">
                        {" "}
                        / {billingCycleLabel(resource.billingCycle).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`project-status-badge resource-status-${resource.status}`}>
                        {resourceStatusLabel(resource.status)}
                      </span>
                    </td>
                    <td className={dueSoon ? "resource-table-due-soon" : undefined}>
                      {formatDate(resource.renewalDate)}
                    </td>
                    <td>{resource.ownerId ? getMemberName(teamMembers, resource.ownerId) : "-"}</td>
                    <td>
                      <div className="resource-table-actions">
                        <Tooltip label="Edit">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => onEditResource(resource)}
                            aria-label={`Edit ${resource.name}`}
                          >
                            <Pencil size={13} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <button
                            className="icon-btn icon-btn-danger"
                            type="button"
                            onClick={() => onDeleteResource(resource.id)}
                            aria-label={`Delete ${resource.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
