const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; 

  if (!token) {
    return res.status(401).send('Accès refusé. Aucun token fourni.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Token invalide.');
  }
};

module.exports = authMiddleware;
