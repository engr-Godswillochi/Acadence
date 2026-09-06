import { courseService as courses } from './course.service.js';

export const courseController = {
  async list(req, res) { res.json({ success: true, data: { courses: await courses.list(req.user) } }); },
  async get(req, res) { res.json({ success: true, data: { course: await courses.get(req.user, req.params.id) } }); },
  async create(req, res) { res.status(201).json({ success: true, data: { course: await courses.create(req.user, req.validatedBody) } }); },
  async update(req, res) { res.json({ success: true, data: { course: await courses.update(req.user, req.params.id, req.validatedBody) } }); },
  async archive(req, res) { await courses.archive(req.user, req.params.id); res.json({ success: true, data: {} }); },
};
