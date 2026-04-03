import { Router } from "jsr:@oak/oak";
import * as programme from "./controllers/programme.ts";
import * as admin from "./controllers/admin.ts";
import * as staff from "./controllers/staff.ts";
import * as modules from "./controllers/modules.ts";
import * as auth from "./controllers/auth.ts";
import { requireAuth } from "./middleware/auth.ts";

export const router = new Router();

// ─── Public / student-facing routes ───────────────────────────────────────────
router
  .get("/", programme.listProgrammes)
  .get("/programmes/:id", programme.getProgramme)
  .post("/programmes/:id/interest", programme.registerInterest)
  .delete("/programmes/:id/interest", programme.withdrawInterest);

// ─── Auth routes ──────────────────────────────────────────────────────────────
router
  .get("/admin/login", auth.loginPage)
  .post("/admin/login", auth.login)
  .post("/admin/logout", auth.logout);

// ─── Admin routes (protected) ─────────────────────────────────────────────────
router
  .get("/admin", requireAuth, admin.dashboard)
  .get("/admin/programmes", requireAuth, admin.listProgrammes)
  .get("/admin/programmes/new", requireAuth, admin.newProgrammeForm)
  .post("/admin/programmes", requireAuth, admin.createProgramme)
  .get("/admin/programmes/:id/edit", requireAuth, admin.editProgrammeForm)
  .post("/admin/programmes/:id", requireAuth, admin.updateProgramme)
  .post("/admin/programmes/:id/delete", requireAuth, admin.deleteProgramme)
  .post("/admin/programmes/:id/publish", requireAuth, admin.togglePublish)
  .get("/admin/programmes/:id/interest", requireAuth, admin.viewInterest)
  .get("/admin/programmes/:id/interest/export", requireAuth, admin.exportMailingList);

  // ─── Module management routes (protected) ─────────────────────────────────────
// Note: /new must be registered before /:moduleId to avoid Oak matching "new"
// as a moduleId parameter.
router
.get("/admin/programmes/:id/modules", requireAuth, modules.listModules)
.get("/admin/programmes/:id/modules/new", requireAuth, modules.newModuleForm)
.post("/admin/programmes/:id/modules", requireAuth, modules.createModule)
.get("/admin/programmes/:id/modules/:moduleId/edit", requireAuth, modules.editModuleForm)
.post("/admin/programmes/:id/modules/:moduleId", requireAuth, modules.updateModule)
.post("/admin/programmes/:id/modules/:moduleId/delete", requireAuth, modules.deleteModule);

// ─── Staff management routes (protected) ──────────────────────────────────────
// Same /new-before-/:id ordering rule applies.
router
  .get("/admin/staff", requireAuth, staff.listStaff)
  .get("/admin/staff/new", requireAuth, staff.newStaffForm)
  .post("/admin/staff", requireAuth, staff.createStaff)
  .get("/admin/staff/:id/edit", requireAuth, staff.editStaffForm)
  .post("/admin/staff/:id", requireAuth, staff.updateStaff)
  .post("/admin/staff/:id/programmes", requireAuth, staff.updateProgrammeRoles)
  .post("/admin/staff/:id/delete", requireAuth, staff.deleteStaff);