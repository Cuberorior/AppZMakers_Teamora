import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { useAuthController } from './controllers/useAuthController';
import { useEmployeeController } from './controllers/useEmployeeController';
import { useHRController } from './controllers/useHRController';
import { useCompanyController } from './controllers/useCompanyController';
import { useAdminController } from './controllers/useAdminController';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { SOCKET_URL } from './config';
import { Infinity } from 'ldrs/react'
import 'ldrs/react/Infinity.css'

// Import Layout & Login
import { Layout } from './views/components/Layout';
import { Login } from './views/components/Login';
import { ResetPassword } from './views/components/ResetPassword';

// Import Views
// Employee
import { EmployeeDashboardView } from './views/pages/employee/EmployeeDashboardView';
import { EmployeeAttendanceView } from './views/pages/employee/EmployeeAttendanceView';
import { EmployeeLeaveView } from './views/pages/employee/EmployeeLeaveView';
import { EmployeeProfileView } from './views/pages/employee/EmployeeProfileView';
import { EmployeeClientNotificationsView } from './views/pages/employee/EmployeeClientNotificationsView';
import { EmployeeFAQView } from './views/pages/employee/EmployeeFAQView';
import { EmployeeGameView } from './views/pages/employee/EmployeeGameView';

// HR
import { HRDashboardView } from './views/pages/hr/HRDashboardView';
import { HRLeaveApprovalsView } from './views/pages/hr/HRLeaveApprovalsView';
import { HREmployeesView } from './views/pages/hr/HREmployeesView';
import { HRReportsView } from './views/pages/hr/HRReportsView';
import { HRProfileView } from './views/pages/hr/HRProfileView';
import { HRClientNotificationsView } from './views/pages/hr/HRClientNotificationsView';

// Company
import { CompanyDashboardView } from './views/pages/company/CompanyDashboardView';
import { CompanyEmployeesView } from './views/pages/company/CompanyEmployeesView';
import { CompanyProfileView } from './views/pages/company/CompanyProfileView';
import { CompanyAttendanceView } from './views/pages/company/CompanyAttendanceView';
import { CompanyCalendarView } from './views/pages/company/CompanyCalendarView';
import { CompanyShiftNoticesView } from './views/pages/company/CompanyShiftNoticesView';
import { CompanyReportsView } from './views/pages/company/CompanyReportsView';
import { CompanyFAQView } from './views/pages/company/CompanyFAQView';

// Admin
import { AdminDashboardView } from './views/pages/admin/AdminDashboardView';
import { AdminUsersView } from './views/pages/admin/AdminUsersView';
import { AdminReportsView } from './views/pages/admin/AdminReportsView';
import { AdminFAQView } from './views/pages/admin/AdminFAQView';
import { AdminCompaniesView } from './views/pages/admin/AdminCompaniesView';
import { AdminSettingsView } from './views/pages/admin/AdminSettingsView';
import { AdminProfileView } from './views/pages/admin/AdminProfileView';
import { TodayAttendanceView } from './views/pages/admin/TodayAttendanceView';
import { AdminKnowledgeSessionView } from './views/pages/admin/AdminKnowledgeSessionView';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function TaskWarningModal({ onClose, onNavigate }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-sm w-full overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-800/50 animate-pulse">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-bold mb-2">Task Log Required</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            Please log at least one completed task in your <strong className="dark:text-slate-200">Today's Work Log</strong> before checking out.
          </p>
          <div className="w-full">
            <button
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-indigo-600/15"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

let globalShowToast = null;

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-800/60';
        let borderAccent = 'border-l-blue-500';
        let title = 'Notification';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800/60';
          borderAccent = 'border-l-emerald-500';
          title = 'Success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-800/60';
          borderAccent = 'border-l-rose-500';
          title = 'Error';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800/60';
          borderAccent = 'border-l-amber-500';
          title = 'Warning';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-4 ${borderAccent} rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/80 p-4 flex gap-3 toast-enter`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-slate-800 dark:text-slate-100 text-sm font-bold leading-snug">{title}</h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed break-words font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 self-start cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AppRoutes() {
  const authController = useAuthController();
  const { auth, handleLogout, updateAuth } = authController;
  const navigate = useNavigate();

  // Lifted employee controller to ensure shared state for checkout validation
  const employeeController = useEmployeeController(auth?.role === 'employee' ? auth.userId : null, updateAuth, handleLogout);

  const [toasts, setToasts] = React.useState([]);
  const [initialLoading, setInitialLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    
    const socket = io(SOCKET_URL);

    socket.on('attendance_update', (data) => {
      window.dispatchEvent(new CustomEvent('refresh_attendance', { detail: data }));
    });

    globalShowToast = (message, type = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.alert = (message) => {
      let type = 'info';
      const msg = String(message).toLowerCase();
      if (
        msg.includes('success') ||
        msg.includes('successfully') ||
        msg.includes('active') ||
        msg.includes('created') ||
        msg.includes('updated') ||
        msg.includes('imported') ||
        msg.includes('sent')
      ) {
        type = 'success';
      } else if (
        msg.includes('failed') ||
        msg.includes('error') ||
        msg.includes('invalid') ||
        msg.includes('cannot') ||
        msg.includes('unable') ||
        msg.includes('not defined')
      ) {
        type = 'error';
      } else if (
        msg.includes('warning') ||
        msg.includes('warn') ||
        msg.includes('notified') ||
        msg.includes('adjust') ||
        msg.includes('enter a reason')
      ) {
        type = 'warning';
      }
      globalShowToast(message, type);
    };

    return () => {
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!auth) return;
    
    // Parse timeout from settings, defaulting to 30 minutes
    let timeoutMinutes = 30;
    if (auth.sessionTimeout) {
      const match = String(auth.sessionTimeout).match(/(\d+)/);
      if (match) timeoutMinutes = parseInt(match[1], 10);
    }
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        globalShowToast('Your session has expired due to inactivity.', 'warning');
        handleLogout();
      }, timeoutMs);
    };

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [auth, handleLogout]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 transition-colors duration-200 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Infinity
            size="55"
            stroke="4"
            strokeLength="0.15"
            bgOpacity="0.1"
            speed="1.3"
            color="#ffffff" 
          />
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<Login {...authController} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const rolePrefixes = {
    employee: 'employee',
    hr: 'hr',
    company: 'company',
    superadmin: 'admin',
  };
  const pathPrefix = rolePrefixes[auth.role] || auth.role;

  return (
    <Layout
      auth={auth}
      role={auth.role}
      onLogout={() => {
        handleLogout();
        navigate('/login');
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to={`/${pathPrefix}/dashboard`} replace />} />
        {auth.role === 'employee' && (
          <Route path="/employee/*" element={<EmployeeRoutes controller={employeeController} />} />
        )}
        {auth.role === 'hr' && (
          <Route path="/hr/*" element={<HRRoutes hrId={auth.userId} updateAuth={updateAuth} />} />
        )}
        {auth.role === 'company' && (
          <Route path="/company/*" element={<CompanyRoutes companyId={auth.userId} updateAuth={updateAuth} isTeam={auth.isTeam} />} />
        )}
        {auth.role === 'superadmin' && (
          <Route path="/admin/*" element={<AdminRoutes adminId={auth.userId} updateAuth={updateAuth} />} />
        )}
        <Route path="*" element={<Navigate to={`/${pathPrefix}/dashboard`} replace />} />
      </Routes>

      {/* Modern, non-default warning popup when employee tries to checkout/logout without logging tasks */}
      {auth.role === 'employee' && employeeController.showTaskWarning && (
        <TaskWarningModal
          onClose={() => employeeController.setShowTaskWarning(false)}
          onNavigate={() => navigate('/employee/attendance', { state: { expandWorkLog: true } })}
        />
      )}

      {/* Modern Toast Notification Overlay */}
      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </Layout>
  );
}

function EmployeeRoutes({ controller }) {
  return (
    <Routes>
      <Route path="dashboard" element={<EmployeeDashboardView {...controller} />} />
      <Route path="attendance" element={<EmployeeAttendanceView {...controller} />} />
      <Route path="leave" element={<EmployeeLeaveView {...controller} />} />
      <Route path="calendar" element={<CompanyCalendarView role="employee" employeeId={controller.employee?.id} />} />
      <Route path="profile" element={<EmployeeProfileView {...controller} />} />
      <Route path="faq" element={<EmployeeFAQView />} />
      <Route path="client-notifications" element={<EmployeeClientNotificationsView {...controller} />} />
      <Route path="game" element={<EmployeeGameView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

function HRRoutes({ hrId, updateAuth }) {
  const controller = useHRController(hrId, updateAuth);
  return (
    <Routes>
      <Route path="dashboard" element={<HRDashboardView {...controller} />} />
      <Route path="today-attendance" element={<TodayAttendanceView {...controller} employees={controller.employeesList} />} />
      <Route path="leave-approvals" element={<HRLeaveApprovalsView {...controller} />} />
      <Route path="employees" element={<HREmployeesView {...controller} />} />
      <Route path="reports" element={<HRReportsView {...controller} />} />
      <Route path="calendar" element={<CompanyCalendarView role="hr" />} />
      <Route path="profile" element={<HRProfileView {...controller} />} />
      <Route path="client-notifications" element={<HRClientNotificationsView {...controller} />} />
      <Route path="game" element={<EmployeeGameView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

function CompanyRoutes({ companyId, updateAuth, isTeam }) {
  const controller = useCompanyController(companyId, updateAuth);
  const resolvedIsTeam = isTeam !== undefined ? isTeam : !!controller.company?.isTeam;
  return (
    <Routes>
      <Route path="dashboard" element={<CompanyDashboardView {...controller} />} />
      <Route path="employees" element={<CompanyEmployeesView {...controller} />} />
      <Route path="attendance" element={<CompanyAttendanceView {...controller} />} />
      <Route path="reports" element={<CompanyReportsView {...controller} />} />
      <Route path="calendar" element={<CompanyCalendarView role="company" companyId={companyId} />} />
      <Route path="shift-notices" element={<CompanyShiftNoticesView {...controller} />} />
      <Route path="profile" element={<CompanyProfileView {...controller} isTeam={resolvedIsTeam} />} />
      <Route path="faq" element={<CompanyFAQView />} />
      <Route path="game" element={<EmployeeGameView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

function AdminRoutes({ adminId, updateAuth }) {
  const controller = useAdminController(adminId, updateAuth);
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboardView {...controller} />} />
      <Route path="today-attendance" element={<TodayAttendanceView {...controller} />} />
      <Route path="leave-approvals" element={<HRLeaveApprovalsView {...controller} />} />
      <Route path="users" element={<AdminUsersView {...controller} />} />
      <Route path="calendar" element={<CompanyCalendarView role="superadmin" />} />
      <Route path="reports" element={<AdminReportsView {...controller} />} />
      <Route path="companies" element={<AdminCompaniesView {...controller} />} />
      <Route path="profile" element={<AdminProfileView {...controller} />} />
      <Route path="settings" element={<AdminSettingsView {...controller} />} />
      <Route path="faqs" element={<AdminFAQView faqs={controller.faqs} handleCreateFaq={controller.handleCreateFaq} handleUpdateFaq={controller.handleUpdateFaq} handleDeleteFaq={controller.handleDeleteFaq} />} />
      <Route path="knowledge-sessions" element={<AdminKnowledgeSessionView employees={controller.employeesList || []} adminName={controller.adminName} />} />
      <Route path="game" element={<EmployeeGameView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
