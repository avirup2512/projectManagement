var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");
const userController = require("./user");
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
    function addUserToCard(idx, users,cardId,self)
    {
        let res = new response();
        if (idx > users.length - 1)
        {
            return [];
        }
        let query = "INSERT INTO card_user (user_id,card_id,role_id)" +
        "VALUES('" + users[idx].user_id + "','" + cardId + "','" + users[idx].roleId + "') ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);";
        const p1 = new Promise((resolve, reject) => {
            self.connection.query(self.connectionObject, query)
                .then(function (data3) {
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
        const p2 = addUserToCard(idx + 1, users, cardId, self);
        return Promise.all([p1, p2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
    }
    const deleteUserToCard = function (idx, users,cardId,self)
    {
        console.log(users);
        
        let res = new response();
        if(idx > users.length-1)
        {
            return [];
        }
        let insertBoardUserQuery = "DELETE FROM card_user WHERE card_id= '"+cardId+"' AND user_id = '"+users[idx].user_id+"'";
        let pr = new Promise((resolve, reject) => {
                self.connection.query(self.connectionObject, insertBoardUserQuery)
                .then(function (data3) {  
                data3.cardId = cardId;      
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
        let pr2 = deleteUserToCard(idx+1, users,cardId,self)
        return Promise.all([pr, pr2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
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
        let { userId, name,listId,boardId,description,isActive,dueDate,reminderDate } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var checkListExists = await this.checkListExists(listId);
        if(checkBoardExists && checkListExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId); 
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "INSERT INTO card (list_id,user_id, name, description,is_active, due_date, reminder_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
                return this.connection.queryByArray(this.connectionObject, insertBoardQuery, [
                    listId,
                    userId,
                    name,
                    description || null,
                    isActive || null,
                    toMySQLDateTime(dueDate),
                    toMySQLDateTime(reminderDate)
                ])
                    .then(function (data) {
                        let query = "SELECT * FROM role";
                        return self.connection.query(self.connectionObject, query)
                            .then(function (data2) {
                            let roleId = null;
                            data2.forEach(function (e) {
                                if (e.role == "ROLE_SUPER_ADMIN")
                                    roleId = e.id;
                            })
                            let insertCardUserQuery = "INSERT INTO card_user (user_id,card_id,role_id)" +
                            "VALUES('" +  userId + "','" + data.insertId + "','"+ roleId +"')";
                            return self.connection.query(self.connectionObject, insertCardUserQuery)
                                .then(function (data3) {                
                            res.message = "Card Has been created";
                            res.status = 200;
                                res.data = data3;
                                return res;
                            }).catch(function (err) {
                                res.message = err;
                                res.status = 406;
                                return res;
                        })
                        }).catch(function (err) {
                            res.message = err;
                            res.status = 406;
                            return res;
                        })
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
    card.prototype.addUsers = async function (param)
    {
        let self = this;
        let res = new response();
        let { authenticateUserId,users,cardId,boardId } = param;
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let selectExistingQuery = "SELECT user_id,role_id from card_user WHERE card_id='" + cardId + "' AND NOT user_id='"+authenticateUserId+"' ";
            return self.connection.query(self.connectionObject, selectExistingQuery)
            .then(function (existingUser) {                            
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
                } else {
                    userToAddedd = users;
                }
                if (users.length > 0)
                {
                    users.forEach((e) => {
                        if (!existingUserMap.has(e.user_id)) {
                            userToAddedd.push(e);
                        }
                    });
                }
                return Promise.all([addUserToCard(0, userToAddedd, cardId, self), deleteUserToCard(0, userToBeDeleted, cardId, self)])
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
            // users.push({ user_id: userId, role: roleId });
            return addUserToCard(0, users, cardId, self);
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
        let { authenticateUserId,tag,cardId,boardId } = param;
        let hasUser = await this.user.checkUserExistsById(authenticateUserId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "INSERT INTO tag (tag) VALUES('"+tag+"')";
            return self.connection.query(self.connectionObject, query)
                .then(function (tag) {
                    const query2 = "INSERT INTO card_tag (card_id, tag_id) VALUES(" + cardId + "," + tag.insertId + ")";
                    return self.connection.query(self.connectionObject, query)
                    .then(function (tag) {
                        res.message = "Tag Has been added";
                        res.status = 200;
                        res.data = data;
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
        let {boardId,listId} = param;
        let updateUserQuery = "DELETE FROM list " +
            "WHERE id='" + listId + "'";
        let boardExists = await this.board.checkBoardExists(boardId);
        let listExists = await this.checkListExists(listId);
        let userCanEdit = await this.board.checkUserIsAuthenticated(param.boardId, param.userId);
        if (boardExists && listExists && userCanEdit)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {                    
                    res.message = "List Has been deleted";
                    res.status = 200;
                    res.data = data;
                    return res;
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
        let res = new response();
        let { boardId,userId ,cardId} = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {            
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, userId);
            if (userIsAuthenticated)
            {
                
                let query = "SELECT c.id,c.*,c.user_id as creator, u.id as user_id, concat(u.first_name,' ', u.last_name) as full_name, u.email, cu.role_id, r.role as role_name, t.tag, t.id as tagId FROM card c join card_user cu on cu.card_id = c.id "+
                "join user u on cu.user_id = u.id join role r on r.id = cu.role_id left join card_tag ct on ct.card_id = c.id left join tag t on t.id = ct.tag_id where c.id = " + cardId + " and c.user_id = " + userId + "";
                return this.connection.query(this.connectionObject, query)
                    .then(function (data) {      
                    console.log(data);
                    
                res.message = "Cards Has been fetched";
                res.status = 200;                
                const cardObject = {};
                let cardUserSet = new Set();
                let cardTagSet = new Set();
                data.forEach((e) => {
                    if (!cardObject.hasOwnProperty(e.id))
                    {
                        cardObject[e.id] = {};
                    }
                    cardObject[e.id].id = e.id;
                    cardObject[e.id].name = e.name;
                    cardObject[e.id].list_id = e.list_id;
                    cardObject[e.id].reminder_date = e.reminder_date;
                    cardObject[e.id].description = e.description;
                    cardObject[e.id].complete = e.is_complete;

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
                            const creator = e.creator == e.user_id ? true : false;
                            cardObject[e.id].tags.push({ tagId: e.tagId, tagName: e.tag});
                            cardTagSet.add(e.tagId);
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
    return card;
})();
module.exports = cardController;