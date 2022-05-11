const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('!@#$%^&*()'));

app.get('/login', (req, res) => {
  fs.readFile('login.html', 'utf-8', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(data);
    }
  });
});

app.post('/login', (req, res) => {
  const userid = req.body.userid;
  const userpw = req.body.userpw;
  console.log(`userid=${userid}`);
  console.log(`userpw=${userpw}`);

  if (userid == 'admin' && userpw == '1234') {
    //24시간후를 저장, 1000ms 60s 60m 24h
    const expiresDay = new Date(Date.now() + 1000 * 60 * 60 * 24);
    res.cookie('userid', userid, { expires: expiresDay, signed: true });
    res.redirect('/main');
  } else {
    res.redirect('/login');
  }
});

app.get('/main', (req, res) => {
  const cookieUserid = req.signedCookies.userid;
  console.log(cookieUserid);
  if (cookieUserid) {
    fs.readFile('main.html', 'utf-8', (err, data) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(data);
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('userid');
  res.redirect('/login');
});
app.listen(port, () => {
  console.log(`${port}포트로 서버 실행중...`);
});
