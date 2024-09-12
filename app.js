const express = require('express');
const app = express();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const port = 3000;
app.use(express.json());
const Stripe = require('stripe');
const Donation = require('./models/DonationModel');
const  Account = require('./models/account'); 
const stripe = Stripe('sk_test_51Px1DPGUfejzhRFa7wgzxlWoUTfnUtjwdOc6WokLjpFar4VbJu8WX0xnJMQqJBAiJ2XfM14W9rXMc0Mc94KP7Cvu00ppYY1gjj'); // أدخل مفتاح السر الخاص بك هنا
const http = require('http'); 
const Message = require('./models/MessageModel')
const axios = require('axios'); 

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
      url: 'http://localhost:3000', 
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


app.post('/create-payment-intent', async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  try {
    const fromAccountData = await Account.findOne({ accountId: fromAccount });
    const toAccountData = await Account.findOne({ accountId: toAccount });

    if (!fromAccountData) {
      return res.status(404).send({ error: 'From account not found' });
    }
    
    if (!toAccountData) {
      return res.status(404).send({ error: 'To account not found' });
    }

    if (fromAccountData.balance < amount) {
      return res.status(400).send({ error: 'Insufficient funds' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, 
      currency: 'usd',
    });

    fromAccountData.balance -= amount;
    toAccountData.balance += amount;

    await fromAccountData.save();
    await toAccountData.save();

    const donation = new Donation({ fromAccount, toAccount, amount });
    await donation.save();

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


async function getAccountBalance(accountId) {
  
  const balances = {
    'account1': 1000,
    'account2': 500,  
  };
  return balances[accountId] || 0;
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const WEAVY_KEY = 'wys_GMzJD2NtXn6lkr8MvUDf73lDsbk2cu0DbQ6b';
app.post('/create-chat', (req, res) => {
  const { userId, chatName } = req.body;

  const optionsGet = {
      hostname: 'api.weavy.io',
      port: 443,
      path: '/chats',
      method: 'POST',
      headers: {
          Authorization: `Bearer ${WEAVY_KEY}`,
          'Content-Type': 'application/json'
      }
  };

  const request = https.request(optionsGet, (response) => {
      let data = '';

      response.on('data', (chunk) => {
          data += chunk;
      });

      response.on('end', () => {
          res.status(201).json(JSON.parse(data));
      });
  });

  request.on('error', (error) => {
      res.status(500).json({ error: error.message });
  });

  request.write(JSON.stringify({
      id: 'my-chat',
      name: chatName,
  }));

  request.end();
});

const spacs = swaggerJSDoc(option)
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(spacs)
  )


  const { Kafka } = require('kafkajs');
  
  const kafka = new Kafka({
    clientId: 'my-producer',
    brokers: ['localhost:9092']
  });
  
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: 'test-group' });
  

  const sendMessageToKafka = async (message) => {
    await producer.connect();
    await producer.send({
      topic: 'test',
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
    await producer.disconnect();
  };
  
  app.post('/messages', async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    const message = new Message({ sender_id, receiver_id, content });
  
    try {
      await message.save(); 
      await sendMessageToKafka(message); 
      res.status(201).send(message);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'test', fromBeginning: true });
  
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received message: ${message.value.toString()}`);
      },
    });
  };
  
  const startServer = async () => {
    await producer.connect();
    await runConsumer();
  
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  };
  
  startServer().catch(console.error);


