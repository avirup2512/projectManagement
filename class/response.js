var response = (function () {
    let message= "";
    let status= "";
    let data = {};
    function response(msg,status,data)
    {
        this.message = msg;
        this.status = status;
        this.data = data;
    }
    return response;
})();   
module.exports = response;