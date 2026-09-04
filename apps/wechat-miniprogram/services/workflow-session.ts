import type { GeneratedArtifact, JobDescription, RequirementMatch } from "../../../packages/contracts/src/index";

interface WorkflowSession {
  job: JobDescription | null;
  matches: RequirementMatch[];
  artifacts: GeneratedArtifact[];
}

export const workflowSession: WorkflowSession = {
  job: null,
  matches: [],
  artifacts: []
};
