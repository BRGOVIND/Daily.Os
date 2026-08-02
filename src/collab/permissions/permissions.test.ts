import { describe, it, expect } from "vitest";
import { can, canAssignRole, assignableRoles } from "./permissions";

describe("can (role capability matrix)", () => {
  it("viewers may only view and comment", () => {
    expect(can("viewer", "view")).toBe(true);
    expect(can("viewer", "comment")).toBe(true);
    expect(can("viewer", "edit-content")).toBe(false);
    expect(can("viewer", "invite")).toBe(false);
  });
  it("editors edit and assign but cannot manage members", () => {
    expect(can("editor", "edit-content")).toBe(true);
    expect(can("editor", "assign")).toBe(true);
    expect(can("editor", "invite")).toBe(false);
    expect(can("editor", "manage-roles")).toBe(false);
  });
  it("admins manage members but cannot delete the workspace", () => {
    expect(can("admin", "invite")).toBe(true);
    expect(can("admin", "manage-roles")).toBe(true);
    expect(can("admin", "delete-workspace")).toBe(false);
  });
  it("owners can do everything", () => {
    expect(can("owner", "delete-workspace")).toBe(true);
    expect(can("owner", "transfer-ownership")).toBe(true);
  });
});

describe("canAssignRole (no privilege escalation)", () => {
  it("you cannot grant a role at or above your own rank", () => {
    expect(canAssignRole("admin", "owner")).toBe(false);
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("admin", "editor")).toBe(true);
  });
  it("owners may grant admin/editor/viewer but not owner", () => {
    expect(canAssignRole("owner", "admin")).toBe(true);
    expect(canAssignRole("owner", "owner")).toBe(false);
  });
  it("editors and viewers cannot assign roles at all", () => {
    expect(canAssignRole("editor", "viewer")).toBe(false);
    expect(canAssignRole("viewer", "viewer")).toBe(false);
    expect(assignableRoles("editor")).toEqual([]);
  });
});
