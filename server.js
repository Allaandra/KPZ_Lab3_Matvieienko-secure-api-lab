// Підключаємо фреймворк Express
const express = require('express');

// Імпортуємо наші дані
const { users, documents, employees } = require('./data');

// Створюємо екземпляр додатку та порт
const app = express();
const PORT = 3000;

app.use(express.json());

// --- MIDDLEWARE ---
const loggingMiddleware = (req, res, next) => {
  // Отримуємо поточний час, HTTP метод та URL запиту
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;

  // Виводимо інформацію в консоль
  console.log(`[${timestamp}] ${method} ${url}`);

  // Передати наступному(інакше зависне)
  next();
};

app.use(loggingMiddleware);

const authMiddleware = (req, res, next) => {
  // Отримуємо дані для входу з заголовків запиту
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];

  // Шукаємо користувача у нашій "базі даних"
  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.' });
  }
  
  req.user = user;

  // Передати наступному(інакше зависне)
  next();
};

const adminOnlyMiddleware = (req, res, next) => {

  // Перевіряємо, чи існує об'єкт user і яка в нього роль
  // req.user був доданий на попередньому етапі в authMiddleware
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  // Передати наступному(інакше зависне)
  next();
};

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ --

// Маршрут для отримання списку всіх документів
app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

// Маршрут для створення нового документа
app.post('/documents', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  // Перевірка, чи передані всі необхідні поля
  if (!title || !content) {
    return res.status(400).json({ message: 'Bad Request. Fields "title" and "content" are required.' });
  }

  const newDocument = {
    id: Date.now(),
    title,
    content,
  };

  documents.push(newDocument);
  res.status(201).json(newDocument);
});

// Маршрут для видалення документа
app.delete('/documents/:id', authMiddleware, (req, res) => {
    // Отримуємо id з параметрів маршруту
    const documentId = parseInt(req.params.id);
    const documentIndex = documents.findIndex(doc => doc.id === documentId);

    // Якщо документ з таким id не знайдено
    if (documentIndex === -1) {
        return res.status(404).json({ message: 'Document not found' });
    }

    // Видаляємо документ з масиву
    documents.splice(documentIndex, 1);

    // Відповідаємо статусом 204 No Content, тіло відповіді буде порожнім
    res.status(204).send();
});

// Маршрут для отримання списку всіх співробітників
app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// --- КІНЕЦЬ МАРШРУТІВ ---

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
