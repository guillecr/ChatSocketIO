/**
 * Codigo Chat con Socket.IO
 */

// Dependencias
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http) // Montamos el Socket con el servidor HTML al cual está asociado Express
var mongoose = require('mongoose')

// Variables globales
const port = process.env.PORT || 3000
var usuarios = []
var colores = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange']


// ===========< MONGODB >==========
// Conexión
//mongoose.connect('mongodb+srv://guilleStart:Sandrita28@cluster0.jxlyr.gcp.mongodb.net/chatIO?retryWrites=true&w=majority',
mongoose.connect('mongodb://localhost:27017',
    {useNewUrlParser: true, useUnifiedTopology: true},
    function (err) {
        if (err) throw err;      
        console.log(`${new Date()} => Conexión establecida con MongoDB`);
    }
)
// Esquema de datos
var modelo = new mongoose.Schema({
    time: Date,
    text: String,
    author: String,
    color: String,
});
// Modelo
var MensajeModelo = mongoose.model('Mensajes', modelo );
// Función para guardar mensaje
function saveMensaje(msg){
    var instancia = new MensajeModelo(
        {
            time:msg.time,
            text:msg.text,
            author:msg.author,
            color:msg.color
        }
    )
    instancia.save()
}

// Desordenamos la lista de colores 
colores.sort(function(a,b) { return Math.random() > 0.5; })

// SERVIDOR
// Listen
http.listen(port, () => {
    console.log(`${new Date()} => Servidor levantado en el puerto: ${port}`)
})

// Controlador GET para entregar el cliente
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});


// SOCKET.IO
io.on('connection', (socket) => {
    console.log((new Date()) + ' => Conexión aceptada')
    var userName = "Desconocido"
    var index = -1
    var userColor
    
    // Cargamos todos los mensajes
    MensajeModelo.find(function(err,msgs){
        socket.emit('history',JSON.stringify(msgs))
    })

    // Definir nombre de usuario
    socket.on('user',(msg) => {
        userName = msg
        userColor = colores.shift()
        if(index < 0 ) index = usuarios.push(msg) -1
        else usuarios[index] = userName
        console.log(`${new Date()} => Usuario ${index} identificado como: ${msg}`)
        socket.emit('color',userColor)
        io.emit('users Chat',usuarios.join(" | "))
    })

    // Nuevo mensaje
    socket.on('chat message', (msg) => {
        var objMsg = {
            time: (new Date()).getTime(),
            text: msg,
            author: userName,
            color: userColor
        }
        console.log(`${new Date()} => Mensaje de ${userName}: ${msg}`)
        saveMensaje(objMsg)
        io.emit('chat message', JSON.stringify(objMsg))
    })

    // Dexconexión del usuario
    socket.on('disconnect',()=>{
        console.log(`${new Date()} => Usuario ${userName} desconectado`)
        usuarios.splice(index,1)
        colores.push(userColor)
        io.emit('users Chat',usuarios.join(" | "))
    })
})