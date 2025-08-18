var express = require('express');
const cors = require('cors');
const port = 3000;
var path = require('path');
var cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
var error = require('./class/error');
const jwt = require("jsonwebtoken");
const mysql = require('mysql');
const connection = require("./class/sql/mysqlDbConnection");
const createQuery = require("./class/sql/createQuery");
const authentication = require("./routes/authentication");
const board = require("./routes/board");
const list = require("./routes/list");
const card = require("./routes/card");
const setting = require("./routes/settings");
const project = require("./routes/project");
var app = express();
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
require('dotenv').config();

const axios = require('axios');
const corsOpts = {
    origin: '*'
};
app.use(cors(), function (req, res, next) {
    console.log(req.url.split('/')[1]);
    
    if (req.url.split('/')[1] !== "auth")
    {        
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        if (!token)
        {
            let err = "Token is needed";
            res.status(400)
                .send(err);
        }else
        {
            try {
                const decodedToken = jwt.verify(token, "SECRET");                
                let { userEmail, password } = decodedToken;
                const con = new connection(mysql);
                let connect = con.getConnection();
                con.connect(connect);
                try {
                    con.query(connect, "SELECT id,email, password FROM user WHERE email='"+userEmail+"'")
                        .then(function (data) {
                        if (!data || data.length == 0) {
                            let err = new error("User does'nt exists");
                            res.status(400)
                                .send(err.msg);
                        } else {
                            req.authenticatedUser = {userEmail, id:data[0].id};
                            next();
                            };
                        con.stop(connect);
                        }).catch(function (err) {
                            console.log(err);
                            con.stop(connect);
                        })
                    
                } catch (r) {
                    let err = new error(r);
                    res.status(400)
                    .send(err.msg);
                }
            } catch (r) {
                console.log(r);
                let err = new error(r);
            res.status(400)
                .send(err.msg);
            }
        }
    } else {
        next();
    }
});
app.use('/api/auth', cors(corsOpts), authentication);
app.use('/api/board', cors(corsOpts), board);
app.use('/api/list', cors(corsOpts), list);
app.use('/api/card', cors(corsOpts), card);
app.use("/api/setting", cors(corsOpts), setting);
app.use("/api/project", cors(corsOpts), project);

app.listen(port, () => {
    console.log("App has been started.");
})
async function createTables()
{
    let con = new connection(mysql);
    let connectionObject = con.getConnection();
    con.connect(connectionObject);
    let dbName = "projectmanagement";
    // ROLE TABLE CREATE
    var roleTableExists = await con.checkTableExists(connectionObject,dbName,"role");
    if(!roleTableExists)
    {
        con.createTable(connectionObject, createQuery.createRoleTable)
            .then(function (data) {
                var queryString = "INSERT INTO role (role) VALUES ('ROLE_BASIC'),('ROLE_ADMIN'),('ROLE_SUPER_ADMIN')";
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
     // PROJECT TABLE CREATE
    var projectTableExists = await con.checkTableExists(connectionObject,dbName,"project");
    if(!projectTableExists)
    {
        con.createTable(connectionObject, createQuery.createProjectTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // BOARD TABLE CREATE
    var boardTableExits = await con.checkTableExists(connectionObject,dbName,"board");
    if(!boardTableExits)
    {
        con.createTable(connectionObject, createQuery.createBoardTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // BOARD USER TABLE CREATE
    var boardUserTableExists = await con.checkTableExists(connectionObject,dbName,"board_user");
    if(!boardUserTableExists)
    {
        con.createTable(connectionObject, createQuery.createBoardUserTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // BOARD LABEL TABLE CREATE
    var boardLabelExists = await con.checkTableExists(connectionObject,dbName,"board_label");
    if(!boardLabelExists)
    {
        con.createTable(connectionObject, createQuery.createBoardLabelTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CORE LABEL TABLE CREATE
    var coreLabelTableExists = await con.checkTableExists(connectionObject,dbName,"core_label");
    if(!coreLabelTableExists)
    {
        con.createTable(connectionObject, createQuery.createCoreLabelTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // List TABLE CREATE
    var listTableExists = await con.checkTableExists(connectionObject,dbName,"list");
    if(!listTableExists)
    {
        con.createTable(connectionObject, createQuery.createListTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD TABLE CREATE
    var cardTableExists = await con.checkTableExists(connectionObject,dbName,"card");
    if(!cardTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardsTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD USER TABLE CREATE
    var cardUserTableExists = await con.checkTableExists(connectionObject,dbName,"card_user");
    if(!cardUserTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardUserTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD LABEL TABLE CREATE
    var cardLabelTableExists = await con.checkTableExists(connectionObject,dbName,"card_label");
    if(!cardLabelTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardLabelTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CHECKLIST ITEM TABLE CREATE
    var checkListItemExists = await con.checkTableExists(connectionObject,dbName,"checklist_item");
    if(!checkListItemExists)
    {
        con.createTable(connectionObject, createQuery.createCheckListItemTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // COMMENT TABLE CREATE
    var commentTableExists = await con.checkTableExists(connectionObject,dbName,"comment");
    if(!commentTableExists)
    {
        con.createTable(connectionObject, createQuery.createCommentTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
     // CARD ACTIVITY TABLE CREATE
    var cardActivityTableExists = await con.checkTableExists(connectionObject,dbName,"card_activity");
    if(!cardActivityTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardActivityTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD ACTIVITY ADDED USER TABLE CREATE
    var cardActivityAddedUserTableExists = await con.checkTableExists(connectionObject,dbName,"card_activity_added_user");
    if(!cardActivityAddedUserTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardActivityAddedUserTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD ACTIVITY ADDED USER TABLE CREATE
    var cardActivityAddedChecklistTableExists = await con.checkTableExists(connectionObject,dbName,"card_activity_added_checklist");
    if(!cardActivityAddedChecklistTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardActivityAddedChecklistTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // TAG TABLE CREATE
    var tagTableExists = await con.checkTableExists(connectionObject,dbName,"tag");
    if(!tagTableExists)
    {
        con.createTable(connectionObject, createQuery.createTagTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // CARD TAG TABLE CREATE
    var cardTagTableExists = await con.checkTableExists(connectionObject,dbName,"card_tag");
    if(!cardTagTableExists)
    {
        con.createTable(connectionObject, createQuery.createCardTagTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // PROJECT USER TABLE CREATE
    var projectUserTableExists = await con.checkTableExists(connectionObject,dbName,"project_user");
    if(!projectUserTableExists)
    {
        con.createTable(connectionObject, createQuery.createProjectUserTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
    // UPLOADED FILE TABLE CREATE
    var uploadedFileTableExists = await con.checkTableExists(connectionObject,dbName,"uploaded_file");
    if(!uploadedFileTableExists)
    {
        con.createTable(connectionObject, createQuery.createUploadedFileTable)
            .then(function (data) {
                console.log(data);
            }).catch(function (err) {
                console.log(err);
        })
    };
}
createTables();
