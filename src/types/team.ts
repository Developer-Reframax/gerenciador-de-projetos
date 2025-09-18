export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  color?: string;
  settings?: TeamSettings;
  is_active?: boolean;
  is_private?: boolean;
  status?: 'active' | 'inactive' | 'archived';
  member_count?: number;
  deleted_at?: string;
}

export interface TeamSettings {
  allow_public_projects: boolean;
  allow_external_sharing: boolean;
  default_project_visibility: 'team' | 'public' | 'private';
  require_approval_for_members: boolean;
  allow_member_invite: boolean;
  require_approval: boolean;
  max_members?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at?: string;
  permissions?: TeamMemberPermissions;
  invited_by?: string;
  invited_at?: string;
  status: 'pending' | 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface TeamMemberPermissions {
  can_manage_team: boolean;
  can_invite_members: boolean;
  can_create_projects: boolean;
  can_delete_projects: boolean;
}

export interface TeamWithMembers extends Team {
  members: TeamMemberWithUser[];
  member_count: number;
}

// Tipo para teams retornados pela API GET /teams com membros básicos
export interface TeamWithBasicMembers extends Team {
  team_members: {
    id: string;
    role: 'owner' | 'admin' | 'member';
    status: 'pending' | 'active' | 'inactive';
    user_id: string;
    team_id: string;
  }[];
}

export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateTeamData {
  name: string;
  description?: string;
  color?: string;
  avatar_url?: string;
  is_private?: boolean;
  status?: 'active' | 'inactive' | 'archived';
  settings?: Partial<TeamSettings>;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  color?: string;
  avatar_url?: string;
  is_private?: boolean;
  status?: 'active' | 'inactive' | 'archived';
  settings?: Partial<TeamSettings>;
  is_active?: boolean;
}

export interface AddTeamMemberData {
  user_id: string;
  role?: 'admin' | 'member';
  permissions?: Partial<TeamMemberPermissions>;
}

export interface UpdateTeamMemberData {
  role?: 'admin' | 'member';
  permissions?: Partial<TeamMemberPermissions>;
  status?: 'active' | 'inactive';
}
