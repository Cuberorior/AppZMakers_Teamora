/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service status
 */

/**
 * @openapi
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee profile, leave balance, settings
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee profile
 */

/**
 * @openapi
 * /api/employees/{id}/attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attendance list
 *   post:
 *     summary: Clock in, break, or clock out
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action: { type: string, enum: [clock-in, start-break, end-break, clock-out] }
 *               time: { type: string }
 *               date: { type: string }
 *     responses:
 *       200:
 *         description: Attendance updated
 */

/**
 * @openapi
 * /api/employees/{id}/leaves:
 *   get:
 *     summary: Get employee leave requests
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Leave list
 *   post:
 *     summary: Submit leave request
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               startDate: { type: string }
 *               endDate: { type: string }
 *               days: { type: number }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Leave created
 */

/**
 * @openapi
 * /api/employees/{id}/client:
 *   put:
 *     summary: Assign employee to hiring company
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId: { type: string }
 *     responses:
 *       200:
 *         description: Client updated
 */

/**
 * @openapi
 * /api/hr/dashboard:
 *   get:
 *     summary: HR dashboard metrics and today's attendance
 *     tags: [HR]
 *     responses:
 *       200:
 *         description: Dashboard data
 */

/**
 * @openapi
 * /api/hr/reports:
 *   get:
 *     summary: HR workforce reports and analytics
 *     tags: [HR]
 *     responses:
 *       200:
 *         description: Reports data
 */

/**
 * @openapi
 * /api/hr/leaves:
 *   get:
 *     summary: List all leave requests
 *     tags: [HR]
 *     responses:
 *       200:
 *         description: Leave list
 */

/**
 * @openapi
 * /api/hr/leaves/{id}/review:
 *   post:
 *     summary: Approve or reject a leave request
 *     tags: [HR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               note: { type: string }
 *               rejectionReason: { type: string }
 *     responses:
 *       200:
 *         description: Leave reviewed
 */

/**
 * @openapi
 * /api/hr/employees:
 *   get:
 *     summary: List all employees
 *     tags: [HR]
 *     responses:
 *       200:
 *         description: Employee list
 *   post:
 *     summary: Create employee
 *     tags: [HR]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Employee created
 */

/**
 * @openapi
 * /api/hr/employees/{id}:
 *   get:
 *     summary: Employee detail with attendance and balance
 *     tags: [HR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee detail
 */

/**
 * @openapi
 * /api/companies/{id}/dashboard:
 *   get:
 *     summary: Hiring company dashboard and assigned employees
 *     tags: [Company]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company dashboard
 */

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     summary: Super admin platform overview
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Admin dashboard
 */

/**
 * @openapi
 * /api/admin/leaves:
 *   get:
 *     summary: All leave requests (admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Leave list
 */

/**
 * @openapi
 * /api/admin/leaves/{id}/review:
 *   post:
 *     summary: Approve or reject leave (admin)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *               note: { type: string }
 *               rejectionReason: { type: string }
 *     responses:
 *       200:
 *         description: Reviewed
 */

/**
 * @openapi
 * /api/admin/hr:
 *   post:
 *     summary: Create HR user record
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: HR created
 */

/**
 * @openapi
 * /api/admin/companies:
 *   post:
 *     summary: Create hiring company
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Company created
 */

/**
 * @openapi
 * /api/admin/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @openapi
 * /api/admin/hr/{id}:
 *   delete:
 *     summary: Delete HR user record
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @openapi
 * /api/admin/companies/{id}:
 *   delete:
 *     summary: Delete hiring company
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @openapi
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings
 *   post:
 *     summary: Update system settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings updated
 */

export default {};
