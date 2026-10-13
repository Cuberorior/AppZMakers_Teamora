import SystemSettings from '../models/SystemSettings.js';

export const getSettings = async () => {
  let settings = await SystemSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await SystemSettings.create({ key: 'default' });
  }
  const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  let modified = false;
  if (!timeRegex.test(settings.morningShiftStartTime || '')) {
    settings.morningShiftStartTime = '09:00';
    modified = true;
  }
  if (!timeRegex.test(settings.nightShiftStartTime || '')) {
    settings.nightShiftStartTime = '21:00';
    modified = true;
  }
  if (!settings.departments || settings.departments.length === 0) {
    settings.departments = [
      'Engineering',
      'Design',
      'Product',
      'Operations',
      'Analytics'
    ];
    modified = true;
  }
  if (modified) {
    await settings.save();
  }
  
  const o = settings.toObject();
  delete o.key;
  delete o._id;
  delete o.__v;
  delete o.createdAt;
  delete o.updatedAt;
  return o;
};

export const updateSettings = async (updates) => {
  const settings = await SystemSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: updates },
    { new: true, upsert: true }
  );
  const o = settings.toObject();
  delete o.key;
  delete o._id;
  delete o.__v;
  delete o.createdAt;
  delete o.updatedAt;
  return o;
};
