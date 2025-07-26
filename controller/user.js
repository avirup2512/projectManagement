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
    user.prototype.authenticateUserByUniqueId = function (param) {
        let result = new response("", 404, {});
        let { email,uniqueIdentifier } = param;
        return this.connection.query(this.connectionObject, "SELECT * FROM user WHERE email='" + email + "' AND unique_identifier='" + uniqueIdentifier + "'")
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
    user.prototype.getUserByEmail = function (userEmail) {
        let self = this;
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT * FROM user WHERE email='" + userEmail + "'")
            .then(function (data) {
                if (data.length == 0) {
                    result.message = false;
                    result.status = 404
                    return result;
                }
                else {
                    result.message = true;
                    result.status = 200;
                    return self.connection.query(self.connectionObject, "SELECT p.name as projectName, p.description as projectDescription, p.id as projectId, p.created_date as projectCreatedAt FROM project p JOIN project_user pu ON pu.project_id = p.id  WHERE pu.user_id='" + data[0].id + "' AND pu.is_default=1")
                    .then(function (project) {
                        result.message = true;
                        result.data = Object.assign(project[0], data[0]);
                        result.status = 200;
                        return result;
                    }).catch(function (err) {
                        result.message = false;
                        result.data = err;
                        return result;
                    })
                }
            }).catch(function (err) {
                result.message = false;
                result.data = err;
                return result;
            })
    };
    user.prototype.getUserByKeyword = function (param) {
        let { keyword, userEmail } = param;
        let key = "%" + keyword + "%";
        console.log(userEmail);
        
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT id,email,first_name,last_name FROM user WHERE email LIKE'" + key + "' AND NOT email='"+userEmail+"' LIMIT 100")
            .then(function (data) {
                if (data.length == 0) {
                    result.message = false;
                    result.status = 404
                    return result;
                }
                else {
                    result.message = true;
                    result.data = data;
                    result.status = 200;
                    return result;
                }
            }).catch(function (err) {
                result.message = false;
                result.data = err;
                return result;
            })
    };
    user.prototype.getBoardUserByKeyword = function (param) {
        let { keyword, userEmail, boardId } = param;
        let key = "%" + keyword + "%";
        console.log(userEmail);
        
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT u.id,u.email,u.first_name,u.last_name FROM user u join board_user bu on bu.user_id = u.id  WHERE email LIKE'" + key + "' AND NOT email='"+userEmail+"' AND bu.board_id = "+ boardId +" LIMIT 100")
            .then(function (data) {
                if (data.length == 0) {
                    result.message = false;
                    result.status = 404
                    return result;
                }
                else {
                    result.message = true;
                    result.data = data;
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
    user.prototype.createUserFromSocialAuth = async function (param)
    {
        var self = this;
        let res = new response();
        let { firstName, lastName, email,address, role, uniqueIdentifier } = param;
        if (!role)
        {
            role = "ROLE_BASIC";
        };
        let insertUserQuery = "INSERT INTO user (first_name,last_name,email,address,social_auth,unique_identifier)" +
            "VALUES('" + firstName + "','" + lastName + "','" + email + "','" + address + "'," + true + ",'" + uniqueIdentifier + "')";
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
                return self.connection.query(self.connectionObject, "INSERT INTO project(name,description,user_id,is_public) VALUES('Default Project','DEfault Project'," + data.insertId + ", 0)")
                    .then(function (project) {
                        return self.connection.query(self.connectionObject, "INSERT INTO project_user(user_id,project_id,role_id,is_default) VALUES(" + data.insertId + "," + project.insertId + ",3,1)")
                        .then(function (data) {
                            return res;
                        }).catch(function (err) {
                            res.message = err;
                            res.status = 400;
                            return res;
                        })
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
    user.prototype.userHasDefaultProject = function (params)
    {
        let { userId } = params;
        console.log(userId);
        
        let result = new response("", 404, {});
        return this.connection.query(this.connectionObject, "SELECT pu.*, p.name as projectName, p.description as projectDescription, p.created_date as projectCreatedDate, p.user_id as projectCreatedBy FROM project_user pu JOIN project p ON p.id=pu.project_id WHERE pu.user_id ='" + userId + "' AND pu.is_default=1")
            .then(function (data) {
                if (data.length == 0) {
                    result.message = false;
                    result.status = 404
                    return result;
                }
                else {
                    result.message = true;
                    result.data = data;
                    result.status = 200;
                    return result;
                }
            }).catch(function (err) {
                result.message = false;
                result.data = err;
                return result;
            })
    }
    return user;
})();
module.exports = userController;