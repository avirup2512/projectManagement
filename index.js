var express = require('express');
const cors = require('cors');
const port = 8089;
var path = require('path');
var cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
var error = require('./class/error');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("./class/sql/mysqlDbConnection");
const createQuery = require("./class/sql/createQuery");
var app = express();
const corsOpts = {
    origin: 'http://localhost:4200'
};
app.use(cors(corsOpts), function (req, res, next) {
    console.log(req.url.split('/'));
    if (req.url.split('/')[1] !== "auth")
    {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        console.log(token);
        if (!token)
        {
            let err = "Token is needed";
            res.status(400)
                .send(err);
        }else
        {
            try {
                const decodedToken = jwt.verify(token, config.secretKey);
                let { userEmail, password } = decodedToken;
                const con = new connection(mysql);
                let connect = con.getConnection();
                con.connect(connect);
                try {
                    con.query(connect, "SELECT email, password FROM user")
                        .then(function (data) {
                        if (!data || data.length == 0) {
                            let err = new error("User does'nt exists");
                            res.status(400)
                                .send(err.msg);
                        } else {
                            globalData.userEmail = userEmail;
                            next();
                            //con.stop(connect);
                        }
                        }).catch(function (err) {
                            console.log(err);
                    })
                } catch (r) {
                    let err = new error(r);
                    res.status(400)
                    .send(err.msg);
                }
            } catch (r) {
                console.log(error);
                let err = new error(r);
            res.status(400)
                .send(err.msg);
            }
        }
    } else {
        next();
    }
});
app.listen(port, () => {
    console.log("App has been started.");
})
async function createTables()
{
    let con = new connection(mysql);
    let connectionObject = con.getConnection();
    con.connect(connectionObject);
    let dbName = "projectManagement";
    // ROLE TABLE CREATE
    var roleTableExists = await con.checkTableExists(connectionObject,dbName,"role");
    if(!roleTableExists)
    {
        con.createTable(connectionObject, createQuery.createRoleTable)
            .then(function (data) {
                var queryString = "INSERT INTO role (role) VALUES ('ROLE_BASIC'),('ROLE_ADMIN'),('ROLE_SUPER_ADMIN')";
                console.log(data);
                con.query(connectionObject, queryString)
                .then(function (data) {
                    console.log(data);
                }).catch(function (err) {
                    console.log(err);
                })
            }).catch(function (err) {
                console.log(err);
        })
    }
    // USER TABLE CREATE
    var userTableExists = await con.checkTableExists(connectionObject,dbName,"user");
    if(!userTableExists)
    {
        con.createTable(connectionObject, createQuery.createUsersTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    }
    // USER ROLE TABLE CREATE
    var userRoleTableExists = await con.checkTableExists(connectionObject,dbName,"user_role");
    if(!userRoleTableExists)
    {
        con.createTable(connectionObject, createQuery.createUserRoleTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // USER TYPE TABLE CREATE
    var UserTypeTableExists = await con.checkTableExists(connectionObject,dbName,"user_type");
    if(!UserTypeTableExists)
    {
        con.createTable(connectionObject, createQuery.createUserTypeTable)
            .then(function (data) {
                let InitialValues = ['CREATOR', 'EMPLOYEE', 'VIEWER'];
                function addInitialValue(idx, array) {
                    if (idx > array.length - 1)
                        return;
                    let InsertQuery = "INSERT INTO `user_type` (type) VALUES('" + array[idx] + "')";
                    con.query(connectionObject, InsertQuery)
                        .then(function (data) {
                            console.log(data);
                        })
                        .catch(function (err) {
                            reject(err);
                        });                    
                    addInitialValue(idx + 1, array);
                };
                addInitialValue(0, InitialValues);
            }).catch(function (err) {
                console.log(err);
        })
    };
}
createTables();