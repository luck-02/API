const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
// const authMiddleware = authMiddleware

const { body, validationResult } = require('express-validator');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'demo_node+mongo_token';


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Nom d'utilisateur
 *                 example: harrypotter
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 description: Mot de passe
 *                 example: azkaban123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur créé"
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "field"
 *                       value:
 *                         type: string
 *                       msg:
 *                         type: string
 *                       path:
 *                         type: string
 *                       location:
 *                         type: string
 *             example:
 *               errors:
 *                 - type: "field"
 *                   value: ""
 *                   msg: "Le nom d'utilisateur est requis."
 *                   path: "username"
 *                   location: "body"
 *                 - type: "field"
 *                   value: ""
 *                   msg: "Doit faire entre 3 et 30 caractères."
 *                   path: "username"
 *                   location: "body"
 */
// POST /auth/register  toujours passer les inputs user au sanitize()
router.post('/register', [
    body('username').trim().escape()
      .notEmpty().withMessage('Le nom d’utilisateur est requis.')
      .isLength({ min: 3, max: 30 }).withMessage('Doit faire entre 3 et 30 caractères.'),
    body('password').trim().escape()
      .notEmpty().withMessage('Le mot de passe est requis.')
      .isLength({ min: 6 }).withMessage('Minimum 6 caractères.')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, password } = req.body;
  
    try {
      const user = new User({ name, password });
      await user.save();
      res.status(201).json({ message: 'Utilisateur créé' });
    } catch (err) {
      if (err.code === 11000) return res.status(500).json({ error: 'Erreur système' });
      res.status(400).json({ error: err.message });
    }
  });


/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token dans un cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Connecté avec succès"
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "demo_node+mongo_token=xxx; HttpOnly; SameSite=Strict"
 *       401:
 *         description: Authentification échouée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Identifiants invalides"
 */
// POST /auth/login
router.post('/login', async (req, res) => {
    // toujours passer les inputs user au sanitize()
    const { name, password } = req.body;

    console.log(name)
    const user = await User.findOne({ name });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
  
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    console.log(token)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false, // à mettre sur true en prod (https)
      maxAge: 24 * 60 * 60 * 1000 // durée de vie 24h
    });
  
    res.json({ message: 'Connecté avec succès' });
  });

  
/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Déconnexion utilisateur
 *     description: Supprime le cookie d'authentification
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Déconnecté"
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "demo_node+mongo_token=; HttpOnly; SameSite=Strict; Max-Age=0"
 */
// GET /auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Déconnecté' });
});

module.exports = router;