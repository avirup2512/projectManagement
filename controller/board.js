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
    const addBoardUser = function (idx, users,boardId,self)
    {
        let res = new response();
        if(idx > users.length-1)
        {
            return [];
        }
        let insertBoardUserQuery = "INSERT INTO board_user (user_id,board_id,role_id)" +
            "VALUES('" +  users[idx].user_id + "','" + boardId + "','"+ users[idx].role +"') ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)";
        let pr = new Promise((resolve, reject) => {
                self.connection.query(self.connectionObject, insertBoardUserQuery)
                .then(function (data3) {  
                data3.boardId = boardId;      
                res.message = "Board Has been created";
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
        let pr2 = addBoardUser(idx+1, users,boardId,self)
        return Promise.all([pr, pr2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
    }
    const deleteBoardUser = function (idx, users,boardId,self)
    {
        let res = new response();
        if(idx > users.length-1)
        {
            return [];
        }
        let insertBoardUserQuery = "DELETE FROM board_user WHERE board_id= '"+boardId+"' AND user_id = '"+users[idx].user_id+"'";
        let pr = new Promise((resolve, reject) => {
                self.connection.query(self.connectionObject, insertBoardUserQuery)
                .then(function (data3) {  
                data3.boardId = boardId;      
                res.message = "Board Has been deleted";
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
        let pr2 = deleteBoardUser(idx+1, users,boardId,self)
        return Promise.all([pr, pr2]).then(([value, rest]) => { 
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        });
    } 
    board.prototype.checkUserIsAuthenticated = async function (boardId, userId) {
        let query = "SELECT (SELECT user_id FROM board WHERE id='" + boardId + "' && user_id='" + userId + "') as board" +
                    "(SELECT user_id FROM board_user WHERE board_id='" + boardId + "' && user_id='" + userId + "') as board_user" 
        return this.connection.query(this.connectionObject,query)
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
        let { userId, name, isPublic, users } = param;  
        if (!users)
        {
            users = [];
        }
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
                    users.push({ user_id: userId, role: roleId });
                    return addBoardUser(0, users, data.insertId, self);
                }).catch(function (err) {
                console.log(err);
                
                res.message = err;
                res.status = 406;
                return res;
            })
            }).catch(function (err) {         
                console.log(err);
                
            res.message = err;
            res.status = 408;
            return res;
        })
    }
    board.prototype.editBoard = async function (param)
    {
        let self = this;
        let res = new response();
        let { boardId, name, isPublic, users,userId } = param;  
        if (!users)
        {
            users = [];
        }
        if (isPublic === undefined)
            isPublic = 0;
        let updateUserQuery = "UPDATE board SET name = '" + name + "',is_public = '" + isPublic + "' WHERE id="+boardId+"";
        var userCanEdit = await this.checkUserIsAuthenticated(param.boardId, param.userId);
        let boardExists = await this.checkBoardExists(param.boardId);
        if (boardExists && userCanEdit)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {
                    let selectExistingQuery = "SELECT user_id from board_user WHERE board_id='" + boardId + "' AND NOT user_id='"+userId+"' ";
                    return self.connection.query(self.connectionObject, selectExistingQuery)
                        .then(function (existingUser) {                            
                            let incomingUserMap = new Map();
                            users.forEach((e) => {
                                incomingUserMap.set(e.user_id, { user_id: e.user_id, role: e.role });
                            })
                            let existingUserMap = new Map();
                            existingUser.forEach((e) => {
                                existingUserMap.set(e.user_id, { user_id: e.user_id, role: e.role });
                            })
                            console.log(incomingUserMap);
                            
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
                            return Promise.all([addBoardUser(0, userToAddedd, boardId, self), deleteBoardUser(0, userToBeDeleted, boardId, self)])
                                .then(([value, rest]) => { 
                                let arr = [value, ...rest];
                                let response = arr.reduce((e,j) => {
                                    return Object.assign(e,j)
                                })
                                if (response.length == 0)
                                    return [{status:200}]
                                return [...response];
                            });
                    });
                });
        } else {
            res.message = "User is not authorized.";
            res.status = 403;
            return [res];
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
        console.log("USER_ID");
        let res = new response();
        let { userId } = param;        
        console.log(userId);
        let query = "SELECT  b.id AS board_id, b.user_id, b.name AS board_name, bu.user_id AS board_user_id, u.first_name, u.last_name, r.role, r.id as role_id FROM  board b JOIN  board_user bu ON b.id = bu.board_id JOIN user u on u.id = bu.user_id  JOIN  role r ON bu.role_id = r.id "+
        "WHERE b.id IN (SELECT board_id FROM board_user WHERE user_id = "+userId+") "+
        "ORDER BY b.id";       
        return this.connection.query(this.connectionObject, query)
            .then(function (data) {
                let boardResponse = {};
                data.forEach((e) => {
                if (!boardResponse.hasOwnProperty(e.board_id))
                {
                    boardResponse[e.board_id] = {};
                }
                    boardResponse[e.board_id].name = e.board_name;
                    boardResponse[e.board_id].id = e.board_id;
                    boardResponse[e.board_id].board_user_id = e.user_id;
                    const creator = e.user_id == e.board_user_id ? true : false;
                if (boardResponse[e.board_id].user && boardResponse[e.board_id].user.length > 0)
                {
                    boardResponse[e.board_id].user.push({ id: e.board_user_id, role: e.role, role_id:e.role_id, first_name: e.first_name, last_name: e.last_name, email: e.email, creator });
                } else {
                    boardResponse[e.board_id].user = [];
                    boardResponse[e.board_id].user.push({id:e.board_user_id,role:e.role, role_id:e.role_id, first_name:e.first_name, last_name:e.last_name,email:e.email, creator})
                }
            })
            res.message = "Board Has been fetched";
            res.status = 200;
                res.data = boardResponse;
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
        if (hasUser && hasBoard && userRole.length > 0 && userRole[0].role_name == "ROLE_SUPER_ADMIN")
        {
            let query = "UPDATE board_user SET role_id='"+ roleId +"' WHERE board_id='" + boardId + "' && user_id='"+userId+"'";
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
    board.prototype.getAllUser = async function (param)
    {
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT u.* FROM user u join board_user bu on bu.user_id = u.id  WHERE bu.board_id="+boardId+"")
            .then(function (data) {
                if (data.length == 0) {
                    result.message = false;
                    result.status = 404
                    return result;
                }
                else {
                    result.message = true;
                    result.data = data[0];
                    result.status = 200;
                    return result;
                }
            }).catch(function (err) {
                result.message = false;
                result.data = err;
                return result;
            })
    }
    return board;
})();
module.exports = boardController;