export const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "MinIO Dev Service API",
    version: "1.0.0",
    description: "Admin-only API for managing per-app MinIO instances",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "General", description: "Root and health endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "MinIO Apps", description: "Manage apps and API keys" },
    { name: "MinIO Files", description: "File upload and download endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["General"],
        summary: "Root endpoint",
        responses: { "200": { description: "API is running" } },
      },
    },
    "/health": {
      get: {
        tags: ["General"],
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
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
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
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
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid or missing refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and invalidate refresh token",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Successfully logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "401": { description: "Invalid or missing token" },
        },
      },
    },
    "/minio/apps": {
      get: {
        tags: ["MinIO Apps"],
        summary: "List all apps",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Apps list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      name: { type: "string" },
                      description: { type: "string" },
                      bucketName: { type: "string" },
                      apiKey: { type: "string", description: "Obfuscated" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["MinIO Apps"],
        summary: "Create a new app with bucket and API key",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "App created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    bucketName: { type: "string" },
                    apiKey: { type: "string" },
                    app: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/minio/apps/{id}/regenerate": {
      post: {
        tags: ["MinIO Apps"],
        summary: "Regenerate app API key",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "App ID",
          },
        ],
        responses: {
          "200": {
            description: "API key regenerated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    apiKey: { type: "string" },
                  },
                },
              },
            },
          },
          "404": { description: "App not found" },
        },
      },
    },
    "/minio/upload": {
      post: {
        tags: ["MinIO Files"],
        summary: "Upload a file to the app bucket",
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: { "200": { description: "Uploaded" } },
      },
    },
    "/minio/download/{objectName}": {
      get: {
        tags: ["MinIO Files"],
        summary: "Download a file from the app bucket",
        security: [{ apiKeyAuth: [] }],
        parameters: [
          {
            name: "objectName",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "File content",
            content: {
              "application/octet-stream": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          "404": { description: "File not found" },
        },
      },
    },
  },
};
