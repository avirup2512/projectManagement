const express = require('express');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("../class/sql/mysqlDbConnection");
var router = express.Router();
var error = require('../class/error');
const projectController = require('../controller/project');

let con = new connection(mysql);
let connectionObject = con.getConnection();
con.connect(connectionObject);
var project = new projectController(con,connectionObject);
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
    let { name } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !name) {
        res.status(400)
            .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await project.createProject(req.body);
            res.status(response[0].status)
                .send(response[0])
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
            var response = await project.editBoard(req.body);
            console.log(response);
            
            res.status(response[0].status)
                .send(response[0])
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
            var response = await project.deleteBoard(req.body);
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
router.get('/getAllProject/:itemLimit/:currentOffset', async function (req, res) {
    Object.assign(req.params, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser) {
        res.status(400)
            .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await project.getAllProject(req.params);
            console.log(response);
            
            res.status(response.status)
                .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(344)
                .send(new error(err));
        }
    }
});
/** POST Methods */
    /**
     * @openapi
     * '/board/addUser':
     *  post:
     *     tags:
     *     - Board Controller
     *     summary: Add User to a Board
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
router.post('/addUser', async function (req, res) {
    console.log("HI");
    let { userId, boardId, roleId } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !userId || !boardId || !roleId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await project.addUser(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(344)
            .send(new error(err));
        }
    }
})
/** PUT Methods */
    /**
     * @openapi
     * '/board/editUserRole':
     *  put:
     *     tags:
     *     - Board Controller
     *     summary: Edit User Role in a Board
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
router.put('/editUserRole', async function (req, res) {
    let { userId, boardId, roleId } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !userId || !boardId || !roleId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await project.updateUserRole(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(344)
            .send(new error(err));
        }
    }
})
router.get('/getAllUser/:boardId', async function (req, res) {
    let { boardId } = req.params;
    Object.assign(req.params, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await project.getAllUser(req.body);
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