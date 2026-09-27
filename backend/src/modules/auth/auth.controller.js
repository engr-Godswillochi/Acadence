export function createAuthController(service) {
  return {
    async register(request, response) {
      response.status(201).json({ success: true, data: await service.register(request.validatedBody) });
    },
    async registerAdmin(request, response) {
      response.status(201).json({ success: true, data: await service.registerAdmin(request.validatedBody) });
    },
    async login(request, response) {
      response.json({ success: true, data: await service.login(request.validatedBody) });
    },
    me(request, response) {
      response.json({ success: true, data: { user: request.user } });
    },
  };
}
