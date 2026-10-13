import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 5001;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkForge API',
      version: '1.0.0',
      description: 'WorkForge workforce management API — all data persisted in MongoDB Atlas.',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Login & registration (MongoDB)' },
      { name: 'Health', description: 'Service health' },
      { name: 'Employee', description: 'Employee profile, attendance, leaves' },
      { name: 'HR', description: 'HR dashboard, reports, approvals' },
      { name: 'Company', description: 'Hiring company views' },
      { name: 'Admin', description: 'Super admin platform management' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/authController.js'),
    path.join(__dirname, 'swagger.paths.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
