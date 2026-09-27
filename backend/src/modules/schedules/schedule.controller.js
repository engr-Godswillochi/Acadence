import { scheduleService as service } from './schedule.service.js';
export const scheduleController = {
  async listCourse(req, res) { res.json({ success: true, data: { schedules: await service.listCourse(req.user, req.params.courseId) } }); },
  async my(req, res) { res.json({ success: true, data: { schedules: await service.my(req.user) } }); },
  async teaching(req, res) { res.json({ success: true, data: { schedules: await service.teaching(req.user) } }); },
  async create(req, res) { res.status(201).json({ success: true, data: { schedule: await service.create(req.user, req.params.courseId, req.validatedBody) } }); },
  async update(req, res) { res.json({ success: true, data: { schedule: await service.update(req.user, req.params.id, req.validatedBody) } }); },
  async remove(req, res) { await service.remove(req.user, req.params.id); res.json({ success: true, data: {} }); },
};
