export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Media & Marketing',
  'Consulting',
  'Non-profit',
  'Government',
] as const

export const FUNCTIONS: Record<string, string[]> = {
  Technology: ['Product', 'Engineering', 'Design', 'Data & Analytics', 'Operations', 'Sales & GTM'],
  Healthcare: ['Clinical Operations', 'Health Informatics', 'Product & Technology', 'Research & Clinical Trials'],
  Finance: ['FinTech Product', 'Risk & Compliance', 'Operations', 'Investment & Analysis'],
  Education: ['EdTech', 'Learning & Development', 'Curriculum & Instruction', 'Administration'],
  'Media & Marketing': ['Content Strategy', 'Brand & Marketing', 'Growth & Performance', 'Communications'],
  Consulting: ['Strategy', 'Operations', 'Technology', 'People & Org'],
  'Non-profit': ['Programs', 'Operations', 'Development & Fundraising', 'Policy & Advocacy'],
  Government: ['Policy', 'Digital Services', 'Operations', 'Research & Analysis'],
}

export const ROLES: Record<string, Record<string, string[]>> = {
  Technology: {
    Product: [
      'Product Manager',
      'Associate Product Manager',
      'Senior Product Manager',
      'Group Product Manager',
      'Product Operations Manager',
      'Technical Product Manager',
    ],
    Engineering: ['Software Engineer', 'Engineering Manager', 'Technical Lead', 'Staff Engineer'],
    Design: ['Product Designer', 'UX Designer', 'UX Researcher', 'Design Manager'],
    'Data & Analytics': ['Data Analyst', 'Data Scientist', 'Analytics Engineer', 'Business Intelligence Analyst'],
    Operations: ['Operations Manager', 'Business Operations Analyst', 'Chief of Staff', 'Strategy & Ops Manager'],
    'Sales & GTM': ['Solutions Engineer', 'Customer Success Manager', 'Account Executive'],
  },
  Healthcare: {
    'Clinical Operations': ['Clinical Operations Manager', 'Care Coordinator', 'Quality Improvement Specialist'],
    'Health Informatics': ['Clinical Informatics Analyst', 'Health Data Analyst', 'EHR Implementation Specialist'],
    'Product & Technology': ['Health Tech Product Manager', 'Digital Health Product Manager'],
    'Research & Clinical Trials': ['Clinical Research Coordinator', 'Research Operations Manager'],
  },
  Finance: {
    'FinTech Product': ['FinTech Product Manager', 'Payments Product Manager', 'Banking Product Manager'],
    'Risk & Compliance': ['Risk Analyst', 'Compliance Manager'],
    Operations: ['Financial Operations Analyst', 'Treasury Analyst'],
    'Investment & Analysis': ['Investment Analyst', 'Portfolio Analyst'],
  },
  Education: {
    EdTech: ['EdTech Product Manager', 'Learning Experience Designer', 'Curriculum Designer'],
    'Learning & Development': ['L&D Specialist', 'Training Manager', 'Instructional Designer'],
    'Curriculum & Instruction': ['Curriculum Developer', 'Academic Coordinator'],
    Administration: ['Academic Program Manager', 'Registrar'],
  },
  'Media & Marketing': {
    'Content Strategy': ['Content Strategist', 'Editorial Manager', 'Content Operations Manager'],
    'Brand & Marketing': ['Marketing Manager', 'Brand Manager', 'Campaign Manager'],
    'Growth & Performance': ['Growth Manager', 'Performance Marketing Manager', 'CRO Specialist'],
    Communications: ['Communications Manager', 'PR Manager', 'Internal Communications Manager'],
  },
  Consulting: {
    Strategy: ['Strategy Consultant', 'Management Consultant', 'Senior Associate'],
    Operations: ['Operations Consultant', 'Process Improvement Analyst'],
    Technology: ['Technology Consultant', 'IT Consultant'],
    'People & Org': ['Organisational Design Consultant', 'Change Management Consultant'],
  },
  'Non-profit': {
    Programs: ['Program Manager', 'Program Director', 'Program Coordinator'],
    Operations: ['Operations Manager', 'COO'],
    'Development & Fundraising': ['Development Manager', 'Grant Writer', 'Major Gifts Officer'],
    'Policy & Advocacy': ['Policy Analyst', 'Advocacy Manager'],
  },
  Government: {
    Policy: ['Policy Analyst', 'Policy Advisor', 'Legislative Analyst'],
    'Digital Services': ['Digital Transformation Manager', 'Government Product Manager'],
    Operations: ['Operations Manager', 'Programme Manager'],
    'Research & Analysis': ['Research Analyst', 'Evaluation Specialist'],
  },
}
