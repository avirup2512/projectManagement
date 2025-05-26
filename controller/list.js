var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");
var listController = (function () {
    let connection;
    let connectionObject;
    let board;
    function list(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection,this.connectionObject)
    }
    const updatePosition = async function (idx,lists,self)
    {
        let res = new response();
        if (idx > lists.length - 1)
        {
            return [];
        }
        const query = "UPDATE list SET position=" + lists[idx].position + " WHERE id=" + lists[idx].id + "";
        const pr1 = new Promise((resolve, reject) => {
            try {
                self.connection.query(self.connectionObject, query).
                then((data) => {
                    res.message = "Position has been updated";
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
        const pr2 = updatePosition(idx + 1, lists, self);
        return Promise.all([pr1, pr2]).then(([value, rest]) => {
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        })
    }
    list.prototype.checkListExists = async function (listId) {
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
    list.prototype.createList = async function (param)
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
    list.prototype.editList = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, name, boardId, listId, position } = param;
        
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        var listExists = await this.checkListExists(listId);
        if(checkBoardExists && listExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN"))
            {
                let insertBoardQuery = "UPDATE list SET name = '" + name + "',position = " + position + " WHERE id="+ listId +"";
                if (!position)
                {
                    insertBoardQuery = "UPDATE list SET name = '" + name + "' WHERE id="+ listId +"";

                }
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
    list.prototype.updatePosition = async function (param)
    {
        let self = this;
        let res = new response();
        let { userId, boardId,lists } = param;
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId,userId);
            var userRole = await this.board.checkUserRole(boardId, userId);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" || userRole[0].role_name == "ROLE_ADMIN")) {
                return updatePosition(0, lists, self);
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
    list.prototype.deleteList = async function (param)
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
    list.prototype.getAllList = async function (param)
    {
        let res = new response();
        let { boardId,userId } = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {
            let query = "SELECT result.*,u.first_name,u.last_name,u.email, cu.id as card_user_id, cu.user_id as card_user_user_id FROM (SELECT l.*, c.id as card_id, c.name as card_name, c.list_id as card_list_id, c.description as card_description,c.is_complete as card_complete, c.reminder_date as card_reminder_date, c.due_date as card_due_date, c.create_date as card_create_date, c.user_id as card_creator "+
            "FROM list l LEFT JOIN card c on c.list_id = l.id WHERE board_id = " + boardId + ") AS result LEFT JOIN card_user cu ON cu.card_id = result.card_id join user u on cu.user_id = u.id  order by result.card_id"; // WHERE cu.user_id = " + userId + "
            return this.connection.query(this.connectionObject, query)
                .then(function (data) {    
                    console.log(data);
                    
                    let listObject = {};
                    if (data.length > 0)
                    {
                        data.forEach((e) => {
                            if (!listObject.hasOwnProperty(e.id))
                            {
                                listObject[e.id] = {};
                            }
                            listObject[e.id].name = e.name;
                            listObject[e.id].id = e.id;
                            listObject[e.id].position = e.position;
                            listObject[e.id].board_id = e.board_id;
                            listObject[e.id].created_date = e.created_date;
                            if (!listObject[e.id].hasOwnProperty("cards"))
                            {
                                listObject[e.id].cards = [];
                            }
                            if (e.card_id && e.card_creator == userId)
                            {
                                const cardUser = [];                                
                                cardUser.push({ user_id: e.card_user_user_id, name: e.first_name + " " + e.last_name, email: e.email })
                                listObject[e.id].cards.push({id:e.card_id,name:e.card_name,description:e.card_description, complete:e.card_complete,users:cardUser})
                            }
                        })
                    }
                    res.message = "List Has been fetched";
                    res.status = 200;
                    res.data = listObject;
                return res;
            }).catch(function (err) {
                console.log(err);
                
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
    return list;
})();
module.exports = listController;