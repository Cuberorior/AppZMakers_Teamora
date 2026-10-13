import Faq from '../models/Faq.js';

export const getFaqs = async (req, res) => {
  try {
    const { targetRole } = req.query;
    const filter = targetRole ? { targetRole } : {};
    const faqs = await Faq.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(faqs);
  } catch (err) {
    console.error('Error fetching FAQs:', err);
    res.status(500).json({ error: 'Server error fetching FAQs' });
  }
};

export const createFaq = async (req, res) => {
  try {
    let { question, answer, targetRole, order } = req.body;
    if (!question || !answer || !targetRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (order !== undefined && order < 0) {
      return res.status(400).json({ error: 'Order number cannot be negative' });
    }
    
    if (order === undefined || order === null || order === '') {
      order = 0;
    }
    order = Number(order);

    // Shift existing FAQs with the same targetRole and order >= the new order
    await Faq.updateMany(
      { targetRole, order: { $gte: order } },
      { $inc: { order: 1 } }
    );

    const newFaq = new Faq({ question, answer, targetRole, order });
    await newFaq.save();
    res.status(201).json(newFaq);
  } catch (err) {
    console.error('Error creating FAQ:', err);
    res.status(500).json({ error: 'Server error creating FAQ' });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    let { question, answer, targetRole, order } = req.body;

    if (order !== undefined && order < 0) {
      return res.status(400).json({ error: 'Order number cannot be negative' });
    }

    const existingFaq = await Faq.findById(id);
    if (!existingFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    if (order === undefined || order === null || order === '') {
      order = existingFaq.order;
    }
    order = Number(order);
    
    if (targetRole === undefined) {
      targetRole = existingFaq.targetRole;
    }

    // Logic for updating order
    const oldOrder = existingFaq.order;
    const oldRole = existingFaq.targetRole;
    const newOrder = order;
    const newRole = targetRole;

    if (oldRole === newRole) {
      if (oldOrder !== newOrder) {
        if (newOrder < oldOrder) {
          // moving up
          await Faq.updateMany(
            { targetRole: newRole, order: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        } else {
          // moving down
          await Faq.updateMany(
            { targetRole: newRole, order: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { order: -1 } }
          );
        }
      }
    } else {
      // If targetRole changed, shift down the old role and shift up the new role
      await Faq.updateMany(
        { targetRole: oldRole, order: { $gt: oldOrder } },
        { $inc: { order: -1 } }
      );
      await Faq.updateMany(
        { targetRole: newRole, order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );
    }

    const updatedFaq = await Faq.findByIdAndUpdate(
      id,
      { question, answer, targetRole, order },
      { new: true }
    );
    
    res.json(updatedFaq);
  } catch (err) {
    console.error('Error updating FAQ:', err);
    res.status(500).json({ error: 'Server error updating FAQ' });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFaq = await Faq.findByIdAndDelete(id);
    if (!deletedFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    // Shift remaining FAQs to fill the gap
    await Faq.updateMany(
      { targetRole: deletedFaq.targetRole, order: { $gt: deletedFaq.order } },
      { $inc: { order: -1 } }
    );

    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('Error deleting FAQ:', err);
    res.status(500).json({ error: 'Server error deleting FAQ' });
  }
};
