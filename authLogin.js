const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Utilisateur déjà existant.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).send('Utilisateur créé avec succès.');
  } catch (error) {
    res.status(500).send('Erreur de serveur');
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Erreur de serveur');
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  const { name, email, password } = req.body;
  const { id } = req.params;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, password: hashedPassword },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).send('Erreur de serveur');
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send('Erreur de serveur');
  }
});

module.exports = router;
