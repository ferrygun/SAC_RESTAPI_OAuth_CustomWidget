/*eslint no-console: 0, no-unused-vars: 0, no-undef:0, no-process-exit:0*/
/*eslint-env node, es6 */
"use strict";
const port = process.env.PORT || 3000;
const server = require("http").createServer();

//Initialize Express App for XSA UAA and HDBEXT Middleware
const xsenv = require("@sap/xsenv");
const passport = require("passport");
const xssec = require("@sap/xssec");
const express = require("express");
global.__base = __dirname + "/";

const https = require('https');
const http = require('http');
const cors = require('cors');
const querystring = require('querystring');

//logging
var logging = require("@sap/logging");
var appContext = logging.createAppContext()

//Initialize Express App for XS UAA and HDBEXT Middleware
var app = express();

app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from    
    res.header('Access-Control-Allow-Methods: OPTIONS,GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//https://stackoverflow.com/questions/42128238/how-can-i-read-the-data-received-in-application-x-www-form-urlencoded-format-on
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

//Compression
app.use(require("compression")({
    threshold: "1b"
}));

//Helmet for Security Policy Headers
const helmet = require("helmet");
// ...
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "sapui5.hana.ondemand.com"],
    scriptSrc: ["'self'", "sapui5.hana.ondemand.com"]
  }
}));
// Sets "Referrer-Policy: no-referrer".
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
	uaa: {
		tag: "xsuaa"
	}
}).uaa));
app.use(logging.middleware({
	appContext: appContext,
	logNetwork: true
}));
app.use(passport.initialize());
app.use(
	passport.authenticate("JWT", {
		session: false
	})
	//xsHDBConn.middleware(hanaOptions.hana)
);

var corsOptions = {
   origin: '*',
   optionsSuccessStatus: 200 
}


// Redirect any to service root
app.get("/node", (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write('OK');
    res.end();
});

app.post('/score', function(req, res) {
	req.setTimeout(0);
    console.log(req.body.partnernumber);

    async function getPartnerNumber() {
        let response = await doRequest(req.body.partnernumber);
        console.log(response);
        res.status(200).send(response)
    }
    getPartnerNumber();
})

function doRequest(partnernumber) {
	console.log();
    return new Promise((resolve, reject) => {

        var post_data = querystring.stringify({
            'partnernumber': partnernumber
        });

        // An object of options to indicate where to post to
        var post_options = {
            host: '_R_PLUMBER_SRV',
            port: '_R_PLUMBER_PORT',
            path: '/score',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

	    var body = '';
        var post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                console.log('Response: ' + chunk);
				body += chunk;
            });
			res.on('end', function() {
				resolve(body);
			});
        });

        post_req.write(post_data)
        post_req.end();
    });
}

//Start the Server 
server.on("request", app);

//Start the Server 
server.listen(port, function () {
	console.info(`HTTP Server: ${server.address().port}`);
});
