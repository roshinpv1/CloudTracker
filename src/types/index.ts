export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Verified';
export type ApplicationStatus = 'In Review' | 'Approved' | 'Onboarded' | 'Production';

export interface ChecklistItem {
  id: string;
  description: string;
  status: Status;
  lastUpdated: string;
  comments: string;
  evidence: string;
  category_id?: string;
}

export interface Category {
  id: string;
  name: string;
  category_type?: string;
  items: ChecklistItem[];
}

export interface Application {
  id: string;
  name: string;
  status: ApplicationStatus;
  description?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  
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
  
  // Technology Checklist Fields
  uses_venafi?: boolean;
  uses_redis?: boolean;
  uses_channel_secure?: boolean;
  uses_nas_smb?: boolean;
  has_nas_credentials?: boolean;
  uses_smtp?: boolean;
  uses_autosys?: boolean;
  uses_batch_operations?: boolean;
  uses_mtls?: boolean;
  uses_ndm?: boolean;
  uses_legacy_jks?: boolean;
  uses_soap?: boolean;
  uses_rest_api?: boolean;
  uses_apigee?: boolean;
  uses_kafka?: boolean;
  uses_ibm_mq?: boolean;
  uses_mq_cipher?: boolean;
  uses_ldap?: boolean;
  uses_splunk?: boolean;
  uses_appd?: boolean;
  uses_elastic_apm?: boolean;
  uses_harness_ucd?: boolean;
  uses_hashicorp_vault?: boolean;
  secure_properties_location?: string;
  uses_hardrock?: boolean;
  uses_rabbit_mq?: boolean;
  uses_database?: boolean;
  uses_mongodb?: boolean;
  uses_sqlserver?: boolean;
  uses_mysql?: boolean;
  uses_postgresql?: boolean;
  uses_oracle?: boolean;
  uses_cassandra?: boolean;
  uses_couchbase?: boolean;
  uses_neo4j?: boolean;
  uses_hadoop?: boolean;
  uses_spark?: boolean;
  uses_okta?: boolean;
  uses_saml?: boolean;
  uses_auth?: boolean;
  uses_jwt?: boolean;
  uses_openid?: boolean;
  uses_adfs?: boolean;
  uses_san?: boolean;
  uses_malware_scanner?: boolean;
  uses_other_services?: boolean;
  other_services_details?: string;
  has_hardcoded_urls?: boolean;
  hardcoded_urls_details?: string;
  
  // Relationships
  application_categories?: Category[];
  applicationCategories?: Category[];
  platform_categories?: Category[];
  platformCategories?: Category[];
}

export interface DashboardMetrics {
  inReview: number;
  approved: number;
  onboarded: number;
  production: number;
}

export interface RecentActivity {
  id: string;
  name: string;
  action: string;
  timestamp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  role?: string;
}