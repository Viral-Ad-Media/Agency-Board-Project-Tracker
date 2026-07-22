import { Search, X } from "lucide-react";
import { PRIORITIES, TEAM_MEMBERS, type Priority } from "../lib/projects";

type FilterBarProps = {
  search: string;
  assignee: string;
  priority: "" | Priority;
  matchCount: number;
  totalCount: number;
  isFiltering: boolean;
  onSearchChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onClear: () => void;
};

export function FilterBar({
  search,
  assignee,
  priority,
  matchCount,
  totalCount,
  isFiltering,
  onSearchChange,
  onAssigneeChange,
  onPriorityChange,
  onClear,
}: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="Project filters">
      <span className="filter-search">
        <Search size={13} aria-hidden="true" />
        <input
          className="filter-input"
          type="search"
          placeholder="Search projects or clients..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search projects"
        />
      </span>

      <select
        className="filter-select"
        value={assignee}
        onChange={(event) => onAssigneeChange(event.target.value)}
        aria-label="Filter by assignee"
      >
        <option value="">All members</option>
        {TEAM_MEMBERS.map((member) => (
          <option value={member} key={member}>
            {member}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={priority}
        onChange={(event) => onPriorityChange(event.target.value)}
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((item) => (
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>

      {isFiltering ? (
        <>
          <button className="filter-clear" type="button" onClick={onClear}>
            <X size={12} aria-hidden="true" />
            Clear
          </button>
          <span className="filter-count" role="status">
            {matchCount} of {totalCount} projects
          </span>
        </>
      ) : null}
    </section>
  );
}
