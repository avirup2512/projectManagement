const express = require('express');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("../class/sql/mysqlDbConnection");
var router = express.Router();
var error = require('../class/error');
var userController = require("../controller/user")

let con = new connection(mysql);
let connectionObject = con.getConnection();
con.connect(connectionObject);
var user = new userController(con,connectionObject);
router.use((req, res, next) => {
    
    if (req.url == "/")
    {
        req.url = "/login";
        next();
    } else {
        next();
    }
})
 /** POST Methods */
    /**
     * @openapi
     * '/auth/login':
     *  post:
     *     tags:
     *     - User Controller
     *     summary: Authenticate a user
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - email
     *              - password
     *            properties:
     *              email:
     *                type: string
     *                default: johndoe@mail.com
     *              password:
     *                type: string
     *                default: johnDoe20!@
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
router.post('/login', async function (req, res) {
    let token;
    let { email, password, socialLogin, uniqueIdentifier } = req.body;
    if (socialLogin)
    {
        if (!uniqueIdentifier)
        {
            return res.status(400)
            .send(new error("Send Proper data."));
        } else {
            try {
                var result = await user.authenticateUserByUniqueId(req.body);
                if (!result.message) {
                    return res.status(result.status)
                    .json({
                        success:result.status == 200 ?  true : false,
                        data: "User not found",
                        status:result.status
                    })
                } else {
                    token = jwt.sign(
                        {
                            userEmail: email,
                            password: password
                        },
                        "SECRET",
                        { expiresIn: "2h" }
                    );
                }
                return res.status(result.status)
                .json({
                    success:result.status == 200 ?  true : false,
                    token: token,
                    status: result.status,
                    message: "Login Successfull.",
                    data:result.data
                })
            }catch (err) {
                const error = new Error("Error ! Something went wrong");
                    return res.status(400)
                    .json(error)
            }
        }
        
    }else if (!email || !password) {
        return res.status(400)
            .send(new error("Send Proper data."));
        // return;
    } else if (email && password) {
        try {
            var result = await user.authenticateUser(email, password);
            if (!result.message) {
                res.status(result.status)
                .json({
                    success:result.status == 200 ?  true : false,
                    data: "User not found"
                })
            } else {
                token = jwt.sign(
                    {
                        userEmail: email,
                        password: password
                    },
                    "SECRET",
                    { expiresIn: "2h" }
                );
            }
            return res.status(result.status)
            .json({
                success:result.status == 200 ?  true : false,
                token: token,
                status: result.status,
                message: "Login Successfull.",
                data:result.data
            })
        } catch (err) {
            const error = new Error("Error ! Something went wrong");
                return res.status(400)
                .json(error)
        }
    }
});
 /** POST Methods */
    /**
     * @openapi
     * '/auth/createUser':
     *  post:
     *     tags:
     *     - User Controller
     *     summary: Create a user
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - firstName
     *              - lastName
     *              - email
     *              - password
     *              - address
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
router.post('/createUser', async function (req, res) {
    let { firstName, lastName, email, password, address, socialLogin, uniqueIdentifier } = req.body;
    if (socialLogin)
    {
        if (!uniqueIdentifier)
        {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                var result = await user.createUserFromSocialAuth(req.body);
                token = jwt.sign(
                {
                    userEmail: email,
                    password: uniqueIdentifier
                },
                "SECRET",
                { expiresIn: "2h" }
            );
            res.status(result.status)
            .json({
                success:result.status == 200 ?  true : false,
                token: token,
                status: result.status,
                message:result.message
            })
            } catch (err) {
                console.log(err);
            res.status(400)
            .send(new error(err));
        }
        }
    }else if (!firstName || !lastName || !email || !password) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        
        try {
            var response = await user.createUser(req.body);
            console.log(response);
            
            token = jwt.sign(
                {
                    userEmail: email,
                    password: uniqueIdentifier
                },
                "SECRET",
                { expiresIn: "2h" }
            );
            res.status(response.status)
            .json({
                success:response.status == 200 ?  true : false,
                token: token,
                status: response.status,
                message:response.message
            })
        } catch (err) {
            res.status(400)
            .send(new error(err));
        }
    }
    
})
/** POST Methods */
    /**
     * @openapi
     * '/auth/getUser':
     *  get:
     *     tags:
     *     - User Controller
     *     summary: Get a user info
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - firstName
     *              - lastName
     *              - email
     *              - password
     *              - address
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
router.post('/getUser', async function (req, res) {
    
    let { token } = req.body;
    console.log(token);
    if (!token) {
        res.status(400)
        .send(new error("Send Proper data."));
        return;
    } else {
        try {
        let u = jwt.verify(
                token,
                "SECRET",
                { expiresIn: "2h" }
        );
        // if(user)
            let userDetails = await user.getUserByEmail(u.userEmail);
            console.log(userDetails);
            res.status(userDetails.status)
            .send(userDetails)
        } catch (err) {
            res.status(400)
            .send(new error(err));
        }
        
    }
    
})
/** POST Methods */
    /**
     * @openapi
     * '/auth/search':
     *  post:
     *     tags:
     *     - User Controller
     *     summary: Search a user
     *     security:
     *          bearerAuth: [read]
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - firstName
     *              - lastName
     *              - email
     *              - password
     *              - address
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
    router.post('/search', async function (req, res) {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        let { keyword } = req.body;
        const decodedToken = jwt.verify(token, "SECRET");                
        let { userEmail, password } = decodedToken;
        Object.assign(req.body, { userEmail })
        if ( !keyword) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                let userDetails = await user.getUserByKeyword(req.body);
                console.log(userDetails);
                res.status(userDetails.status)
                .send(userDetails)
            } catch (err) {
                console.log(err);
                
                res.status(400)
                .send(new error(err));
            }
        }
    })
    router.post('/searchByProjectId', async function (req, res) {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        let { keyword, projectId } = req.body;
        const decodedToken = jwt.verify(token, "SECRET");                
        let { userEmail, password } = decodedToken;
        Object.assign(req.body, { userEmail })
        if ( !keyword || !projectId) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                let userDetails = await user.getProjectUserByKeyword(req.body);
                console.log(userDetails);
                res.status(userDetails.status)
                .send(userDetails)
            } catch (err) {
                console.log(err);
                
                res.status(400)
                .send(new error(err));
            }
        }
    })
    router.post('/searchByBoardId', async function (req, res) {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        let { keyword, boardId } = req.body;
        const decodedToken = jwt.verify(token, "SECRET");                
        let { userEmail, password } = decodedToken;
        Object.assign(req.body, { userEmail })
        if ( !keyword) {
            res.status(400)
            .send(new error("Send Proper data."));
            return;
        } else {
            try {
                let userDetails = await user.getBoardUserByKeyword(req.body);
                console.log(userDetails);
                res.status(userDetails.status)
                .send(userDetails)
            } catch (err) {
                console.log(err);
                
                res.status(400)
                .send(new error(err));
            }
        }
    })
module.exports = router;