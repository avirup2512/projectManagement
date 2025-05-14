var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");
var settingController = (function () {
    let connection;
    let connectionObject;
    let board;
    function setting(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection,this.connectionObject)
    }
    setting.prototype.checkListExists = async function (listId) {
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
    setting.prototype.createList = async function (param)
    {        
        let self = this;
        let res = new response();
        let { userId, name, boardId, position } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);       
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            console.log(userRole[0]);
            console.log(userIsAuthenticated);
            
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "INSERT INTO list (board_id,name,position)" +
                "VALUES('" + boardId + "','" + name + "','" + position + "')";
                return this.connection.query(this.connectionObject, insertBoardQuery)
                .then(function (data) {                
                res.message = "List Has been created";
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
    setting.prototype.editList = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, name, boardId,listId, position } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var listExists = await this.checkListExists(listId);
        if(checkBoardExists && listExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "UPDATE list SET name = '" + name + "',position = '" + position + "' WHERE id="+ listId +"";
                return this.connection.query(this.connectionObject, insertBoardQuery)
                .then(function (data) {                
                res.message = "List Has been updated";
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
    setting.prototype.deleteList = async function (param)
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
    setting.prototype.getExistingRoles = async function ()
    {
        let res = new response();
        try {
            let query = "SELECT * FROM role";
            return this.connection.query(this.connectionObject, query)
            .then(function (data) {                                    
            res.message = "Roles Has been fetched";
            res.status = 200;
                res.data = data;
                return res;
            }).catch(function (err) {
                console.log("err");
                
                res.message = err;
                res.status = 406;
                return res;
            }) 
        } catch (error) {
            res.message = error;
            res.status = 403;
            return res;
        }
    }
    return setting;
})();
module.exports = settingController;