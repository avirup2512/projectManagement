var createQuery = require("../class/sql/createQuery");
const error = require("../class/error");
const response = require("../class/response");
const boardController = require("./board");

var fileController = (function () {
    let connection;
    let connectionObject;
    let board;
    function file(connection,connectionObject) {
        this.connection = connection;
        this.connectionObject = connectionObject;
        this.board = new boardController(this.connection,this.connectionObject)
    }
    file.prototype.uploadFile = async function (param) {
        const res = new Response();
        const { cardId, userId, projectId, path, memory } = param;

        let query = "INSERT INTO uploaded_file (filePath, memory, user_id, card_id, project_id) VALUES('"+path+"', "+memory+", "+ userId +", "+cardId+", "+projectId+")"
        return this.connection.query(this.connectionObject, query)
        .then(async function (data) {
        res.message = "File Has been uploaded successfully.";
            res.status = 200;
            res.data = data;
            return res;
        }).catch(function (err) {
            console.log(err);
            res.message = err;
            res.status = 406;
            return res;
        })
    }
    return file;
})();
module.exports = fileController;