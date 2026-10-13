import { useState, useEffect, useRef } from 'react';

import { BACKEND_URL } from '../config';

export function useHRController(hrId, updateAuth) {
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [hrProfile, setHrProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [employeesList, setEmployeesList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [clients, setClients] = useState([]);
  const [shiftNotices, setShiftNotices] = useState([]);
  const [globalDepartments, setGlobalDepartments] = useState([]);

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [todayDate, setTodayDate] = useState('');
  const [todayLabel, setTodayLabel] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
  });
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

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    joinDate: '',
    dateOfBirth: '',
    address: '',
    country: '',
    shift: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [leaveTabFilter, setLeaveTabFilter] = useState('pending');
  const [leaveMonthFilter, setLeaveMonthFilter] = useState('all');
  const [leaveYearFilter, setLeaveYearFilter] = useState(() => String(new Date().getFullYear()));
  const [leaveSearch, setLeaveSearch] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [hrNote, setHrNote] = useState('');
  const [leaveAction, setLeaveAction] = useState(null);

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

  const fetchData = async () => {
    try {
      const [dashRes, dbRes, leavesRes, noticesRes, settingsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/hr/dashboard?date=${selectedDate}`),
        fetch(`${BACKEND_URL}/admin/dashboard`),
        fetch(`${BACKEND_URL}/hr/leaves`),
        fetch(`${BACKEND_URL}/hr/shift-notices`),
        fetch(`${BACKEND_URL}/hr/settings`),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setGlobalDepartments(settingsData.departments || []);
      }

      if (leavesRes.ok) {
        setLeavesList(await leavesRes.json());
      }

      if (noticesRes.ok) {
        setShiftNotices(await noticesRes.json());
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setEmployeesList(dashData.employees || []);
        setTodayAttendance(dashData.todayAttendance || []);
        setWeeklyAttendanceData(dashData.weeklyAttendanceData || []);
        setDeptData(dashData.deptData || []);
        setTodayDate(dashData.todayDate || '');
        setTodayLabel(dashData.todayLabel || '');
        setDashboardStats(dashData.stats || {});
      }

      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setClients(dbData.companies || []);
      }
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
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchHRProfile = async () => {
    let resolvedId = hrId;
    if (!resolvedId) {
      const savedAuth = localStorage.getItem('wf_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        resolvedId = parsed.userId || parsed.email;
      }
    }
    if (!resolvedId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/hr/${resolvedId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setHrProfile(data.hr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateHRProfile = async (updateData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/${hrId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (res.ok) {
        setHrProfile(data.hr);
        if (updateData.avatar !== undefined || updateData.name) {
          if (updateAuth) {
            updateAuth({
              avatar: data.hr.avatar || '',
              name: data.hr.name,
            });
          }
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleAdjustAttendance = async (attendanceId, adjustmentData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adjustmentData,
          adjustedBy: hrProfile?.name || 'HR Manager',
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
          adjustedBy: hrProfile?.name || 'HR Manager',
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

  useEffect(() => {
    fetchHRProfile();
  }, [hrId]);

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

  const departments = ['All', ...new Set(employeesList.map((e) => e.department))];

  const filteredEmployees = employeesList.filter((e) => {
    const matchSearch =
      search === '' ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchShift = shiftFilter === 'All' || e.shift === shiftFilter;
    return matchSearch && matchDept && matchStatus && matchShift;
  });

  const selectedEmployee = selectedEmployeeDetail || (selectedEmployeeId
    ? employeesList.find((e) => e.id === selectedEmployeeId)
    : null);

  const getEmployeeStats = (empId) =>
    employeeStatsMap[empId] || { present: 0, total: 0, pct: 0, hours: 0, extraHours: 0, lessHours: 0, late: 0, absent: 0, halfDay: 0, mealBreakMinutes: 0, teaBreakMinutes: 0 };

  const handleDeleteLeaveApproval = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave history?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/hr/leaves/${leaveId}`, { method: 'DELETE' });
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
      const res = await fetch(`${BACKEND_URL}/hr/leaves/${selectedLeave.id}/review`, {
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
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to review leave request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeaves = leavesList
    .filter((l) => leaveTabFilter === 'all' || l.status === leaveTabFilter)
    .filter(
      (l) =>
        leaveSearch === '' ||
        l.employeeName.toLowerCase().includes(leaveSearch.toLowerCase()) ||
        l.department.toLowerCase().includes(leaveSearch.toLowerCase())
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

  const leaveCounts = {
    all: leavesList.length,
    pending: leavesList.filter((l) => l.status === 'pending').length,
    approved: leavesList.filter((l) => l.status === 'approved').length,
    rejected: leavesList.filter((l) => l.status === 'rejected').length,
    cancelled: leavesList.filter((l) => l.status === 'cancelled').length,
  };

  const totalEmployees = dashboardStats.totalEmployees || employeesList.length;
  const activeEmployees = dashboardStats.activeEmployees || employeesList.filter((e) => e.status === 'active').length;
  const presentToday = dashboardStats.presentToday || 0;
  const onLeaveToday = dashboardStats.onLeaveToday || 0;

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
        setEmployeesList((prev) => prev.map((e) => e.id === employeeId ? { ...e, companyId: clientId, company: clients.find(c => c.id === clientId)?.name || 'General' } : e));
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
        setEmployeesList((prev) => prev.map((e) => e.id === employeeId ? { ...e, teamId: teamId, team: clients.find(c => c.id === teamId)?.name || 'None' } : e));
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
        setEmployeesList((prev) => prev.map((e) => e.id === employeeId ? { ...e, shift } : e));
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

  const handleUpdateEmployeeStatus = async (employeeId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/hr/employees/${employeeId}/status`, {
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

  const handleAddEmployee = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

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
      const res = await fetch(`${BACKEND_URL}/hr/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empForm.name.trim(),
          email: empForm.email,
          position: empForm.position,
          department: empForm.department,
          joinDate: empForm.joinDate || new Date().toISOString().split('T')[0],
          dateOfBirth: empForm.dateOfBirth || null,
          companyId: null,
          phone: null,
          address: empForm.address,
          country: empForm.country,
          shift: empForm.shift,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Employee created successfully.');
        setEmpForm({ name: '', email: '', position: '', department: '', joinDate: '', dateOfBirth: '', address: '', country: '', shift: '' });
        setShowModal(false);
        fetchData();
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add employee');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while adding the employee.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    employeesList,
    leavesList,
    todayAttendance,
    weeklyAttendanceData,
    deptData,
    todayDate,
    todayLabel,
    dashboardStats,
    reportsSummary,
    leaveTypeData,
    monthlyTrend,
    reportsAttendanceData,

    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    shiftFilter,
    setShiftFilter,
    selectedEmployeeId,
    setSelectedEmployeeId,
    departments,
    globalDepartments,
    filteredEmployees,
    selectedEmployee,
    selectedAttendance,
    selectedBalance,
    getEmployeeStats,

    leaveTabFilter,
    setLeaveTabFilter,
    leaveMonthFilter,
    setLeaveMonthFilter,
    leaveYearFilter,
    setLeaveYearFilter,
    leaveSearch,
    setLeaveSearch,
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
    filteredLeaves,
    leaveCounts,

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

    totalEmployees,
    activeEmployees,
    presentToday,
    onLeaveToday,

    clients,
    handleAssignClient,
    handleAssignTeam,
    handleAssignShift,
    handleUpdateEmployeeStatus,

    showModal,
    setShowModal,
    empForm,
    setEmpForm,
    handleAddEmployee,
    isSubmitting,

    hrProfile,
    handleUpdateHRProfile,
    handleAdjustAttendance,
    handleCreateManualAttendance,
    shiftNotices,
  };
}
