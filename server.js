const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { port, nodeEnv } = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (nodeEnv !== 'test') app.use(morgan('dev'));

// Optional demo frontend (static HTML/CSS/JS/Bootstrap) — talks to the API
// below purely over fetch(), per the project's "optional but recommended"
// frontend guidance.
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'P01 Enterprise E-Commerce API is running', data: {} });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server listening on port ${port} (${nodeEnv})`);
  });
}

// Only auto-start when run directly (keeps the app requireable for tests)
if (require.main === module) {
  start();
}

module.exports = app;
