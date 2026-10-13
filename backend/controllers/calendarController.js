import CompanyEvent from '../models/CompanyEvent.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Company from '../models/Company.js';
import mongoose from 'mongoose';
import {
  fetchHolidaysFromGoogle,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '../services/googleCalendarService.js';
import { syncLeaveBalance } from '../services/leaveService.js';

export const getEvents = async (req, res) => {
  console.log('getEvents called!');
  try {
    const { employeeId, companyId } = req.query;

    let country = 'Sri Lanka';
    let office = 'Colombo';
    let localFilter = {};

    if (employeeId) {
      // Find employee by legacyId or ObjectId or userId
      let query = { $or: [{ legacyId: employeeId }] };
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.$or.push({ _id: employeeId });
        query.$or.push({ userId: employeeId });
      }
      const emp = await Employee.findOne(query).select('-avatar -cvData -cvName').lean();
      if (emp) {
        country = emp.country || 'Sri Lanka';
        office = emp.office || 'Colombo';

        // If employee is assigned to a client/company, show the client's country calendar/holidays
        if (emp.companyId) {
          let compQuery = { $or: [{ legacyId: emp.companyId }] };
          if (mongoose.Types.ObjectId.isValid(emp.companyId)) {
            compQuery.$or.push({ _id: emp.companyId });
          }
          const comp = await Company.findOne(compQuery).select('-avatar').lean();
          if (comp && comp.country) {
            country = comp.country;
          }
        }
      }
      localFilter = {
        $or: [
          { targetLocation: 'all' },
          { targetLocation: 'country', targetValue: country },
          { targetLocation: 'branch', targetValue: office },
        ],
      };
    } else if (companyId) {
      // Find company by legacyId or ObjectId
      let query = { $or: [{ legacyId: companyId }] };
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        query.$or.push({ _id: companyId });
      }
      const comp = await Company.findOne(query).select('-avatar').lean();
      if (comp) {
        country = comp.country || 'Sri Lanka';
      }
      localFilter = {
        $or: [
          { targetLocation: 'all' },
          { targetLocation: 'country', targetValue: country },
        ],
      };
    } else {
      localFilter = {};
    }

    const localEvents = await CompanyEvent.find(localFilter).sort({ start: 1 }).lean();

    const mergedEvents = localEvents.map((e) => {
      const obj = e.toObject ? e.toObject() : e;
      if (!employeeId && !companyId && obj.targetLocation === 'country' && obj.targetValue) {
        obj.title = `[${obj.targetValue}] ${obj.title}`;
      }
      return obj;
    });

    if (employeeId) {
      let query = { $or: [{ legacyId: employeeId }] };
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.$or.push({ _id: employeeId });
        query.$or.push({ userId: employeeId });
      }
      const emp = await Employee.findOne(query).select('-avatar -cvData -cvName').lean();
      if (emp) {
        const empId = emp.legacyId || emp._id.toString();
        const approvedLeaves = await LeaveRequest.find({
          employeeId: empId,
          status: 'approved'
        }).lean();
        approvedLeaves.forEach((leave) => {
          mergedEvents.push({
            id: leave._id,
            title: `Leave: ${leave.employeeName || 'Employee'} (${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)})`,
            description: `Approved ${leave.type} leave. Reason: ${leave.reason || 'None'}`,
            start: leave.startDate,
            end: leave.endDate,
            type: `${leave.type}-leave`,
            targetLocation: 'country',
            targetValue: country
          });
        });
      }
    } else if (companyId) {
      // Find company and fetch leaves of all its employees
      let query = { $or: [{ legacyId: companyId }] };
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        query.$or.push({ _id: companyId });
      }
      const comp = await Company.findOne(query).select('-avatar').lean();
      if (comp) {
        const compId = comp.legacyId || comp._id.toString();
        const employeeQuery = comp.isTeam ? { teamId: compId } : { companyId: compId };
        const employees = await Employee.find(employeeQuery).select('-avatar -cvData -cvName').lean();
        const empIds = employees.map((emp) => emp.legacyId || emp._id.toString());

        const approvedLeaves = await LeaveRequest.find({
          employeeId: { $in: empIds },
          status: 'approved'
        }).lean();

        approvedLeaves.forEach((leave) => {
          mergedEvents.push({
            id: leave._id,
            title: `Leave: ${leave.employeeName} (${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)})`,
            description: `Approved ${leave.type} leave. Reason: ${leave.reason || 'None'}`,
            start: leave.startDate,
            end: leave.endDate,
            type: `${leave.type}-leave`,
            targetLocation: 'country',
            targetValue: country
          });
        });
      }
    } else {
      const approvedLeaves = await LeaveRequest.find({
        status: 'approved'
      }).lean();
      approvedLeaves.forEach((leave) => {
        mergedEvents.push({
          id: leave._id,
          title: `Leave: ${leave.employeeName} (${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)})`,
          description: `Approved ${leave.type} leave. Reason: ${leave.reason || 'None'}`,
          start: leave.startDate,
          end: leave.endDate,
          type: `${leave.type}-leave`,
          targetLocation: 'all',
          targetValue: 'all'
        });
      });
    }

    // --- Generate Birthdays and Work Anniversaries ---
    let targetEmployees = [];
    if (employeeId) {
      let query = { $or: [{ legacyId: employeeId }] };
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.$or.push({ _id: employeeId });
        query.$or.push({ userId: employeeId });
      }
      const emp = await Employee.findOne(query).select('-avatar -cvData -cvName').lean();
      if (emp) {
        if (emp.companyId) {
          targetEmployees = await Employee.find({ companyId: emp.companyId, status: 'active' }).select('-avatar -cvData -cvName').lean();
        } else {
          targetEmployees = await Employee.find({ status: 'active' }).select('-avatar -cvData -cvName').lean();
        }
      }
    } else if (companyId) {
      let query = { $or: [{ legacyId: companyId }] };
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        query.$or.push({ _id: companyId });
      }
      const comp = await Company.findOne(query).select('-avatar').lean();
      if (comp) {
        const compId = comp.legacyId || comp._id.toString();
        const employeeQuery = comp.isTeam ? { teamId: compId, status: 'active' } : { companyId: compId, status: 'active' };
        targetEmployees = await Employee.find(employeeQuery).select('-avatar -cvData -cvName').lean();
      }
    } else {
      // HR/Admin sees all active employees
      targetEmployees = await Employee.find({ status: 'active' }).select('-avatar -cvData -cvName').lean();
    }

    const currentYear = new Date().getFullYear();
    const eventYears = [currentYear - 1, currentYear, currentYear + 1];

    targetEmployees.forEach(emp => {
      // Generate Birthdays
      if (emp.dateOfBirth) {
        const [, month, day] = emp.dateOfBirth.split('-');
        if (month && day) {
          eventYears.forEach(year => {
            mergedEvents.push({
              id: `bday-${emp._id}-${year}`,
              title: `🎂 ${emp.name}'s Birthday`,
              description: `Wish ${emp.name} a Happy Birthday!`,
              start: `${year}-${month}-${day}`,
              end: `${year}-${month}-${day}`,
              type: `birthday`,
              targetLocation: 'all',
              targetValue: 'all',
              allDay: true,
            });
          });
        }
      }

      // Generate Anniversaries
      if (emp.joinDate) {
        const [joinYearStr, month, day] = emp.joinDate.split('-');
        const joinYear = parseInt(joinYearStr, 10);
        if (!isNaN(joinYear) && month && day) {
          eventYears.forEach(year => {
            const diff = year - joinYear;
            if (diff > 0) {
              let suffix = 'th';
              if (diff % 10 === 1 && diff !== 11) suffix = 'st';
              else if (diff % 10 === 2 && diff !== 12) suffix = 'nd';
              else if (diff % 10 === 3 && diff !== 13) suffix = 'rd';

              mergedEvents.push({
                id: `annv-${emp._id}-${year}`,
                title: `🎉 ${emp.name}'s ${diff}${suffix} Work Anniversary`,
                description: `Celebrate ${emp.name}'s ${diff}${suffix} year with us!`,
                start: `${year}-${month}-${day}`,
                end: `${year}-${month}-${day}`,
                type: `anniversary`,
                targetLocation: 'all',
                targetValue: 'all',
                allDay: true,
              });
            }
          });
        }
      }
    });
    // --- End Generate Birthdays and Work Anniversaries ---

    let googleHolidays = [];
    try {
      if (employeeId || companyId) {
        const hols = await fetchHolidaysFromGoogle(country);
        googleHolidays = hols.map(h => ({
          ...h,
          targetLocation: 'country',
          targetValue: country
        }));
      } else {
        const countriesToFetch = ['Sri Lanka', 'USA', 'UK', 'Canada', 'Australia'];
        const results = await Promise.all(
          countriesToFetch.map(async (c) => {
            try {
              const hols = await fetchHolidaysFromGoogle(c);
              return hols.map(h => ({
                ...h,
                title: `[${c}] ${h.title}`,
                targetLocation: 'country',
                targetValue: c
              }));
            } catch (err) {
              console.warn(`Could not fetch dynamic holidays for ${c}:`, err.message);
              return [];
            }
          })
        );
        googleHolidays = results.flat();
      }
    } catch (err) {
      console.warn(`Could not fetch Google Calendar holidays:`, err.message);
    }

    googleHolidays.forEach((holiday) => {
      const isDuplicate = mergedEvents.some(
        (le) =>
          le.googleEventId === holiday.googleEventId ||
          (le.title === holiday.title && le.start === holiday.start)
      );
      if (!isDuplicate) {
        mergedEvents.push(holiday);
      }
    });

    res.json(mergedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateCalendarEvent = (title, description, isNew = false, start = null, end = null) => {
  if (title !== undefined) {
    const titleText = title.trim();
    if (!titleText) {
      return 'Title is required.';
    }
    const titleWords = titleText.split(/\s+/).filter(Boolean).length;
    if (titleWords > 20) {
      return 'Title word limit is 20 words.';
    }
    if (titleText.length > 100) {
      return 'Title cannot exceed 100 characters.';
    }
    const hasLongWord = titleText.split(/\s+/).some(word => word.length > 20);
    if (hasLongWord) {
      return 'Individual words in the title cannot exceed 20 characters.';
    }
  }

  if (description !== undefined) {
    const descText = description.trim();
    const descWords = descText.split(/\s+/).filter(Boolean).length;
    if (descWords > 50) {
      return 'Description word limit is 50 words.';
    }
    if (descText.length > 300) {
      return 'Description cannot exceed 300 characters.';
    }
    const hasLongWord = descText.split(/\s+/).some(word => word.length > 25);
    if (hasLongWord) {
      return 'Individual words in the description cannot exceed 25 characters.';
    }
  }

  if (isNew) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (start && start < todayStr) {
      return 'Start date cannot be in the past.';
    }
    if (end && end < todayStr) {
      return 'End date cannot be in the past.';
    }
  }

  return null;
};

/**
 * Create a new event
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, start, end, type, targetLocation, targetValue, createdBy } = req.body;

    const errorMsg = validateCalendarEvent(title, description, true, start, end);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    if (!type) {
      return res.status(400).json({ error: 'Please select an event type.' });
    }

    const event = new CompanyEvent({
      title,
      description,
      start,
      end,
      type,
      targetLocation,
      targetValue,
      createdBy: createdBy || 'HR Manager',
    });

    const googleEventId = await createGoogleCalendarEvent(event, targetLocation === 'country' ? targetValue : 'Global');
    event.googleEventId = googleEventId;

    await event.save();

    res.status(201).json({
      message: 'Calendar event created successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, type, targetLocation, targetValue } = req.body;

    const errorMsg = validateCalendarEvent(title, description, false);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const event = await CompanyEvent.findById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (start !== undefined) event.start = start;
    if (end !== undefined) event.end = end;
    if (type !== undefined) event.type = type;
    if (targetLocation !== undefined) event.targetLocation = targetLocation;
    if (targetValue !== undefined) event.targetValue = targetValue;

    if (event.googleEventId) {
      await updateGoogleCalendarEvent(event.googleEventId, event, event.targetLocation === 'country' ? event.targetValue : 'Global');
    }

    await event.save();

    res.json({
      message: 'Calendar event updated successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    let event;
    try {
      event = await CompanyEvent.findById(id);
    } catch (err) {}

    if (!event) {
      let leave;
      try {
        leave = await LeaveRequest.findById(id);
      } catch(err) {}

      if (leave) {
        await LeaveRequest.findByIdAndDelete(id);
        let query = { $or: [{ legacyId: leave.employeeId }] };
        if (mongoose.Types.ObjectId.isValid(leave.employeeId)) {
          query.$or.push({ _id: leave.employeeId });
        }
        const emp = await Employee.findOne(query);
        if (emp) {
            await syncLeaveBalance(leave.employeeId, emp.joinDate);
        }
        return res.json({ message: 'Leave deleted from calendar successfully' });
      }
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.googleEventId) {
      await deleteGoogleCalendarEvent(event.googleEventId, event.targetLocation === 'country' ? event.targetValue : 'Global');
    }

    await CompanyEvent.findByIdAndDelete(id);

    res.json({
      message: 'Calendar event deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





