const express = require('express');
const controller = require('../controllers/shipmentController');

const router = express.Router();

router.get('/health', controller.health);
router.post('/shipments', controller.createShipment);
router.get('/shipments', controller.listShipments);
router.get('/checks', controller.listChecks);
router.get('/checks/lookup', controller.lookupChecks);
router.get('/shipments/lookup', controller.lookupShipments);
router.post('/checks', controller.createCheck);

module.exports = router;
