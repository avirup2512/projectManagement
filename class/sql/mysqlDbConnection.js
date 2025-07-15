var connection = (function () {
    let mysql;
    let connection;
    function mysqlConnectionInstance(mysql) {
        this.mysql = mysql;
    }
    mysqlConnectionInstance.prototype.configure = function (host,user,pswd,db,port)
    {
        return this.mysql.createConnection({
        host: host,
        user: user,
        password: pswd,
            database: db,
        port:port
        });
    }
    mysqlConnectionInstance.prototype.getConnection = function () {
        return this.configure('gondola.proxy.rlwy.net', 'root', 'bfLcmPbmyWpINusPpiPhAEnhbsEQjuaf', 'railway',27880);
    }
    
    mysqlConnectionInstance.prototype.connect = function (con)
    {
        con.connect(function (err) {
            if (err)
            {
                console.log(err);
                return;
            }
        console.log('connected as id ' + con.threadId);
        });
    }
    mysqlConnectionInstance.prototype.stop = function (con)
    {
        con.end();
    }
    mysqlConnectionInstance.prototype.query = async function (con,queryString)
    {
        var queryResult = new Promise(async (resolve, reject) => {
            con.query(queryString, await function (err, rows, fields) {
            if (err)
            {
                reject(err);
            } else {
                resolve(rows);
            }
            })
        });        
        return queryResult;
    }
     mysqlConnectionInstance.prototype.queryByArray = async function (con,queryString,param)
    {
        var queryResult = new Promise(async (resolve, reject) => {
            con.query(queryString,param, await function (err, rows, fields) {
            if (err)
            {
                reject(err);
            } else {
                resolve(rows);
            }
            })
        });        
        return queryResult;
    }
    
    mysqlConnectionInstance.prototype.checkTableExists = async function (con,schemaName,tableName)
    {
        return this.query(con, "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='"+schemaName+"' AND table_name='"+tableName+"')")
            .then(function (data) {
                console.log()
                for (var x in data[0])
                {
                    if (data[0][x] == 0)
                        return false;
                    else
                        return true;
                }
            }).catch(function (error) {
                console.log(error);
        })
    }
    mysqlConnectionInstance.prototype.createTable = async function (con,query)
    {
        var queryResult = new Promise(async (resolve, reject) => {
            con.query(query, await function (err, rows, fields) {
            if (err)
            {
                reject(err);
            } else {
                resolve(rows);
            }
        })
        });
        return queryResult;
    }
    return mysqlConnectionInstance;
})();
module.exports = connection;