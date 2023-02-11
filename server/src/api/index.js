const express = require('express');

const steam = require('./steam');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'you have reached the /api/ route'
  });
});

router.use('/steam', steam);

module.exports = router;
