const express = require('express');
const controller = require('../controllers/accountController');

const router = express.Router();

router.get('/health', controller.health);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/admin/overview', controller.adminOverview);
router.get('/users/:id', controller.getUserById);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

module.exports = router;
