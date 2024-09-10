const express = require('express');
const app = express();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const port = 3000;
app.use(express.json());
const Stripe = require('stripe');
const Donation = require('./models/DonationModel');
const  Account = require('./models/account'); // تأكد من مسار النموذج الصحيح
const stripe = Stripe('sk_test_51Px1DPGUfejzhRFa7wgzxlWoUTfnUtjwdOc6WokLjpFar4VbJu8WX0xnJMQqJBAiJ2XfM14W9rXMc0Mc94KP7Cvu00ppYY1gjj'); // أدخل مفتاح السر الخاص بك هنا
const http = require('http'); // تأكد من استيراد وحدة http

const axios = require('axios'); // تأكد من استيراد axios هنا

const option = {
  definition: {
  openapi: '3.0.0',
  info: {
    title: 'Donations',
    version: '1.0.0',
    description: 'API for managing trip plans',
  },
  servers: [
    {
      url: 'http://localhost:3000', // Update this with your server URL
    },
  ],
},
apis: ['./routes/*.js'],
}
const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/donations", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const nodemailer = require("nodemailer");
const cors = require('cors');



app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

const authRoute = require("./routes/authRoutes");
const DonationRoutes = require("./routes/DonationRoutes");

const swaggerJSDoc = require('swagger-jsdoc');
const account = require('./models/account');
app.use('/user',authRoute);
app.use('/donation',DonationRoutes);

app.post('/create-account', async (req, res) => {
  const { accountId, initialBalance } = req.body;

  try {
    const existingAccount = await accounts.findOne({ accountId });
    if (existingAccount) {
      return res.status(400).send({ error: 'Account already exists' });
    }

    const account = new Account({ accountId, balance: initialBalance });
    await account.save();
    res.status(201).send(account);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// نقطة نهاية لإنشاء الدفع
app.post('/create-payment-intent', async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  try {
    // استعلام عن الحسابات
    const fromAccountData = await Account.findOne({ accountId: fromAccount });
    const toAccountData = await Account.findOne({ accountId: toAccount });

    // التأكد من وجود الحسابات
    if (!fromAccountData) {
      return res.status(404).send({ error: 'From account not found' });
    }
    
    if (!toAccountData) {
      return res.status(404).send({ error: 'To account not found' });
    }

    // تحقق من أن المبلغ متاح في الحساب
    if (fromAccountData.balance < amount) {
      return res.status(400).send({ error: 'Insufficient funds' });
    }

    // إنشاء Intent للدفع
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // المبلغ بالسنتمات
      currency: 'usd',
    });

    // تحديث الأرصدة
    fromAccountData.balance -= amount;
    toAccountData.balance += amount;

    // حفظ التغييرات في كلا الحسابين
    await fromAccountData.save();
    await toAccountData.save();

    // تخزين العملية في قاعدة البيانات
    const donation = new Donation({ fromAccount, toAccount, amount });
    await donation.save();

    // إرسال client secret
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// وظيفة لاسترجاع رصيد الحساب (تأكد من تنفيذها حسب احتياجاتك)
async function getAccountBalance(accountId) {
  // هنا يمكنك إضافة منطق لاسترجاع رصيد الحساب من قاعدة البيانات
  // كمثال بسيط، يمكنك استخدام كود ثابت:
  const balances = {
    'account1': 1000, // 10.00 دولار
    'account2': 500,  // 5.00 دولار
  };
  return balances[accountId] || 0; // إرجاع الرصيد أو 0 إذا لم يكن الحساب موجودًا
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const WEAVY_KEY = 'wys_GMzJD2NtXn6lkr8MvUDf73lDsbk2cu0DbQ6b';
app.post('/create-chat', (req, res) => {
  const { userId, chatName } = req.body;

  // إعداد خيارات الطلب
  const optionsGet = {
      hostname: 'api.weavy.io', // استخدم hostname
      port: 443, // استخدم 443 للبروتوكول HTTPS
      path: '/chats',
      method: 'POST',
      headers: {
          Authorization: `Bearer ${WEAVY_KEY}`,
          'Content-Type': 'application/json'
      }
  };

  // إنشاء الطلب
  const request = https.request(optionsGet, (response) => {
      let data = '';

      // استقبال البيانات من الاستجابة
      response.on('data', (chunk) => {
          data += chunk;
      });

      // عندما يتم الانتهاء من الاستجابة
      response.on('end', () => {
          res.status(201).json(JSON.parse(data));
      });
  });

  // التعامل مع الأخطاء
  request.on('error', (error) => {
      res.status(500).json({ error: error.message });
  });

  // إرسال البيانات إلى Weavy API
  request.write(JSON.stringify({
      id: 'my-chat',
      name: chatName,
  }));

  // إنهاء الطلب
  request.end();
});

const spacs = swaggerJSDoc(option)
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(spacs)
  )

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});