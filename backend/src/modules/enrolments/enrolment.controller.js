import { enrolmentService as enrolments } from './enrolment.service.js';

export const enrolmentController = {
  async list(req, res) { res.json({ success: true, data: { students: await enrolments.list(req.user, req.params.id) } }); },
  async add(req, res) { res.status(201).json({ success: true, data: { enrolment: await enrolments.add(req.user, req.params.id, req.validatedBody) } }); },
  async remove(req, res) { await enrolments.remove(req.user, req.params.id, req.params.studentId); res.json({ success: true, data: {} }); },
};
