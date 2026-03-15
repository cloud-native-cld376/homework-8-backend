const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const { engine } = require('express-handlebars');

dotenv.config();

const app = express();
const PORT = 3000;


const users = {
  "admin": {
      username: "admin",
      password: "password123",
      fullName: "System Administrator",
      email: "admin@university.edu",
      bio: "Managing the campus network infrastructure."
  },
  "student_dev": {
      username: "student_dev",
      password: "dev_password",
      fullName: "Jane Developer",
      email: "jane.d@student.edu",
      bio: "Full-stack enthusiast and coffee drinker."
  }
};

app.engine('hbs', engine({ defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(process.env.SECRET));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, 
      httpOnly: true
    }
  })
);

// Set theme in res.locals for all views
app.use((req, res, next) => {
  const theme = req.signedCookies.theme || 'light';
  res.locals.theme = theme;
  next();
});

//Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}


// GET /login - show login form
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: req.query.error });
});

// POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    req.session.user = user;
    res.redirect('/profile');
  } else {
    res.redirect('/login?error=Invalid+username+or+password');
  }
});

// GET /logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/profile');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});


// GET /profile 
app.get('/profile', requireAuth, (req, res) => {
  const user = req.session.user;
  res.render('profile', { title: 'Profile', user });
});


app.get('/toggle-theme', (req, res) => {
  const current = req.signedCookies.theme || 'light';
  const nextTheme = current === 'light' ? 'dark' : 'light';
  res.cookie('theme', nextTheme, {
    httpOnly: true,
    signed: true,
    maxAge: 365 * 24 * 60 * 60 * 1000
  });

  const back = req.query.redirect || '/';
  res.redirect(back);
});

// Home redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/profile');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
