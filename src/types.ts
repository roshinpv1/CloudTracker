export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Verified' | 'Not Applicable';

export interface ChecklistItem {
  id: string;
  description: string;
  status: Status;
  requirement_type?: string;
  evidence?: string;
  comments?: string;
  last_updated?: string;  // From backend
  lastUpdated?: string;   // For frontend
  category_id?: string;   // From backend
  categoryId?: string;    // For frontend
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  category_type?: string;
  items?: ChecklistItem[];
}

export type ApplicationStatus = 'In Review' | 'Approved' | 'Onboarded' | 'Production';

export interface Application {
  id: string;
  name: string;
  description: string;
  owner?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  platform_id?: string;
  platform_name?: string;
  applicationCategories?: Category[];
  platformCategories?: Category[];
  repository_url?: string;
  commit_id?: string;
  jira_project_key?: string;
  appdynamics_id?: string;
  grafana_dashboard_id?: string;
  splunk_index?: string;
  // Git Repository Information
  git_repo_link?: string;
  prod_branch_name?: string;
  is_default_branch?: boolean;
  default_branch_name?: string;
  git_cd_repo_link?: string;
  prod_cd_branch_name?: string;
  // Environment Information
  is_running_dev_pcf?: boolean;
  dev_env_name?: string;
  is_running_sit_pcf?: boolean;
  sit_env_name?: string;
  is_running_uat_pcf?: boolean;
  uat_env_name?: string;
  // PCF Information
  dev_pcf_details?: string;
  sit_pcf_details?: string;
  uat_pcf_details?: string;
  additional_nonprod_env?: string;
  // OCP Information
  target_ocp_env?: string;
  // Access and App Details
  ad_ent_groups?: string;
  test_user?: string;
  needs_vanity_url?: boolean;
  vanity_url_preference?: string;
  // Integration and Infrastructure
  upstream_downstream_impact?: string;
  cmp_link?: string;
  pcf_access_steps?: string;
  // Technical Information
  app_type?: string;
  uses_bridge_utility?: boolean;
  technology_stack?: string;
  build_pack?: string;
  uses_epl?: boolean;
}

export interface Platform {
  id: string;
  name: string;
  description: string;
  owner: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'reviewer' | 'user';
}

// Other types can be added here 