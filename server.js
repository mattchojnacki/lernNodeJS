var mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime'); // odczytuje format plikow

var debugLog = true; // turning on logging to console

//var as = new ObjectId();
//console.log(as);

mongo.connect("mongodb://localhost:27018", function (err, conn) {
    if(err){
        console.log("Connect failed" + err);
        return;
    }

    var db = conn.db("socialApp");
    var accounts = db.collection("users");

    function serverFile(rep, fileName, errorCode, message) {

        if(debugLog) console.log('Serving file ' + fileName + (message ? ' with message \'' + message + '\'': ''));

        fs.readFile(fileName, function (err, data) {
            if(err){
                serverError(rep, 404, 'Document ' + fileName + 'not found');
            }else{
                rep.writeHead(errorCode, message, { 'Content-Type': mime.getType(path.basename(fileName)) });
                if(message){
                    data = data.toString().replace('{errMsg}', rep.statusMessage.replace('{errCode}',rep.statusCode));
                }
                rep.end(data);
            }
        });
    }

    function serverError(rep,error,message) {
        serverFile(rep,'html/error.html',error,message);
    }

    var listeningPort = 8888;
    http.createServer().on('request',function (req,rep) {

        if(debugLog) console.log('HTTP request URL' + req.url);


        switch (req.url){
            case '/':
                serverFile(rep, 'html/index.html',200, '');
                break;
            case '/user':
                switch (req.method){
                    case 'GET':
                        rep.writeHead(200,'OK',{'Content-type':'application/json'});
                        accounts.findOne({ _id: ObjectId("5aae479024c63d156e2c6acf") }, function(err, konto) {
                        rep.end(JSON.stringify(konto));
                    });
                    break;

                    default:
                        rep.writeHead(501,'Not implemeted',{'Content-type':'application/json'});
                        rep.end(JSON.stringify({error : "Not implemeted"}));
                }
                break;
            case '/users':
                switch (req.method){
                    case 'GET':
                        rep.writeHead(200,'OK',{'Content-type': 'application/json'});
                        accounts.find({}).toArray(function (err, users) {
                            rep.end(JSON.stringify(users));
                        });

                        break;
                    case 'POST':
                        rep.writeHead(200, 'OK', {'Content-type': 'application/json'});

                        var newObject = {
                            _id: new ObjectId(),
                            userName: "asdasd"
                        };
                        accounts.insertOne(newObject, function (error, succes) {
                            if(succes)console.log("został dodany");
                            rep.end(JSON.stringify({status: 'success'}));
                        });

                    case 'DELETE':
                        rep.writeHead(200, 'OK', {'Content-type': 'application/json'});
                        accounts.find({}).toArray(function (err, users) {
                            rep.end(JSON.stringify(users));
                        });

                        break;
                    default:
                        rep.writeHead(501,'Not implemeted',{'Content-type':'application/json'});
                        rep.end(JSON.stringify({error : "Not implemeted"}));
                }
                break;

            default:
                if(/^\/(html|css|js|fonts|img)\//.test(req.url)) {
                    var fileName = path.normalize('./' + req.url);
                    serverFile(rep,fileName,200,'');
                }else {
                    serverError(rep,403,'Access denied');
                }
        }


    }).listen(listeningPort);

});