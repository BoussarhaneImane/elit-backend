require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const Order = require('./models/Order');
const User = require('./models/Order');
const authMiddleware = require('./authMiddleware');
const authRoutes = require('./authRoutes');
const authLogin = require('./authLogin')
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(bodyParser.json());
const path = require('path');

app.use('/images', express.static(path.join(__dirname, 'images')));



const products = [
  { id: 1, img: "/images/women-02.jpg", title: "Robe Évasée en Soie", price: 120 },
  { id: 2, img: "/images/women-02.jpg", title: "Blouse Élégante en Dentelle", price: 80 },
  { id: 3, img: "/images/women-03.jpg", title: "Pantalon Taille Haute", price: 90 },
  { id: 4, img: "/images/instagram-01.jpg", title: "Veste en Cuir", price: 150 },
  { id: 5, img: "/images/instagram-02.jpg", title: "Jupe Crayon", price: 70 },
  { id: 6, img: "/images/explore-image-02.jpg", title: "Cardigan Doux", price: 65 },
  { id: 7, img: "/images/baner-right-image-02.jpg", title: "Manteau Long en Laine", price: 180 },
  { id: 8, img: "/images/women-03.jpg", title: "T-shirt Basique", price: 40 },
];


// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, {
 
}).then(() => console.log('Connexion à MongoDB réussie'))
.catch(err => console.error('Erreur de connexion à MongoDB', err));

// Initialiser Nodemailer avec un transporteur
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,  // Gmail or other SMTP service
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
      user: process.env.SMTP_MAIL,   // Your email (e.g., Gmail)
      pass: process.env.SMTP_PASS,   // Your app password or actual email password
  }
});
// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  const { totalPrice } = req.body;

  if (!totalPrice || totalPrice <= 0) {
    return res.status(400).json({ error: 'Invalid total price.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route pour mettre à jour l'état de paiement
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(id, { paymentStatus }, { new: true });
    if (!order) {
      return res.status(404).send('Commande non trouvée');
    }
    res.status(200).send('État de paiement mis à jour avec succès!');
  } catch (error) {
    res.status(500).send(`Erreur lors de la mise à jour de la commande: ${error.message}`);
  }
});

// Route Checkout
app.post('/api/checkout', async (req, res) => {
  const { cartItems, totalPrice, userInfo } = req.body;

  if (!cartItems || !totalPrice || !userInfo?.name || !userInfo?.email) {
    return res.status(400).send({ error: "Données de commande incomplètes." });
  }

  try {
    const newOrder = new Order({
      userInfo,
      cartItems,
      totalPrice,
    });

    await newOrder.save();

    const itemsList = cartItems.map(item => `${item.title} (x${item.quantity}) - $${item.price}`).join('\n');

    // Add payment status to the email body
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: 'boussarhaneimane@gmail.com',
      subject: 'Nouvelle commande',
      text: `
        Nouvelle commande de ${userInfo.name}.
        Email : ${userInfo.email}
        Articles :
        ${itemsList}
        Total : $${totalPrice.toFixed(2)}
        Statut de paiement : ${newOrder.paymentStatus}  
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Commande enregistrée avec succès !' });
  } catch (error) {
    res.status(500).send({ error: `Erreur : ${error.message}` });
  }
});

// Route : Mettre à jour l'état de paiement d'une commande
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(id, { paymentStatus }, { new: true });
    if (!order) {
      return res.status(404).send('Commande non trouvée');
    }
    res.status(200).send('État de paiement mis à jour avec succès!');
  } catch (error) {
    res.status(500).send({ error: `Erreur : ${error.message}` });
  }
});
// Route pour récupérer l'état d'une commande par ID
app.get('/api/order-status/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Rechercher la commande par son ID
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    // Répondre avec le statut de paiement
    res.status(200).json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    res.status(500).json({ error: `Erreur lors de la récupération de l'état : ${error.message}` });
  }
});



app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(product => product.id === parseInt(id));

  if (productIndex === -1) {
    return res.status(404).send('Product not found');
  }

  products.splice(productIndex, 1); // Remove the product from the array
  res.status(200).send('Product deleted successfully');
});
const bcrypt = require('bcrypt');

// Route pour l'inscription
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation des champs
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    res.status(201).json({ message: 'Inscription réussie !' });
  } catch (error) {
    res.status(500).json({ error: `Erreur lors de l'inscription : ${error.message}` });
  }
});

// appele Auth Routes (connexion)
app.use(authRoutes);
app.use(authLogin)

// Route to fetch products
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/hello', (req, res) => {
  res.send('Hello, Browser');
});
// Démarrer le serveur
app.listen(process.env.PORT , () => {
  console.log(`Serveur backend démarré sur le port ${process.env.PORT }`);
});
