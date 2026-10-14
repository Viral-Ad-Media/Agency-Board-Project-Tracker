import { Search, X } from "lucide-react";
import { PRIORITIES, type Priority, type Project, type TeamMemberDef } from "../lib/tasks";

type FilterBarProps = {
  search: string;
  assignee: string;
  priority: "" | Priority;
  projectId: string;
  teamMembers: TeamMemberDef[];
  projects: Project[];
  matchCount: number;
  totalCount: number;
  isFiltering: boolean;
  onSearchChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onClear: () => void;
};

export function FilterBar({
  search,
  assignee,
  priority,
  projectId,
  teamMembers,
  projects,
  matchCount,
  totalCount,
  isFiltering,
  onSearchChange,
  onAssigneeChange,
  onPriorityChange,
  onProjectChange,
  onClear,
}: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="Task filters" data-tour-id="filter-bar">
      <span className="filter-search">
        <Search size={13} aria-hidden="true" />
        <input
          className="filter-input"
          type="search"
          placeholder="Search tasks or clients..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search tasks"
        />
      </span>

      <select
        className="filter-select"
        value={assignee}
        onChange={(event) => onAssigneeChange(event.target.value)}
        aria-label="Filter by assignee"
      >
        <option value="">All members</option>
        {teamMembers.map((member) => (
          <option value={member.id} key={member.id}>
            {member.name}
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

      {projects.length > 0 ? (
        <select
          className="filter-select"
          value={projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          aria-label="Filter by project"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      ) : null}

      {isFiltering ? (
        <>
          <button className="filter-clear" type="button" onClick={onClear}>
            <X size={12} aria-hidden="true" />
            Clear
          </button>
          <span className="filter-count" role="status">
            {matchCount} of {totalCount} tasks
          </span>
        </>
      ) : null}
    </section>
  );
}
