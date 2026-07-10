import express from "express";
const router = express.Router();
export default router;

import requireUser from "#middleware/requireUser";
import requireBody from "#middleware/requireBody";
import {
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from "#middleware/requireWorkspaceRole";
import { getUserByEmail } from "#db/queries/users";
import {
  createWorkspace,
  getWorkspacesForUser,
  getWorkspaceById,
  getMembers,
  addMember,
  removeMember,
  countAdmins,
} from "#db/queries/workspaces";

/**
 * SCAFFOLDING (Tickets 1-3) -- delete these two routes and swap in your own
 * if you've already built workspace creation/listing elsewhere.
 */
router
  .route("/")
  .post(requireUser, requireBody(["name"]), async (req, res) => {
    const { name } = req.body;
    const workspace = await createWorkspace(name, req.user.id);
    res.status(201).send(workspace);
  })
  .get(requireUser, async (req, res) => {
    const workspaces = await getWorkspacesForUser(req.user.id);
    res.send(workspaces);
  });

router.route("/:id").get(requireUser, requireWorkspaceMember, async (req, res) => {
  const workspace = await getWorkspaceById(req.params.id);
  res.send(workspace);
});

// ---------------------------------------------------------------------
// Ticket 4: POST /workspaces/:id/invite
// ---------------------------------------------------------------------
router.post(
  "/:id/invite",
  requireUser,
  requireBody(["email"]),
  requireWorkspaceAdmin, // Ticket 6
  async (req, res) => {
    const { id: workspaceId } = req.params;
    const { email } = req.body;

    const invitedUser = await getUserByEmail(email);
    if (!invitedUser) {
      return res
        .status(404)
        .send(
          "No account found with that email. They'll need to sign up before they can be added to this workspace."
        );
    }

    const members = await getMembers(workspaceId);
    if (members.some((m) => m.id === invitedUser.id)) {
      return res.status(400).send("That person is already a member of this workspace.");
    }

    const membership = await addMember(workspaceId, invitedUser.id, "member");

    res.status(201).send({
      id: invitedUser.id,
      name: invitedUser.name,
      email: invitedUser.email,
      role: membership.role,
      joined_at: membership.joined_at,
    });
  }
);

// ---------------------------------------------------------------------
// Ticket 5: GET /workspaces/:id/members
// ---------------------------------------------------------------------
router.get(
  "/:id/members",
  requireUser,
  requireWorkspaceMember, // any member can view, not just admins
  async (req, res) => {
    const members = await getMembers(req.params.id);
    res.send(members);
  }
);

// ---------------------------------------------------------------------
// Ticket 5: DELETE /workspaces/:id/members/:userId
// ---------------------------------------------------------------------
router.delete(
  "/:id/members/:userId",
  requireUser,
  requireWorkspaceAdmin, // Ticket 6
  async (req, res) => {
    const { id: workspaceId, userId } = req.params;

    const members = await getMembers(workspaceId);
    const target = members.find((m) => String(m.id) === userId);

    if (!target) {
      return res.status(404).send("That user is not a member of this workspace.");
    }

    if (target.role === "admin") {
      const adminCount = await countAdmins(workspaceId);
      if (adminCount <= 1) {
        return res
          .status(400)
          .send("You can't remove the last admin. Promote someone else to admin first.");
      }
    }

    await removeMember(workspaceId, userId);
    res.status(204).send();
  }
);
