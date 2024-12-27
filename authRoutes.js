const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware'); // Importer le middleware

const router = express.Router();

// Récupération des identifiants de l'administrateur à partir des variables d'environnement
const validEmail = process.env.ADMIN_EMAIL;  
const validPassword = process.env.ADMIN_PASSWORD; 

// Middleware de login
router.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérification de l'email
    if (email !== validEmail) {
      return res.status(400).json({ message: 'Email incorrect' });
    }

    // Vérification du mot de passe
    if (password !== validPassword) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Générer un token JWT pour authentifier l'utilisateur
    const token = jwt.sign({ email: validEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retourner le token au client
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Exemple de route protégée
router.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Vous avez accès à cette route protégée!', user: req.user });
});

// Exporter le routeur
module.exports = router;
