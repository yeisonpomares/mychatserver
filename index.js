const express = require("express");
const expressSession = require("express-session");
const bodyparser = require("body-parser");
const path = require("path");
const fs = require("fs");

var mongoose = require("./models/user");


const app = express();

//Use body-parse for forms element
app.use(bodyparser.urlencoded({extended: true}));
//Use express-session
var session = app.use(expressSession({resave:true, saveUninitialized:true, secret: 'asdfnaosdnfoansdfiansdoiuw89a8sjfa'}));

app.get('/',(req,res)=>{
    if(!req.session.user_id){
        res.redirect('login.html');
    }
});

//POST: Login
app.post('/login', (req,res)=>{
    if(req.body.username == 'Yeison' && req.body.password == '12345678'){
        //Set session data
        req.session.user_id = {username: req.body.username};
        //Load html 
        var html = fs.readFileSync("./public/views/login_successful.html");
        res.write(html);
        
        res.end();
    }else{
        res.write('Username or Password does not match');
        res.end();
    }
    

});

//settings
app.set('port', process.env.PORT || 3000);


//static files
app.use(express.static(path.join(__dirname, 'public')));

//Init Server
const server = app.listen(app.get('port'), () => {
    console.log('Server on port:', app.get('port'));
});

//websockets
const SocketIO = require("socket.io");
const bodyParser = require("body-parser");
const { Session } = require("inspector");
const { request } = require("http");
const io = SocketIO(server);


io.on('connection', (socket) => {
    console.log('New Conection:', socket.id);
    //Register
    socket.on('chat:register',(data)=>{        
        if(data.username == '' || data.password1 == '' || data.password2 == ''){
            socket.emit("chat:register","0;You must provide a valid user name and password");
        }else{
            if(data.password1 == data.password2){
                //Verify if user exists:
                mongoose.User.findOne({username:data.username,password: data.password1}, (err,doc)=>{
                    if(err == null){
                        if(doc == null){
                            var user = new mongoose.User({username:data.username,password:data.password1});
                            user.save();
                            socket.emit("chat:register","1;Your account has been successfully registered");
                        }else{
                            socket.emit("chat:register","0;User "+data.username+" already exist");            
                        }
                    }                    
                })
                
                
            }else{
                socket.emit("chat:register","0;Your password and confirmation must be the same");
            }
        }
    });

    //Login
    socket.on('chat:login', (data) => {
        if(data.username == '' || data.password == ''){
            socket.emit("chat:login","0;User or password empty");
        }else{
            mongoose.User.findOne({username:data.username,password: data.password}, (err,doc)=>{            
                if(err == null && doc != null){
                    socket.emit("chat:login","1;Welcome to MyChat;"+data.username);
                }else{
                    socket.emit("chat:login","0;User or password does not match");
                }
        
            });
        }
        
    });
    
    //Emit new-user
    socket.on('chat:newuser', (username) => {        
        io.sockets.emit('chat:newuser',username);
    });
    //Emit Message
    socket.on('chat:message', (data) => {        
        io.sockets.emit('chat:message',data);
    });
    //Emit: Typing
    socket.on('chat:typing',(username)=>{
        socket.broadcast.emit('chat:typing',username);
    });
    
});

