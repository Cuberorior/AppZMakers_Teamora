const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://thanushan1022_db_user:Arrowverse1022@cluster0.lncb67f.mongodb.net/AppzMaker?retryWrites=true&w=majority')
  .then(async () => {
    const faqSchema = new mongoose.Schema({
      targetRole: String,
      question: String,
      answer: String,
      order: Number
    });
    const Faq = mongoose.model('Faq', faqSchema);
    const faqs = await Faq.find().sort({ targetRole: 1, order: 1, createdAt: 1 });
    let employeeOrder = 0;
    let companyOrder = 0;
    for (let f of faqs) {
      if(f.targetRole === 'employee') {
        f.order = employeeOrder++;
      } else {
        f.order = companyOrder++;
      }
      await Faq.updateOne({ _id: f._id }, { $set: { order: f.order } });
    }
    console.log('Fixed orders');
    process.exit(0);
  });
