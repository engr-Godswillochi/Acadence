import { notificationService } from './notification.service.js';

export const notificationController = {
  async list(req, res) { res.json({ success: true, data: await notificationService.list(req.user) }); },
  async markRead(req, res) { await notificationService.markRead(req.user, req.params.id); res.json({ success: true, data: {} }); },
  async markAllRead(req, res) { await notificationService.markAllRead(req.user); res.json({ success: true, data: {} }); },
};
