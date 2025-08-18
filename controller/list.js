var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");
const cardController = require("./cards");
var listController = (function () {
    let connection;
    let connectionObject;
    let board;
    function list(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection, this.connectionObject);
        this.card = new cardController(this.connection, this.connectionObject);
    }
    const updateCardPositionInList = function (idx, cards,type, self)
    {
        console.log(cards);
        console.log(idx);
        console.log(cards[idx]);
        if (cards.length == 0)
        {
            return [];
        }
        let res = new response();
        if (idx > cards.length - 1)
        {
            return [];
        }
        let query = type == "plus" ? "UPDATE card SET position=position+1 WHERE id=" + cards[idx] + "" : "UPDATE card SET position=position-1 WHERE id=" + cards[idx] + "";
        const pr1 = new Promise((resolve, reject) => {
            try {
                self.connection.query(self.connectionObject, query).
                    then((data) => {
                    console.log(data);
                    
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
        const pr2 = updateCardPositionInList(idx + 1, cards,type, self);
        return Promise.all([pr1, pr2]).then(([value, rest]) => {
            let arr = [value, ...rest];
            let response = arr.reduce((e,j) => {
                return Object.assign(e,j)
            })
            return [response];
        })
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
        let self = this;
        let res = new response();
        let { boardId,userId } = param;    
        let boardExists = await this.board.checkBoardExists(boardId);
        if (boardExists)
        {   
            let query = "SELECT list.id as list_id , list.name as list_name, list.created_date as list_created_date, list.position as list_position , list.is_archived as list_archived, list.is_backloged as list_backlog, card.id as card_id, card.name as card_name, card.description as card_description, card.create_date as card_create_date, card.is_complete as card_is_complete, card.position as card_position, card.tag_id, card.tag_name, card.tag_color, card.card_user_id, card.first_name, card.last_name, card.card_user_email, card.role_id,card.role, card.user_id as card_creator FROM List LEFT JOIN " +
                
            "(SELECT c.*, tag.tag_id as tag_id, tag.tag_name, tag.tag_color,card_user.user_id as card_user_id, card_user.first_name, card_user.last_name, card_user.role_id, card_user.email as card_user_email, card_user.role FROM card c LEFT JOIN" +
            "(SELECT t.id as tag_id , t.tag as tag_name, t.color as tag_color, ct.id as card_tag_id, ct.card_id FROM tag t JOIN card_tag ct ON ct.tag_id = t.id ) as tag ON c.id = tag.card_id LEFT JOIN (SELECT u.id as user_id, u.first_name, u.last_name, u.email, cu.card_id as card_user_card_id, cu.role_id, r.role FROM card_user cu JOIN user u ON cu.user_id = u.id JOIN role r ON r.id = cu.role_id) as card_user ON card_user.card_user_card_id = c.id "+
            ") as card " +
            "ON card.list_id = list.id Where list.board_id = "+boardId+""
            return this.connection.query(this.connectionObject, query)
                .then(async function (data) {    
                    let listObject = {};
                    if (data.length > 0)
                    {
                        await data.forEach(async(e) => {
                            if (!listObject.hasOwnProperty(e.list_id))
                            {
                                listObject[e.list_id] = {};
                            }
                            listObject[e.list_id].name = e.list_name;
                            listObject[e.list_id].id = e.list_id;
                            listObject[e.list_id].position = e.list_position;
                            listObject[e.list_id].board_id = boardId;
                            listObject[e.list_id].created_date = e.list_created_date;
                            listObject[e.list_id].is_archived = e.list_archived;
                            listObject[e.list_id].is_backloged = e.list_backlog;
                            if (!listObject[e.list_id].hasOwnProperty("cards"))
                                    {
                                        listObject[e.list_id].cards = {};
                                    }
                                    if (!listObject[e.list_id].cards.hasOwnProperty(e.card_id))
                                    {
                                        listObject[e.list_id].cards[e.card_id] = {};
                                    }
                                    listObject[e.list_id].cards[e.card_id].name = e.card_name;
                                    listObject[e.list_id].cards[e.card_id].id = e.card_id;
                                    listObject[e.list_id].cards[e.card_id].description = e.card_description;
                                    listObject[e.list_id].cards[e.card_id].create_date = e.card_create_date;
                                    listObject[e.list_id].cards[e.card_id].isComplete = e.card_is_complete;
                                    listObject[e.list_id].cards[e.card_id].position = e.card_position;
                                    if (!listObject[e.list_id].cards[e.card_id].hasOwnProperty("users"))
                                    {
                                        listObject[e.list_id].cards[e.card_id].users = {};
                                    }
                                    if (!listObject[e.list_id].cards[e.card_id].users.hasOwnProperty("e.card_user_id"))
                                    {
                                        listObject[e.list_id].cards[e.card_id].users[e.card_user_id] = {};
                                    }
                                    const creator = e.card_creator == e.card_user_id ? true : false;
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].user_id = e.card_user_id;
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].creator = creator;
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].role_name = e.role
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].role = e.role_id;
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].name = e.first_name + " " + e.last_name;
                                    listObject[e.list_id].cards[e.card_id].users[e.card_user_id].email = e.card_user_email

                                    // ADDING TAG IN THE CARD
                                    if (!listObject[e.list_id].cards[e.card_id].hasOwnProperty("tags"))
                                    {
                                        listObject[e.list_id].cards[e.card_id].tags = {};
                                    }
                                    if (!listObject[e.list_id].cards[e.card_id].tags.hasOwnProperty("e.tag_id"))
                                    {
                                        listObject[e.list_id].cards[e.card_id].tags[e.tag_id] = {};
                                    }
                                    listObject[e.list_id].cards[e.card_id].tags[e.tag_id].tagId = e.tag_id;
                                    listObject[e.list_id].cards[e.card_id].tags[e.tag_id].tagName = e.tag_name;
                                    listObject[e.list_id].cards[e.card_id].tags[e.tag_id].tagColor = e.tag_color;
                                    
                            //     self.card.checkUserHasPermission({userId, cardId:e.card_id})
                            //     .then((hasPemisiion) => {
                            //     //  if (hasPemisiion)
                            //     //     {
                                    
                            //         // }
                            //         res.message = "List Has been fetched";
                            //         res.status = 200;
                            //         res.data = listObject;
                            //         return res;
                            // })
                            // listObject[e.list_id].cards.sort((a, b) => {
                            //     return a.position > b.position ? 1 : -1
                            // });
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
    list.prototype.addDeleteCardAmongDiffList = async function (param) {
        let res = new response();
        const { authenticatedUser, boardId, cardId, addedListId, deletedListId, position } = param;        
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, authenticatedUser);
            var userRole = await this.board.checkUserRole(boardId, authenticatedUser);
            console.log(userIsAuthenticated);
            console.log(userRole);
            
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" | userRole[0].role_name == "ROLE_ADMIN")) {
                let query1 = "UPDATE card SET list_id=" + addedListId + ", position="+position+" WHERE list_id=" + deletedListId + " AND id="+cardId+"";
                return this.connection.query(this.connectionObject, query1).
                then((data) => {
                    res.message = "Card has been updated";
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
    list.prototype.addDeleteCardAmongSameList = async function (param) {
        let res = new response();
        const { authenticatedUser, boardId, cards } = param;        
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, authenticatedUser);
            var userRole = await this.board.checkUserRole(boardId, authenticatedUser);
            console.log(userIsAuthenticated);
            console.log(userRole);
            
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" | userRole[0].role_name == "ROLE_ADMIN")) {
                let query1 = "UPDATE card SET position=" + cards[0].position + " WHERE id=" + cards[0].id + "";
                let query2 = "UPDATE card SET position=" + cards[1].position + " WHERE id="+cards[1].id+"";
                return this.connection.query(this.connectionObject, query1).
                then((data1) => {
                    return this.connection.query(this.connectionObject, query2).
                    then((data2) => {
                        res.message = "Card has been updated";
                        res.status = 200;
                        res.data = Object.assign(data1,data2);
                        return res;
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
    list.prototype.updateCardPositionInList = async function (param) {
        let res = new response();
        const { authenticatedUser, boardId, cardsPositionToBePlus,cardsPositionToBeMinus } = param;        
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if(checkBoardExists)
        {
            var userIsAuthenticated = await this.board.checkUserIsAuthenticated(boardId, authenticatedUser);
            var userRole = await this.board.checkUserRole(boardId, authenticatedUser);
            if (userIsAuthenticated && userRole.length > 0 && (userRole[0].role_name == "ROLE_SUPER_ADMIN" | userRole[0].role_name == "ROLE_ADMIN")) {
                return Promise.all([updateCardPositionInList(0, cardsPositionToBePlus, "plus", this), updateCardPositionInList(0, cardsPositionToBeMinus, "minus", this)])
                .then(([value, rest]) => {
                    let arr = [value, ...rest];
                    let response = arr.reduce((e,j) => {
                    return Object.assign(e,j)
                })
                return [response];
                })
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
    list.prototype.archivedList = async function (param)
    {
        let res = new response();
        const {  boardId, archived, listId } = param;        
        var checkBoardExists = await this.board.checkBoardExists(boardId);
        if (checkBoardExists) {
            let query = "UPDATE list SET is_archived=" + archived + " WHERE id=" + listId + "";
            try {
                return this.connection.query(this.connectionObject, query).
                    then((data) => {
                    res.message = archived == 1 ? "List has been archived" : "List has been activated";
                    res.status = 200;
                    res.data = data;
                    return res
            })
            } catch (error) {
                console.log(err);
                res.message = err;
                res.status = 400;
                return res;
            }
        }else {
            res.message = "Board does not exists.";
            res.status = 403;
            return res;
        }
    }
    return list;
})();
module.exports = listController;