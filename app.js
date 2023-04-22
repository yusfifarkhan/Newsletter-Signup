/* Module Require */
const bodyParser = require("body-parser");
const express = require("express");
const https = require("https");
require("dotenv").config();
const serverPort = 4000;

/* Mailchimp Config*/
const url =
  "https://us" +
  process.env.MAILCHIMP_CDNS_ID +
  ".api.mailchimp.com/3.0/lists/" +
  process.env.MAILCHIMP_LIST_ID +
  "";

const options = (methode) => {
  return {
    method: methode,
    auth: "udedo:" + process.env.MAILCHIMP_API_KEY,
  };
};

/* Express Init */
const app = express();

/* Express Setting */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

/* Express Routes */

// Home
app.get("/", (req, res) => {
  res.render("signup");
  res.end();
});

app.post("/", (req, res) => {
  const { firstName, lastName, userEmail } = req.body;
  const userData = JSON.stringify({
    members: [
      {
        email_address: userEmail,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  });
  const request = https.request(url, options("POST"), (response) => {
    if (response.statusCode === 200) {
      response.on("data", (data) => {
        const { error_count } = JSON.parse(data);
        if (error_count === 0) {
          res.render("success", {
            status: 200,
            status_msg: "CONTACT_SUBBED",
            errors_code: "",
            userName: firstName + " " + lastName,
          });
          res.end();
        } else {
          const checkDuplicate = https.request(
            url + "/members/" + userEmail,
            options("GET"),
            (response) => {
              response.on("data", (data) => {
                const { status } = JSON.parse(data);
                if (status === "unsubscribed") {
                  // Resub Account
                  res.render("failure", {
                    status: 422,
                    errors_code: "ERROR_CONTACT_INACTIVE",
                    userEmail: userEmail,
                  });
                  res.end();
                } else {
                  // Duplicate Account
                  res.render("failure", {
                    status: 409,
                    errors_code: "ERROR_CONTACT_ACTIVE",
                    userEmail: userEmail,
                  });
                  res.end();
                }
              });
            }
          );

          checkDuplicate.write("");
          checkDuplicate.end();
        }
      });
    } else {
      res.render("failure", {
        status: 500,
        errors_code: "CONNECTION_ERROR",
        userName: firstName + " " + lastName,
      });
      res.end();
    }
  });

  // Execute Signup Request
  request.write(userData);
  request.end();
});

// Resub
app.post("/resub", (req, res) => {
  const { userEmail } = req.body;
  const resubUser = JSON.stringify({
    members: [{ email_address: userEmail, status: "subscribed" }],
    update_existing: true,
  });
  const request = https.request(url, options("POST"), (response) => {
    if (response.statusCode === 200) {
      response.on("data", (data) => {
        const { updated_members } = JSON.parse(data);
        res.render("success", {
          status: 201,
          status_msg: "CONTACT_RESUB",
          errors_code: "",
          userName: "",
          userEmail: updated_members[0].email_address,
        });
        res.end();
      });
    } else {
      res.render("failure", {
        status: 500,
        errors_code: "CONNECTION_ERROR",
      });
      res.end();
    }
  });

  // Execute Resub Request
  request.write(resubUser);
  request.end();
});

// Unsub
app.get("/unsub", (req, res) => {
  res.render("unsub");
  res.end();
});

app.post("/unsub", (req, res) => {
  const { userEmail } = req.body;
  const userData = JSON.stringify({
    members: [{ email_address: userEmail, status: "unsubscribed" }],
    update_existing: true,
  });
  const request = https.request(url, options("POST"), (response) => {
    if (response.statusCode === 200) {
      response.on("data", (data) => {
        const { updated_members } = JSON.parse(data);
        res.render("success", {
          status: 204,
          status_msg: "CONTACT_UNSUB",
          errors_code: "",
          userEmail: updated_members[0].email_address,
        });
        res.end();
      });
    } else {
      res.render("failure", {
        status: 500,
        errors_code: "CONNECTION_ERROR",
        userName: firstName + " " + lastName,
      });
      res.end();
    }
  });

  // Execute Unsub Request
  request.write(userData);
  request.end();
});

/* Port Listener */
app.listen(serverPort || 3000, () => {
  console.log(`Server is runing in: http://127.0.0.1:${serverPort || 3000}/`);
});
