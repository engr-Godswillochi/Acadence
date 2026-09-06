import { announcementService as service } from './announcement.service.js';
export const announcementController = {
  async listCourse(req, res) { res.json({ success: true, data: { announcements: await service.listCourse(req.user, req.params.courseId) } }); },
  async my(req, res) { res.json({ success: true, data: { announcements: await service.my(req.user) } }); },
  async create(req, res) { res.status(201).json({ success: true, data: { announcement: await service.create(req.user, req.params.courseId, req.validatedBody) } }); },
  async update(req, res) { res.json({ success: true, data: { announcement: await service.update(req.user, req.params.id, req.validatedBody) } }); },
  async remove(req, res) { await service.remove(req.user, req.params.id); res.json({ success: true, data: {} }); },
};
