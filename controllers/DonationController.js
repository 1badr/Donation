const Donation = require('../models/DonationModel'); // تأكد من مسار الموديل
const { Client } = require('@elastic/elasticsearch');

// تأكد من صحة عنوان المضيف
const client = new Client({ node: 'http://localhost:9200' });

const searchels = async (req, res) => {
  try {
    const response = await client.info();
    res.status(200).json(response); // أعد معلومات الخادم في الاستجابة
    console.log('Elasticsearch Info:', response);
  } catch (error) {
    console.error('Connection error:', error); 
    process.exit(1);// سجل الخطأ في وحدة التحكم
    res.status(500).json({ error: error.message }); // أعد رسالة الخطأ في الاستجابة
  }
};

// تصدير الدالة لاستخدامها في مسارات أخرى
module.exports = { searchels };

// إنشاء تبرع جديد
const mongoose = require('mongoose');
const Fawn = require('fawn');

Fawn.init("mongodb://127.0.0.1:27017/donations");

// إنشاء تبرع جديد
const createDonation = async (req, res) => {
  const { sender_id, receiver_id, amount, message } = req.body;

  const donation = new Donation({ sender_id, receiver_id, amount, message });

  const task = new Fawn.Task();

  task
    .save('donations', donation)
    .run()
    .then(() => res.status(201).json(donation))
    .catch(err => res.status(400).json({ message: err.message }));
};

// الحصول على جميع التبرعات
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().populate('sender_id'); // يمكن إضافة populate للحصول على تفاصيل المستخدم
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// الحصول على جميع التبرعات من خلال sender_id
const getAllDonationsByID = async (req, res) => {
  const { senderId } = req.params; // استلام senderId من معلمات الطلب

  try {
    const donations = await Donation.find({ sender_id: senderId }).populate('sender_id'); // استعلام عن التبرعات بناءً على sender_id
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// البحث عن التبرعات
const search = async (req, res) => {
  try {
    // تحقق من الاتصال بـ Elasticsearch
    await client.ping();
    console.log("Connection to ES Server successful");

    // الحصول على جميع مؤشرات Wazuh
    const { body: indices } = await client.cat.indices({ format: 'json' });
    const wazuhIndices = indices
      .filter(index => index.index.startsWith(ALERTS_PREFIX)) // تأكد من تعريف ALERTS_PREFIX
      .map(index => index.index);

    console.log('Wazuh Indices:', wazuhIndices);

    const { query } = req.body; // احصل على استعلام البحث من الجسم

    const { body } = await client.search({
      index: 'donations', // تأكد من اسم الفهرس الصحيح
      body: {
        query: {
          match: { sender_id: query }, // استخدم الحقل المناسب للبحث
        },
      },
    });

    res.status(200).json(body.hits.hits); // أعد نتائج البحث
  } catch (error) {
    console.error('Error during search:', error); // سجل الخطأ في وحدة التحكم
    res.status(500).json({ error: error.message }); // أعد الخطأ في الاستجابة
  }
};

// الحصول على تبرع محدد
const getDonationById = async (req, res) => {
  try {
    const { query } = req.body; // احصل على استعلام البحث من الجسم

    const { body } = await client.search({
      index: 'donations', // تأكد من اسم الفهرس الصحيح
      body: {
        query: {
          match: { sender_id: query }, // استخدم الحقل المناسب للبحث
        },
      },
    });

    res.status(200).json(body.hits.hits); // أعد نتائج البحث
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تحديث تبرع
const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// حذف تبرع
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.status(204).send(); // لا تحتاج لإرسال محتوى
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تصدير جميع الدوال
module.exports = {
  createDonation,
  getAllDonations,
  search,
  getDonationById,
  updateDonation,
  deleteDonation,
  getAllDonationsByID,
  searchels
};