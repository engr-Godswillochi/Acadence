import { enrolmentService as enrolments } from './enrolment.service.js';

export const enrolmentController = {
  async list(req, res) { res.json({ success: true, data: { students: await enrolments.list(req.user, req.params.id) } }); },
  async add(req, res) { res.status(201).json({ success: true, data: { enrolment: await enrolments.add(req.user, req.params.id, req.validatedBody) } }); },
  async remove(req, res) { await enrolments.remove(req.user, req.params.id, req.params.studentId); res.json({ success: true, data: {} }); },
  async currentLink(req, res) { res.json({ success: true, data: await enrolments.currentLink(req.user, req.params.id) }); },
  async createLink(req, res) { res.status(201).json({ success: true, data: { link: await enrolments.createLink(req.user, req.params.id) } }); },
  async revokeLink(req, res) { await enrolments.revokeLink(req.user, req.params.id); res.json({ success: true, data: {} }); },
};

export const enrolmentLinkController = {
  async preview(req, res) { res.json({ success: true, data: await enrolments.previewLink(req.params.token, req.user ?? null) }); },
  async redeem(req, res) { res.status(201).json({ success: true, data: await enrolments.redeemLink(req.user, req.params.token) }); },
};
