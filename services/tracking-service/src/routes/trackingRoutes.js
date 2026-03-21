const express = require('express');
const controller = require('../controllers/trackingController');

const router = express.Router();

router.get('/health', controller.health);
router.post('/trackings', controller.createTracking);
router.get('/trackings/me', controller.getMyTrackings);
router.get('/trackings/all', controller.getAllTrackings);
router.put('/trackings/:id/status', controller.updateTrackingStatus);
router.get('/trackings/my/:accountId', controller.getMyTrackingsLegacy);
router.post('/trackings/sync-by-account/:accountId', controller.syncByAccount);
router.get('/trackings/by-account/:accountId', controller.getByAccount);

module.exports = router;
