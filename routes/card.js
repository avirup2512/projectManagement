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
    let { name, boardId,listId,position,description,isActive,dueDate,reminderDate } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !name || !boardId || !listId || position == undefined) {
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
     * '/card/edit':
     *  put:
     *     tags:
     *     - Card Controller
     *     summary: Edit a card
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
    let { name, boardId,listId,description,isActive,dueDate,reminderDate,cardId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId || !listId || !cardId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.editCards(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            
            res.status(400)
            .send(new error(err));
        }
    }
})
/** PUT Methods */
    /**
     * @openapi
     * '/card/setStatus':
     *  put:
     *     tags:
     *     - Card Controller
     *     summary: Edit a card
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
router.put('/setStatus', async function (req, res) {
        let {boardId,listId,isComplete,cardId } = req.body;
        Object.assign(req.body, { userId: req.authenticatedUser.id })
        if (!req.authenticatedUser || isComplete == undefined || !boardId || !listId || !cardId) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                var response = await card.setCardStatus(req.body);
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
    let { listId, boardId, cardId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !boardId || !listId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.deleteCards(req.body);
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
     * '/card/getAllCard/:listId/:boardId':
     *  get:
     *     tags:
     *     - Card Controller
     *     summary: Get all Card
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
router.get('/getAllCard/:listId/:boardId', async function (req, res) {
    let { listId,boardId } = req.params;
    Object.assign(req.params, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !listId || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.getAllCards(req.params);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
router.get('/getCardById/:boardId/:cardId', async function (req, res) {
    let { boardId } = req.params;
    Object.assign(req.params, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !boardId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.getCardById(req.params);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
/** POST Methods */
    /**
     * @openapi
     * '/card/addUser':
     *  post:
     *     tags:
     *     - Card Controller
     *     summary: Add User to a Card
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
router.post('/addUsers', async function (req, res) {
    console.log("HI");
    let { cardId, users, boardId } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !users || !boardId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        users = users.map((e) => ({ user_id: e.user_id | e.id, roleId: e.role }));
        console.log(users);
        Object.assign(req.body, { users:users })
        try {
            var response = await card.addUsers(req.body);
            console.log(response);
            
            res.status(response[0].status)
            .send(response[0])
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
     * '/card/editUserRole':
     *  put:
     *     tags:
     *     - Card Controller
     *     summary: Edit User Role in a Card
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - cardId
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
    let { userId, boardId,cardId, roleId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !userId || !boardId || !cardId || !roleId ) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.updateUserRole(req.body);
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
     * '/card/getTag':
     *  PUT:
     *     tags:
     *     - Card Controller
     *     summary: Add Tags to card
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - cardId
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

router.get('/getTag/:searchKey/:boardId', async function (req, res) {
    Object.assign(req.params, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.getTagByKeyWord(req.params);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(400)
            .send(new error(err));
        }
    }
})
/** POST Methods */
    /**
     * @openapi
     * '/card/addTag':
     *  POST:
     *     tags:
     *     - Card Controller
     *     summary: Add Tags to card
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - cardId
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

router.post('/addTag', async function (req, res) {
    let { cardId, tag, boardId } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !tag || !boardId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.addTag(req.body);
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
router.delete('/deleteTag', async function (req, res) {
    let { cardId, boardId, tagId } = req.body;
    Object.assign(req.body, { userId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !boardId || !tagId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.removeTag(req.body);
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(400)
            .send(new error(err));
        }
    }
})

router.post('/addCheckList', async function (req, res) {
    let { cardId,boardId,name,isChecked,position } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !boardId || !name || isChecked == undefined || position == undefined) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.addCheckListItem(req.body);            
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
router.put('/editCheckList', async function (req, res) {
    let { cardId,boardId,name,isChecked,position,id } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !boardId || !name || isChecked == undefined || position == undefined || !id) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.editCheckListItem(req.body);            
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
router.delete('/deleteCheckList', async function (req, res) {
    let { cardId,boardId,id } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
    if (!req.authenticatedUser || !cardId || !boardId || !id) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.deleteCheckListItem(req.body);            
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})

router.post('/createComment', async function (req, res) {
    let { cardId,boardId,listId,comment } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id, date: new Date() })
    if (!req.authenticatedUser || !cardId || !boardId || !comment || !listId) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.createComments(req.body);            
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
router.put('/editComment', async function (req, res) {
    let { cardId,boardId,listId,id,comment } = req.body;
    Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id, date: new Date() })
    if (!req.authenticatedUser || !cardId || !boardId || !comment || !listId || !id) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
            var response = await card.editComments(req.body);            
            res.status(response.status)
            .send(response)
        } catch (err) {
            console.log(err);
            res.status(344)
            .send(new error(err));
        }
    }
})
router.put('/updatePosition', async function (req, res) {
        let { boardId,cards } = req.body;
        Object.assign(req.body, { userId: req.authenticatedUser.id })
        if (!req.authenticatedUser || !boardId || !cards ) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                var response = await card.updatePosition(req.body);
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
router.post('/copyCard', async function (req, res) {
        let { boardId,listId,cardId, listIds } = req.body;
        Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
        if (!req.authenticatedUser || !boardId || !cardId || !listId || !listIds ) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                var response = await card.copyCard(req.body);
                console.log(response);
                
                res.status(response.status)
                .send(response)
            } catch (err) {
                console.log(err);
                res.status(400)
                .send(new error(err));
            }
        }
})
router.post('/cardActivity', async function (req, res) {
    let { boardId, listId, cardId } = req.body;
        Object.assign(req.body, { authenticateUserId: req.authenticatedUser.id })
        if (!req.authenticatedUser || !boardId || !cardId || !listId ) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                var response = await card.getCardActivity(req.body);
                console.log(response);
                
                res.status(response.status)
                .send(response)
            } catch (err) {
                console.log(err);
                res.status(400)
                .send(new error(err));
            }
        }
})
module.exports = router;