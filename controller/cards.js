var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");
var cardController = (function () {
    let connection;
    let connectionObject;
    let board;
    function card(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection,this.connectionObject)
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
        let { userId, name,listId,boardId,description,dueDate,reminderDate } = param;
        var checkBoardExists = await this.board.checkBoardExists(listId);
        var checkListExists = await this.checkListExists(listId);
        if (dueDate == undefined)
            dueDate = '0000-00-00 00:00:00';
        if (reminderDate == undefined)
            reminderDate = '0000-00-00 00:00:00';
        if(checkBoardExists && checkListExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "INSERT INTO card (list_id,name,description,due_date,reminder_date)" +
                "VALUES('" + listId + "','" + name + "','" + description + "','" + dueDate + "','" + reminderDate + "')";
                return this.connection.query(this.connectionObject, insertBoardQuery)
                .then(function (data) {                
                res.message = "Card Has been created";
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
    card.prototype.editCards = async function (param)
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
    card.prototype.getAllCards = async function (param)
    {
        let res = new response();
        let { boardId } = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {
            let query = "SELECT * FROM list WHERE board_id=" + boardId + "";
            return this.connection.query(this.connectionObject, query)
            .then(function (data) {                                    
            res.message = "List Has been fetched";
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
            res.message = "Board does not exists";
            res.status = 403;
            return res;
        }
        
    }
    return card;
})();
module.exports = cardController;