const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const mailchimp = require("@mailchimp/mailchimp_marketing");
const request = require("request");
const https = require("https");
// These id's and secrets should come from .env file.
const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mailchimp.setConfig({
  apiKey: process.env.API_KEY,
  server: "us1",
});

var emails = '';
const subscription = "subscribed";
const list = async () => {
  const response = await mailchimp.lists.getListMembersInfo("8bcd86d47b");
  var i;
  for (i = 0; i < response.total_items; i++) {
    var status = response.members[i].status;
    if(status === subscription){
      emails += (response.members[i].email_address + ", ");
    }

}
};
list();
var user_name = '';
var msg = '';
var subject = '';

app.get("/", function(req, res){
  res.sendFile(__dirname + "/mail.html");
})
app.get("/newsletter", function(req, res){
  res.sendFile(__dirname + "/newsletter.html");
})

app.post("/subscribed", function(req,res){
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;

  const data = {
    members : [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: fname,
          LNAME: lname
        }
      }
    ]
  }
  const jsonData = JSON.stringify(data);

  const url = "https://us1.api.mailchimp.com/3.0/lists/8bcd86d47b";
  const options = {
    method: "POST",
    auth: "Harshad:366c83924bbd3d342b127ae73b2467bb-us1"

  };

  const request = https.request(url, options, function(response){
    response.on("data", function(data){
      console.log(JSON.parse(data));
    });
  });

  request.write(jsonData);
  request.end();
  res.sendFile(__dirname + "/subscribed.html");
});



app.post("/mailsent", function(req,res){
  msg = req.body.msg;
  user_name = req.body.username;
  subject = req.body.subject;
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLEINT_SECRET,
    REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  async function sendMail() {
    try {
      const accessToken = await oAuth2Client.getAccessToken();

      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'harshadonly01@gmail.com',
          clientId: CLIENT_ID,
          clientSecret: CLEINT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      const mailOptions = {
        from: user_name+'<harshadonly01@gmail.com>',
        to: emails,
        subject: subject,
        text: msg
      };

      const result = await transport.sendMail(mailOptions);
      return result;
    } catch (error) {
      return error;
    }
  }

  sendMail()
    .then((result) => console.log('Email sent...', result))
    .catch((error) => console.log(error.message));
    res.sendFile(__dirname + "/mailsent.html");
});

app.listen(3000, function(){
    console.log("server is running @ port 3000");
  });
