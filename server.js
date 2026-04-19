const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const archivoBD = './productos.json';
if (!fs.existsSync(archivoBD)) fs.writeFileSync(archivoBD, '[]');

app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/video', express.static(path.join(__dirname, 'video')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- RUTAS API ---

app.get('/api/productos', (req, res) => {
    const data = fs.readFileSync(archivoBD);
    res.json(JSON.parse(data));
});

app.post('/api/productos', upload.single('foto'), (req, res) => {
    try {
        const productos = JSON.parse(fs.readFileSync(archivoBD));
        const nuevoProducto = {
            _id: Date.now().toString(), // Guardamos el momento exacto (sirve para etiqueta NUEVO)
            nombre: req.body.nombre,
            precio: Number(req.body.precio),
            talle: req.body.talle || "Único", // NUEVO: Guardamos el talle
            categoria: req.body.categoria,
            stock: req.body.stock === 'true', 
            imagen: req.file ? `/uploads/${req.file.filename}` : "/img/placeholder.png"
        };
        productos.push(nuevoProducto);
        fs.writeFileSync(archivoBD, JSON.stringify(productos, null, 2));
        res.json({ mensaje: "¡Prenda cargada con éxito! 🚀" });
    } catch (e) {
        res.status(500).json({ mensaje: "Error al guardar" });
    }
});

app.put('/api/productos/:id', upload.single('foto'), (req, res) => {
    try {
        let productos = JSON.parse(fs.readFileSync(archivoBD));
        const index = productos.findIndex(p => p._id === req.params.id);
        
        if (index !== -1) {
            productos[index].nombre = req.body.nombre;
            productos[index].precio = Number(req.body.precio);
            productos[index].talle = req.body.talle || "Único"; // NUEVO
            productos[index].categoria = req.body.categoria;
            productos[index].stock = req.body.stock === 'true';
            
            if (req.file) {
                productos[index].imagen = `/uploads/${req.file.filename}`;
            }
            
            fs.writeFileSync(archivoBD, JSON.stringify(productos, null, 2));
            res.json({ mensaje: "¡Producto actualizado! ✏️" });
        } else {
            res.status(404).json({ mensaje: "No encontrado" });
        }
    } catch (e) {
        res.status(500).json({ mensaje: "Error al actualizar" });
    }
});

app.delete('/api/productos/:id', (req, res) => {
    let productos = JSON.parse(fs.readFileSync(archivoBD));
    productos = productos.filter(p => p._id !== req.params.id);
    fs.writeFileSync(archivoBD, JSON.stringify(productos, null, 2));
    res.json({ mensaje: "Eliminado" });
});

app.listen(3000, '0.0.0.0', () => {
    console.log("-----------------------------------------");
    console.log("🚀 SERVIDOR CORRIENDO EN EL PUERTO 3000");
    console.log("👉 ADMIN: http://localhost:3000/admin.html");
    console.log("👉 TIENDA: http://localhost:3000/index.html");
    console.log("-----------------------------------------");
});