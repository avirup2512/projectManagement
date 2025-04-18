var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const userController = require("./user");
var boardController = (function () {
    let connection;
    let connectionObject;
    let user;
    function board(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.user = new userController(this.connection,this.connectionObject)
    }
    board.prototype.checkUserIsAuthenticated = async function (boardId,userId) {
        return this.connection.query(this.connectionObject,"SELECT user_id FROM board WHERE id='" + boardId + "' && user_id='"+userId+"'")
            .then(function (data) {
                if (data.length == 0)
                    return false;
                else
                    return true;
            }).catch(function (err) {
                return true;
        })
    }
    board.prototype.checkUserRole = async function (boardId, userId) {
        let query = "SELECT DISTINCT r.role AS role_name " +
            "FROM board_user bu " +
            "JOIN role r ON bu.role_id = r.id " +
            "WHERE bu.user_id = '" + userId + "' AND bu.board_id = " + boardId + "";
        console.log(query);
        
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
    board.prototype.checkBoardExists = async function (boardId) {
        return this.connection.query(this.connectionObject,"SELECT * FROM board WHERE id='" + boardId + "'")
            .then(function (data) {
                if (data.length == 0)
                    return false;
                else
                    return true;
            }).catch(function (err) {
                return true;
        })
    }
    board.prototype.checkRole = function (role) {
        let response = {};
        return this.connection.query(this.connectionObject,"SELECT * FROM role WHERE role='" + role + "'")
            .then(function (data) {
                if (data.length == 0)
                {
                    response.message = false;
                    return response;
                }
                else
                {
                    response.message = true;
                    response.role = data[0];
                    return response;
                }
                    return true;
            }).catch(function (err) {
                response.message = false;
                return response;
        })
    }
    board.prototype.createBoard = async function (param)
    {        
        let self = this;
        let res = new response();
        let { userId, name, isPublic } = param;        
        if (isPublic === undefined)
            isPublic = 0;
        let insertBoardQuery = "INSERT INTO board (user_id,name,is_public)" +
            "VALUES('" + userId + "','" + name + "','" + isPublic + "')";
        return this.connection.query(this.connectionObject, insertBoardQuery)
            .then(function (data) {
            let query = "SELECT * FROM role";
            return self.connection.query(self.connectionObject, query)
                .then(function (data2) {
                let roleId = null;
                data2.forEach(function (e) {
                    if (e.role == "ROLE_SUPER_ADMIN")
                        roleId = e.id;
                })
                let insertBoardUserQuery = "INSERT INTO board_user (user_id,board_id,role_id)" +
                "VALUES('" +  userId + "','" + data.insertId + "','"+ roleId +"')";
                return self.connection.query(self.connectionObject, insertBoardUserQuery)
                    .then(function (data3) {                
                res.message = "Board Has been created";
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
            res.status = 408;
            return res;
        })
    }
    board.prototype.editBoard = async function (param)
    {
        var self = this;
        let res = new response();
        let { name, isPublic } = param;
        let updateUserQuery = "UPDATE board SET name = '" + name + "',is_public = '" + isPublic + "' WHERE id="+param.boardId+"";
        var userCanEdit = await this.checkUserIsAuthenticated(param.boardId, param.userId);
        let boardExists = await this.checkBoardExists(param.boardId);
        if (boardExists && userCanEdit)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {                    
                    res.message = "Board Has been updated";
                    res.status = 200;
                    res.data = data;
                    return res;
                });
        } else {
            res.message = "User is not authorized.";
            res.status = 403;
            return res;
        }
    }
    board.prototype.deleteBoard = async function (param)
    {
        var self = this;
        let res = new response();
        let {boardId} = param;
        let updateUserQuery = "DELETE FROM board " +
            "WHERE id='" + boardId + "'";
        let boardExists = await this.checkBoardExists(param.boardId);
        let userCanEdit = await this.checkUserIsAuthenticated(param.boardId, param.userId);
        if (boardExists && userCanEdit)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {                    
                    res.message = "Board Has been deleted";
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
    board.prototype.getAllBoard = async function (param)
    {
        let res = new response();
        let { userId } = param;        
        let query = "SELECT b.* FROM board b  JOIN `board_user` bu ON b.id = bu.board_id WHERE bu.user_id=" + userId + "";        
        return this.connection.query(this.connectionObject, query)
            .then(function (data) {                
                    console.log("data");
                    
            res.message = "Board Has been fetched";
            res.status = 200;
                res.data = data;
                return res;
            }).catch(function (err) {
                console.log("err");
                
                res.message = err;
                res.status = 406;
                return res;
            })
    }
    board.prototype.addUser = async function (param)
    {
        let res = new response();
        let { authenticateUserId,userId, boardId, roleId } = param;
        let hasUser = await this.user.checkUserExistsById(userId);
        let hasBoard = await this.checkBoardExists(boardId);
        let userRole = await this.checkUserRole(boardId, authenticateUserId);
        console.log(hasBoard);
        console.log(hasUser);
        console.log(userRole);
        
        
        
        if (hasUser && hasBoard && userRole.length > 0 && userRole[0].role_name == "ROLE_SUPER_ADMIN")
        {
            let query = "INSERT INTO board_user (user_id,board_id,role_id)" +
                "VALUES('" + userId + "','" + boardId + "','" + roleId + "')";
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
    board.prototype.updateUserRole = async function (param)
    {
        let res = new response();
        let { authenticateUserId,userId, boardId, roleId } = param;
        let hasUser = await this.user.checkUserExistsById(userId);
        let hasBoard = await this.checkBoardExists(boardId);
        let userRole = await this.checkUserRole(boardId, authenticateUserId);
        console.log(boardId);
        console.log(userId);
        
        if (hasUser && hasBoard && userRole.length > 0 && userRole[0].role_name == "ROLE_SUPER_ADMIN")
        {
            let query = "UPDATE board_user SET role_id='"+ roleId +"' WHERE board_id='" + boardId + "' && user_id='"+userId+"'";
            return this.connection.query(this.connectionObject, query)
                .then(function (data3) {         
                        console.log(data3);
                        
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
    return board;
})();
module.exports = boardController;