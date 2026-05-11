import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API',
      version: '1.0.0',
      description: 'Auth API with versioning',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        deviceIdAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'deviceId',
        },
      },
    },
  },
  apis: ['./src/v1/*.routes.js', './src/v2/*.routes.js', './src/v3/*.routes.js', './src/v4/*.routes.js', './src/v5/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
