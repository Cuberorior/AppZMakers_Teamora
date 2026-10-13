import { useState, useEffect } from 'react';

import { BACKEND_URL } from '../config';

export function useCompanyController(companyId, updateAuth) {
  const [company, setCompany] = useState({
    name: 'Loading...',
    industry: '',
    contact: '',
    email: '',
    phone: '',
    employeeCount: 0,
    status: 'active',
  });
  const [myEmployees, setMyEmployees] = useState([]);
  const [todayRecs, setTodayRecs] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [shiftNotices, setShiftNotices] = useState([]);

  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [reportType, setReportType] = useState('attendance');
  const [reportsFilterType, setReportsFilterType] = useState('monthly');
  const [reportsSelectedYear, setReportsSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [reportsSelectedMonthNum, setReportsSelectedMonthNum] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [reportsSelectedWeekDate, setReportsSelectedWeekDate] = useState(getLocalDateString());
  const [reportsCustomStartDate, setReportsCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reportsCustomEndDate, setReportsCustomEndDate] = useState(getLocalDateString());

  const getReportsWeekRange = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  const [reportsData, setReportsData] = useState({});
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchReports = async () => {
    if (!companyId) return;
    setReportsLoading(true);
    try {
      let url = `${BACKEND_URL}/companies/${companyId}/reports`;
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
        setReportsData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [
    reportsFilterType,
    reportsSelectedYear,
    reportsSelectedMonthNum,
    reportsSelectedWeekDate,
    reportsCustomStartDate,
    reportsCustomEndDate,
    companyId
  ]);

  const fetchShiftNotices = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/shift-notices`);
      if (res.ok) {
        setShiftNotices(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShiftNotice = async (noticeData) => {
    if (!companyId) return { success: false, error: 'No company ID' };
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/shift-notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchShiftNotices();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateShiftNotice = async (noticeId, noticeData) => {
    if (!companyId) return { success: false, error: 'No company ID' };
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/shift-notices/${noticeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchShiftNotices();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleDeleteShiftNotice = async (noticeId) => {
    if (!companyId) return { success: false, error: 'No company ID' };
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/shift-notices/${noticeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        await fetchShiftNotices();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const fetchData = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setMyEmployees(data.employees || []);
        setTodayRecs(data.todayRecs || []);
        setAttendanceHistory(data.attendanceHistory || []);
        setWeeklyData(data.weeklyData || []);
        setPresentCount(data.stats?.presentCount || 0);
        setAbsentCount(data.stats?.absentCount || 0);
        setOnLeaveCount(data.stats?.onLeaveCount || 0);
        setPendingLeaves(data.stats?.pendingLeaves || 0);
        setTotalHours(data.stats?.totalHours || 0);
      }
      await fetchShiftNotices();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
  }, [companyId]);

  const filteredEmployees = myEmployees.filter((emp) => {
    const matchSearch =
      searchQuery === '' ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateCompanyProfile = async (updateData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/companies/${companyId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (res.ok) {
        setCompany(data.company);
        if (updateData.avatar !== undefined || updateData.name) {
          if (updateAuth) {
            updateAuth({
              avatar: data.company.avatar || '',
              name: data.company.name,
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

  return {
    company,
    myEmployees,
    todayRecs,
    attendanceHistory,
    weeklyData,
    presentCount,
    absentCount,
    onLeaveCount,
    pendingLeaves,
    totalHours,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredEmployees,
    handleUpdateCompanyProfile,
    shiftNotices,
    handleCreateShiftNotice,
    handleUpdateShiftNotice,
    handleDeleteShiftNotice,
    fetchShiftNotices,
    reportsData,
    reportsLoading,
    fetchReports,

    reportType, setReportType,
    reportsFilterType, setReportsFilterType,
    reportsSelectedYear, setReportsSelectedYear,
    reportsSelectedMonthNum, setReportsSelectedMonthNum,
    reportsSelectedWeekDate, setReportsSelectedWeekDate,
    reportsCustomStartDate, setReportsCustomStartDate,
    reportsCustomEndDate, setReportsCustomEndDate,
    getReportsWeekRange, getReportsCompanyMonthRange,

    employeesList: reportsData?.employees || [],
    leavesList: reportsData?.leaves || [],
    todayAttendance: reportsData?.todayAttendance || [],
    weeklyAttendanceData: reportsData?.weeklyAttendanceData || [],
    leaveTypeData: reportsData?.leaveTypeData || [],
    monthlyTrend: reportsData?.monthlyTrend || [],
    reportsSummary: reportsData?.summary || {},
    reportsAttendanceData: reportsData?.attendanceData || [],
    getEmployeeStats: (id) => reportsData?.employeeStats?.[id] || { present: 0, total: 0, pct: 0, hours: 0, extraHours: 0, lessHours: 0, late: 0, absent: 0, halfDay: 0, mealBreakMinutes: 0, teaBreakMinutes: 0 },
  };
}
