var express = require('express');
const cors = require('cors');
const port = 8089;
var path = require('path');
var cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

var app = express();
const corsOpts = {
    origin: 'http://localhost:4200'
};
app.use(cors(corsOpts), function (req, res, next) {
    console.log(req.url.split('/'));
    if (req.url.split('/')[1] !== "auth")
    {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        console.log(token);
        if (!token)
        {
            let err = "Token is needed";
            res.status(400)
                .send(err);
        }else
        {
            try {
                const decodedToken = jwt.verify(token, config.secretKey);
                let { userEmail, password } = decodedToken;
                const con = new connection(mysql);
                let connect = con.getConnection();
                con.connect(connect);
                try {
                    con.query(connect, "SELECT email, password FROM user")
                        .then(function (data) {
                        if (!data || data.length == 0) {
                            let err = new error("User does'nt exists");
                            res.status(400)
                                .send(err.msg);
                        } else {
                            globalData.userEmail = userEmail;
                            next();
                            //con.stop(connect);
                        }
                        }).catch(function (err) {
                            console.log(err);
                    })
                } catch (r) {
                    let err = new error(r);
                    res.status(400)
                    .send(err.msg);
                }
            } catch (r) {
                console.log(error);
                let err = new error(r);
            res.status(400)
                .send(err.msg);
            }
        }
    } else {
        next();
    }
});
app.listen(port, () => {
    console.log("App has been started.");
})