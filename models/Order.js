const mongoose = require('mongoose');
const moment = require('moment-timezone'); // Importer moment-timezone

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    unique: true, 
    required: true // Chaque commande doit avoir un ID unique 
  },
  userInfo: {
    name: String,
    email: String,
    address: String,
    clientNumber: String,
  },
  cartItems: [
    {
      title: String,
      quantity: Number,
      price: Number,
    }
  ],
  totalPrice: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    default: 'not paid', 
    enum: ['not paid', 'paid', 'pending'] // Liste des états valides
  },
  paymentIntentId: String, // ID du PaymentIntent Stripe
  createdAt: {
    type: String, // Utilise une chaîne pour stocker la date formatée
    default: () => moment.tz('Africa/Casablanca').format('DD/MM/YYYY HH:mm:ss'), // Format jour/mois/année et heure
  },
});

module.exports = mongoose.model('Order', orderSchema);
