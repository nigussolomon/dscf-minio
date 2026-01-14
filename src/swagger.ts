export const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "MinIO Dev Service API",
    version: "1.0.0",
    description: "Admin-only API for managing per-app MinIO instances",
  },
  servers: [{ url: "http://localhost:3000" }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  paths: {
    "/": {
      get: {
        summary: "Root endpoint",
        responses: {
          "200": {
            description: "API is running",
          },
        },
      },
    },

    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },

    "/auth/login": {
      post: {
        summary: "Login and obtain access & refresh tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },

    "/auth/refresh": {
      post: {
        summary: "Refresh access token",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "New access token issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" }, // rotation included
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid or missing refresh token",
          },
        },
      },
    },

    "/auth/logout": {
      post: {
        summary: "Logout and invalidate refresh token",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Successfully logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Logged out" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid or missing token",
          },
        },
      },
    },
  },
};
