import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Application } from '../types';

interface ApplicationFormProps {
  application?: Application;
  initialData?: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isUpdating?: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ 
  application,
  initialData = {}, 
  onSubmit, 
  onCancel,
  isEdit = false,
  isUpdating = false
}) => {
  // Use application prop if provided, otherwise fall back to initialData
  const data = application || initialData;
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: data.name || '',
    status: data.status || 'In Review',
    description: data.description || '',
    
    // Git Repository Information
    git_repo_link: data.git_repo_link || '',
    prod_branch_name: data.prod_branch_name || '',
    is_default_branch: data.is_default_branch || false,
    default_branch_name: data.default_branch_name || '',
    git_cd_repo_link: data.git_cd_repo_link || '',
    prod_cd_branch_name: data.prod_cd_branch_name || '',
    
    // Environment Information
    is_running_dev_pcf: data.is_running_dev_pcf || false,
    dev_env_name: data.dev_env_name || '',
    is_running_sit_pcf: data.is_running_sit_pcf || false,
    sit_env_name: data.sit_env_name || '',
    is_running_uat_pcf: data.is_running_uat_pcf || false,
    uat_env_name: data.uat_env_name || '',
    
    // PCF Information
    dev_pcf_details: data.dev_pcf_details || '',
    sit_pcf_details: data.sit_pcf_details || '',
    uat_pcf_details: data.uat_pcf_details || '',
    additional_nonprod_env: data.additional_nonprod_env || '',
    
    // OCP Information
    target_ocp_env: data.target_ocp_env || '',
    
    // Access and App Details
    ad_ent_groups: data.ad_ent_groups || '',
    test_user: data.test_user || '',
    needs_vanity_url: data.needs_vanity_url || false,
    vanity_url_preference: data.vanity_url_preference || '',
    
    // Integration and Infrastructure
    upstream_downstream_impact: data.upstream_downstream_impact || '',
    cmp_link: data.cmp_link || '',
    pcf_access_steps: data.pcf_access_steps || '',
    
    // Technical Information
    app_type: data.app_type || '',
    uses_bridge_utility: data.uses_bridge_utility || false,
    technology_stack: data.technology_stack || '',
    build_pack: data.build_pack || '',
    uses_epl: data.uses_epl || false,
    
    // Technology Checklist
    uses_venafi: data.uses_venafi || false,
    uses_redis: data.uses_redis || false,
    uses_channel_secure: data.uses_channel_secure || false,
    uses_nas_smb: data.uses_nas_smb || false,
    has_nas_credentials: data.has_nas_credentials || false,
    uses_smtp: data.uses_smtp || false,
    uses_autosys: data.uses_autosys || false,
    uses_batch_operations: data.uses_batch_operations || false,
    uses_mtls: data.uses_mtls || false,
    uses_ndm: data.uses_ndm || false,
    uses_legacy_jks: data.uses_legacy_jks || false,
    uses_soap: data.uses_soap || false,
    uses_rest_api: data.uses_rest_api || false,
    uses_apigee: data.uses_apigee || false,
    uses_kafka: data.uses_kafka || false,
    uses_ibm_mq: data.uses_ibm_mq || false,
    uses_mq_cipher: data.uses_mq_cipher || false,
    uses_ldap: data.uses_ldap || false,
    uses_splunk: data.uses_splunk || false,
    uses_appd: data.uses_appd || false,
    uses_elastic_apm: data.uses_elastic_apm || false,
    uses_harness_ucd: data.uses_harness_ucd || false,
    uses_hashicorp_vault: data.uses_hashicorp_vault || false,
    secure_properties_location: data.secure_properties_location || '',
    uses_hardrock: data.uses_hardrock || false,
    uses_rabbit_mq: data.uses_rabbit_mq || false,
    uses_database: data.uses_database || false,
    uses_mongodb: data.uses_mongodb || false,
    uses_sqlserver: data.uses_sqlserver || false,
    uses_mysql: data.uses_mysql || false,
    uses_postgresql: data.uses_postgresql || false,
    uses_oracle: data.uses_oracle || false,
    uses_cassandra: data.uses_cassandra || false,
    uses_couchbase: data.uses_couchbase || false,
    uses_neo4j: data.uses_neo4j || false,
    uses_hadoop: data.uses_hadoop || false,
    uses_spark: data.uses_spark || false,
    uses_okta: data.uses_okta || false,
    uses_saml: data.uses_saml || false,
    uses_auth: data.uses_auth || false,
    uses_jwt: data.uses_jwt || false,
    uses_openid: data.uses_openid || false,
    uses_adfs: data.uses_adfs || false,
    uses_san: data.uses_san || false,
    uses_malware_scanner: data.uses_malware_scanner || false,
    uses_other_services: data.uses_other_services || false,
    other_services_details: data.other_services_details || '',
    has_hardcoded_urls: data.has_hardcoded_urls || false,
    hardcoded_urls_details: data.hardcoded_urls_details || '',
  });
  
  const [currentSection, setCurrentSection] = useState('basic');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'git', label: 'Git Repository' },
    { id: 'env', label: 'Environment Information' },
    { id: 'pcf', label: 'PCF Information' },
    { id: 'ocp', label: 'OCP Information' },
    { id: 'access', label: 'Access & App Details' },
    { id: 'integration', label: 'Integration' },
    { id: 'tech', label: 'Technical Information' },
    { id: 'checklist', label: 'Technology Checklist' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-neutral-900 opacity-75" onClick={onCancel}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-sm text-left overflow-hidden shadow-md transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3 mb-5">
              <h3 className="text-lg leading-6 font-medium text-neutral-900">
                {isEdit ? 'Edit Application' : 'Add New Application'}
              </h3>
              <button 
                onClick={onCancel}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar navigation */}
              <div className="md:w-64 flex flex-col space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`text-left px-3 py-2 rounded-sm text-sm font-medium ${
                      currentSection === section.id
                        ? 'bg-primary text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    onClick={() => setCurrentSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              
              {/* Form content */}
              <div className="flex-1 overflow-y-auto max-h-[60vh] px-2">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information Section */}
                  {currentSection === 'basic' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                          Application Name*
                        </label>
                        <input
                          required
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
                          Status*
                        </label>
                        <select
                          required
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-sm"
                        >
                          <option value="In Review">In Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Onboarded">Onboarded</option>
                          <option value="Production">Production</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Git Repository Section */}
                  {currentSection === 'git' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="git_repo_link" className="block text-sm font-medium text-neutral-700">
                          GIT Repo Link
                        </label>
                        <input
                          type="text"
                          name="git_repo_link"
                          id="git_repo_link"
                          value={formData.git_repo_link}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="https://github.com/example/repo"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="prod_branch_name" className="block text-sm font-medium text-neutral-700">
                          PROD Version Branch Name
                        </label>
                        <input
                          type="text"
                          name="prod_branch_name"
                          id="prod_branch_name"
                          value={formData.prod_branch_name}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="main, master, production, etc."
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_default_branch"
                          id="is_default_branch"
                          checked={formData.is_default_branch}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="is_default_branch" className="text-sm font-medium text-neutral-700">
                          Is Production Branch the Default Branch?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="default_branch_name" className="block text-sm font-medium text-neutral-700">
                          Default Branch Name (if different)
                        </label>
                        <input
                          type="text"
                          name="default_branch_name"
                          id="default_branch_name"
                          value={formData.default_branch_name}
                          onChange={handleChange}
                          disabled={formData.is_default_branch}
                          className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border ${
                            formData.is_default_branch ? 'bg-neutral-100 text-neutral-500' : ''
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="git_cd_repo_link" className="block text-sm font-medium text-neutral-700">
                          GIT CD Repo Link
                        </label>
                        <input
                          type="text"
                          name="git_cd_repo_link"
                          id="git_cd_repo_link"
                          value={formData.git_cd_repo_link}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="prod_cd_branch_name" className="block text-sm font-medium text-neutral-700">
                          Prod Equivalent CD Branch Name
                        </label>
                        <input
                          type="text"
                          name="prod_cd_branch_name"
                          id="prod_cd_branch_name"
                          value={formData.prod_cd_branch_name}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Environment Information Section */}
                  {currentSection === 'env' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_running_dev_pcf"
                          id="is_running_dev_pcf"
                          checked={formData.is_running_dev_pcf}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="is_running_dev_pcf" className="text-sm font-medium text-neutral-700">
                          Is Prod Version Running in DEV PCF?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="dev_env_name" className="block text-sm font-medium text-neutral-700">
                          Active DEV Environment Name
                        </label>
                        <input
                          type="text"
                          name="dev_env_name"
                          id="dev_env_name"
                          value={formData.dev_env_name}
                          onChange={handleChange}
                          disabled={!formData.is_running_dev_pcf}
                          className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border ${
                            !formData.is_running_dev_pcf ? 'bg-neutral-100 text-neutral-500' : ''
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_running_sit_pcf"
                          id="is_running_sit_pcf"
                          checked={formData.is_running_sit_pcf}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="is_running_sit_pcf" className="text-sm font-medium text-neutral-700">
                          Is Prod Version Running in SIT PCF?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="sit_env_name" className="block text-sm font-medium text-neutral-700">
                          Active SIT Environment Name
                        </label>
                        <input
                          type="text"
                          name="sit_env_name"
                          id="sit_env_name"
                          value={formData.sit_env_name}
                          onChange={handleChange}
                          disabled={!formData.is_running_sit_pcf}
                          className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border ${
                            !formData.is_running_sit_pcf ? 'bg-neutral-100 text-neutral-500' : ''
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="is_running_uat_pcf"
                          id="is_running_uat_pcf"
                          checked={formData.is_running_uat_pcf}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="is_running_uat_pcf" className="text-sm font-medium text-neutral-700">
                          Is Prod Version Running in UAT PCF?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="uat_env_name" className="block text-sm font-medium text-neutral-700">
                          Active UAT Environment Name
                        </label>
                        <input
                          type="text"
                          name="uat_env_name"
                          id="uat_env_name"
                          value={formData.uat_env_name}
                          onChange={handleChange}
                          disabled={!formData.is_running_uat_pcf}
                          className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border ${
                            !formData.is_running_uat_pcf ? 'bg-neutral-100 text-neutral-500' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* PCF Information Section */}
                  {currentSection === 'pcf' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="dev_pcf_details" className="block text-sm font-medium text-neutral-700">
                          DEV PCF Foundation/Org/Space
                        </label>
                        <input
                          type="text"
                          name="dev_pcf_details"
                          id="dev_pcf_details"
                          value={formData.dev_pcf_details}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="sit_pcf_details" className="block text-sm font-medium text-neutral-700">
                          SIT PCF Foundation/Org/Space
                        </label>
                        <input
                          type="text"
                          name="sit_pcf_details"
                          id="sit_pcf_details"
                          value={formData.sit_pcf_details}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="uat_pcf_details" className="block text-sm font-medium text-neutral-700">
                          UAT PCF Foundation/Org/Space
                        </label>
                        <input
                          type="text"
                          name="uat_pcf_details"
                          id="uat_pcf_details"
                          value={formData.uat_pcf_details}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="additional_nonprod_env" className="block text-sm font-medium text-neutral-700">
                          Additional Non-Prod Environments
                        </label>
                        <input
                          type="text"
                          name="additional_nonprod_env"
                          id="additional_nonprod_env"
                          value={formData.additional_nonprod_env}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="QA, Performance, etc."
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* OCP Information Section */}
                  {currentSection === 'ocp' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="target_ocp_env" className="block text-sm font-medium text-neutral-700">
                          Target OCP Environment
                        </label>
                        <select
                          id="target_ocp_env"
                          name="target_ocp_env"
                          value={formData.target_ocp_env}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-sm"
                        >
                          <option value="">Select OCP Environment</option>
                          <option value="Sterling">Sterling</option>
                          <option value="Lewisville">Lewisville</option>
                          <option value="Manassas">Manassas</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Access and App Details Section */}
                  {currentSection === 'access' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="ad_ent_groups" className="block text-sm font-medium text-neutral-700">
                          AD-ENT Groups for Access
                        </label>
                        <input
                          type="text"
                          name="ad_ent_groups"
                          id="ad_ent_groups"
                          value={formData.ad_ent_groups}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="E.g. GIT access, Splunk Access groups"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="test_user" className="block text-sm font-medium text-neutral-700">
                          Test User Information
                        </label>
                        <input
                          type="text"
                          name="test_user"
                          id="test_user"
                          value={formData.test_user}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="User for testing (UI apps)"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="needs_vanity_url"
                          id="needs_vanity_url"
                          checked={formData.needs_vanity_url}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="needs_vanity_url" className="text-sm font-medium text-neutral-700">
                          Does App Need Vanity URL?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="vanity_url_preference" className="block text-sm font-medium text-neutral-700">
                          Vanity URL Preference
                        </label>
                        <input
                          type="text"
                          name="vanity_url_preference"
                          id="vanity_url_preference"
                          value={formData.vanity_url_preference}
                          onChange={handleChange}
                          disabled={!formData.needs_vanity_url}
                          className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border ${
                            !formData.needs_vanity_url ? 'bg-neutral-100 text-neutral-500' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Integration and Infrastructure Section */}
                  {currentSection === 'integration' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="upstream_downstream_impact" className="block text-sm font-medium text-neutral-700">
                          Upstream/Downstream App Impact
                        </label>
                        <textarea
                          id="upstream_downstream_impact"
                          name="upstream_downstream_impact"
                          rows={3}
                          value={formData.upstream_downstream_impact}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="Apps that might be impacted with this component"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cmp_link" className="block text-sm font-medium text-neutral-700">
                          CMP Link
                        </label>
                        <input
                          type="text"
                          name="cmp_link"
                          id="cmp_link"
                          value={formData.cmp_link}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="pcf_access_steps" className="block text-sm font-medium text-neutral-700">
                          PCF Access Request Steps
                        </label>
                        <textarea
                          id="pcf_access_steps"
                          name="pcf_access_steps"
                          rows={3}
                          value={formData.pcf_access_steps}
                          onChange={handleChange}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="Steps to request access to PCF app manager as lead engineer"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Technical Information Section */}
                  {currentSection === 'tech' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="app_type" className="block text-sm font-medium text-neutral-700">
                          Application Type
                        </label>
                        <select
                          id="app_type"
                          name="app_type"
                          value={formData.app_type}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-sm"
                        >
                          <option value="">Select App Type</option>
                          <option value="Batch">Batch (AutoSys)</option>
                          <option value="UI">UI</option>
                          <option value="API">API</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_bridge_utility"
                          id="uses_bridge_utility"
                          checked={formData.uses_bridge_utility}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_bridge_utility" className="text-sm font-medium text-neutral-700">
                          Uses Bridge Utility Server in PCF?
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="technology_stack" className="block text-sm font-medium text-neutral-700">
                          Technology Stack
                        </label>
                        <select
                          id="technology_stack"
                          name="technology_stack"
                          value={formData.technology_stack}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-sm"
                        >
                          <option value="">Select Technology</option>
                          <option value="Java">Java</option>
                          <option value=".NET">.NET</option>
                          <option value="Python">Python</option>
                          <option value="Angular">Angular</option>
                          <option value="React">React</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="build_pack" className="block text-sm font-medium text-neutral-700">
                          Build Pack
                        </label>
                        <select
                          id="build_pack"
                          name="build_pack"
                          value={formData.build_pack}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-sm"
                        >
                          <option value="">Select Build Pack</option>
                          <option value="Gradle">Gradle</option>
                          <option value="Maven">Maven</option>
                          <option value="NPM">NPM</option>
                          <option value="Pip">Pip</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_epl"
                          id="uses_epl"
                          checked={formData.uses_epl}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_epl" className="text-sm font-medium text-neutral-700">
                          Uses EPL/EPLX?
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Technology Checklist Section */}
                  {currentSection === 'checklist' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-neutral-800 mb-4">Security & Authentication</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_venafi"
                          id="uses_venafi"
                          checked={formData.uses_venafi}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_venafi" className="text-sm font-medium text-neutral-700">
                          Is the component using Venafi?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_channel_secure"
                          id="uses_channel_secure"
                          checked={formData.uses_channel_secure}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_channel_secure" className="text-sm font-medium text-neutral-700">
                          Is the component using Channel Secure / PingFed?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_mtls"
                          id="uses_mtls"
                          checked={formData.uses_mtls}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_mtls" className="text-sm font-medium text-neutral-700">
                          Is the component using MTLS / Mutual Auth Or hard rock pattern?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_legacy_jks"
                          id="uses_legacy_jks"
                          checked={formData.uses_legacy_jks}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_legacy_jks" className="text-sm font-medium text-neutral-700">
                          Is the component using legacy JKS file?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_hardrock"
                          id="uses_hardrock"
                          checked={formData.uses_hardrock}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_hardrock" className="text-sm font-medium text-neutral-700">
                          Is the Component using hardRock / MTLS auth?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_hashicorp_vault"
                          id="uses_hashicorp_vault"
                          checked={formData.uses_hashicorp_vault}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_hashicorp_vault" className="text-sm font-medium text-neutral-700">
                          Is the component storing secure values in Hashicorp vault or external storage?
                        </label>
                      </div>
                      
                      {formData.uses_hashicorp_vault && (
                        <div className="ml-6">
                          <label htmlFor="secure_properties_location" className="block text-sm font-medium text-neutral-700">
                            Share details of where secure properties are stored:
                          </label>
                          <input
                            type="text"
                            name="secure_properties_location"
                            id="secure_properties_location"
                            value={formData.secure_properties_location}
                            onChange={handleChange}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          />
                        </div>
                      )}
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Storage & Infrastructure</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_nas_smb"
                          id="uses_nas_smb"
                          checked={formData.uses_nas_smb}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_nas_smb" className="text-sm font-medium text-neutral-700">
                          Is the component using NAS / SMB?
                        </label>
                      </div>
                      
                      {formData.uses_nas_smb && (
                        <div className="flex items-center space-x-2 ml-6">
                          <input
                            type="checkbox"
                            name="has_nas_credentials"
                            id="has_nas_credentials"
                            checked={formData.has_nas_credentials}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor="has_nas_credentials" className="text-sm font-medium text-neutral-700">
                            Does app team have AD-ENT or QA-ENT credentials for volume mounts in OCP?
                          </label>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_san"
                          id="uses_san"
                          checked={formData.uses_san}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_san" className="text-sm font-medium text-neutral-700">
                          Is the component using SAN?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Messaging & Integration</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_redis"
                          id="uses_redis"
                          checked={formData.uses_redis}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_redis" className="text-sm font-medium text-neutral-700">
                          Is the component using Redis?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_smtp"
                          id="uses_smtp"
                          checked={formData.uses_smtp}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_smtp" className="text-sm font-medium text-neutral-700">
                          Is the component using SMTP?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_ndm"
                          id="uses_ndm"
                          checked={formData.uses_ndm}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_ndm" className="text-sm font-medium text-neutral-700">
                          Is the component using NDM?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_soap"
                          id="uses_soap"
                          checked={formData.uses_soap}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_soap" className="text-sm font-medium text-neutral-700">
                          Is the component using SOAP Calls?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_rest_api"
                          id="uses_rest_api"
                          checked={formData.uses_rest_api}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_rest_api" className="text-sm font-medium text-neutral-700">
                          Is the component using REST API?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_apigee"
                          id="uses_apigee"
                          checked={formData.uses_apigee}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_apigee" className="text-sm font-medium text-neutral-700">
                          Is the component using APIGEE?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_kafka"
                          id="uses_kafka"
                          checked={formData.uses_kafka}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_kafka" className="text-sm font-medium text-neutral-700">
                          Is the component using KAFKA?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_ibm_mq"
                          id="uses_ibm_mq"
                          checked={formData.uses_ibm_mq}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_ibm_mq" className="text-sm font-medium text-neutral-700">
                          Is the component using IBM MQ?
                        </label>
                      </div>
                      
                      {formData.uses_ibm_mq && (
                        <div className="flex items-center space-x-2 ml-6">
                          <input
                            type="checkbox"
                            name="uses_mq_cipher"
                            id="uses_mq_cipher"
                            checked={formData.uses_mq_cipher}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor="uses_mq_cipher" className="text-sm font-medium text-neutral-700">
                            Is the component using any Cipher suite with MQ?
                          </label>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_ldap"
                          id="uses_ldap"
                          checked={formData.uses_ldap}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_ldap" className="text-sm font-medium text-neutral-700">
                          Is the component using LDAP?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_rabbit_mq"
                          id="uses_rabbit_mq"
                          checked={formData.uses_rabbit_mq}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_rabbit_mq" className="text-sm font-medium text-neutral-700">
                          Is the Component using RabbitMQ?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Batch Processing & Jobs</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_autosys"
                          id="uses_autosys"
                          checked={formData.uses_autosys}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_autosys" className="text-sm font-medium text-neutral-700">
                          Is the component using AutoSys?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_batch_operations"
                          id="uses_batch_operations"
                          checked={formData.uses_batch_operations}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_batch_operations" className="text-sm font-medium text-neutral-700">
                          Is the component using CRON/quartz/spring batch or other batch operations?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Databases</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_database"
                          id="uses_database"
                          checked={formData.uses_database}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_database" className="text-sm font-medium text-neutral-700">
                          Is the component using Database?
                        </label>
                      </div>
                      
                      {formData.uses_database && (
                        <div className="ml-6 space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_mongodb"
                              id="uses_mongodb"
                              checked={formData.uses_mongodb}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_mongodb" className="text-sm font-medium text-neutral-700">
                              MongoDB
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_sqlserver"
                              id="uses_sqlserver"
                              checked={formData.uses_sqlserver}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_sqlserver" className="text-sm font-medium text-neutral-700">
                              SQL Server
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_mysql"
                              id="uses_mysql"
                              checked={formData.uses_mysql}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_mysql" className="text-sm font-medium text-neutral-700">
                              MySQL
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_postgresql"
                              id="uses_postgresql"
                              checked={formData.uses_postgresql}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_postgresql" className="text-sm font-medium text-neutral-700">
                              PostgreSQL
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_oracle"
                              id="uses_oracle"
                              checked={formData.uses_oracle}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_oracle" className="text-sm font-medium text-neutral-700">
                              Oracle
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_cassandra"
                              id="uses_cassandra"
                              checked={formData.uses_cassandra}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_cassandra" className="text-sm font-medium text-neutral-700">
                              Cassandra
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_couchbase"
                              id="uses_couchbase"
                              checked={formData.uses_couchbase}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_couchbase" className="text-sm font-medium text-neutral-700">
                              Couchbase
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="uses_neo4j"
                              id="uses_neo4j"
                              checked={formData.uses_neo4j}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="uses_neo4j" className="text-sm font-medium text-neutral-700">
                              Neo4j
                            </label>
                          </div>
                        </div>
                      )}
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Big Data</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_hadoop"
                          id="uses_hadoop"
                          checked={formData.uses_hadoop}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_hadoop" className="text-sm font-medium text-neutral-700">
                          Is the component using Hadoop?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_spark"
                          id="uses_spark"
                          checked={formData.uses_spark}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_spark" className="text-sm font-medium text-neutral-700">
                          Is the component using Spark?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Authentication & Identity</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_okta"
                          id="uses_okta"
                          checked={formData.uses_okta}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_okta" className="text-sm font-medium text-neutral-700">
                          Is the component using Okta?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_saml"
                          id="uses_saml"
                          checked={formData.uses_saml}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_saml" className="text-sm font-medium text-neutral-700">
                          Is the component using SAML?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_auth"
                          id="uses_auth"
                          checked={formData.uses_auth}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_auth" className="text-sm font-medium text-neutral-700">
                          Is the component using Auth?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_jwt"
                          id="uses_jwt"
                          checked={formData.uses_jwt}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_jwt" className="text-sm font-medium text-neutral-700">
                          Is the component using JWT?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_openid"
                          id="uses_openid"
                          checked={formData.uses_openid}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_openid" className="text-sm font-medium text-neutral-700">
                          Is the component using OpenID?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_adfs"
                          id="uses_adfs"
                          checked={formData.uses_adfs}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_adfs" className="text-sm font-medium text-neutral-700">
                          Is the component using ADFS?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Monitoring & Operations</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_splunk"
                          id="uses_splunk"
                          checked={formData.uses_splunk}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_splunk" className="text-sm font-medium text-neutral-700">
                          Is the Component using Splunk?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_appd"
                          id="uses_appd"
                          checked={formData.uses_appd}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_appd" className="text-sm font-medium text-neutral-700">
                          Is the Component using AppD/AppDynamics?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_elastic_apm"
                          id="uses_elastic_apm"
                          checked={formData.uses_elastic_apm}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_elastic_apm" className="text-sm font-medium text-neutral-700">
                          Is the Component using ELASTIC APM?
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_malware_scanner"
                          id="uses_malware_scanner"
                          checked={formData.uses_malware_scanner}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_malware_scanner" className="text-sm font-medium text-neutral-700">
                          Is the component using MalwareScanner?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">CI/CD & Deployment</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_harness_ucd"
                          id="uses_harness_ucd"
                          checked={formData.uses_harness_ucd}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_harness_ucd" className="text-sm font-medium text-neutral-700">
                          Is the component using Harness or UCD for CICD?
                        </label>
                      </div>
                      
                      <h4 className="text-md font-medium text-neutral-800 mt-6 mb-4">Additional Information</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="uses_other_services"
                          id="uses_other_services"
                          checked={formData.uses_other_services}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="uses_other_services" className="text-sm font-medium text-neutral-700">
                          Is the component using any other service?
                        </label>
                      </div>
                      
                      {formData.uses_other_services && (
                        <div className="ml-6">
                          <label htmlFor="other_services_details" className="block text-sm font-medium text-neutral-700">
                            Please share details of other services:
                          </label>
                          <textarea
                            id="other_services_details"
                            name="other_services_details"
                            rows={3}
                            value={formData.other_services_details}
                            onChange={handleChange}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="has_hardcoded_urls"
                          id="has_hardcoded_urls"
                          checked={formData.has_hardcoded_urls}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="has_hardcoded_urls" className="text-sm font-medium text-neutral-700">
                          Are there any application URLs hardcoded in application code or property files?
                        </label>
                      </div>
                      
                      {formData.has_hardcoded_urls && (
                        <div className="ml-6">
                          <label htmlFor="hardcoded_urls_details" className="block text-sm font-medium text-neutral-700">
                            Please share details on hardcoded URLs:
                          </label>
                          <textarea
                            id="hardcoded_urls_details"
                            name="hardcoded_urls_details"
                            rows={3}
                            value={formData.hardcoded_urls_details}
                            onChange={handleChange}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-neutral-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-sm border border-transparent px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update' : 'Create'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-sm border border-neutral-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm; 