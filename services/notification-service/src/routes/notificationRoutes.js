const express = require('express');
const controller = require('../controllers/notificationController');

const router = express.Router();

router.get('/health', controller.health);
router.post('/notifications', controller.createNotification);
router.get('/notifications', controller.listNotifications);

module.exports = router;
