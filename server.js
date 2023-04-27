const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser');
const request = require('request')
require('dotenv').config();

const UserModel = require('./model/User.js')

// CONSTANTS
const PORT = process.env.PORT || 3001;
const TOKEN_SECRET = process.env.TOKEN_SECRET 
const MONGO_DB = process.env.MONGO_DB_CONNECT 

// CONNECT
try{
    mongoose.connect(MONGO_DB)
} catch (err){
    console.log(err)
}

// USE
const app = express();
app.use(express.json());
app.use(cors())
app.use(cookieParser())

// SOCKET IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// CONNECT
io.on('connection', socket => {
    console.log(`${socket.id} connected`)

    socket.on('joinRoom', room => {
        socket.join(room);
        console.log(`A User joined room: ${room}`)
    })

    socket.on('sendMessageToServer', data => {
        io.to(data.room).emit('sendMessageToClient', data)
    })

    socket.on('disconnectCleanup', async data => {
        if (data.messages.length !== 0){
            const owner = await UserModel.findOne({name: data.owner})
            const to = await UserModel.findOne({name: data.to})
            owner.messages = data.messages
            to.messages = data.messages
            owner.save() //
            to.save() 
    
            io.to(data.room).emit('saveConvo', data.messages)
        }
    })

    socket.on('disconnect', (randomData) => {})
})

app.post('/register', async (req, res) => {
    if (!req.body.name || !req.body.password) res.status(400).send('Incorrect name or passwrod')

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    try{
        const newRegisteredUser = await UserModel.create({
            name: req.body.name,
            password: hashedPassword,
        })
        
        if (newRegisteredUser){
            res.status(200).send('User created')
        } else {
            res.status(400).send('Error registering')
        }
    } catch (err){
        res.status(400).send(err)
    }
})

app.post('/login', async (req, res) => {
    if (!req.body.name || !req.body.password) res.status(400).send('Incorrect name or passwrod')

    const found = await UserModel.findOne({
        name: req.body.name
    })
    if (!found) {
        res.status(400).send('User not found')
    } else {
        const result = await bcrypt.compare(req.body.password, found.password);
        if (!result) res.status(400).send('Wrong password')
    
        const token = jwt.sign(req.body, TOKEN_SECRET)

        // NOT WORKING
        res.cookie('session_id', token.toString(), {
            httpOnly: false, maxAge: 24 * 60 * 60 * 1000
        }).json({found, token})
    }
})

app.get('/verify/:name', async (req, res) => {
    try{
        const verified = await UserModel.findOne({name: req.params.name})
        res.json({verified});
    } catch (err){
        res.send(400).send(err)
    }
})

app.get('/getAllUsers', async (req, res) => {
    try{
        const all = await UserModel.find()
        res.json({all});
    } catch (err){
        res.status(400).send(err)
    }
})

app.get('/getInitialMessages/:name', async (req, res) => {
    try{
        const user = await UserModel.findOne({name: req.params.name})
        res.json({user})
    } catch (err){
        res.status(400).send(err)
    }
})

server.listen(PORT, () => console.log('>> listening on ' + PORT))
