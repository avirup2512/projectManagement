const response = require("../class/response");
const boardController = require("./board");
const userController = require("./user");
const activity = require("../helper/textcontent");
var cardController = (function () {
    let connection;
    let connectionObject;
    let board;
    let user;
    function card(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection, this.connectionObject);
        this.user = new userController(this.connection,this.connectionObject)
    }
    function toMySQLDateTime(isoString) {
        if (!isoString || isoString === 'null' || isoString === undefined) return null;
        const date = new Date(isoString);
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    function addCardActivity(cardId, userId, activityObject, self)
    { 
        console.log(activityObject);
        
        let query = "INSERT INTO card_activity (card_id, user_id,activity) VALUES(" + cardId + ", " + userId + ", '" + activityObject?.activity + "')";
        self.connection.query(self.connectionObject, query)
            .then(async function (data3) {
                console.log(data3);
                
                if (activityObject.hasUser)
                {
                    await self.connection.query(self.connectionObject, "SELECT created_date FROM card_activity WHERE id = " + data3.insertId + "")
                        .then(async function (data4) {
                        console.log(data4);
                        await self.connection.query(self.connectionObject, "INSERT INTO card_activity_added_user (card_activity_id,added_user_id,type,created_date) VALUES(" + data3.insertId + "," + activityObject.userId + "," + activityObject.type + ", '" + toMySQLDateTime(data4[0].created_date) + "')")
                        .then(async function (data5) {
                            return {status:200};
                        }).catch(function (err) {
                            console.log(err);
                            return{message:err,status:406};
                        })
                        return {status:200};
                    }).catch(function (err) {
                        console.log(err);
                        return{message:err,status:406};
                    })
                } else if (activityObject.hasChecklist)
                {
                    await self.connection.query(self.connectionObject, "SELECT created_date FROM card_activity WHERE id = " + data3.insertId + "")
                        .then(async function (data4) {
                        console.log(data4);
                        await self.connection.query(self.connectionObject, "INSERT INTO `card_activity_added_checklist` (card_activity_id,added_checklist_id,type,created_date) VALUES(" + data3.insertId + "," + activityObject.checklistId + "," + activityObject.type + ", '" + toMySQLDateTime(data4[0].created_date) + "')")
                        .then(async function (data5) {
                            return {status:200};
                        }).catch(function (err) {
                            console.log(err);
                            return{message:err,status:406};
                        })
                        return {status:200};
                    }).catch(function (err) {
                        console.log(err);
                        return{message:err,status:406};
                    })
                }
            return {status:200};
        }).catch(function (err) {
            console.log(err);
            return{message:err,status:406};
        })
    }
    function addUserToCard(idx, users,cardId,loggedInUser,self)
    {
        let res = new response();
        if (idx > users.length - 1)
        {
            return [];
        }
        console.log("ARINDAM");
        
        console.log(users);
        let userID = users[idx].user_id || users[idx].id;
        let roleID = users[idx].roleId || users[idx].role;
        let query = "INSERT INTO card_user (user_id,card_id,role_id)" +
        "VALUES('" + userID + "','" + cardId + "','" +roleID + "') ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);";
        const p1 = new Promise((resolve, reject) => {
            self.connection.query(self.connectionObject, query)
                .then(async function (data3) {
                    let activityObject = { activity: activity.CARD_ADD_USER, hasUser: true, userId: userID, type:1 };
                    await addCardActivity(cardId, loggedInUser, activityObject, self);
                    res.message = "Users Has been added";
                    res.status = 200;
                    res.data = data3;
                    resolve(res);
                }).catch(function (err) {
                    res.message = err;
                    res.status = 406;
                    reject(res);
                })
        });
        const p2 = addUserToCard(idx + 1, users, cardId,loggedInUser, self);
        return Promise.all([p1, p2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
    }
    
    const deleteUserToCard = function (idx, users,cardId,loggedInUser,self)
    {        
        let res = new response();
        if(idx > users.length-1)
        {
            return [];
        }
        let userID = users[idx].user_id || users[idx].id;
        let insertBoardUserQuery = "DELETE FROM card_user WHERE card_id= '"+cardId+"' AND user_id = '"+userID+"'";
        let pr = new Promise((resolve, reject) => {
                self.connection.query(self.connectionObject, insertBoardUserQuery)
                .then(async function (data3) {  
                    data3.cardId = cardId;      
                    let activityObject = { activity: activity.CARD_REMOVE_USER, hasUser: true, userId: userID, type:0 };
                    await addCardActivity(cardId, loggedInUser, activityObject, self);
                    res.message = "Card Has been deleted";
                    res.status = 200;
                    res.data = data3;
                    resolve(res);
                }).catch(function (err) {
                console.log(err);
                res.message = err;
                res.status = 400;
                reject(res);
            })
        })
        let pr2 = deleteUserToCard(idx+1, users,cardId,loggedInUser,self)
        return Promise.all([pr, pr2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
    } 
    const updatePosition = async function (idx,cards,self)
    {
        let res = new response();
        if (idx > cards.length - 1)
        {
            return [];
        }
        const query = "UPDATE card SET position=" + cards[idx].position + " WHERE id=" + cards[idx].id + "";
        const pr1 = new Promise((resolve, reject) => {
            try {
                self.connection.query(self.connectionObject, query).
                then((data) => {
                    res.message = "Card's Position has been updated";
                    res.status = 200;
                    res.data = data;
                    resolve(res);
            })
            } catch (error) {
                console.log(err);
                res.message = err;
                res.status = 400;
                reject(res);
            }
        })
        const pr2 = updatePosition(idx + 1, cards, self);
        return Promise.all([pr1, pr2]).then(([value, rest]) => {
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        })
    }
    const checkUserHasPermission = async function (cardId,userId, self)
    {
        let query = "SELECT COUNT(*) as totalCards FROM card_user cu WHERE cu.card_id="+cardId+" AND cu.user_id="+userId+"";
        return self.connection.query(self.connectionObject, query)
        .then(function (data) {
                if (data[0].totalCards > 0)
                    return true;
                else
                    return false;
        }).catch(function (err) {
                console.log(err);
                
                return false;
        })
    }
    card.prototype.checkUserHasPermission = async function (param)
    {
        const { cardId, userId } = param;
        return checkUserHasPermission(cardId, userId, this);
    }
    card.prototype.checkTagIsExists = function(tagName)
    {
        return this.connection.query(this.connectionObject, "SELECT * FROM tag WHERE tag='" + tagName + "'")
        .then(function (data) {
            if (data.length == 0)
                return false;
            else
                return true;
        }).catch(function (err) {
                return false;
        })
        
    }
    card.prototype.checkTagExistsInCard = function (tag,cardId)
    {
        return this.connection.query(this.connectionObject, "SELECT * FROM card_tag WHERE tag='" + tag + "' AND card_id='"+cardId+"'")
        .then(function (data) {
            if (data.length == 0)
                return false;
            else
                return true;
        }).catch(function (err) {
                return false;
        })
    }
    card.prototype.checkUserRole = async function (cardId, userId) {
        let query = "SELECT DISTINCT r.role AS role_name " +
            "FROM card_user cu " +
            "JOIN role r ON cu.role_id = r.id " +
            "WHERE cu.user_id = '" + userId + "' AND cu.card_id = " + cardId + "";
        return this.connection.query(this.connectionObject, query)
            .then(function (data) {
                if (data.length == 0)
                    return [];
                else
                    return data;
            }).catch(function (err) {
                return [];
        })
    }
    card.prototype.checkListExists = async function (listId) {
        return this.connection.query(this.connectionObject,"SELECT * FROM list WHERE id='" + listId + "'")
            .then(function (data) {
                if (data.length == 0)
                    return false;
                else
                    return true;
            }).catch(function (err) {
                return true;
        })
    }
    card.prototype.createCards = async function (param)
    {        
        let self = this;
        let res = new response();
        let { userId, name,listId,boardId,description,isActive,dueDate,reminderDate,position } = param;
        // var checkBoardExists = await this.board.checkBoardExists(boardId);
        // var checkListExists = await this.checkListExists(listId);
        // if(checkBoardExists && checkListExists)
        // {
            
        // }else {
        //     res.message = "Board does not exists.";
        //     res.status = 403;
        //     return res;
        // }
        // var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
        //     var userRole = await this.board.checkUserRole(boardId, userId); 
        //     if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
        //     {
                
        //     }else {
        //         res.message = "User is not authorized.";
        //         res.status = 403;
        //         return res;
        //     }
        let insertBoardQuery = "INSERT INTO card (list_id,user_id, name, description,is_active, due_date, reminder_date, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            return this.connection.queryByArray(this.connectionObject, insertBoardQuery, [
                listId,
                userId,
                name,
                description || null,
                isActive || null,
                toMySQLDateTime(dueDate),
                toMySQLDateTime(reminderDate),
                position
            ])
            .then(function (data) {
                let query = "SELECT * FROM role";
                return self.connection.query(self.connectionObject, query)
                    .then(function (data2) {
                        console.log(data2);
                        
                    let roleId = null;
                    data2.forEach(function (e) {
                        if (e.role == "ROLE_SUPER_ADMIN")
                            roleId = e.id;
                    })
                    let insertCardUserQuery = "INSERT INTO card_user (user_id,card_id,role_id)" +
                    "VALUES('" +  userId + "','" + data.insertId + "','"+ roleId +"')";
                    return self.connection.query(self.connectionObject, insertCardUserQuery)
                        .then(async function (data3) {
                            console.log(data3);
                            let activityObject = {activity:activity.CARD_CREATE}
                            await addCardActivity(data.insertId, userId, activityObject, self);                            
                            res.message = "Card Has been created";
                            res.status = 200;
                                res.data = {...data3, lastInsertCardId:data.insertId};
                                return res;
                            }).catch(function (err) {
                                res.message = err;
                                res.status = 406;
                                return res;
                            })
                }).catch(function (err) {
                    console.log(err);
                    
                    res.message = err;
                    res.status = 406;
                    return res;
                })
        }).catch(function (err) {
            console.log(err);
            
            res.message = err;
            res.status = 406;
            return res;
        })
    }
    card.prototype.editCards = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, name,listId,boardId,description,isActive,isComplete,dueDate,reminderDate,cardId } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);
        if(checkBoardExists && checkListExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "UPDATE card"+
                                " SET list_id = ?, name = IFNULL(?, name), description = IFNULL(?, description), is_active = IFNULL(?, is_active), is_complete = IFNULL(?, is_complete), due_date = IFNULL(?, due_date), reminder_date = IFNULL(?, reminder_date)"+
                                " WHERE id = ?"
                return this.connection.queryByArray(this.connectionObject, insertBoardQuery, [
                    listId,
                    name,
                    description,
                    isActive,
                    isComplete,
                    toMySQLDateTime(dueDate),
                    toMySQLDateTime(reminderDate),
                    cardId
                ])
                .then(function (data) {                
                res.message = "Card Has been updated";
                res.status = 200;
                    res.data = data;
                    return res;
                }).catch(function (err) {
                    res.message = err;
                    res.status = 406;
                    return res;
                })
            }else {
                res.message = "User is not authorized.";
                res.status = 403;
                return res;
            }
        }else {
            res.message = "Board does not exists.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.setCardStatus = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, listId,boardId,isComplete,cardId } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);
        if(checkBoardExists && checkListExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "UPDATE card"+
                                " SET is_complete = ?"+
                                " WHERE id = ?"
                return this.connection.queryByArray(this.connectionObject, insertBoardQuery, [isComplete,cardId])
                    .then(async function (data) {    
                        console.log(data);
                        const activitiText = (isComplete ? activity.CARD_STATUS_COMPLETED : activity.CARD_STATUS_INCOMPLETE);
                        activityObject = {activity:activitiText}
                        await addCardActivity(cardId, userId, activityObject, self);
                        res.message = "Card Has been updated";
                        res.status = 200;
                            res.data = data;
                            return res;
                        }).catch(function (err) {
                            res.message = err;
                            res.status = 406;
                            return res;
                        })
                }else {
                    res.message = "User is not authorized.";
                    res.status = 403;
                    return res;
                }
            }else {
                res.message = "Board does not exists.";
                res.status = 403;
                return res;
            }
    }
    card.prototype.addUsers = async function (param)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId, users, cardId, boardId } = param;
        console.log("ADD USERS HUHUHUU ==================================");
        console.log(users);
        
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let selectExistingQuery = "SELECT user_id,role_id from card_user WHERE card_id='" + cardId + "' AND NOT user_id='"+authenticateUserId+"' ";
            return self.connection.query(self.connectionObject, selectExistingQuery)
                .then(function (existingUser) {            
                console.log("EXISTING USERS");
                console.log(users);
                console.log(existingUser);
                
                let incomingUserMap = new Map();
                users.forEach((e) => {
                    incomingUserMap.set(e.user_id, { user_id: e.user_id, roleId: e.roleId });
                })
                let existingUserMap = new Map();
                existingUser.forEach((e) => {
                    existingUserMap.set(e.user_id, { id: e.user_id, role: e.role_id });
                })
                // console.log(incomingUserMap);
                            
                let userToBeDeleted = [];
                let userToAddedd = [];
                if(existingUser.length > 0)
                {
                    existingUser.forEach((e) => {
                        if (!incomingUserMap.has(e.user_id)) {
                            userToBeDeleted.push({user_id:e.user_id});
                        } else {
                            userToAddedd.push(incomingUserMap.get(e.user_id))
                        }
                    });
                    if (users.length > 0)
                    {
                        users.forEach((e) => {
                            if (!existingUserMap.has(e.user_id)) {
                                userToAddedd.push(e);
                            }
                        });
                    }
                } else {
                    userToAddedd = users;
                }
                console.log("THOMBA");
                console.log(userToAddedd);
                console.log(cardId);
                
                return Promise.all([addUserToCard(0, userToAddedd, cardId,authenticateUserId, self), deleteUserToCard(0, userToBeDeleted, cardId,authenticateUserId, self)])
                    .then(([value, rest]) => { 
                    let arr = [value, ...rest];
                    let response = arr.reduce((e,j) => {
                        return Object.assign(e,j)
                    })
                    if (response.length == 0)
                        return [{status:200}]
                    return [...response];
                });
            })
        }else {
            res.message = "User is not authorized.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.addTag = async function (param)
    {
        
        let self = this;
        let res = new response();
        let { authenticateUserId,tag,color,cardId,boardId } = param;
        console.log(authenticateUserId);
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        // let tagExists = await this.checkTagIsExists(tag);
        let tagExistsInCard = await this.checkTagExistsInCard(tag, cardId);
        console.log(hasUser);
        console.log("TAGS"+userRoleForBoard);
        console.log("TAGS" +userRole);
        
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")) && (!tagExistsInCard))
        {
            let clr = color ? color : "#ccc";
            let query = "INSERT INTO tag (tag,color) VALUES('"+tag+"','"+clr+"')";
            return self.connection.query(self.connectionObject, query)
                .then(function (tag) {
                    const query2 = "INSERT INTO card_tag (card_id, tag_id) VALUES(" + cardId + "," + tag.insertId + ")";
                    return self.connection.query(self.connectionObject, query2)
                    .then(function (tag2) {
                        res.message = "Tag Has been added";
                        res.status = 200;
                        res.data = Object.assign(tag, tag2);
                        console.log("HUHUHUHU");
                        return res;
                        })
                    .catch((err) => {
                        console.log(err);
                    })
            })
            .catch((err) => {
                console.log(err);
            })
        }else {
            res.message = "User is not authorized.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.deleteCards = async function (param)
    {
        var self = this;
        let res = new response();
        let { boardId, listId, cardId } = param;
        let query1 = "DELETE FROM card_user WHERE card_id = '" + cardId + "'";
        let updateUserQuery = "DELETE FROM card " +
            "WHERE id='" + cardId + "'";
        let boardExists = await this.board.checkBoardExists(boardId);
        let listExists = await this.checkListExists(listId);
        let userCanEdit = await this.board.checkUserIsAuthenticated(param.boardId, param.userId);
        if (boardExists && listExists && userCanEdit)
        {
            return this.connection.query(this.connectionObject, query1)
                .then(function (data) {
                    if (boardExists && listExists && userCanEdit)
                {
                    return self.connection.query(self.connectionObject, updateUserQuery)
                        .then(function (data2) {                    
                            res.message = "Card Has been deleted";
                            res.status = 200;
                            res.data = data2;
                            return res;
                        });
                    }else {
                        res.message = "User is not authorized.";
                        res.status = 403;
                        return res;
                    }
                });
        }else {
            res.message = "User is not authorized.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.updateUserRole = async function (param)
    {
        let res = new response();
        let { authenticateUserId,userId, boardId,cardId, roleId } = param;
        let hasUser = await this.user.checkUserExistsById(userId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "UPDATE card_user SET role_id='"+ roleId +"' WHERE card_id='" + cardId + "' && user_id='"+userId+"'";
            return this.connection.query(this.connectionObject, query)
                .then(function (data3) {         
                res.message = "Users role has been updated";
                res.status = 200;
                    res.data = data3;
                    return res;
                }).catch(function (err) {
                    res.message = err;
                    res.status = 406;
                    return res;
            })
        }else {
            res.message = "User is not authorized.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.getAllCards = async function (param)
    {
        let res = new response();
        let { boardId,listId,userId } = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {            
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            if (userIsAuthenticated)
            {
                
                let query = "SELECT c.* FROM card c join card_user cu on cu.card_id = c.id "+
                "where c.list_id = " + listId + " and cu.user_id = " + userId + "";
                return this.connection.query(this.connectionObject, query)
                .then(function (data) {                                    
                res.message = "Cards Has been fetched";
                res.status = 200;
                    res.data = data;
                    return res;
                }).catch(function (err) {
                    console.log("err");
                    
                    res.message = err;
                    res.status = 406;
                    return res;
                })
            } else {
                res.message = "User is not authorized";
                res.status = 403;
                return res;
            }
            
        } else {
            res.message = "Board does not exists";
            res.status = 403;
            return res;
        }
        
    }
    card.prototype.getCardById = async function (param)
    {
        console.log("========================================================================");
        
        let res = new response();
        let { boardId,userId ,cardId} = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        console.log(boardExists);
        
        if (boardExists)
        {            
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            // if (userIsAuthenticated)
            // {
                let query = "SELECT cmnt2.comment, cmnt2.id as commentId, cmnt2.created_date as commentDate, cmnt2.commentUserName as cmntUser2, cmnt2.cmntUserId as cmntUserId, cli.name as cli_name,cli.id as cli_id,cli.is_checked as cli_isChecked, cli.position as cli_position, c.id,c.*,c.user_id as creator, u.id as user_id, concat(u.first_name,' ', u.last_name) as full_name, u.email, cu.role_id, r.role as role_name, t.tag, t.id as tagId FROM card c LEFT JOIN card_user cu on cu.card_id = c.id "+
                "left join user u on cu.user_id = u.id left join role r on r.id = cu.role_id left join card_tag ct on ct.card_id = c.id left join tag t on t.id = ct.tag_id LEFT JOIN checklist_item cli on cli.card_id = c.id LEFT JOIN (SELECT cmnt.*, concat(cmntUser.first_name, ' ',cmntUser.last_name) as commentUserName, cmntUser.email, cmntUser.id as cmntUserId FROM comment cmnt JOIN user cmntUser on cmntUser.id = cmnt.user_id WHERE cmnt.card_id= " + cardId + ") as cmnt2 on cmnt2.card_id = c.id  where c.id = " + cardId + "";
                return this.connection.query(this.connectionObject, query)
                    .then(function (data) {    
                        console.log(data);
                        
                    res.message = "Cards Has been fetched";
                    res.status = 200;                
                    const cardObject = {};
                    let cardUserSet = new Set();
                        let cardTagSet = new Set();
                        let checkListSet = new Set();
                        let commentSet = new Set();
                        data.forEach((e) => {
                            console.log(e);
                            console.log("HADIMBA");
                            
                        console.log(e.reminder_date);
                        
                        if (!cardObject.hasOwnProperty(e.id))
                        {
                            cardObject[e.id] = {};
                        }
                        cardObject[e.id].id = e.id;
                        cardObject[e.id].name = e.name;
                        cardObject[e.id].list_id = e.list_id;
                        cardObject[e.id].reminder_date = e.reminder_date;
                        cardObject[e.id].due_date = e.due_date;
                        cardObject[e.id].description = e.description;
                        cardObject[e.id].complete = e.is_complete;
                        cardObject[e.id].position = e.position;
                        // ADD USER
                        cardObject[e.id].users = cardObject[e.id].hasOwnProperty("users") ? cardObject[e.id].users : [];
                        if (!cardUserSet.has(e.user_id))
                        {
                            const creator = e.creator == e.user_id ? true : false;
                            cardObject[e.id].users.push({ id: e.user_id, name: e.full_name, email: e.email, creator, role_name: e.role_name, role: e.role_id });
                            cardUserSet.add(e.user_id);
                        }
                        // ADD TAG
                        cardObject[e.id].tags = cardObject[e.id].hasOwnProperty("tags") ? cardObject[e.id].tags : [];
                        if (!cardTagSet.has(e.tagId))
                        {
                            if(e.tagId)
                            {
                                cardObject[e.id].tags.push({ tagId: e.tagId, tagName: e.tag});
                                cardTagSet.add(e.tagId);
                            }
                        }
                        // ADD CHECKLIST
                        cardObject[e.id].checkList = cardObject[e.id].hasOwnProperty("checkList") ? cardObject[e.id].checkList : [];
                        if (!checkListSet.has(e.cli_id))
                        {
                            if (e.cli_id)
                            {
                                cardObject[e.id].checkList.push({ cliId: e.cli_id, cliName: e.cli_name, cliPosition: e.cli_position, cliIsChecked: e.cli_isChecked });
                                checkListSet.add(e.cli_id);
                            }
                        }
                        // ADD COMMENT
                        cardObject[e.id].comments = cardObject[e.id].hasOwnProperty("comments") ? cardObject[e.id].comments : [];
                        if (!commentSet.has(e.commentId))
                        {
                            if (e.commentId)
                            {
                                cardObject[e.id].comments.push({ id: e.commentId, user: e.cmntUser2, date: e.commentDate, comment:e.comment, userId:e.cmntUserId});
                                commentSet.add(e.commentId);
                            }
                        }
                        
                    })                   
                    res.data = cardObject; 
                    return res;
                    }).catch(function (err) {
                        console.log(err);
                        
                        res.message = err;
                        res.status = 406;
                        return res;
                    })
                    // } else {
                    //     res.message = "User is not authorized";
                    //     res.status = 403;
                    //     return res;
                    // }
        } else {
            res.message = "Board does not exists";
            res.status = 403;
            return res;
        }
    }
    card.prototype.getCardActivity = async function (params)
    {
        let res = new response();
        let { boardId,userId ,cardId} = params;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists) {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            if (userIsAuthenticated) {
                let query = "SELECT cacl.checklistName, card_activity.*, concat(u.first_name,' ',u.last_name) as full_name , u.email, caau.editedUserFullName, caau.editedUserEmail , caau.editedUserId, caau.type FROM card_activity JOIN user u on card_activity.user_id = u.id LEFT JOIN (SELECT ca.type, ca.card_activity_id, ca.created_date, concat(u.first_name,' ',u.last_name) as editedUserFullName, u.email as editedUserEmail, u.id as editedUserId FROM `card_activity_added_user` ca JOIN user u on ca.added_user_id = u.id ) as caau on card_activity.id = caau.card_activity_id AND card_activity.created_date = caau.created_date LEFT JOIN (SELECT cl.card_activity_id,cl.added_checklist_id, cli.name as checklistName FROM `card_activity_added_checklist` cl JOIN `checklist_item` cli on cl.added_checklist_id = cli.id) as cacl ON  cacl.card_activity_id = card_activity.id WHERE card_id = " + cardId + "";
                return this.connection.query(this.connectionObject, query)
                    .then(function (data) { 
                        if(data.length > 0)
                        {
                            res.status = 200;
                            res.data = data; 
                        } else {
                            res.status = 406;
                            res.data = data; 
                        }
                        return res;
                    })
                    .catch(function (err) {
                        console.log(err);
                        res.message = err;
                        res.status = 406;
                        return res;
                    })
            } else {
                        res.message = "User is not authorized";
                        res.status = 403;
                        return res;
                    }
        } else {
            res.message = "Board does not exists";
            res.status = 403;
            return res;
        }
    }
    card.prototype.getTagByKeyWord = async function (param)
    {
        let res = new response();
        let {userId,boardId,searchKey} = param;
         var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            if (userIsAuthenticated)
            {
                
                let query = "SELECT * FROM tag WHERE tag LIKE '%"+searchKey+"%'";
                return this.connection.query(this.connectionObject, query)
                .then(function (data) {      
                    res.message = "Tags Has been fetched";
                    res.status = 200;                    
                    res.data = data; 
                return res;
                }).catch(function (err) {
                    console.log(err);
                    res.message = err;
                    res.status = 406;
                    return res;
                })
                } else {
                    res.message = "User is not authorized";
                    res.status = 403;
                    return res;
                }
        
    }
    card.prototype.removeTag = async function (param)
    {
        let res = new response();
        let { boardId,userId ,cardId,tagId} = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            if (userIsAuthenticated)
            {
                let query = "DELETE t,ct FROM card_tag ct JOIN tag t ON ct.tag_id = t.id WHERE tag_id="+tagId+" AND card_id="+cardId+"";
                return this.connection.query(this.connectionObject, query)
                .then(function (data) {                          
                    res.message = "Cards Has been deleted";
                    res.status = 200;                
                    res.data = data;
                return res;
                }).catch(function (err) {
                    console.log(err);
                    res.message = err;
                    res.status = 406;
                    return res;
                })
                } else {
                    res.message = "User is not authorized";
                    res.status = 403;
                    return res;
                }
        } else {
            res.message = "Board does not exists";
            res.status = 403;
            return res;
        }
        
    }
    card.prototype.addCheckListItem = async function (params)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId,cardId,boardId,name,isChecked,position } = params;
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "INSERT INTO `checklist_item` (card_id,name,is_checked,position) VALUES('"+cardId+"','"+name+"','"+isChecked+"', '"+position+"')";
            return self.connection.query(self.connectionObject, query)
                .then(async function (data) {
                const activityObject = {activity:activity.CARD_CHECKLIST_ADDED,hasChecklist:true,type:1,checklistId:data.insertId}
                await addCardActivity(cardId, authenticateUserId, activityObject, self);
                res.message = "Checklist Has been added";
                res.status = 200;
                res.data = Object.assign(data);
                return res;
                        })
            .catch((err) => {
                console.log(err);
            })
        }
    }
    card.prototype.editCheckListItem = async function (params)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId,cardId,boardId,id,name,isChecked,position } = params;
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "UPDATE `checklist_item` set name='"+name+"', is_checked='"+isChecked+"', position='"+position+"' where id='"+id+"'";
            return self.connection.query(self.connectionObject, query)
                .then(async function (data) {
                const activityObject = {activity:activity.CARD_CHECKLIST_EDITED,hasChecklist:true,type:1,checklistId:id}
                await addCardActivity(cardId, authenticateUserId, activityObject, self);
                res.message = "Checklist Has been updated";
                res.status = 200;
                res.data = Object.assign(data);
                return res;
                        })
            .catch((err) => {
                console.log(err);
            })
        }
    }
    card.prototype.deleteCheckListItem = async function (params)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId,cardId,boardId,id } = params;
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "DELETE FROM `checklist_item` where id='"+id+"'";
            return self.connection.query(self.connectionObject, query)
                .then(async function (data) {
                const activityObject = {activity:activity.CARD_CHECKLIST_DELETE,hasChecklist:true,type:0,checklistId:null}
                await addCardActivity(cardId, authenticateUserId, activityObject, self);
                res.message = "Checklist Has been deleted";
                res.status = 200;
                res.data = Object.assign(data);
                return res;
                        })
            .catch((err) => {
                console.log(err);
            })
        }
    }
    card.prototype.createComments = async function (params)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId,listId,boardId , cardId,comment,date} = params;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);        
        if (checkBoardExists && checkListExists) {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, authenticateUserId);
            var userRole = await this.checkUserRole(cardId, authenticateUserId);
            if (userIsAuthenticated && userRole.length > 0) {
                let query = "INSERT INTO comment (card_id,user_id,comment,created_date) VALUES ('" + cardId + "', '" + authenticateUserId + "','" + comment + "', '" + toMySQLDateTime(date) + "')";
                return this.connection.query(this.connectionObject, query)
                    .then(async function (data) {
                    res.message = "Comment Has been added";
                    res.status = 200;
                        res.data = data;
                        return res;
                    }).catch(function (err) {
                        console.log("err");
                        res.message = err;
                        res.status = 406;
                        return res;
                    })
            }else {
                res.message = "User is not authorized.";
                res.status = 403;
                return res;
            }
        }else {
            res.message = "Board does not exists.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.editComments = async function (params)
    {
        let res = new response();
        let { authenticateUserId,listId,boardId , cardId,comment,id} = params;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);        
        if (checkBoardExists && checkListExists) {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, authenticateUserId);
            var userRole = await this.checkUserRole(cardId, authenticateUserId);
            if (userIsAuthenticated && userRole.length > 0) {
                let query = "UPDATE comment SET comment = '"+ comment + "' WHERE id='"+id+"'";
                return this.connection.query(this.connectionObject, query)
                .then(function (data) {                                    
                res.message = "Comment Has been edited";
                res.status = 200;
                    res.data = data;
                    return res;
                }).catch(function (err) {
                    console.log("err");
                    res.message = err;
                    res.status = 406;
                    return res;
                })
            }else {
                res.message = "User is not authorized.";
                res.status = 403;
                return res;
            }
        }else {
            res.message = "Board does not exists.";
            res.status = 403;
            return res;
        }
    }
    card.prototype.updatePosition = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, boardId,cards } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")) {
                return updatePosition(0, cards, self);
            } else {
                res.message = "User not authorized";
                res.status = 403;
                return [res];
            }
        }else {
            res.message = "Board does not exists.";
            res.status = 403;
            return [res];
        }
    }
    const addMultipleTags = async function (idx,tags,userId,cardId,boardId,self)
    {
        console.log(tags);
        
        if (idx > tags.length - 1)
        {
            return [];
        }
        const p1 = new Promise(async (resolve, reject) => {
            try {
                self.addTag({ authenticateUserId: userId, tag: tags[idx].tagName, color: tags[idx].color, cardId, boardId }).then(async (e) => {
                    await addMultipleTags(idx + 1,tags,userId,cardId,boardId,self);
                    resolve(e);
                })
            } catch (error) {
                console.log(error);
                reject(error);
            }
        })
        return p1.then((e) => {
            console.log("RESPONSE");
            return e;
        });
    }
    const addMultipleChecklist = async function (idx,checkList,userId,cardId,boardId,self)
    {        
        if (idx > checkList.length - 1)
        {
            return [];
        }
        const p1 = new Promise(async (resolve, reject) => {
            try {
                self.addCheckListItem({ authenticateUserId: userId, name: checkList[idx].cliName, isChecked: checkList[idx].cliIsChecked, position: checkList[idx].cliPosition, cardId, boardId })
                    .then(async (e) => {
                        await addMultipleChecklist(idx + 1, checkList, userId, cardId, boardId, self);
                        resolve(e)
                })
            } catch (err) {
                console.log(err);
                reject(err);
            }
        })
        return p1.then((e) => {
            console.log("CHECKLIST RESPONSE");
            console.log(e);
            return e;
        });
    }
    const copyCardHelper = async function (idx, listIds,userIds,tagIds,checkListIds,userId,card,boardId, self)
    {
        console.log(idx+" CALL =================================================");
        
        if (idx > listIds.length - 1)
        {
            return [];
        }
            try {
                const addedCard = await self.createCards({ userId, name: card.data[Object.keys(card.data)[0]].name, listId: listIds[idx], description: card.data[Object.keys(card.data)[0]].description, isActive: card.data[Object.keys(card.data)[0]].complete, dueDate: card.data[Object.keys(card.data)[0]].reminder_date, reminderDate: card.data[Object.keys(card.data)[0]].reminder_date, position: card.data[Object.keys(card.data)[0]].position });
                console.log("ADDED CARD HUHU STARTS ====================================");
                console.log(addedCard);
                console.log(userIds);
                console.log(tagIds);
                console.log(checkListIds);
                console.log("ADDED CARD HUHU ENDS ====================================");
                if (userIds && userIds.length > 0)
                {
                    const p1 = new Promise(async (resolve, reject) => {
                        self.addUsers({ authenticateUserId: userId, users: userIds, cardId: addedCard.data.lastInsertCardId, boardId }).then(async (e) => {
                        console.log("USER ADDDED ===========");
                        console.log(e);
                        if (e[0].status && e[0].status == 200)
                        {
                            console.log(tagIds);
                            
                            if (tagIds && tagIds.length > 0)
                            {
                                addMultipleTags(0, tagIds, userId, addedCard.data.lastInsertCardId, boardId, self).then(async(e2) => {
                                    console.log("TAG========");
                                    console.log(e2.status);
                                    if (e2.status && e2.status == 200) {
                                        if (checkListIds && checkListIds.length > 0)
                                        {
                                            console.log(checkListIds);
                                            
                                            addMultipleChecklist(0, checkListIds, userId, addedCard.data.lastInsertCardId, boardId, self).then(async (e3) => {
                                                await copyCardHelper(idx + 1, listIds, userIds, tagIds, checkListIds, userId, card, boardId, self);
                                                resolve({ status: 200, message: "Hoyegechhe" });
                                            })
                                        } else {
                                            await copyCardHelper(idx + 1, listIds, userIds, tagIds, checkListIds, userId, card, boardId, self);
                                            resolve({ status: 200, message: "Hoyegechhe" });
                                        }
                                    }
                                })
                                
                            } else {
                                await copyCardHelper(idx + 1, listIds, userIds, tagIds, checkListIds, userId, card, boardId, self);
                                resolve({ status: 200, message: "Hoyegechhe" });
                            }
                        }
                    })
                    })
                    return p1.then((e) => {
                        console.log(e);
                        
                        return e;
                    });
                } else {
                    return addedCard;
                }
            } catch (error) {
                console.log(error);
                reject(error);
            }
    }
    card.prototype.copyCard = async function (params)
    {
        let res = new Response();
        let self = this;
        const { authenticateUserId,boardId,listId, cardId, listIds, withUser, withTags, withChecklist, checkListIds, } = params;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);        
        if (checkBoardExists && checkListExists) {
            let hasUser = await this.user.checkUserExistsById(authenticateUserId);
            let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
            let userRole = await this.checkUserRole(cardId, authenticateUserId);
            if (listIds.length > 0 && hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
            {
                
                let card = await this.getCardById({ boardId, userId: authenticateUserId, cardId });
                console.log("FETCHED CARD ================================");
                console.log(card);
                console.log(card.data[cardId].users);
                console.log(card.data[cardId].tags);
                console.log(card.data[cardId].checkList);
                console.log(listIds);
                
                return copyCardHelper(0, listIds, card.data[cardId].users, card.data[cardId].tags, card.data[cardId].checkList, authenticateUserId, card, boardId, self).then((e) => {
                    console.log(e);
                    return e
                })
                //console.log(copiedCard);
                return {};
            }else {
                res.message = "User is not authorized.";
                res.status = 403;
                return res;
            }
        }else {
            res.message = "Board or List does not exists.";
            res.status = 403;
            return res;
        }
    }
    return card;
})();
module.exports = cardController;