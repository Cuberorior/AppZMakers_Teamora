import { useState, useEffect, useRef } from 'react';

import { BACKEND_URL } from '../config';

export function useAdminController(adminId, updateAuth) {
  const [employees, setEmployees] = useState([]);
  const [hrUsers, setHRUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [faqs, setFaqs] = useState([]);

  const fetchAdminProfile = async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/${adminId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setAdminProfile(data.admin);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAdminProfile = async (profileData) => {
    if (!adminId) return { success: false, error: 'Admin ID not provided' };
    try {
      const res = await fetch(`${BACKEND_URL}/admin/${adminId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminProfile(data.admin);
        if (profileData.name || profileData.avatar !== undefined) {
          if (updateAuth) {
            updateAuth({
              name: data.admin.name,
              avatar: data.admin.avatar || '',
            });
          }
        }
        return { success: true, message: data.message || 'Profile updated successfully' };
      } else {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Server error updating profile' };
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, [adminId]);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [reportType, setReportType] = useState('attendance');
  const [reportsFilterType, setReportsFilterType] = useState('monthly'); // 'monthly', 'weekly', 'custom'
  const [reportsSelectedYear, setReportsSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [reportsSelectedMonthNum, setReportsSelectedMonthNum] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [reportsSelectedWeekDate, setReportsSelectedWeekDate] = useState(getLocalDateString());
  const [reportsCustomStartDate, setReportsCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [reportsCustomEndDate, setReportsCustomEndDate] = useState(getLocalDateString());
  const [employeeStatsMap, setEmployeeStatsMap] = useState({});
  const [reportsSummary, setReportsSummary] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    avgAttendance: 0,
    totalHours: 0,
    leaveDaysUsed: 0,
  });
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [reportsAttendanceData, setReportsAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [todayLabel, setTodayLabel] = useState('');
  const [deptData, setDeptData] = useState([]);

  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [adminName, setAdminName] = useState('Administrator');

  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    company: 'General',
    joinDate: '',
    dateOfBirth: '',
    address: '',
    country: '',
    shift: '',
  });

  const [hrForm, setHrForm] = useState({
    name: '',
    email: '',
    department: 'Human Resources',
    joinDate: '',
    dateOfBirth: '',
  });

  const [coForm, setCoForm] = useState({
    name: '',
    industry: '',
    contact: '',
    email: '',
    phone: '',
    joinedDate: '',
    address: '',
    country: '',
  });

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [hrNote, setHrNote] = useState('');
  const [leaveAction, setLeaveAction] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [leaveTabFilter, setLeaveTabFilter] = useState('pending');
  const [leaveMonthFilter, setLeaveMonthFilter] = useState('all');
  const [leaveYearFilter, setLeaveYearFilter] = useState(() => String(new Date().getFullYear()));
  const [leaveSearch, setLeaveSearch] = useState('');

  const leaveCounts = {
    all: leavesList.length,
    pending: leavesList.filter((l) => l.status === 'pending').length,
    approved: leavesList.filter((l) => l.status === 'approved').length,
    rejected: leavesList.filter((l) => l.status === 'rejected').length,
    cancelled: leavesList.filter((l) => l.status === 'cancelled').length,
  };

  const filteredLeaves = leavesList
    .filter((l) => leaveTabFilter === 'all' || l.status === leaveTabFilter)
    .filter(
      (l) =>
        leaveSearch === '' ||
        l.employeeName?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
        l.department?.toLowerCase().includes(leaveSearch.toLowerCase())
    )
    .filter((l) => {
      if (leaveMonthFilter !== 'all') {
        const leaveDate = l.startDate || l.appliedOn;
        if (!leaveDate) return false;
        const [y, m] = leaveDate.split('-');
        if (y !== leaveYearFilter || m !== leaveMonthFilter) return false;
      } else if (leaveYearFilter !== 'all') {
        const leaveDate = l.startDate || l.appliedOn;
        if (leaveDate && !leaveDate.startsWith(leaveYearFilter)) return false;
      }
      return true;
    });

  const [settings, setSettings] = useState({
    workHours: '8 hours',
    breakTime: '45 minutes',
    lateThreshold: '15 minutes',
    overtimeRate: '1.5x',
    sessionTimeout: '30 minutes',
    backupSchedule: 'Daily at 2 AM',
    leaveAllocations: { annual: 15, casual: 10, personal: 10 },
  });

  const fetchData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/dashboard?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setHRUsers(data.hrUsers || []);
        setCompanies(data.companies || []);
        setDashboardStats(data.stats || {});
        setPendingLeaves((data.pendingLeaves || []).filter((l) => l.status === 'pending'));
        setTodayAttendance(data.todayAttendance || []);
        setWeeklyAttendanceData(data.weeklyAttendanceData || []);
        setDeptData(data.deptData || []);
        setTodayLabel(data.todayLabel || '');
      }

      const leavesRes = await fetch(`${BACKEND_URL}/admin/leaves`);
      if (leavesRes.ok) {
        setLeavesList(await leavesRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/settings`);
      if (res.ok) setSettings(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const getReportsWeekRange = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dayVal = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayVal}`;
    };
    return { mondayStr: format(monday), sundayStr: format(sunday) };
  };

  const getReportsCompanyMonthRange = (yearStr, monthNumStr) => {
    const yr = Number(yearStr);
    const mo = Number(monthNumStr);
    let prevYr = yr;
    let prevMo = mo - 1;
    if (prevMo === 0) {
      prevMo = 12;
      prevYr -= 1;
    }
    const startStr = `${prevYr}-${String(prevMo).padStart(2, '0')}-28`;
    const endStr = `${yr}-${String(mo).padStart(2, '0')}-27`;
    return { startStr, endStr };
  };

  const fetchReports = async () => {
    try {
      let url = `${BACKEND_URL}/hr/reports`;
      const queryParams = [];
      if (reportsFilterType === 'monthly') {
        const { startStr, endStr } = getReportsCompanyMonthRange(reportsSelectedYear, reportsSelectedMonthNum);
        queryParams.push(`startDate=${startStr}`);
        queryParams.push(`endDate=${endStr}`);
      } else if (reportsFilterType === 'weekly') {
        const { mondayStr, sundayStr } = getReportsWeekRange(reportsSelectedWeekDate);
        queryParams.push(`startDate=${mondayStr}`);
        queryParams.push(`endDate=${sundayStr}`);
      } else if (reportsFilterType === 'custom') {
        queryParams.push(`startDate=${reportsCustomStartDate}`);
        queryParams.push(`endDate=${reportsCustomEndDate}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const reportsData = await res.json();
        setEmployeeStatsMap(reportsData.employeeStats || {});
        setReportsSummary(reportsData.summary || {});
        setLeaveTypeData(reportsData.leaveTypeData || []);
        setMonthlyTrend(reportsData.monthlyTrend || []);
        setReportsAttendanceData(reportsData.attendanceData || []);
        setTodayAttendance(reportsData.todayAttendance || []);
        setWeeklyAttendanceData(reportsData.weeklyAttendanceData || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_attendance', handleRefresh);

    const intervalId = setInterval(fetchData, 15000);

    return () => {
      window.removeEventListener('refresh_attendance', handleRefresh);
      clearInterval(intervalId);
    };
  }, [selectedDate]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [
    reportsFilterType,
    reportsSelectedYear,
    reportsSelectedMonthNum,
    reportsSelectedWeekDate,
    reportsCustomStartDate,
    reportsCustomEndDate
  ]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('wf_auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      if (parsed.name) {
        setAdminName(parsed.name);
      }
    }
  }, []);

  const fetchEmployeeDetail = async (empId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/employees/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEmployeeDetail(data.employee);
        setSelectedAttendance(data.attendance || []);
        setSelectedBalance(data.leaveBalance);
        if (data.stats) {
          setEmployeeStatsMap((prev) => ({ ...prev, [empId]: data.stats }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeDetail(selectedEmployeeId);
      const intervalId = setInterval(() => fetchEmployeeDetail(selectedEmployeeId), 15000);
      return () => clearInterval(intervalId);
    } else {
      setSelectedEmployeeDetail(null);
      setSelectedAttendance([]);
      setSelectedBalance(null);
    }
  }, [selectedEmployeeId]);

  const handleAdjustAttendance = async (attendanceId, adjustmentData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adjustmentData,
          adjustedBy: adminName || 'Administrator',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (selectedEmployeeId) {
          fetchEmployeeDetail(selectedEmployeeId);
        }
        fetchData();
        return { success: true, message: data.message };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleCreateManualAttendance = async (employeeId, attendanceData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          ...attendanceData,
          adjustedBy: adminName || 'Administrator',
          isAdmin: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (selectedEmployeeId) {
          fetchEmployeeDetail(selectedEmployeeId);
        }
        fetchData();
        return { success: true, message: data.message };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const getEmployeeStats = (empId) =>
    employeeStatsMap[empId] || { present: 0, total: 0, pct: 0, hours: 0, extraHours: 0, lessHours: 0, late: 0, absent: 0, halfDay: 0, mealBreakMinutes: 0, teaBreakMinutes: 0 };

  const [shiftFilter, setShiftFilter] = useState('All');

  const filteredEmployees = employees.filter(
    (e) =>
      (searchQuery === '' ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (shiftFilter === 'All' || e.shift === shiftFilter)
  );

  const filteredHR = hrUsers.filter(
    (h) =>
      searchQuery === '' ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(
    (c) => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteEmployee = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee? This will permanently delete their account, attendance records, and leave request logs.");
    if (!confirmed) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/employees/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHR = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this HR manager?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/hr/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCompany = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this client? Associated employees will be unassigned.");
    if (!confirmed) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/companies/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEmployee = async (e) => {
    if (e) e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(empForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (empForm.joinDate && empForm.joinDate > today) {
      alert('Join date cannot be a future date.');
      return;
    }
    if (!empForm.country || empForm.country.trim() === '') {
      alert('Please select or enter a working location (country).');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `${BACKEND_URL}/admin/employees/${editingItem.id}` : `${BACKEND_URL}/hr/employees`;
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload = {
        name: empForm.name.trim(),
        email: empForm.email,
        position: empForm.position,
        department: empForm.department,
        joinDate: empForm.joinDate || new Date().toISOString().split('T')[0],
        dateOfBirth: empForm.dateOfBirth || null,
        address: empForm.address,
        country: empForm.country,
        shift: empForm.shift,
      };
      if (!isEdit) {
        bodyPayload.companyId = null;
        bodyPayload.phone = null;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const data = await res.json();
        alert(isEdit ? 'Employee updated successfully.' : 'Employee created successfully.');
        setEmpForm({ name: '', email: '', position: '', department: '', company: 'General', joinDate: '', dateOfBirth: '', address: '', country: '', shift: '' });
        setEditingItem(null);
        setShowModal(false);
        fetchData();
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save employee');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the employee.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleAddHR = async (e) => {
    if (e) e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hrForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (hrForm.joinDate && hrForm.joinDate > today) {
      alert('Join date cannot be a future date.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `${BACKEND_URL}/admin/hr/${editingItem.id}` : `${BACKEND_URL}/admin/hr`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hrForm.name,
          email: hrForm.email,
          department: hrForm.department || 'Human Resources',
          joinDate: hrForm.joinDate || new Date().toISOString().split('T')[0],
          dateOfBirth: hrForm.dateOfBirth || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || (isEdit ? 'HR Manager updated successfully.' : 'HR Manager created successfully.'));
        setHrForm({ name: '', email: '', department: 'Human Resources', joinDate: '', dateOfBirth: '' });
        setEditingItem(null);
        setShowModal(false);
        fetchData();
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save HR Manager');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the HR Manager.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleAddCompany = async (e, isTeamOverride) => {
    if (e) e.preventDefault();
    const isTeam = isTeamOverride !== undefined ? isTeamOverride : coForm.isTeam;

    if (!coForm.name || coForm.name.length > 30) {
      alert('Company Name must be between 2 and 30 characters long.');
      return;
    }
    if (!isTeam && (!coForm.industry || coForm.industry.length > 30)) {
      alert('Industry Sector must be between 2 and 30 characters long.');
      return;
    }
    if (!coForm.contact || coForm.contact.length > 30) {
      alert('Contact Person must be between 2 and 30 characters long.');
      return;
    }
    if (!isTeam && (!coForm.phone || !/^\+?[0-9\s\-()]{7,20}$/.test(coForm.phone))) {
      alert('Please enter a valid phone number (7-20 digits).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `${BACKEND_URL}/admin/companies/${editingItem.id}` : `${BACKEND_URL}/admin/companies`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: coForm.name,
          industry: coForm.industry,
          contact: coForm.contact,
          email: coForm.email,
          phone: coForm.phone,
          joinedDate: coForm.joinedDate || new Date().toISOString().split('T')[0],
          address: coForm.address,
          country: coForm.country,
          isTeam: isTeam,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(isEdit ? 'Client updated successfully.' : 'Client created successfully.');
        setCoForm({ name: '', industry: '', contact: '', email: '', phone: '' });
        setEditingItem(null);
        setShowModal(false);
        fetchData();
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save Client');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the Client.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployeeStatus = async (employeeId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/employees/${employeeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Employee status updated successfully.');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update employee status.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating employee status.');
    }
  };

  const handleEditClick = (item, type) => {
    setEditingItem({ id: item.id, type });
    if (type === 'employee') {
      setEmpForm({
        name: item.name || '',
        email: item.email || '',
        position: item.position || '',
        department: item.department || '',
        company: item.company || 'General',
        joinDate: item.joinDate ? item.joinDate.split('T')[0] : '',
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split('T')[0] : '',
        address: item.address || '',
        country: item.country || '',
        shift: item.shift || '',
      });
    } else if (type === 'hr') {
      setHrForm({
        name: item.name || '',
        email: item.email || '',
        department: item.department || 'Human Resources',
        joinDate: item.joinDate ? item.joinDate.split('T')[0] : '',
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split('T')[0] : '',
      });
    } else if (type === 'company') {
      setCoForm({
        name: item.name || '',
        industry: item.industry || '',
        contact: item.contact || '',
        email: item.email || '',
        phone: item.phone || '',
        joinedDate: item.joinedDate ? item.joinedDate.split('T')[0] : '',
        address: item.address || '',
        country: item.country || '',
      });
    }
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setEmpForm({ name: '', email: '', position: '', department: '', company: 'General', joinDate: '', dateOfBirth: '', address: '', country: '', shift: 'morning' });
    setHrForm({ name: '', email: '', department: 'Human Resources', joinDate: '', dateOfBirth: '' });
    setCoForm({ name: '', industry: '', contact: '', email: '', phone: '', joinedDate: '', address: '', country: '' });
    setShowModal(true);
  };

  const handleDeleteLeaveApproval = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave history?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/leaves/${leaveId}`, { method: 'DELETE' });
      if (res.ok) {
        setLeavesList(prev => prev.filter(l => l.id !== leaveId));
        fetchData();
      } else {
        alert('Failed to delete leave history.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting leave history.');
    }
  };

  const handleConfirmLeaveAction = async () => {
    if (!selectedLeave) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/leaves/${selectedLeave.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: leaveAction === 'approve' ? 'approved' : 'rejected',
          note: hrNote,
          rejectionReason: rejectReason,
        }),
      });
      if (res.ok) {
        setSelectedLeave(null);
        setRejectReason('');
        setHrNote('');
        setLeaveAction(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      let updatedPayload = {};
      if (key.startsWith('leaveAllocations.')) {
        const subKey = key.split('.')[1];
        updatedPayload = { leaveAllocations: { [subKey]: value } };
      } else {
        updatedPayload = { [key]: value };
      }

      const res = await fetch(`${BACKEND_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignClient = async (employeeId, clientId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${employeeId}/client`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Client assignment updated successfully.');
        setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, companyId: clientId, company: companies.find(c => c.id === clientId)?.name || 'General' } : e));
        fetchData();
        if (selectedEmployeeId === employeeId) {
          fetchEmployeeDetail(employeeId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update client assignment.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating client assignment.');
    }
  };

  const handleAssignTeam = async (employeeId, teamId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${employeeId}/team`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Team assignment updated successfully.');
        setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, teamId: teamId, team: companies.find(c => c.id === teamId)?.name || 'None' } : e));
        fetchData();
        if (selectedEmployeeId === employeeId) {
          fetchEmployeeDetail(employeeId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update team assignment.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating team assignment.');
    }
  };

  const handleAssignShift = async (employeeId, shift) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${employeeId}/shift`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Shift assignment updated successfully.');
        setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, shift } : e));
        fetchData();
        if (selectedEmployeeId === employeeId) {
          fetchEmployeeDetail(employeeId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update shift assignment.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating shift assignment.');
    }
  };

  const handleToggleEmployeeTeaBreak = async (empId, currentState) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teaBreakAllowed: !currentState })
      });
      if (res.ok) {
        setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, teaBreakAllowed: !currentState } : emp));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update employee setting');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCompanyTeaBreak = async (compId, currentState) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/companies/${compId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teaBreakAllowed: !currentState })
      });
      if (res.ok) {
        setCompanies(prev => prev.map(co => co.id === compId ? { ...co, teaBreakAllowed: !currentState } : co));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update company setting');
      }
    } catch (err) {
      console.error(err);
    }
  };



  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/faqs`);
      if (res.ok) {
        setFaqs(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreateFaq = async (faqData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqData),
      });
      if (res.ok) {
        fetchFaqs();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Server error' };
    }
  };

  const handleUpdateFaq = async (faqId, faqData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/faqs/${faqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqData),
      });
      if (res.ok) {
        fetchFaqs();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Server error' };
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/faqs/${faqId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFaqs();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Server error' };
    }
  };

  return {
    adminProfile,
    handleUpdateProfile: handleUpdateAdminProfile,
    employees,
    hrUsers,
    companies,
    leavesList,
    dashboardStats,
    pendingLeaves,
    leaveCounts,

    adminName,
    setAdminName,

    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    shiftFilter,
    setShiftFilter,
    showModal,
    setShowModal,
    empForm,
    setEmpForm,
    settings,

    selectedLeave,
    setSelectedLeave,
    rejectReason,
    setRejectReason,
    hrNote,
    setHrNote,
    leaveAction,
    setLeaveAction,
    handleConfirmLeaveAction,
    handleDeleteLeaveApproval,

    leaveTabFilter,
    setLeaveTabFilter,
    leaveMonthFilter,
    setLeaveMonthFilter,
    leaveYearFilter,
    setLeaveYearFilter,
    leaveSearch,
    setLeaveSearch,
    filteredLeaves,
    leaveCounts,

    filteredEmployees,
    filteredHR,
    filteredCompanies,

    handleDeleteEmployee,
    handleDeleteHR,
    handleDeleteCompany,
    handleAddEmployee,
    handleAddHR,
    handleAddCompany,
    handleUpdateSetting,
    handleAssignClient,
    handleAssignTeam,
    handleAssignShift,
    handleToggleEmployeeTeaBreak,
    handleToggleCompanyTeaBreak,

    hrForm,
    setHrForm,
    coForm,
    setCoForm,

    editingItem,
    handleEditClick,
    handleAddClick,

    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedAttendance,
    selectedBalance,
    handleAdjustAttendance,
    handleCreateManualAttendance,
    handleUpdateEmployeeStatus,

    employeesList: employees,
    reportType,
    setReportType,
    reportsFilterType,
    setReportsFilterType,
    reportsSelectedYear,
    setReportsSelectedYear,
    reportsSelectedMonthNum,
    setReportsSelectedMonthNum,
    reportsSelectedWeekDate,
    setReportsSelectedWeekDate,
    reportsCustomStartDate,
    setReportsCustomStartDate,
    reportsCustomEndDate,
    setReportsCustomEndDate,
    getReportsWeekRange,
    getReportsCompanyMonthRange,
    reportsSummary,
    leaveTypeData,
    monthlyTrend,
    reportsAttendanceData,
    todayAttendance,
    weeklyAttendanceData,
    getEmployeeStats,
    selectedDate,
    setSelectedDate,
    deptData,
    todayLabel,
    selectedEmployeeDetail,
    
    faqs,
    handleCreateFaq,
    handleUpdateFaq,
    handleDeleteFaq,
    isSubmitting,
  };
}
