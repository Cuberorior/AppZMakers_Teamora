import Company from '../models/Company.js';
import Employee from '../models/Employee.js';

export const syncCompanyEmployeeCounts = async () => {
  const companies = await Company.find();
  if (companies.length === 0) return;
  
  // Calculate counts in parallel
  const counts = await Promise.all(
    companies.map(async (company) => {
      const cid = company.legacyId || company._id.toString();
      const query = company.isTeam ? { teamId: cid } : { companyId: cid };
      const count = await Employee.countDocuments(query);
      return { _id: company._id, count };
    })
  );

  // Use bulkWrite for updating all companies in a single operation
  const bulkOps = counts.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { employeeCount: item.count } },
    },
  }));

  await Company.bulkWrite(bulkOps);
};
