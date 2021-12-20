const express = require('express');

const steam = require('./steam');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/steam', steam);

module.exports = router;
