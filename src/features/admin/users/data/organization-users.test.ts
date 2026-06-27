import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationAdminContext } from "@/lib/auth/organization-admin";
import { createClient } from "@/lib/supabase/server";

import {
  getOrganizationUsersDirectory,
  mapOrganizationUsersDirectory,
} from "@/features/admin/users/data/organization-users";

vi.mock("server-only", () => ({}), { virtual: true });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

type QueryResult = {
  data: unknown;
  error: Error | null;
};

type QueryRecord = {
  table: string;
  selectedFields: string | null;
  filters: Array<{ column: string; value: string }>;
  orderedBy: string | null;
};

interface MockQuery {
  select: (fields: string) => MockQuery;
  eq: (column: string, value: string) => MockQuery;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => Promise<QueryResult>;
  maybeSingle: () => Promise<QueryResult>;
}

const organizationAdmin: OrganizationAdminContext = {
  id: "org-admin-id",
  organizationId: "trusted-organization-id",
  role: "manager",
  teamId: null,
  isOrganizationAdmin: true,
};

const createClientMock = vi.mocked(createClient);

function createSupabaseMock(results: Record<string, QueryResult>) {
  const records: QueryRecord[] = [];

  const from = vi.fn((table: string) => {
    const record: QueryRecord = {
      table,
      selectedFields: null,
      filters: [],
      orderedBy: null,
    };
    records.push(record);

    const query: MockQuery = {
      select(fields) {
        record.selectedFields = fields;
        return query;
      },
      eq(column, value) {
        record.filters.push({ column, value });
        return query;
      },
      async order(column) {
        record.orderedBy = column;
        return results[table];
      },
      async maybeSingle() {
        return results[table];
      },
    };

    return query;
  });

  createClientMock.mockResolvedValue({
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { records };
}

describe("organization users directory data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes organization, team, and profile queries to the trusted organization id", async () => {
    const { records } = createSupabaseMock({
      organizations: {
        data: { name: "FieldFlow Demo Motors" },
        error: null,
      },
      teams: {
        data: [{ id: "team-id", name: "Field Team" }],
        error: null,
      },
      profiles: {
        data: [
          {
            display_name: "Arjun Rao",
            role: "manager",
            status: "active",
            team_id: "team-id",
            is_organization_admin: true,
          },
        ],
        error: null,
      },
    });

    await expect(
      getOrganizationUsersDirectory(organizationAdmin),
    ).resolves.toMatchObject({
      status: "ready",
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "organizations",
          selectedFields: "name",
          filters: [
            { column: "id", value: "trusted-organization-id" },
          ],
        }),
        expect.objectContaining({
          table: "teams",
          selectedFields: "id, name",
          filters: [
            {
              column: "organization_id",
              value: "trusted-organization-id",
            },
          ],
          orderedBy: "name",
        }),
        expect.objectContaining({
          table: "profiles",
          selectedFields:
            "display_name, role, status, team_id, is_organization_admin",
          filters: [
            {
              column: "organization_id",
              value: "trusted-organization-id",
            },
          ],
          orderedBy: "display_name",
        }),
      ]),
    );
  });

  it("maps teamless admins, unassigned invited users, and named team assignments", () => {
    const directory = mapOrganizationUsersDirectory({
      organization: { name: "FieldFlow Demo Motors" },
      teams: [{ id: "team-id", name: "Field Team" }],
      profiles: [
        {
          display_name: "Priya Admin",
          role: "manager",
          status: "active",
          team_id: null,
          is_organization_admin: true,
        },
        {
          display_name: "Maya Chen",
          role: "sales_executive",
          status: "active",
          team_id: "team-id",
          is_organization_admin: false,
        },
        {
          display_name: "Invited User",
          role: "sales_executive",
          status: "invited",
          team_id: null,
          is_organization_admin: false,
        },
      ],
    });

    expect(directory.organizationName).toBe("FieldFlow Demo Motors");
    expect(directory.inviteTeams).toEqual([
      { id: "team-id", name: "Field Team" },
    ]);
    expect(directory.summary).toEqual({
      totalUsers: 3,
      activeUsers: 2,
      invitedUsers: 1,
      disabledUsers: 0,
    });
    expect(directory.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Priya Admin",
          teamName: "Organization-wide",
          statusLabel: "Active",
          isOrganizationAdmin: true,
        }),
        expect.objectContaining({
          name: "Maya Chen",
          teamName: "Field Team",
          roleLabel: "Sales Executive",
        }),
        expect.objectContaining({
          name: "Invited User",
          teamName: "Unassigned",
          statusLabel: "Invited",
        }),
      ]),
    );
  });
});
