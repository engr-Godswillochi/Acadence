import { assignmentService as assignments } from './assignment.service.js';

export const assignmentController = {
  async listCourse(req, res) { res.json({ success: true, data: { assignments: await assignments.listCourse(req.user, req.params.courseId) } }); },
  async my(req, res) { res.json({ success: true, data: { assignments: await assignments.my(req.user) } }); },
  async get(req, res) { res.json({ success: true, data: { assignment: await assignments.get(req.user, req.params.id) } }); },
  async create(req, res) { res.status(201).json({ success: true, data: { assignment: await assignments.create(req.user, req.params.courseId, req.validatedBody) } }); },
  async update(req, res) { res.json({ success: true, data: { assignment: await assignments.update(req.user, req.params.id, req.validatedBody) } }); },
  async remove(req, res) { await assignments.remove(req.user, req.params.id); res.json({ success: true, data: {} }); },
  async setStatus(req, res) { res.json({ success: true, data: await assignments.setStatus(req.user, req.params.id, req.validatedBody.status) }); },
};
