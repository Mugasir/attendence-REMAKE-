require('./config/env');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/', studentRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal server error');
});

app.listen(env.port, () => {
  console.log(`SU Attend listening on port ${env.port}`);
});
