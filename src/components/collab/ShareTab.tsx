"use client";

import { useState } from "react";
import {
  Activity as ActivityIcon,
  Check,
  Copy,
  Shield,
  UserPlus,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { useIdentity } from "@/hooks/useIdentity";
import { useActivity, useCollab } from "@/hooks/useCollab";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  ACTIVITY_ICON,
  ROLE_LABEL,
  assignableRoles,
  describeActivity,
} from "@/collab";
import { CommentsThread } from "./CommentsThread";
import { cn } from "@/lib/utils";
import type { Member, Role } from "@/types";
import type { SyncStatus as SyncStatusType } from "@/collab";

interface ShareTabProps {
  workspaceId: string;
}

const STATUS_STYLE: Record<SyncStatusType, { label: string; className: string }> = {
  offline: { label: "Local only", className: "text-ink-muted" },
  connecting: { label: "Connecting…", className: "text-warning" },
  online: { label: "Live · this device", className: "text-success" },
  error: { label: "Sync error", className: "text-alert" },
};

/**
 * Module 2/6/7 surface — the workspace's Share tab. Manage members & roles,
 * invite collaborators (offline invite codes), watch the live activity feed and
 * discuss at the workspace level. Renders identically in personal mode, where
 * you are simply the sole owner.
 */
export function ShareTab({ workspaceId }: ShareTabProps) {
  const { identity, rename } = useIdentity();
  const collab = useCollab(workspaceId);
  const activity = useActivity(workspaceId);
  const status = useSyncStatus(true);

  return (
    <div className="space-y-6">
      {/* You */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <div>
              <YouName name={identity.name} onSave={(n) => rename(n, identity.handle)} />
              <p className="text-[12px] text-ink-muted">
                Your role: {ROLE_LABEL[collab.myRole]}
              </p>
            </div>
          </div>
          <SyncBadge status={status} />
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            <Users className="h-4 w-4" /> Members
            <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium">
              {collab.members.length || 1}
            </span>
          </h4>
        </div>

        {collab.members.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[13px] text-ink-muted">
              This is a personal workspace. Share it to collaborate — everything
              stays on your device until you connect a sync provider.
            </p>
            <button
              type="button"
              onClick={() => collab.ensureSelfMember()}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <UserPlus className="h-4 w-4" /> Enable sharing
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {collab.members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                myRole={collab.myRole}
                isMe={m.actorId === identity.actorId}
                onRole={(role) => collab.changeRole(m, role)}
                onRemove={() => collab.kick(m)}
              />
            ))}
          </ul>
        )}

        {collab.members.length > 0 && collab.can("invite") && (
          <InviteForm onInvite={collab.invite} inviterRole={collab.myRole} />
        )}
      </section>

      {/* Activity feed */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <h4 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <ActivityIcon className="h-4 w-4" /> Activity
        </h4>
        {activity.length === 0 ? (
          <p className="text-[13px] text-ink-muted/70">
            Invites, comments and changes will appear here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5">
                <span className="text-sm">{ACTIVITY_ICON[a.kind]}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                  {describeActivity(a)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Workspace discussion */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <CommentsThread
          workspaceId={workspaceId}
          targetType="workspace"
          targetId={workspaceId}
          canComment={collab.can("comment")}
        />
      </section>
    </div>
  );
}

function YouName({ name, onSave }: { name: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="text-[15px] font-medium text-ink hover:text-accent"
      >
        {name}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
        setEditing(false);
      }}
      className="flex items-center gap-1"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          onSave(value);
          setEditing(false);
        }}
        className="h-7 rounded-md border border-line bg-canvas px-2 text-[14px] text-ink focus:border-accent/50 focus:outline-none"
      />
    </form>
  );
}

function SyncBadge({ status }: { status: SyncStatusType }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("flex items-center gap-1.5 text-[12px] font-medium", s.className)}>
      <Wifi className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
}

function MemberRow({
  member,
  myRole,
  isMe,
  onRole,
  onRemove,
}: {
  member: Member;
  myRole: Role;
  isMe: boolean;
  onRole: (role: Role) => void;
  onRemove: () => void;
}) {
  const roleOptions = assignableRoles(myRole);
  const canEdit = roleOptions.length > 0 && member.role !== "owner" && !isMe;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-[12px] font-semibold text-accent">
        {member.name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">
          {member.name} {isMe && <span className="text-ink-muted">(you)</span>}
        </p>
        <p className="text-[11px] text-ink-muted">
          {member.status === "invited" ? (
            <span className="inline-flex items-center gap-1">
              Invited · code <code className="rounded bg-canvas px-1">{member.inviteCode}</code>
              <CopyCode code={member.inviteCode ?? ""} />
            </span>
          ) : (
            member.status
          )}
        </p>
      </div>
      {canEdit ? (
        <select
          value={member.role}
          onChange={(e) => onRole(e.target.value as Role)}
          className="h-8 rounded-lg border border-line bg-card px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none"
        >
          {[member.role, ...roleOptions.filter((r) => r !== member.role)].map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      ) : (
        <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted">
          {ROLE_LABEL[member.role]}
        </span>
      )}
      {canEdit && (
        <button
          type="button"
          aria-label={`Remove ${member.name}`}
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted/50 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  return (
    <button
      type="button"
      aria-label="Copy invite code"
      onClick={() => {
        void navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-ink-muted/60 hover:text-accent"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function InviteForm({
  onInvite,
  inviterRole,
}: {
  onInvite: (name: string, role: Role) => void;
  inviterRole: Role;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const roles = assignableRoles(inviterRole);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onInvite(name.trim(), role);
        setName("");
      }}
      className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Invite by name…"
        className="h-9 min-w-[8rem] flex-1 rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink placeholder:text-ink-muted/60 focus:border-accent/50 focus:outline-none"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="h-9 rounded-lg border border-line bg-card px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none"
      >
        {roles.map((r) => (
          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!name.trim()}
        className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
      >
        <UserPlus className="h-4 w-4" /> Invite
      </button>
    </form>
  );
}
