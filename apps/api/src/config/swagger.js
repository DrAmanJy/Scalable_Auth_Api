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
  },
  apis: ['./src/v1/routes/*.js', './src/v2/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
