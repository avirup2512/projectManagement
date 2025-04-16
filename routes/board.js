const express = require('express');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("../class/sql/mysqlDbConnection");
var router = express.Router();
var error = require('../class/error');
var boardController = require("../controller/board")

let con = new connection(mysql);
let connectionObject = con.getConnection();
con.connect(connectionObject);
var board = new boardController(con,connectionObject);
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
     * '/board/create':
     *  post:
     *     tags:
     *     - Board Controller
     *     summary: Create a board
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
     *              - user_id
     *              - created_date
     *              - is_public
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
    let { name, isPublic } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !name) {
        res.status(400)
            .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await board.createBoard(req.body);
            res.status(response.status)
                .send(response)
        } catch (err) {
            res.status(400)
                .send(new error(err));
        }
    }
});
/** PUT Methods */
    /**
     * @openapi
     * '/board/edit':
     *  put:
     *     tags:
     *     - Board Controller
     *     summary: Edit a board
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
     *              - boardId
     *              - is_public
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
    let { boardId, name, isPublic } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId || !name ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await board.editBoard(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            res.status(400)
            .send(new error(err));
        }
    }
})
/** DELETE Methods */
    /**
     * @openapi
     * '/board/delete':
     *  delete:
     *     tags:
     *     - Board Controller
     *     summary: Delete a board
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
router.delete('/delete', async function (req, res) {
    let { boardId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await board.deleteBoard(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            res.status(400)
            .send(new error(err));
        }
    }
})
/** GET Methods */
    /**
     * @openapi
     * '/board/getAllBoard':
     *  get:
     *     tags:
     *     - Board Controller
     *     summary: Get all board
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
router.get('/getAllBoard', async function (req, res) {
    console.log("HI");
    
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await board.getAllBoard(req.body);
            console.log(response);
            
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