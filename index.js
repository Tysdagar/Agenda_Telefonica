/*eslint linebreak-style: ["error", "windows"]*/

const express = require("express");
const session = require("express-session");
const app = express();
const getPersons = require("./mocks/persons.mock");
const getUsers = require("../eventos/pruebas_backend/users");
const cors = require("cors");

let users = getUsers();

let persons = getPersons();

// Configuración de sesiones
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

//

const checkLoginMiddleware = (req, res, next) => {
  // Excluir las rutas de inicio de sesión y otras rutas públicas que no requieran autenticación
  if (req.path === "/login" || req.path === "/api/persons") {
    return next();
  }

  // Si no hay usuario en la sesión, redirigir a la página de inicio de sesión
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
};

// Configuración de sesiones

app.post("/login", (request, response) => {
  const { username, password } = request.body;

  const user = users.find((u) => u.username === username);

  if (!user || user.password !== password) {
    return response.status(401).json({
      error:
        "Inicio de sesión inválido, usuario no existe o contraseña inválida",
    });
  }

  const authToken = `token for ${username}`;

  const userData = {
    username: user.username,
  };

  return response.json({ authToken, userData });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error al destruir la sesión:", err);
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }

    return res.sendStatus(204); // Envía una respuesta vacía con código de estado 204
  });
});

// Recuperar datos de personas

app.get("/api/persons", checkLoginMiddleware, (request, response) => {
  response.json(persons);
});

// Recuperar datos de la persona por id

app.get("/api/persons/:id ", checkLoginMiddleware, (request, response) => {
  const id = Number(request.params.id);
  const personId = persons.find((p) => p.id === id);

  if (personId) {
    // Si el contacto se encuentra, enviar los datos del contacto
    response.json(personId);
  } else {
    // Si el contacto no se encuentra, enviar una respuesta con el código de estado 404
    return response.status(404).json({
      error: `Person with id: ${id} not exist`,
    });
  }
});

// Eliminar persona por id

app.delete("/api/persons/:id", checkLoginMiddleware, (request, response) => {
  const id = Number(request.params.id);
  persons = persons.filter((p) => p.id !== id);

  response.status(204).end();
});

// Agregar persona

function generateRandomId() {
  const min = 1;
  const max = 100;

  const randomId = Math.floor(Math.random() * (max * min + 1)) + min;

  return randomId;
}

app.post("/api/persons", checkLoginMiddleware, (request, response) => {
  const body = request.body;
  const nameDuplicated = persons.some((p) => p.name === body.name);

  if (!body.name) {
    return response.status(400).json({
      error: "name missing",
    });
  }

  if (!body.tel) {
    return response.status(400).json({
      error: "tel missing",
    });
  }

  if (nameDuplicated) {
    return response.status(400).json({
      error: "name must be unique",
    });
  }

  const person = {
    id: generateRandomId(),
    name: body.name,
    tel: body.tel,
  };

  persons = persons.concat(person);

  response.json(person);
});

// modificar contacto

app.put("/api/persons/:id", (request, response) => {
  const personId = parseInt(request.params.id);
  const { tel } = request.body;

  // Encuentra el índice del contacto en el arreglo "persons"
  const personIndex = persons.findIndex((p) => p.id === personId);

  if (personIndex === -1) {
    return response.status(404).json({ error: "Contacto no encontrado" });
  }

  // Realiza la actualización del número de teléfono del contacto
  persons[personIndex].tel = tel;

  return response.status(200).json(persons[personIndex]);
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(checkLoginMiddleware);

app.use(unknownEndpoint);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
