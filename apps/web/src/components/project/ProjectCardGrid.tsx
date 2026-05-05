import projectList from "@/data/project_list.json";
import ProjectCard from "./ProjectCard";

interface Props {
  sectionLabel?: string;
  countSuffix?: string;
}

export default function ProjectCardGrid({
  sectionLabel = "ALL CLASSES",
  countSuffix = "가지 원데이 클래스",
}: Props) {
  return (
    <section id="all-projects" className="aprj-section">
      <div className="aprj-container">
        <div className="aprj-grid-header">
          <span className="aprj-section-label">{sectionLabel}</span>
          <p className="aprj-grid-header-count">
            총 <strong>{projectList.length}</strong>{countSuffix}
          </p>
        </div>
        <div className="aprj-grid">
          {projectList.map((p) => (
            <ProjectCard key={p.num} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
