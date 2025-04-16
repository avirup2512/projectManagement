var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
var userController = (function () {
    let connection;
    let connectionObject;
    function user(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
    }
    user.prototype.checkUserExists = async function (userEmail) {
        return this.connection.query(this.connectionObject,"SELECT * FROM user WHERE email='" + userEmail + "'")
            .then(function (data) {
                if (data.length == 0)
                    return false;
                else
                    return true;
            }).catch(function (err) {
                return true;
        })
    }
    user.prototype.checkUserExistsById = async function (id) {
        return this.connection.query(this.connectionObject,"SELECT * FROM user WHERE id='" + id + "'")
            .then(function (data) {
                if (data.length == 0)
                    return false;
                else
                    return true;
            }).catch(function (err) {
                return true;
        })
    }
    user.prototype.authenticateUser = function (userEmail, userPassword) {
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT * FROM user WHERE email='" + userEmail + "' AND password='" + userPassword + "'")
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
    };
    user.prototype.login = async function (userEmail, userPassword) {
        var result = await this.authenticateUser(userEmail, userPassword)
        return result
    }
    user.prototype.checkRole = function (role) {
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
    user.prototype.createUser = async function (param)
    {
        var self = this;
        let res = new response();
        let { firstName, lastName, email, password, address, role } = param;
        if (!role)
        {
            role = "ROLE_BASIC";
        };
        let insertUserQuery = "INSERT INTO user (first_name,last_name,email,password,address)" +
            "VALUES('" + firstName + "','" + lastName + "','" + email + "','" + password + "','" + address + "')";
        var hasUser = await this.checkUserExists(email);
        if (hasUser)
        {
            res.message = "User is already exists";
            res.status = 400;
            return res;
        } else {
            var existsRole = await this.checkRole(role);
            if (existsRole.message)
            {
                return this.connection.query(this.connectionObject, insertUserQuery)
                .then(function (data) {
                res.message = "User Has been created";
                res.status = 200;
                res.data = data;
                return self.connection.query(self.connectionObject, "INSERT INTO user_role(roleId,userId) VALUES(" + existsRole.role.id + "," + data.insertId + ")")
                    .then(function (data) {
                        return res;
                    }).catch(function (err) {
                    res.message = err;
                    res.status = 400;
                    return res;
                })
                }).catch(function (err) {
                    res.message = err;
                    res.status = 400;
                    return res;
                })
            } else {
                res.message = "Role does not exists";
                res.status = 400;
                return res;
            }
        }
    }
    user.prototype.editUser = async function (param)
    {
        var self = this;
        let res = new response();
        let { firstName, lastName, email, password, address, role } = param;
        let updateUserQuery = "UPDATE user SET first_name = '" + firstName + "',last_name = '" + lastName + "',address = '" + address + "'" +
            "WHERE email='" + email + "'";
        var hasUser = await this.checkUserExists(email);
        console.log(hasUser);
        
        if (hasUser)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {                    
                    res.message = "User Has been updated";
                    res.status = 200;
                    res.data = data;
                    return res;
                });
        }
    }
    user.prototype.deleteUser = async function (param)
    {
        var self = this;
        let res = new response();
        let {email} = param;
        let updateUserQuery = "DELETE FROM user " +
            "WHERE email='" + email + "'";
        var hasUser = await this.checkUserExists(email);        
        if (hasUser)
        {
            return this.connection.query(this.connectionObject, updateUserQuery)
                .then(function (data) {                    
                    res.message = "User Has been deleted";
                    res.status = 200;
                    res.data = data;
                    return res;
                });
        }
    }
    user.prototype.createTable = function ()
    {
        this.connection.createTable(this.connectionObject,createQuery.createUsersTable)
        .then(function (data) {
            return true;
        }).catch(function (err) {
            return false;
    })
    }
    return user;
})();
module.exports = userController;