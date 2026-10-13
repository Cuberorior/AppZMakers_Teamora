export const hiringCompanies = [
  { id: 'co001', name: 'TechVentures Ltd', industry: 'Technology', contact: 'Mark Reynolds', email: 'mark@techventures.com', phone: '+1 (555) 100-2000', employeeCount: 24, status: 'active', joinedDate: '2023-01-10' },
  { id: 'co002', name: 'BuildCraft Inc', industry: 'Construction', contact: 'Diana Lee', email: 'diana@buildcraft.com', phone: '+1 (555) 200-3000', employeeCount: 18, status: 'active', joinedDate: '2023-03-22' },
  { id: 'co003', name: 'MediCare Solutions', industry: 'Healthcare', contact: 'Robert Chen', email: 'robert@medicare.com', phone: '+1 (555) 300-4000', employeeCount: 31, status: 'active', joinedDate: '2022-11-05' },
  { id: 'co004', name: 'EduFirst Academy', industry: 'Education', contact: 'Priya Patel', email: 'priya@edufirst.com', phone: '+1 (555) 400-5000', employeeCount: 12, status: 'inactive', joinedDate: '2023-06-14' },
];

export const hrUsers = [
  { id: 'hr001', name: 'Amanda Foster', email: 'amanda.foster@hrm.com', department: 'Human Resources', status: 'active' },
  { id: 'hr002', name: 'James Wilson', email: 'james.wilson@hrm.com', department: 'Human Resources', status: 'active' },
  { id: 'hr003', name: 'Nina Kowalski', email: 'nina.k@hrm.com', department: 'Human Resources', status: 'inactive' },
];

export const employees = [
  { id: 'emp001', name: 'Sarah Johnson', email: 'sarah.j@techventures.com', position: 'Senior Developer', department: 'Engineering', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'SJ', joinDate: '2022-03-15', status: 'active', phone: '+1 (555) 234-5678', address: '142 Oak Street, Austin TX 78701' },
  { id: 'emp002', name: 'Michael Torres', email: 'michael.t@techventures.com', position: 'UI/UX Designer', department: 'Design', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'MT', joinDate: '2021-08-20', status: 'active', phone: '+1 (555) 345-6789', address: '89 Pine Avenue, Austin TX 78702' },
  { id: 'emp003', name: 'Emily Chen', email: 'emily.c@techventures.com', position: 'Product Manager', department: 'Product', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'EC', joinDate: '2020-11-10', status: 'active', phone: '+1 (555) 456-7890', address: '310 Elm Road, Austin TX 78703' },
  { id: 'emp004', name: 'David Park', email: 'david.p@buildcraft.com', position: 'Project Lead', department: 'Operations', company: 'BuildCraft Inc', companyId: 'co002', avatar: 'DP', joinDate: '2023-01-05', status: 'active', phone: '+1 (555) 567-8901', address: '55 Maple Drive, Denver CO 80201' },
  { id: 'emp005', name: 'Aisha Williams', email: 'aisha.w@buildcraft.com', position: 'Site Engineer', department: 'Engineering', company: 'BuildCraft Inc', companyId: 'co002', avatar: 'AW', joinDate: '2022-07-18', status: 'active', phone: '+1 (555) 678-9012', address: '77 Cedar Lane, Denver CO 80202' },
  { id: 'emp006', name: 'Carlos Rivera', email: 'carlos.r@medicare.com', position: 'Data Analyst', department: 'Analytics', company: 'MediCare Solutions', companyId: 'co003', avatar: 'CR', joinDate: '2021-05-30', status: 'active', phone: '+1 (555) 789-0123', address: '201 Birch Blvd, Miami FL 33101' },
  { id: 'emp007', name: 'Hannah Lee', email: 'hannah.l@medicare.com', position: 'Healthcare Coordinator', department: 'Operations', company: 'MediCare Solutions', companyId: 'co003', avatar: 'HL', joinDate: '2023-02-12', status: 'active', phone: '+1 (555) 890-1234', address: '456 Walnut St, Miami FL 33102' },
  { id: 'emp008', name: 'James Okonkwo', email: 'james.o@techventures.com', position: 'DevOps Engineer', department: 'Engineering', company: 'TechVentures Ltd', companyId: 'co001', avatar: 'JO', joinDate: '2022-09-01', status: 'inactive', phone: '+1 (555) 901-2345', address: '90 Spruce Way, Austin TX 78704' },
];

export const attendanceRecords = [
  { id: 'att001', employeeId: 'emp001', date: '2026-05-31', checkIn: '09:02', checkOut: null, status: 'present', totalHours: 0, breakMinutes: 30, extraHours: 0, lessHours: 0 },
  { id: 'att002', employeeId: 'emp001', date: '2026-05-30', checkIn: '08:55', checkOut: '17:10', status: 'present', totalHours: 7.92, breakMinutes: 45, extraHours: 0, lessHours: 0.08 },
  { id: 'att003', employeeId: 'emp001', date: '2026-05-29', checkIn: '09:31', checkOut: '18:30', status: 'late', totalHours: 8.48, breakMinutes: 30, extraHours: 0.48, lessHours: 0 },
  { id: 'att004', employeeId: 'emp001', date: '2026-05-28', checkIn: '08:48', checkOut: '17:05', status: 'present', totalHours: 7.95, breakMinutes: 40, extraHours: 0, lessHours: 0.05 },
  { id: 'att005', employeeId: 'emp001', date: '2026-05-27', checkIn: null, checkOut: null, status: 'absent', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 8 },
  { id: 'att006', employeeId: 'emp001', date: '2026-05-26', checkIn: '09:00', checkOut: '13:15', status: 'half-day', totalHours: 4.25, breakMinutes: 15, extraHours: 0, lessHours: 3.75 },
  { id: 'att007', employeeId: 'emp001', date: '2026-05-25', checkIn: '08:52', checkOut: '17:22', status: 'present', totalHours: 8.17, breakMinutes: 35, extraHours: 0.17, lessHours: 0 },
  { id: 'att008', employeeId: 'emp002', date: '2026-05-31', checkIn: '08:45', checkOut: null, status: 'present', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 0 },
  { id: 'att009', employeeId: 'emp003', date: '2026-05-31', checkIn: '09:15', checkOut: null, status: 'late', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 0 },
  { id: 'att010', employeeId: 'emp004', date: '2026-05-31', checkIn: null, checkOut: null, status: 'absent', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 8 },
  { id: 'att011', employeeId: 'emp005', date: '2026-05-31', checkIn: '08:58', checkOut: null, status: 'present', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 0 },
  { id: 'att012', employeeId: 'emp006', date: '2026-05-31', checkIn: '09:00', checkOut: null, status: 'present', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 0 },
  { id: 'att013', employeeId: 'emp007', date: '2026-05-31', checkIn: '09:20', checkOut: null, status: 'late', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 0 },
  { id: 'att014', employeeId: 'emp002', date: '2026-05-30', checkIn: '08:40', checkOut: '17:00', status: 'present', totalHours: 7.83, breakMinutes: 40, extraHours: 0, lessHours: 0.17 },
  { id: 'att015', employeeId: 'emp002', date: '2026-05-29', checkIn: '09:00', checkOut: '17:30', status: 'present', totalHours: 8.0, breakMinutes: 30, extraHours: 0, lessHours: 0 },
  { id: 'att016', employeeId: 'emp002', date: '2026-05-28', checkIn: null, checkOut: null, status: 'absent', totalHours: 0, breakMinutes: 0, extraHours: 0, lessHours: 8 },
];

export const leaveRequests = [
  { id: 'lv001', employeeId: 'emp002', employeeName: 'Michael Torres', department: 'Design', type: 'personal', startDate: '2026-06-05', endDate: '2026-06-06', days: 2, reason: 'Severe migraine and fever. Doctor advised rest.', status: 'pending', appliedOn: '2026-05-30' },
  { id: 'lv002', employeeId: 'emp003', employeeName: 'Emily Chen', department: 'Product', type: 'annual', startDate: '2026-06-10', endDate: '2026-06-14', days: 5, reason: 'Family vacation planned for summer.', status: 'pending', appliedOn: '2026-05-28' },
  { id: 'lv003', employeeId: 'emp005', employeeName: 'Aisha Williams', department: 'Engineering', type: 'personal', startDate: '2026-06-02', endDate: '2026-06-02', days: 1, reason: 'Family emergency - urgent travel required.', status: 'pending', appliedOn: '2026-05-31' },
  { id: 'lv004', employeeId: 'emp001', employeeName: 'Sarah Johnson', department: 'Engineering', type: 'casual', startDate: '2026-05-20', endDate: '2026-05-21', days: 2, reason: 'Personal errand and home maintenance.', status: 'approved', appliedOn: '2026-05-15', hrNote: 'Approved. Enjoy your time off.' },
  { id: 'lv005', employeeId: 'emp006', employeeName: 'Carlos Rivera', department: 'Analytics', type: 'personal', startDate: '2026-05-15', endDate: '2026-05-16', days: 2, reason: 'Flu symptoms.', status: 'approved', appliedOn: '2026-05-14', hrNote: 'Approved. Get well soon.' },
  { id: 'lv006', employeeId: 'emp004', employeeName: 'David Park', department: 'Operations', type: 'annual', startDate: '2026-05-12', endDate: '2026-05-12', days: 1, reason: 'Personal day off.', status: 'rejected', appliedOn: '2026-05-10', rejectionReason: 'Critical project deadline this week. Please reschedule.', hrNote: 'Denied due to ongoing project.' },
  { id: 'lv007', employeeId: 'emp007', employeeName: 'Hannah Lee', department: 'Operations', type: 'casual', startDate: '2026-06-15', endDate: '2026-06-17', days: 3, reason: 'Attending a professional training conference.', status: 'pending', appliedOn: '2026-05-31' },
];

export const leaveBalances = [
  { employeeId: 'emp001', annual: { total: 15, used: 3 }, casual: { total: 10, used: 2 }, personal: { total: 10, used: 0 } },
  { employeeId: 'emp002', annual: { total: 15, used: 7 }, casual: { total: 10, used: 3 }, personal: { total: 10, used: 3 } },
  { employeeId: 'emp003', annual: { total: 15, used: 2 }, casual: { total: 10, used: 1 }, personal: { total: 10, used: 2 } },
  { employeeId: 'emp004', annual: { total: 15, used: 5 }, casual: { total: 10, used: 4 }, personal: { total: 10, used: 5 } },
  { employeeId: 'emp005', annual: { total: 15, used: 1 }, casual: { total: 10, used: 0 }, personal: { total: 10, used: 0 } },
  { employeeId: 'emp006', annual: { total: 15, used: 4 }, casual: { total: 10, used: 2 }, personal: { total: 10, used: 2 } },
  { employeeId: 'emp007', annual: { total: 15, used: 0 }, casual: { total: 10, used: 1 }, personal: { total: 10, used: 0 } },
];

export const weeklyAttendanceData = [
  { day: 'Mon', present: 18, absent: 3, late: 2 },
  { day: 'Tue', present: 20, absent: 2, late: 1 },
  { day: 'Wed', present: 17, absent: 4, late: 2 },
  { day: 'Thu', present: 19, absent: 3, late: 1 },
  { day: 'Fri', present: 15, absent: 5, late: 3 },
  { day: 'Sat', present: 8, absent: 15, late: 0 },
];

export const monthlyHoursData = [
  { week: 'W1', hours: 39.5 },
  { week: 'W2', hours: 41.2 },
  { week: 'W3', hours: 38.0 },
  { week: 'W4', hours: 40.8 },
];

