// Añadimos las dependencias
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http) // Montamos el Socket con el servidor HTML al cual está asociado Express
const port = process.env.PORT || 3000

var mensajes = []
var usuarios = []
var colores = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange']

// Desordenamos la lista de colores 
colores.sort(function(a,b) { return Math.random() > 0.5; })

// Levantamos el escuchador por el puerto definido
http.listen(port, () => {
    console.log(`Escuchando por el puerto: ${port}`)
})

// Creamos un metodo en Express que nos devolverá la pagina indicada
// Esta tiene que ser la ruta absoluta, por lo que añadimos la 
// variable __dirname a lo que concatenamos el nombre del fichero
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

// Metodo cuando alguien se conecte 
// socket será como nuestra sesión
io.on('connection', (socket) => {
    console.log((new Date()) + ' Conexión aceptada.')
    var userName = "Desconocido"
    var index = -1
    var userColor
    
    // Cargamos todos los mensajes
    socket.emit('history',JSON.stringify(mensajes))

    // Definir nombre de usuario
    socket.on('user',(msg) => {
        console.log(`Usuario llamado ${msg}`)
        userName = msg
        userColor = colores.shift()
        index = usuarios.push(msg) -1
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
        console.log('message: ' + msg)
        io.emit('chat message', JSON.stringify(objMsg))
        mensajes.push(objMsg)

    })

    // Dexconexión del usuario
    socket.on('disconnect',()=>{
        console.log('Usuario desconectado')
        console.log(index)
        usuarios.splice(index,1)
        colores.push(userColor)
        io.emit('users Chat',usuarios.join(" | "))
    })
})