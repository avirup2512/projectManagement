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
                let insertBoardQuery = "INSERT INTO card (list_id, name, description,is_active, due_date, reminder_date) VALUES (?, ?, ?, ?, ?, ?)";
                return this.connection.queryByArray(this.connectionObject, insertBoardQuery, [
                    listId,
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
        var checkBoardExists = await this.board.checkBoardExists(listId);
        var checkListExists = await this.checkListExists(listId);
        if(checkBoardExists && checkListExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "UPDATE card"+
                                " SET list_id = ?, name = ?, description = ?, is_active = ?, is_complete = ?, due_date = ?, reminder_date = ?"+
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
    card.prototype.addUser = async function (param)
    {
        let res = new response();
        let { authenticateUserId, userId, listId, roleId,cardId,boardId } = param;
        let hasUser = await this.user.checkUserExistsById(userId);
        let userRoleForBoard = await this.board.checkUserRole(boardId, authenticateUserId);
        let userRole = await this.checkUserRole(cardId, authenticateUserId);
        if (hasUser && (userRoleForBoard.length > 0 && userRoleForBoard[0].role_name == "ROLE_SUPER_ADMIN") && (userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")))
        {
            let query = "INSERT INTO card_user (user_id,card_id,role_id)" +
                "VALUES('" + userId + "','" + cardId + "','" + roleId + "')";
                return this.connection.query(this.connectionObject, query)
                .then(function (data3) {                
                res.message = "Users Has been added";
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
                let query = "SELECT * FROM card WHERE list_id=" + listId + "";
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
    return card;
})();
module.exports = cardController;