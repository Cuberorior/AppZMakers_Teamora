import { useRef, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Calendar, Download, Users, BarChart3, Clock, Coffee, Utensils, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CustomSelect } from '../../components/CustomSelect';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const formatHrMin = (valDec) => {
  if (valDec === null || valDec === undefined || valDec === '' || isNaN(valDec)) return '—';
  const val = Number(valDec);
  if (val <= 0) return '—';
  const totalMinutes = Math.round(val * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}min`;
  } else if (hrs > 0) {
    return `${hrs}h`;
  } else {
    return `${mins}min`;
  }
};

const formatMin = (minsVal) => {
  if (minsVal === null || minsVal === undefined || minsVal === '' || isNaN(minsVal)) return '—';
  const val = Number(minsVal);
  if (val <= 0) return '—';
  const hrs = Math.floor(val / 60);
  const mins = val % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}min`;
  } else if (hrs > 0) {
    return `${hrs}h`;
  } else {
    return `${mins}min`;
  }
};

const FormatMultilineName = ({ name }) => {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  return (
    <div className="flex flex-col">
      {parts.map((p, i) => (
        <span key={i} className="leading-tight capitalize">{p}</span>
      ))}
    </div>
  );
};

const renderLeaveTypeLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
  if (!value || value <= 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      className="fill-slate-800 dark:fill-slate-100 text-[11px] sm:text-xs font-black"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name}: ${value}`}
    </text>
  );
};

export function HRReportsView({
  reportType,
  setReportType,
  employeesList,
  leavesList,
  getEmployeeStats,
  weeklyAttendanceData,
  leaveTypeData,
  monthlyTrend,
  reportsSummary,
  reportsAttendanceData,
  todayAttendance,
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
  role,
}) {
  const totalHours = todayAttendance?.reduce((s, r) => s + (r.totalHours || 0), 0) || 0;

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [selectedPresentDetails, setSelectedPresentDetails] = useState(null);
  const [breakPopover, setBreakPopover] = useState(null);

  const handleBreakClick = (e, type, breaks = []) => {
    e.stopPropagation();
    const typeBreaks = (breaks || []).filter(b => {
      const isMatch = type === 'meal' ? b.type !== 'tea' : b.type === type;
      return isMatch && b.start && b.end;
    });
    if (typeBreaks.length === 0) return;

    let totalSecs = 0;
    typeBreaks.forEach(b => {
      const s = b.start.split(':').map(Number);
      const e = b.end.split(':').map(Number);
      let inS = s[0] * 3600 + s[1] * 60 + s[2];
      let outS = e[0] * 3600 + e[1] * 60 + e[2];
      if (outS < inS) outS += 86400;
      totalSecs += (outS - inS);
    });

    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left + 16;
    if (left + 260 > window.innerWidth) {
      left = window.innerWidth - 260 - 20;
    }

    const estimatedHeight = 180 + (typeBreaks.length * 35);
    const isFlipped = (rect.bottom + estimatedHeight > window.innerHeight);

    setBreakPopover({
      type,
      count: typeBreaks.length,
      total: formatMin(Math.round(totalSecs / 60)),
      breaks: typeBreaks,
      x: left,
      yStyle: isFlipped
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }
    });
  };

  const handlePresentClick = (emp) => {
    const stats = getEmployeeStats ? getEmployeeStats(emp.id) : null;
    if (!stats || stats.present === 0) return;
    const records = (reportsAttendanceData || [])
      .filter(a => String(a.employeeId) === String(emp.id) && (a.checkIn || a.status === 'present' || a.status === 'late'))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setSelectedPresentDetails({ emp, records });
  };

  const filteredEmployeesList = useMemo(() => {
    if (selectedEmployeeFilter === 'all') return employeesList || [];
    return (employeesList || []).filter(e => String(e.id) === String(selectedEmployeeFilter));
  }, [employeesList, selectedEmployeeFilter]);

  const filteredLeavesList = useMemo(() => {
    if (selectedEmployeeFilter === 'all') return leavesList || [];
    return (leavesList || []).filter(l => String(l.employeeId) === String(selectedEmployeeFilter));
  }, [leavesList, selectedEmployeeFilter]);

  const filteredEmployeeAttendanceData = useMemo(() => {
    if (selectedEmployeeFilter === 'all' || !reportsAttendanceData) return [];
    return [...reportsAttendanceData].filter(a => String(a.employeeId) === String(selectedEmployeeFilter)).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [reportsAttendanceData, selectedEmployeeFilter]);

  const dynamicSummary = useMemo(() => {
    if (selectedEmployeeFilter === 'all') {
      return reportsSummary || {};
    }
    const emp = filteredEmployeesList[0];
    if (!emp) return {};
    const stats = getEmployeeStats ? getEmployeeStats(emp.id) : null;
    return {
      totalEmployees: 1,
      activeEmployees: emp.status === 'active' ? 1 : 0,
      avgAttendance: stats ? stats.pct : 0,
      totalHours: stats ? stats.hours : 0,
      leaveDaysUsed: filteredLeavesList.filter((l) => l.status === 'approved').reduce((s, l) => s + l.days, 0)
    };
  }, [reportsSummary, selectedEmployeeFilter, filteredEmployeesList, filteredLeavesList, getEmployeeStats]);

  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, select, a')) return;
    isDown.current = true;
    containerRef.current.classList.add('cursor-grabbing');
    containerRef.current.classList.remove('cursor-grab');
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const leaveContainerRef = useRef(null);
  const isLeaveDown = useRef(false);
  const leaveStartX = useRef(0);
  const leaveScrollLeft = useRef(0);

  const handleLeaveMouseDown = (e) => {
    if (e.target.closest('button, input, select, a')) return;
    isLeaveDown.current = true;
    leaveContainerRef.current.classList.add('cursor-grabbing');
    leaveContainerRef.current.classList.remove('cursor-grab');
    leaveStartX.current = e.pageX - leaveContainerRef.current.offsetLeft;
    leaveScrollLeft.current = leaveContainerRef.current.scrollLeft;
  };

  const handleLeaveMouseLeave = () => {
    isLeaveDown.current = false;
    if (leaveContainerRef.current) {
      leaveContainerRef.current.classList.remove('cursor-grabbing');
      leaveContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleLeaveMouseUp = () => {
    isLeaveDown.current = false;
    if (leaveContainerRef.current) {
      leaveContainerRef.current.classList.remove('cursor-grabbing');
      leaveContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleLeaveMouseMove = (e) => {
    if (!isLeaveDown.current) return;
    e.preventDefault();
    const x = e.pageX - leaveContainerRef.current.offsetLeft;
    const walk = (x - leaveStartX.current) * 1.5;
    leaveContainerRef.current.scrollLeft = leaveScrollLeft.current - walk;
  };

  const availableYears = [];
  for (let y = 2030; y >= 2024; y--) {
    availableYears.push(y);
  }

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handlePrevWeek = () => {
    if (!reportsSelectedWeekDate) return;
    const [y, m, d] = reportsSelectedWeekDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    setReportsSelectedWeekDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextWeek = () => {
    if (!reportsSelectedWeekDate) return;
    const [y, m, d] = reportsSelectedWeekDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 7);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    setReportsSelectedWeekDate(`${newY}-${newM}-${newD}`);
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [67, 56, 202]; // indigo-600
      const lightBgColor = [248, 250, 252]; // slate-50

      // Title & Header details
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('AppzMaker Portal', 14, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Workforce Analytics & Reporting', 14, 25);

      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.setFontSize(9);
      doc.text(`Generated: ${todayStr}`, 196, 20, { align: 'right' });
      doc.text(`Role: ${role === 'superadmin' ? 'Administrator' : 'HR Manager'}`, 196, 25, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      let reportTitle = (reportType || 'Attendance').charAt(0).toUpperCase() + (reportType || 'Attendance').slice(1) + ' Report';
      doc.text(reportTitle, 14, 38);

      let periodText = 'Period: All Time';
      if (reportsFilterType === 'monthly') {
        const { startStr, endStr } = getReportsCompanyMonthRange(reportsSelectedYear, reportsSelectedMonthNum);
        periodText = `Period: Monthly (${startStr} to ${endStr})`;
      } else if (reportsFilterType === 'weekly') {
        const { mondayStr, sundayStr } = getReportsWeekRange(reportsSelectedWeekDate);
        periodText = `Period: Weekly (${mondayStr} to ${sundayStr})`;
      } else if (reportsFilterType === 'custom') {
        periodText = `Period: Custom Range (${reportsCustomStartDate} to ${reportsCustomEndDate})`;
      }
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(periodText, 14, 44);

      let currentY = 48;

      if (selectedEmployeeFilter !== 'all' && filteredEmployeesList.length > 0) {
        const emp = filteredEmployeesList[0];
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(`Employee: ${emp.name}`, 14, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Department: ${emp.department || '—'}`, 14, currentY + 5);
        currentY += 12;
      }

      // Summary Cards block
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.rect(14, currentY, 182, 22, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, currentY, 182, 22, 'S');

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('TOTAL EMPLOYEES', 20, currentY + 6);
      doc.text('TOTAL HOURS', 65, currentY + 6);
      doc.text('LEAVES USED', 105, currentY + 6);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);

      const sumVal1 = String(dynamicSummary?.totalEmployees ?? filteredEmployeesList.length ?? 0);
      const sumVal2 = `${Math.round(dynamicSummary?.totalHours ?? totalHours ?? 0)}h`;
      const sumVal3 = String(dynamicSummary?.leaveDaysUsed ?? filteredLeavesList.filter((l) => l.status === 'approved').reduce((s, l) => s + l.days, 0) ?? 0);

      doc.text(sumVal1, 20, currentY + 14);
      doc.text(sumVal2, 65, currentY + 14);
      doc.text(sumVal3, 105, currentY + 14);

      currentY += 30;

      let tableHeaders = [];
      let tableRows = [];

      if (reportType === 'attendance') {
        if (selectedEmployeeFilter !== 'all') {
          tableHeaders = [['Date', 'Check In', 'Check Out', 'Break', 'Total Hours', 'Extra Hours', 'Less Hours', 'Status']];
          tableRows = filteredEmployeeAttendanceData.map((a) => [
            a.date,
            a.checkIn ? `date: ${a.date}\ntime: ${a.checkIn}` : '—',
            a.checkOut ? `date: ${a.checkOutDate || a.date}\ntime: ${a.checkOut}` : '—',
            formatMin(a.breakMinutes || 0),
            formatHrMin(a.totalHours || 0),
            a.extraHours > 0 ? `+${formatHrMin(a.extraHours)}` : '—',
            a.lessHours > 0 ? `${formatHrMin(a.lessHours)}` : '—',
            a.status
          ]);
        } else {
          tableHeaders = [['Employee', 'Department', 'Present', 'Meal Break', 'Tea Break', 'Total Hours', 'Extra Hours', 'Less Hours']];
          tableRows = filteredEmployeesList.map((emp) => {
            const stats = getEmployeeStats ? getEmployeeStats(emp.id) : { present: 0, total: 0, pct: 0, hours: 0, extraHours: 0, lessHours: 0, late: 0, mealBreakMinutes: 0, teaBreakMinutes: 0 };
            return [
              emp.name,
              emp.department || '—',
              String(stats.present),
              formatMin(stats.mealBreakMinutes),
              formatMin(stats.teaBreakMinutes),
              formatHrMin(stats.hours),
              stats.extraHours > 0 ? `+${formatHrMin(stats.extraHours)}` : '—',
              stats.lessHours > 0 ? `${formatHrMin(stats.lessHours)}` : '—'
            ];
          });
        }
      } else if (reportType === 'leave') {
        tableHeaders = [['Employee', 'Dept', 'Type', 'From', 'To', 'Days', 'Status', 'Applied']];
        tableRows = filteredLeavesList.map((l) => [
          l.employeeName,
          l.department || '—',
          l.type,
          l.startDate,
          l.endDate,
          String(l.days),
          l.status,
          l.appliedOn
        ]);
      } else {
        tableHeaders = [['Employee', 'Company', 'Department', 'Position', 'Join Date', 'Status']];
        tableRows = filteredEmployeesList.map((emp) => [
          emp.name,
          emp.company || '—',
          emp.department || '—',
          emp.position || '—',
          emp.joinDate,
          emp.status
        ]);
      }

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: currentY,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      let suffix = 'Report';
      if (reportsFilterType === 'monthly') {
        suffix = `${reportsSelectedYear}_${reportsSelectedMonthNum}`;
      } else if (reportsFilterType === 'weekly') {
        suffix = `Week_${reportsSelectedWeekDate}`;
      } else if (reportsFilterType === 'custom') {
        suffix = `${reportsCustomStartDate}_to_${reportsCustomEndDate}`;
      }

      let empNameSuffix = '';
      if (selectedEmployeeFilter !== 'all' && filteredEmployeesList.length > 0) {
        empNameSuffix = `_${filteredEmployeesList[0].name.replace(/\s+/g, '_')}`;
      }

      const filename = `AppzMaker_${reportType}_Report_${suffix}${empNameSuffix}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const downloadExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AppzMaker';
      workbook.lastModifiedBy = 'AppzMaker';
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet('Report', {
        views: [{ state: 'frozen', ySplit: 5 }],
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // Title
      let reportTitle = (reportType || 'Attendance').charAt(0).toUpperCase() + (reportType || 'Attendance').slice(1) + ' Report';
      sheet.mergeCells('A1:I2');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `AppzMaker Portal - ${reportTitle}`;
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Subtitle (Period)
      let periodText = 'Period: All Time';
      if (reportsFilterType === 'monthly') {
        const { startStr, endStr } = getReportsCompanyMonthRange(reportsSelectedYear, reportsSelectedMonthNum);
        periodText = `Period: Monthly (${startStr} to ${endStr})`;
      } else if (reportsFilterType === 'weekly') {
        const { mondayStr, sundayStr } = getReportsWeekRange(reportsSelectedWeekDate);
        periodText = `Period: Weekly (${mondayStr} to ${sundayStr})`;
      } else if (reportsFilterType === 'custom') {
        periodText = `Period: Custom Range (${reportsCustomStartDate} to ${reportsCustomEndDate})`;
      }

      sheet.mergeCells('A3:I3');
      const subTitleCell = sheet.getCell('A3');
      subTitleCell.value = periodText;
      subTitleCell.font = { name: 'Arial', size: 11, italic: true };
      subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Generated Date & Info
      sheet.mergeCells('A4:I4');
      const infoCell = sheet.getCell('A4');
      infoCell.value = `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Role: ${role === 'superadmin' ? 'Administrator' : 'HR Manager'}`;
      infoCell.font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } };
      infoCell.alignment = { vertical: 'middle', horizontal: 'right' };

      let tableHeaders = [];
      let tableRows = [];
      let colWidths = [];

      if (reportType === 'attendance') {
        if (selectedEmployeeFilter !== 'all') {
          tableHeaders = ['Date', 'Check In', 'Check Out', 'Break', 'Total Hours', 'Extra Hours', 'Less Hours', 'Status'];
          colWidths = [15, 20, 20, 10, 12, 12, 12, 15];
          let sumBreak = 0, sumHrs = 0, sumExtra = 0, sumLess = 0;
          tableRows = filteredEmployeeAttendanceData.map((a) => {
            sumBreak += (a.breakMinutes || 0);
            sumHrs += (a.totalHours || 0);
            sumExtra += (a.extraHours || 0);
            sumLess += (a.lessHours || 0);
            return [
              a.date,
              a.checkIn ? `date: ${a.date}\ntime: ${a.checkIn}` : '—',
              a.checkOut ? `date: ${a.checkOutDate || a.date}\ntime: ${a.checkOut}` : '—',
              formatMin(a.breakMinutes || 0),
              formatHrMin(a.totalHours || 0),
              a.extraHours > 0 ? `+${formatHrMin(a.extraHours)}` : '—',
              a.lessHours > 0 ? `${formatHrMin(a.lessHours)}` : '—',
              a.status
            ];
          });
          tableRows.push([
            'TOTAL', '—', '—',
            formatMin(sumBreak),
            formatHrMin(sumHrs),
            sumExtra > 0 ? `+${formatHrMin(sumExtra)}` : '—',
            sumLess > 0 ? formatHrMin(sumLess) : '—',
            '—'
          ]);
        } else {
          tableHeaders = ['Employee', 'Department', 'Present', 'Meal Break', 'Tea Break', 'Total Hours', 'Extra Hours', 'Less Hours'];
          colWidths = [25, 20, 10, 12, 12, 12, 12, 12];
          let sumPresent = 0, sumMeal = 0, sumTea = 0, sumHrs = 0, sumExtra = 0, sumLess = 0;
          tableRows = filteredEmployeesList.map((emp) => {
            const stats = getEmployeeStats ? getEmployeeStats(emp.id) : { present: 0, total: 0, pct: 0, hours: 0, extraHours: 0, lessHours: 0, late: 0, mealBreakMinutes: 0, teaBreakMinutes: 0 };
            sumPresent += stats.present;
            sumMeal += stats.mealBreakMinutes;
            sumTea += stats.teaBreakMinutes;
            sumHrs += stats.hours;
            sumExtra += stats.extraHours;
            sumLess += stats.lessHours;
            return [
              emp.name,
              emp.department || '—',
              stats.present,
              formatMin(stats.mealBreakMinutes),
              formatMin(stats.teaBreakMinutes),
              formatHrMin(stats.hours),
              stats.extraHours > 0 ? `+${formatHrMin(stats.extraHours)}` : '—',
              stats.lessHours > 0 ? `${formatHrMin(stats.lessHours)}` : '—'
            ];
          });
          tableRows.push([
            'TOTAL', '—',
            sumPresent,
            formatMin(sumMeal),
            formatMin(sumTea),
            formatHrMin(sumHrs),
            sumExtra > 0 ? `+${formatHrMin(sumExtra)}` : '—',
            sumLess > 0 ? formatHrMin(sumLess) : '—'
          ]);
        }
      } else if (reportType === 'leave') {
        tableHeaders = ['Employee', 'Dept', 'Type', 'From', 'To', 'Days', 'Status', 'Applied'];
        colWidths = [25, 20, 15, 15, 15, 10, 15, 15];
        let totalDays = 0;
        tableRows = filteredLeavesList.map((l) => {
          totalDays += (Number(l.days) || 0);
          return [
            l.employeeName,
            l.department || '—',
            l.type,
            l.startDate,
            l.endDate,
            l.days,
            l.status,
            l.appliedOn
          ];
        });
        tableRows.push([
          'TOTAL', '—', '—', '—', '—',
          totalDays,
          '—', '—'
        ]);
      } else {
        tableHeaders = ['Employee', 'Company', 'Department', 'Position', 'Join Date', 'Status'];
        colWidths = [25, 20, 20, 20, 15, 15];
        tableRows = filteredEmployeesList.map((emp) => [
          emp.name,
          emp.company || '—',
          emp.department || '—',
          emp.position || '—',
          emp.joinDate,
          emp.status
        ]);
        tableRows.push([
          'TOTAL EMPLOYEES', String(filteredEmployeesList.length), '—', '—', '—', '—'
        ]);
      }

      // Add Headers
      const headerRow = sheet.getRow(5);
      headerRow.values = tableHeaders;
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      tableHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      // Add Data
      tableRows.forEach((rowData, index) => {
        const row = sheet.getRow(index + 6);
        row.values = rowData;
        row.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Alternate row colors
        const bgColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';

        rowData.forEach((val, cIndex) => {
          const cell = row.getCell(cIndex + 1);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Center specific columns
          if (typeof val === 'number' || val?.includes('%') || ['Status', 'Date', 'From', 'To', 'Join Date', 'Present', 'Days'].includes(tableHeaders[cIndex])) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }

          // Color code status if applicable
          if (tableHeaders[cIndex] === 'Status') {
            const statusStr = String(val).toLowerCase();
            let statusColor = 'FF334155'; // default
            if (statusStr === 'present' || statusStr === 'active' || statusStr === 'approved') statusColor = 'FF10B981'; // emerald
            else if (statusStr === 'absent' || statusStr === 'rejected') statusColor = 'FFEF4444'; // red
            else if (statusStr === 'late' || statusStr === 'pending') statusColor = 'FFF59E0B'; // amber

            cell.font = { ...row.font, color: { argb: statusColor }, bold: true };
          }

          if (String(rowData[0]).startsWith('TOTAL')) {
            cell.font = { ...row.font, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          }
        });
      });

      // Set column widths
      sheet.columns.forEach((col, index) => {
        if (colWidths[index]) {
          col.width = colWidths[index];
        } else {
          col.width = 15;
        }
      });

      let suffix = 'Report';
      if (reportsFilterType === 'monthly') {
        suffix = `${reportsSelectedYear}_${reportsSelectedMonthNum}`;
      } else if (reportsFilterType === 'weekly') {
        suffix = `Week_${reportsSelectedWeekDate}`;
      } else if (reportsFilterType === 'custom') {
        suffix = `${reportsCustomStartDate}_to_${reportsCustomEndDate}`;
      }

      let empNameSuffix = '';
      if (selectedEmployeeFilter !== 'all' && filteredEmployeesList.length > 0) {
        empNameSuffix = `_${filteredEmployeesList[0].name.replace(/\s+/g, '_')}`;
      }

      const filename = `AppzMaker_${reportType}_Report_${suffix}${empNameSuffix}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Error generating Excel report. Please try again.');
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium mt-1">Generate and export workforce analytics</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <Download className="w-4 h-4" />Excel
          </button>
          <button
            type="button"
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-rose-600/10"
          >
            <Download className="w-4 h-4" />PDF
          </button>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/80 dark:border-slate-700 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-900/40 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-400/50 transition-colors duration-700"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-fuchsia-300/30 dark:bg-fuchsia-900/30 rounded-full blur-3xl pointer-events-none group-hover:bg-fuchsia-400/40 transition-colors duration-700"></div>
        <div className="flex flex-wrap items-start md:items-center justify-between gap-4 relative z-10 w-full">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-auto">
            {[
              { id: 'attendance', label: 'Attendance', icon: BarChart3 },
              { id: 'leave', label: 'Leave', icon: Calendar },
              { id: 'summary', label: 'Summary', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setReportType(id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-[11px] sm:text-sm font-bold transition-all ${reportType === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-auto">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'custom', label: 'Custom Range' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setReportsFilterType(id)}
                  className={`flex items-center justify-center px-2 sm:px-4 py-2.5 rounded-lg text-[11px] sm:text-sm font-bold transition-all ${reportsFilterType === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                >
                  <span className="whitespace-nowrap leading-tight sm:leading-normal">{label}</span>
                </button>
              ))}
            </div>

            {reportsFilterType === 'monthly' && (
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Year</label>
                  <div className="flex-1 sm:flex-none w-full sm:w-[120px]">
                    <CustomSelect
                      value={reportsSelectedYear}
                      onChange={e => setReportsSelectedYear(e.target.value)}
                      options={availableYears.map(y => ({ value: String(y), label: String(y) }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Month</label>
                  <div className="flex-1 sm:flex-none w-full sm:w-[150px]">
                    <CustomSelect
                      value={reportsSelectedMonthNum}
                      onChange={e => setReportsSelectedMonthNum(e.target.value)}
                      options={months.map(m => ({ value: m.value, label: m.label }))}
                    />
                  </div>
                </div>
                {(() => {
                  const { startStr, endStr } = getReportsCompanyMonthRange(reportsSelectedYear, reportsSelectedMonthNum);
                  const format = (s) => {
                    const [y, m, d] = s.split('-');
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  };
                  return (
                    <div className="text-xs text-slate-500 font-semibold bg-indigo-50/50 dark:bg-indigo-900/30 px-3 py-2 rounded-xl border border-indigo-100/30 w-full sm:w-auto text-center sm:text-left">
                      🗓️ Period: <strong className="text-indigo-700 dark:text-indigo-400">{format(startStr)} - {format(endStr)}</strong>
                    </div>
                  );
                })()}
              </div>
            )}

            {reportsFilterType === 'weekly' && (
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Select Day</label>
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <button
                      type="button"
                      onClick={handlePrevWeek}
                      className="px-2.5 py-2 border border-border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer shadow-sm text-xs font-bold"
                    >
                      ←
                    </button>
                    <input
                      type="date"
                      value={reportsSelectedWeekDate}
                      onChange={e => setReportsSelectedWeekDate(e.target.value)}
                      className="text-xs sm:text-sm border border-border dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="px-2.5 py-2 border border-border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer shadow-sm text-xs font-bold"
                    >
                      →
                    </button>
                  </div>
                </div>
                {(() => {
                  const { mondayStr, sundayStr } = getReportsWeekRange(reportsSelectedWeekDate);
                  const format = (s) => {
                    const [y, m, d] = s.split('-');
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };
                  return (
                    <div className="text-xs text-slate-500 font-semibold bg-indigo-50/50 dark:bg-indigo-900/30 px-3 py-2 rounded-xl border border-indigo-100/30 w-full sm:w-auto text-center sm:text-left">
                      🗓️ Period: <strong className="text-indigo-700 dark:text-indigo-400">{format(mondayStr)} - {format(sundayStr)}</strong>
                    </div>
                  );
                })()}
              </div>
            )}

            {reportsFilterType === 'custom' && (
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">From</label>
                  <input
                    type="date"
                    value={reportsCustomStartDate}
                    onChange={e => setReportsCustomStartDate(e.target.value)}
                    className="text-xs sm:text-sm border border-border dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer flex-1"
                  />
                </div>
                <span className="text-slate-300 dark:text-slate-500 hidden sm:inline">-</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">To</label>
                  <input
                    type="date"
                    value={reportsCustomEndDate}
                    onChange={e => setReportsCustomEndDate(e.target.value)}
                    className="text-xs sm:text-sm border border-border dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer flex-1"
                  />
                </div>
              </div>
            )}

            {/* Individual Employee Filter */}
            <div className="flex items-center gap-2 md:pl-3 md:border-l border-slate-200 dark:border-slate-700 min-w-0 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0 w-full md:w-auto">
              <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Employee</label>
              <div className="flex-1 md:flex-none w-full md:w-auto min-w-[160px]">
                <CustomSelect
                  value={selectedEmployeeFilter}
                  onChange={e => setSelectedEmployeeFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Employees' },
                    ...(employeesList || []).map(emp => ({ value: emp.id, label: emp.name }))
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: dynamicSummary.totalEmployees ?? filteredEmployeesList.length, sub: `${dynamicSummary.activeEmployees ?? filteredEmployeesList.filter((e) => e.status === 'active').length} active` },
          { label: 'Total Hours', value: `${(dynamicSummary.totalHours ?? totalHours).toFixed(0)}h`, sub: selectedEmployeeFilter === 'all' ? 'All employees' : 'Selected employee' },
          { label: 'Leave Days Used', value: dynamicSummary.leaveDaysUsed ?? filteredLeavesList.filter((l) => l.status === 'approved').reduce((s, l) => s + l.days, 0), sub: 'Approved leaves' },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
            <div className="relative z-10">
              <div className="text-slate-800 dark:text-slate-100 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.75rem' }}>{s.value}</div>
              <div className="text-slate-700 dark:text-slate-300 text-sm font-bold">{s.label}</div>
              <div className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {reportType === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Weekly Attendance Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyAttendanceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="onLeave" name="On Leave" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Monthly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#4338ca" strokeWidth={2} dot={{ fill: '#4338ca', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Employee Attendance Report</h3>
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="overflow-auto max-h-[600px] border border-slate-100 rounded-xl relative cursor-grab select-none"
            >
              <table className="w-full text-sm border-collapse">
                <thead className="z-10">
                  <tr className="border-b border-border bg-white dark:bg-slate-900/50">
                    {selectedEmployeeFilter !== 'all' ? (
                      ['Date', 'Check In', 'Check Out', 'Meal Break', 'Tea Break', 'Total Hours', 'Extra Hours', 'Less Hours', 'Status'].map((h, i) => (
                        <th key={h} className={`sticky top-0 text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap bg-white dark:bg-slate-900/90 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-none ${i === 0 ? 'min-w-[200px]' : ''}`}>{h}</th>
                      ))
                    ) : (
                      ['Employee', 'Department', 'Present', 'Meal Break', 'Tea Break', 'Total Hours', 'Extra Hours', 'Less Hours'].map((h, i) => (
                        <th key={h} className={`sticky top-0 text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap bg-white dark:bg-slate-900/90 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-none ${i === 0 ? 'min-w-[200px]' : ''}`}>{h}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedEmployeeFilter !== 'all' ? (
                    filteredEmployeeAttendanceData.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-500">No attendance records found for this period.</td>
                      </tr>
                    ) : (
                      filteredEmployeeAttendanceData.map((a) => (
                        <tr key={a._id || a.id} className="group hover:bg-slate-50/50">
                          <td className="py-3 px-4 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap min-w-[200px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.date}</td>
                          <td className="py-3 px-4 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {a.checkIn ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">date: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{a.date}</span></span>
                                <span className="text-xs text-slate-400 uppercase tracking-wider">time: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{a.checkIn}</span></span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {a.checkOut ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">date: <span className="text-purple-600 dark:text-purple-400 font-bold">{a.checkOutDate || a.date}</span></span>
                                <span className="text-xs text-slate-400 uppercase tracking-wider">time: <span className="text-purple-600 dark:text-purple-400 font-bold">{a.checkOut}</span></span>
                              </div>
                            ) : '—'}
                          </td>
                          <td
                            className="py-3 px-4 text-amber-600 font-medium cursor-pointer hover:text-amber-700 hover:underline transition-colors"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            onClick={(e) => handleBreakClick(e, 'meal', a.breaks)}
                          >
                            {formatMin(a.breakMinutes || 0)}
                          </td>
                          <td
                            className="py-3 px-4 text-teal-600 font-medium cursor-pointer hover:text-teal-700 hover:underline transition-colors"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            onClick={(e) => handleBreakClick(e, 'tea', a.breaks)}
                          >
                            {formatMin(
                              (a.breaks || []).filter(b => b.type === 'tea').reduce((acc, b) => {
                                if (b.start && b.end) {
                                  const s = b.start.split(':').map(Number);
                                  const e = b.end.split(':').map(Number);
                                  let inS = s[0] * 3600 + s[1] * 60 + s[2];
                                  let outS = e[0] * 3600 + e[1] * 60 + e[2];
                                  if (outS < inS) outS += 86400;
                                  return acc + Math.round((outS - inS) / 60);
                                }
                                return acc;
                              }, 0)
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatHrMin(a.totalHours || 0)}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.extraHours > 0 ? `+${formatHrMin(a.extraHours)}` : '—'}</td>
                          <td className="py-3 px-4 text-red-500 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.lessHours > 0 ? `${formatHrMin(a.lessHours)}` : '—'}</td>
                          <td className="py-3 px-4 capitalize">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${a.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                              a.status === 'absent' ? 'bg-red-50 text-red-700' :
                                a.status === 'late' ? 'bg-amber-50 text-amber-700' :
                                  a.status.startsWith('on leave') ? 'bg-blue-50 text-blue-700' :
                                    'bg-slate-100 text-slate-700'
                              }`}>{a.status}</span>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredEmployeesList.map((emp) => {
                      const stats = getEmployeeStats(emp.id);
                      return (
                        <tr key={emp.id} className="group hover:bg-slate-50/50">
                          <td className="py-3 px-4 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0 overflow-hidden">
                                {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                                  <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                                )}
                              </div>
                              <FormatMultilineName name={emp.name} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{emp.department}</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold cursor-pointer hover:text-emerald-700 hover:underline transition-colors" style={{ fontFamily: 'JetBrains Mono, monospace' }} onClick={() => handlePresentClick(emp)}>{stats.present}</td>
                          <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatMin(stats.mealBreakMinutes)}</td>
                          <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatMin(stats.teaBreakMinutes)}</td>
                          <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatHrMin(stats.hours)}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stats.extraHours > 0 ? `+${formatHrMin(stats.extraHours)}` : '—'}</td>
                          <td className="py-3 px-4 text-red-500 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stats.lessHours > 0 ? `${formatHrMin(stats.lessHours)}` : '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Leave by Type</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 10, right: 35, bottom: 10, left: 35 }}>
                <Pie
                  data={leaveTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  label={renderLeaveTypeLabel}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {leaveTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2.5 mt-3 justify-center">
              {leaveTypeData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.name}:</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Leave Requests Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Requests', value: leavesList.length, color: 'text-slate-700' },
                { label: 'Approved', value: leavesList.filter((l) => l.status === 'approved').length, color: 'text-emerald-600' },
                { label: 'Rejected', value: leavesList.filter((l) => l.status === 'rejected').length, color: 'text-red-500' },
                { label: 'Pending', value: leavesList.filter((l) => l.status === 'pending').length, color: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-slate-500 text-sm">{s.label}</span>
                  <span className={`font-semibold ${s.color}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Leave Request Details</h3>
            <div
              ref={leaveContainerRef}
              onMouseDown={handleLeaveMouseDown}
              onMouseLeave={handleLeaveMouseLeave}
              onMouseUp={handleLeaveMouseUp}
              onMouseMove={handleLeaveMouseMove}
              className="overflow-auto max-h-[600px] border border-slate-100 rounded-xl relative cursor-grab select-none"
            >
              <table className="w-full text-sm border-collapse">
                <thead className="z-30">
                  <tr className="border-b border-border bg-white dark:bg-slate-900/50">
                    {['Employee', 'Dept', 'Type', 'From', 'To', 'Days', 'Status', 'Applied'].map((h, i) => (
                      <th key={h} className={`sticky top-0 text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap bg-white dark:bg-slate-900/90 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-none ${i === 0 ? 'min-w-[200px]' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeavesList.map((l) => {
                    const sc = { approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-600', pending: 'bg-amber-50 text-amber-700' };
                    return (
                      <tr key={l.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 min-w-[200px]">
                          <FormatMultilineName name={l.employeeName} />
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{l.department}</td>
                        <td className="py-2.5 px-4 capitalize text-slate-500 whitespace-nowrap">{l.type}</td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{l.startDate}</td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{l.endDate}</td>
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{l.days}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[l.status] || 'bg-slate-50'}`}>{l.status}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{l.appliedOn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'summary' && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-4">Employee Work Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Employee', 'Company', 'Department', 'Position', 'Join Date', 'Status'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployeesList.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold overflow-hidden">
                          {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                            <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                          )}
                        </div>
                        <div className="text-slate-700 font-medium whitespace-nowrap">
                          <FormatMultilineName name={emp.name} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{emp.company}</td>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{emp.department}</td>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{emp.position}</td>
                    <td className="py-3 pr-4 text-slate-400 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{emp.joinDate}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{emp.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Present Details Modal */}
      {selectedPresentDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/50 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                  {selectedPresentDetails.emp.avatar && selectedPresentDetails.emp.avatar.startsWith('data:image/') ? (
                    <img src={selectedPresentDetails.emp.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedPresentDetails.emp.avatar || selectedPresentDetails.emp.name[0]
                  )}
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-lg">{selectedPresentDetails.emp.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                    <p><span className="font-semibold text-slate-600">Dept:</span> {selectedPresentDetails.emp.department || 'N/A'}</p>
                    <p className="hidden sm:block text-slate-300">•</p>
                    <p><span className="font-semibold text-slate-600">Email:</span> {selectedPresentDetails.emp.email || 'N/A'}</p>
                    <p className="hidden sm:block text-slate-300">•</p>
                    <p><span className="font-semibold text-slate-600">Phone:</span> {selectedPresentDetails.emp.phone || 'N/A'}</p>
                    <p className="hidden sm:block text-slate-300">•</p>
                    <p className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedPresentDetails.records.length} Days Present</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPresentDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    {['Date', 'Check In', 'Check Out', 'Meal Break', 'Tea Break', 'Net Hours', 'Extra Hours', 'Less Hours'].map((h) => (
                      <th key={h} className="text-left text-slate-500 font-semibold py-3 px-4 text-xs tracking-wider uppercase whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedPresentDetails.records.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-800 font-bold whitespace-nowrap">{a.date}</td>
                      <td className="py-3 px-4 text-indigo-600 font-bold whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {a.checkIn ? (
                          <div className="flex flex-col gap-0.5 font-normal">
                            <span className="text-xs text-slate-400 uppercase tracking-wider">date: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{a.date}</span></span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">time: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{a.checkIn}</span></span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-purple-600 font-bold whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {a.checkOut ? (
                          <div className="flex flex-col gap-0.5 font-normal">
                            <span className="text-xs text-slate-400 uppercase tracking-wider">date: <span className="text-purple-600 dark:text-purple-400 font-bold">{a.checkOutDate || a.date}</span></span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">time: <span className="text-purple-600 dark:text-purple-400 font-bold">{a.checkOut}</span></span>
                          </div>
                        ) : '—'}
                      </td>
                      <td
                        className="py-3 px-4 text-amber-600 font-medium cursor-pointer hover:text-amber-700 hover:underline transition-colors"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        onClick={(e) => handleBreakClick(e, 'meal', a.breaks)}
                      >
                        {formatMin(a.breakMinutes || 0)}
                      </td>
                      <td
                        className="py-3 px-4 text-teal-600 font-medium cursor-pointer hover:text-teal-700 hover:underline transition-colors"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        onClick={(e) => handleBreakClick(e, 'tea', a.breaks)}
                      >
                        {formatMin(
                          (a.breaks || []).filter(b => b.type === 'tea').reduce((acc, b) => {
                            if (b.start && b.end) {
                              const s = b.start.split(':').map(Number);
                              const e = b.end.split(':').map(Number);
                              let inS = s[0] * 3600 + s[1] * 60 + s[2];
                              let outS = e[0] * 3600 + e[1] * 60 + e[2];
                              if (outS < inS) outS += 86400;
                              return acc + Math.round((outS - inS) / 60);
                            }
                            return acc;
                          }, 0)
                        )}
                      </td>
                      <td className="py-3 px-4 text-blue-600 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatHrMin(a.totalHours || 0)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.extraHours > 0 ? `+${formatHrMin(a.extraHours)}` : '—'}</td>
                      <td className="py-3 px-4 text-rose-500 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.lessHours > 0 ? `${formatHrMin(a.lessHours)}` : '—'}</td>
                    </tr>
                  ))}
                  {selectedPresentDetails.records.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-500">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPresentDetails(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Break Popover Overlay and Modal */}
      {breakPopover && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setBreakPopover(null)} />
          <div
            className="fixed z-[110] bg-[#fdf8ec] border border-[#ece0cc] rounded-2xl shadow-xl px-5 pt-5 pb-3 min-w-[240px] animate-in fade-in zoom-in-95 duration-200"
            style={{ left: breakPopover.x, ...breakPopover.yStyle }}
          >
            <div className="flex items-center gap-2 text-[#db7706] font-bold uppercase tracking-wider text-[11px] mb-3">
              {breakPopover.type === 'meal' ? (
                <Utensils className="w-[14px] h-[14px] stroke-[2.5]" />
              ) : (
                <Coffee className="w-[14px] h-[14px] stroke-[2.5]" />
              )}
              <span>{breakPopover.type === 'meal' ? 'Meal Break' : 'Tea Break'}</span>
            </div>

            <div className="text-[#78350f] font-bold text-[19px] mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {breakPopover.count}-{breakPopover.total}
            </div>

            <div className="space-y-2.5">
              {breakPopover.breaks.map((b, idx) => {
                const suffix = ['st', 'nd', 'rd'][idx] || 'th';
                const name = breakPopover.type === 'meal' ? 'meal' : 'tea';
                return (
                  <div key={idx} className="flex items-center gap-2.5 text-[#b45309] font-medium text-[13px]">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#f59e0b]"></div>
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>
                      {idx + 1}{suffix} {name}: {b.start} - {b.end}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
