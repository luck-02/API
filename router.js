const express = require('express');
const router = express.Router();
const Potion = require('./potion.model');
const authMiddleware = require('./auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Potion:
 *       type: object
 *       required:
 *         - name
 *         - effect
 *       properties:
 *         name:
 *           type: string
 *           description: Nom de la potion
 *         effect:
 *           type: string
 *           description: Effet de la potion
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des ingrédients
 *         price:
 *           type: number
 *           description: Prix de la potion
 * 
 *   examples:
 *     Potion:
 *       value:
 *         name: "Potion de vie"
 *         effect: "Restaure la santé"
 *         ingredients: ["Herbe médicinale", "Eau pure"]
 *         price: 100
 */

/**
 * @swagger
 * /potions/price-range:
 *   get:
 *     tags: [Potions]
 *     summary: Recherche des potions par fourchette de prix
 *     parameters:
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *         required: true
 *         description: Prix minimum
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *         required: true
 *         description: Prix maximum
 *     responses:
 *       200:
 *         description: Liste des potions dans la fourchette de prix
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Potion'
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get('/price-range', async (req, res) => {
    try {

        const minPrice = parseFloat(req.query.min);
        const maxPrice = parseFloat(req.query.max);

        if (isNaN(minPrice) || isNaN(maxPrice)) {
            return res.status(400).json({ 
                error: 'Les prix doivent être des nombres valides' 
            });
        }

        // Modified query with proper type casting and sorting
        const potions = await Potion.find({
            price: { 
                $gte: minPrice, 
                $lte: maxPrice 
            }
        })
        .sort({ price: 1 })

        console.log(potions)

        res.json({
            potions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions:
 *   get:
 *     tags: [Potions]
 *     summary: Récupère toutes les potions
 *     responses:
 *       200:
 *         description: Liste des potions
 */
router.get('/', async (req, res) => {
    try {
        const potions = await Potion.find();
        res.json(potions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions/names:
 *   get:
 *     tags: [Potions]
 *     summary: Récupère le nom de toutes les potions
 *     responses:
 *       200:
 *         description: Liste des potions
 */
router.get('/names', async (req, res) => {
    try {
        const names = await Potion.find({}, 'name');
        res.json(names.map(p => p.name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions/{id}:
 *   get:
 *     tags: [Potions]
 *     summary: Récupère une potion par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la potion
 *     responses:
 *       200:
 *         description: La potion retrouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Potion'
 *       404:
 *         description: Potion non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
    try {
        const potion = await Potion.findById(req.params.id);
        if (!potion) return res.status(404).json({ error: 'Potion not found' });
        res.json(potion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions:
 *   post:
 *     tags: [Potions]
 *     summary: Crée une nouvelle potion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Potion'
 *     responses:
 *       201:
 *         description: Potion créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Potion'
 *       400:
 *         description: Données invalides
 */
// router.post('/', async (req, res) => {
//     try {
//         const potion = new Potion(req.body);
//         const savedPotion = await potion.save();
//         res.status(201).json(savedPotion);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// POST /potions : créer une nouvelle potion
router.post("/", authMiddleware, async (req, res) => {
    try {
      const newPotion = new Potion(req.body);
      const savedPotion = await newPotion.save();
      res.status(201).json(savedPotion);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
/**
 * @swagger
 * /potions/{id}:
 *   put:
 *     tags: [Potions]
 *     summary: Met à jour une potion
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la potion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Potion'
 *     responses:
 *       200:
 *         description: Potion mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Potion'
 *       404:
 *         description: Potion non trouvée
 *       400:
 *         description: Données invalides
 */
router.put('/:id', async (req, res) => {
    try {
        const potion = await Potion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!potion) return res.status(404).json({ error: 'Potion not found' });
        res.json(potion);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions/{id}:
 *   delete:
 *     tags: [Potions]
 *     summary: Supprime une potion
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB de la potion
 *     responses:
 *       200:
 *         description: Potion supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Potion non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req, res) => {
    try {
        const potion = await Potion.findByIdAndDelete(req.params.id);
        if (!potion) return res.status(404).json({ error: 'Potion not found' });
        res.json({ message: 'Potion deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * @swagger
 * /potions/vendor/{vendor_id}:
 *   get:
 *     tags: [Potions]
 *     summary: Récupère toutes les potions d'un vendeur
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du vendeur
 *     responses:
 *       200:
 *         description: Liste des potions du vendeur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Potion'
 *       404:
 *         description: Vendeur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/vendor/:vendor_id', async (req, res) => {
    try {
        if (!req.params.vendor_id) {
            return res.status(400).json({ error: 'ID du vendeur requis' });
        }

        const potions = await Potion.find({ vendor_id: req.params.vendor_id })
            .select('-__v')
            .sort({ name: 1 });

        if (!potions.length) {
            return res.status(404).json({ 
                message: 'Aucune potion trouvée pour ce vendeur' 
            });
        }

        res.json(potions);
    } catch (err) {
        res.status(500).json({ 
            error: err.message,
            details: 'Erreur lors de la récupération des potions'
        });
    }
});



/**
 * @swagger
 * /potions/analytics/distinct-categories:
 *   get:
 *     tags: [Analytics]
 *     summary: Nombre total de catégories différentes
 *     description: Retourne le nombre total de catégories uniques de potions
 *     responses:
 *       200:
 *         description: Nombre de catégories calculé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: Nombre total de catégories uniques
 *             example:
 *               count: 5
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Message d'erreur
 *             example:
 *               error: "Erreur lors de l'agrégation des catégories"
 */
router.get('/analytics/distinct-categories', async (req, res) => {
    try {
        const result = await Potion.aggregate([
            { $unwind: "$categories" },
            { $group: { _id: null, categories: { $addToSet: "$categories" } } },
            { $project: { count: { $size: "$categories" } } }
        ]);
        res.json(result[0] || { count: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions/analytics/strength-flavor-ratio:
 *   get:
 *     tags: [Analytics]
 *     summary: Ratio force/parfum des potions
 *     description: Calcule le ratio entre la force et le parfum de chaque potion
 *     responses:
 *       200:
 *         description: Liste des ratios calculés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID de la potion
 *                   ratio:
 *                     type: number
 *                     description: Ratio force/parfum
 *             example:
 *               - _id: "507f1f77bcf86cd799439011"
 *                 ratio: 1.5
 *       500:
 *         description: Erreur serveur
 */
router.get('/analytics/strength-flavor-ratio', async (req, res) => {
    try {
        const ratios = await Potion.aggregate([
            {
                $project: {
                    ratio: {
                        $cond: [
                            { $eq: ["$ratings.flavor", 0] },
                            0,
                            { $divide: ["$ratings.strength", "$ratings.flavor"] }
                        ]
                    }
                }
            }
        ]);
        res.json(ratios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /potions/analytics/search:
 *   get:
 *     tags: [Analytics]
 *     summary: Recherche analytique personnalisée
 *     description: Permet de grouper et d'agréger les données selon différents critères
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vendor, category]
 *         description: Champ de groupement (vendeur ou catégorie)
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [avg, sum, count]
 *         description: Type de métrique à calculer
 *       - in: query
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *           enum: [score, price, ratings]
 *         description: Champ sur lequel appliquer la métrique
 *     responses:
 *       200:
 *         description: Résultats de l'analyse
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Valeur du groupement
 *                   result:
 *                     type: number
 *                     description: Résultat de l'agrégation
 *             example:
 *               - _id: "vendor1"
 *                 result: 42.5
 *       400:
 *         description: Paramètres invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Métrique invalide"
 *       500:
 *         description: Erreur serveur
 */
router.get('/analytics/search', async (req, res) => {
    try {
        const { groupBy, metric, field } = req.query;
        
        let groupId = "$" + (groupBy === 'vendor' ? 'vendor_id' : 'categories');
        let operation = {};
        
        switch(metric) {
            case 'avg':
                operation = { $avg: `$${field}` };
                break;
            case 'sum':
                operation = { $sum: `$${field}` };
                break;
            case 'count':
                operation = { $sum: 1 };
                break;
            default:
                return res.status(400).json({ error: 'Métrique invalide' });
        }

        const pipeline = [
            { $unwind: groupBy === 'category' ? "$categories" : null },
            {
                $group: {
                    _id: groupId,
                    result: operation
                }
            }
        ].filter(stage => stage.$unwind !== null);

        const results = await Potion.aggregate(pipeline);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
