const express = require('express');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("../class/sql/mysqlDbConnection");
var router = express.Router();
var error = require('../class/error');
var cardController = require("../controller/cards")

let con = new connection(mysql);
let connectionObject = con.getConnection();
con.connect(connectionObject);
var card = new cardController(con,connectionObject);
router.use((req, res, next) => {
    if (req.url == "/")
    {
        req.url = "/create";
        next();
    } else {
        next();
    }
})
 /** POST Methods */
    /**
     * @openapi
     * '/card/create':
     *  post:
     *     tags:
     *     - Card Controller
     *     summary: Create a Card
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - name
     *              - board_id
     *              - created_date
     *              - position
     *            properties:
     *              firstName:
     *                type: string
     *                default: john
     *              lastName:
     *                type: string
     *                default: doe
     *              email:
     *                type: string
     *                default: johndoe@mail.com
     *              password:
     *                type: string
     *                default: johnDoe20!@
     *              address:
     *                type: string
     *                default: kolkata
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
router.post('/create', async function (req, res) {
    let { name, boardId,listId,description,dueDate,reminderDate } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !name || !boardId || !listId) {
        res.status(400)
            .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.createCards(req.body);
            res.status(response.status)
                .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(400)
                .send(new error(err));
        }
    }
});
/** PUT Methods */
    /**
     * @openapi
     * '/list/edit':
     *  put:
     *     tags:
     *     - List Controller
     *     summary: Edit a list
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - name
     *              - listId
     *              - position
     *              - boardId
     *            properties:
     *              firstName:
     *                type: string
     *                default: john
     *              lastName:
     *                type: string
     *                default: doe
     *              email:
     *                type: string
     *                default: johndoe@mail.com
     *              password:
     *                type: string
     *                default: johnDoe20!@
     *              address:
     *                type: string
     *                default: kolkata
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
router.put('/edit', async function (req, res) {
    let { name, boardId,listId, position } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId || !listId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await list.editList(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(400)
            .send(new error(err));
        }
    }
})
/** DELETE Methods */
    /**
     * @openapi
     * '/list/delete':
     *  delete:
     *     tags:
     *     - List Controller
     *     summary: Delete a list
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - ListId
     *            properties:
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     */
router.delete('/delete', async function (req, res) {
    let { listId, boardId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !listId || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await list.deleteList(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(400)
            .send(new error(err));
        }
    }
})
/** GET Methods */
    /**
     * @openapi
     * '/list/getAllList':
     *  get:
     *     tags:
     *     - List Controller
     *     summary: Get all list
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - boardId
     *            properties:
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     */
router.get('/getAllList', async function (req, res) {
    let { boardId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await list.getAllList(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
module.exports = router;