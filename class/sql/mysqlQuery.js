var sqlQuery = (function () {
    query = "";
    connection;
    function query(connection,query)
    {
        this.connection = connection;
        this.query = query;
    }
    query.prototype.insert = function ()
    {
        this.connection.query(this.query);
    }
})()