// Añadimos las dependencias
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http); // Montamos el Socket con el servidor HTML al cual está asociado Express
const port = process.env.PORT || 3000;

// Creamos un metodo en Express que nos devolverá la pagina indicada
// Esta tiene que ser la ruta absoluta, por lo que añadimos la 
// variable __dirname a lo que concatenamos el nombre del fichero
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Metodo cuando alguien se conecte 
// socket será como nuestra sesión
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect',()=>{
        console.log('Usuario desconectado')
    })
});

  
http.listen(port, () => {
console.log(`listening on *: ${port}`);
});