import { attendanceService as service } from './attendance.service.js';

export const attendanceController = {
  async list(req, res) { res.json({ success: true, data: { sessions: await service.list(req.user, req.params.courseId) } }); },
  async get(req, res) { res.json({ success: true, data: { session: await service.get(req.user, req.params.id) } }); },
  async open(req, res) { res.status(201).json({ success: true, data: { session: await service.open(req.user, req.params.courseId, req.validatedBody) } }); },
  async close(req, res) { res.json({ success: true, data: { session: await service.close(req.user, req.params.id) } }); },
  async records(req, res) { res.json({ success: true, data: { records: await service.records(req.user, req.params.id) } }); },
  async active(req, res) { res.json({ success: true, data: { session: await service.active(req.device) } }); },
  async submit(req, res) { res.status(201).json({ success: true, data: { attendance: await service.submit(req.device, req.validatedBody) } }); },
  async heartbeat(req, res) { await service.heartbeat(req.device, req.validatedBody); res.json({ success: true, data: {} }); },
  async my(req, res) { res.json({ success: true, data: { attendance: await service.my(req.user) } }); },
  async summary(req, res) { res.json({ success: true, data: { summaries: await service.summary(req.user) } }); },
  async devices(req, res) { res.json({ success: true, data: { devices: await service.devices(req.user) } }); },
};
