-- Tenant isolation policies
-- Users can only access data within organizations they belong to

-- organizations: members can view their own organizations
CREATE POLICY "users can view own organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- users: users can view their own profile
CREATE POLICY "users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- users: users can update their own profile
CREATE POLICY "users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- organization_members: members can view other members in their org
CREATE POLICY "members can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- analysis_subjects: tenant isolation
CREATE POLICY "tenant isolation for analysis_subjects"
  ON analysis_subjects FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- consents: tenant isolation
CREATE POLICY "tenant isolation for consents"
  ON consents FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- analysis_jobs: tenant isolation
CREATE POLICY "tenant isolation for analysis_jobs"
  ON analysis_jobs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- reports: tenant isolation
CREATE POLICY "tenant isolation for reports"
  ON reports FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
