// SERVIDOR
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http) // Montamos el Socket con el servidor HTML al cual está asociado Express
const port = process.env.PORT || 3000

var usuarios = []
var colores = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange']


// MONGOBD
var mongoose = require('mongoose')
mongoose.connect('mongodb+srv://guilleStart:Sandrita28@cluster0.jxlyr.gcp.mongodb.net/chatIO?retryWrites=true&w=majority',
//mongoose.connect('mongodb://localhost:27017',
    {useNewUrlParser: true, useUnifiedTopology: true},
    function (err) {
        if (err) throw err;      
        console.log('Conexión establecida con MongoDB');
    }
)

var modelo = new mongoose.Schema({
    time: Date,
    text: String,
    author: String,
    color: String,
});
var MensajeModelo = mongoose.model('Mensajes', modelo );

// Desordenamos la lista de colores 
colores.sort(function(a,b) { return Math.random() > 0.5; })

// Levantamos el escuchador por el puerto definido
http.listen(port, () => {
    console.log(`Servidor levantado en el puerto: ${port}`)
})

// Creamos un metodo en Express que nos devolverá la pagina indicada
// Esta tiene que ser la ruta absoluta, por lo que añadimos la 
// variable __dirname a lo que concatenamos el nombre del fichero
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

// CONEXIÓN CON USUARIO
io.on('connection', (socket) => {
    console.log((new Date()) + ' Conexión aceptada')
    var userName = "Desconocido"
    var index = -1
    var userColor
    
    // Cargamos todos los mensajes
    MensajeModelo.find(function(err,msgs){
        socket.emit('history',JSON.stringify(msgs))
    })

    // Definir nombre de usuario
    socket.on('user',(msg) => {
        console.log(`Usuario identificado como: ${msg}`)
        userName = msg
        userColor = colores.shift()
        if(index < 0 ) index = usuarios.push(msg) -1
        else usuarios[index] = userName
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
        console.log(`Mensaje de ${userName}: ${msg}`)
        saveMensaje(objMsg)
        io.emit('chat message', JSON.stringify(objMsg))
    })

    // Dexconexión del usuario
    socket.on('disconnect',()=>{
        console.log(`Usuario ${userName} desconectado`)
        usuarios.splice(index,1)
        colores.push(userColor)
        io.emit('users Chat',usuarios.join(" | "))
    })
})

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
    console.log("Mensaje guardado")
}