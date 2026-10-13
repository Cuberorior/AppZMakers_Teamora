import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faq from './models/Faq.js';

dotenv.config();

const employeeFaqs = [
  { question: "I forgot my password. What should I do?", answer: "Click the Forgot Password link on the login page and follow the instructions to reset your password." },
  { question: "How is my password generated?", answer: "A temporary password is automatically generated when your account is created. You should change it after your first login if the system allows." },
  { question: "Can I change my password?", answer: "Yes. You can change your password from your profile or account settings if the feature is available." },
  { question: "Can I check in more than once a day?", answer: "No. The system allows only one check-in and one check-out per working day unless otherwise configured." },
  { question: "What happens if I forget to check in or check out?", answer: "Contact your HR department. HR or the Super Admin can add missed attendance records if approved." },
  { question: "If I forget to check in for the day, what should I do?", answer: "Only HR and Super Admin users have permission to add missed attendance." },
  { question: "If I need to work after checking out for the day, what should I do?", answer: "Working hours are calculated based on your check-in time, check-out time, and recorded break durations. Contact HR if additional work needs to be recorded." },
  { question: "What happens if I forget to click the End Tea Break button?", answer: "Click the Tea Break button before leaving your workstation and end the break when you return. If you forget, contact HR if a correction is required." },
  { question: "Why is my Tea Break button not enabled?", answer: "Verify that you are checked in and not already on a break. If the issue continues, contact HR or the System Administrator." },
  { question: "Can I cancel a leave request?", answer: "Yes. You can cancel a pending leave request before it is approved." },
  { question: "Which file formats are supported for CV upload?", answer: "PDF, DOC, and DOCX formats are generally supported, depending on system configuration." },
  { question: "Is there a file size limit for CV uploads?", answer: "Yes. The maximum file size depends on the system settings." },
  { question: "What should I do if I receive an \"Access Denied\" message?", answer: "Contact your HR department or System Administrator to verify your permissions." },
  { question: "How do I log out?", answer: "Click your profile icon and select Logout to securely end your session." },
  { question: "What happens if my session expires?", answer: "You will be automatically logged out and redirected to the login page for security reasons." },
  { question: "Can I use the system on my mobile phone?", answer: "Yes, if the application supports responsive web design or has a mobile version." },
  { question: "Who should I contact if I experience technical issues?", answer: "Contact your HR department, System Administrator, or IT Support team for assistance." },
  { question: "Why am I unable to log in?", answer: "Ensure your email, password, and selected role are correct. If the issue continues, contact your administrator." },
  { question: "What should I do if I don't receive the OTP?", answer: "Verify your registered mobile number and request that the OTP be resent." },
  { question: "Can I use my old password after changing it?", answer: "No, depending on your organization's password policy." },
  { question: "Why am I automatically logged out?", answer: "Your session expired due to inactivity for security reasons." },
  { question: "Can I update my phone number?", answer: "Yes, if profile editing is permitted." },
  { question: "What time should I check in?", answer: "Follow your organization's assigned working hours." },
  { question: "How can I change my shift?", answer: "You do not have permission to change your shift. Only HR or the Super Admin can modify it." },
  { question: "What happens if the internet disconnects during check-in?", answer: "Verify your attendance history after reconnecting and try again if necessary. If the check-in was not recorded, contact HR." },
  { question: "Can working hours be modified?", answer: "Yes, but only by authorized administrators." },
  { question: "What should I do if I suspect unauthorized access?", answer: "Change your password immediately and contact your System Administrator." },
  { question: "Does the system support mobile devices?", answer: "Yes, if the application is mobile responsive." },
  { question: "Who should I contact for login issues?", answer: "Contact HR or the System Administrator." },
  { question: "Can HR view my uploaded CV?", answer: "Yes. HR can view your uploaded CV as part of the recruitment or employee management process." },
  { question: "Why did my file or image upload fail?", answer: "The file may be too large or in an unsupported format." },
  { question: "Can I cancel my leave request?", answer: "Yes, as long as it has not yet been approved." },
  { question: "Can I edit an approved leave request?", answer: "No. Contact HR if changes are required." },
  { question: "Can I request attendance correction?", answer: "Yes. Contact HR if changes are required" },
  { question: "Can I access the system while on leave?", answer: "Yes" },
  { question: "How can I inform my leave request even pending yet now still there is no acceptance/rejection?", answer: "Contact HR if changes are required." }
].map((faq, index) => ({ ...faq, targetRole: 'employee', order: index }));

const companyFaqs = [
  { question: "How will I receive my login credentials?", answer: "Your account is created by the System Administrator, and your login credentials are sent to your registered email address." },
  { question: "I forgot my password. What should I do?", answer: "Click the Forgot Password link on the login page and follow the instructions to reset your password securely." },
  { question: "Can I change my password?", answer: "Yes. You can change your password from the Profile or Account Settings page after logging in." },
  { question: "Why am I unable to log in?", answer: "Ensure your email address, password, and selected role are correct. Also check your internet connection. If the problem continues, contact the System Administrator." },
  { question: "What should I do if I don't receive the OTP?", answer: "Verify your registered email address or mobile number and request a new OTP. If you still do not receive it, contact the System Administrator." },
  { question: "What happens if my session expires while working?", answer: "Unsaved changes may be lost. Save your work frequently and log in again if your session expires." },
  { question: "Can I change my registered email address or phone number?", answer: "Yes, subject to your organization's policies. Contact the System Administrator if you cannot edit these details yourself." },
  { question: "How can I change my assigned employees?", answer: "Navigate to the Projects section to see all projects assigned to your organization or account." },
  { question: "Which file formats are supported for uploads?", answer: "Commonly supported formats include PDF, DOC, DOCX, XLSX, PPTX, JPG, JPEG, PNG, and ZIP files, depending on system configuration." },
  { question: "Is there a file size limit for uploads?", answer: "Yes. The maximum file size is determined by the system administrator and server configuration." },
  { question: "Why did my file upload fail?", answer: "The file may exceed the size limit, be in an unsupported format, or your internet connection may have been interrupted." },
  { question: "Can I download files shared by the project team?", answer: "Yes. You can download any document that has been shared with you and for which you have permission." },
  { question: "Can I generate or download reports?", answer: "Yes. Depending on your permissions, you can download project reports, progress summaries, and other available reports." },
  { question: "Can multiple users from my organization access the portal?", answer: "Yes. Multiple client users can be created with different permission levels, depending on your organization's requirements." },
  { question: "What should I do if I receive an \"Access Denied\" message?", answer: "Your account may not have permission to access that feature. Contact the System Administrator to verify your access rights." },
  { question: "Can I access the portal from my mobile phone or tablet?", answer: "Yes. The portal supports modern web browsers on desktop and mobile devices if responsive access is enabled." },
  { question: "What should I do if I suspect unauthorized access to my account?", answer: "Change your password immediately and notify the System Administrator so your account activity can be reviewed." },
  { question: "Who should I contact if I need assistance?", answer: "Contact your Project Manager, System Administrator, or the organization's Support Team for technical or project-related assistance." }
].map((faq, index) => ({ ...faq, targetRole: 'company', order: index }));

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    await Faq.deleteMany({});
    console.log('Cleared existing FAQs');

    await Faq.insertMany([...employeeFaqs, ...companyFaqs]);
    console.log('Successfully seeded FAQs');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding FAQs:', err);
    process.exit(1);
  }
};

seed();
