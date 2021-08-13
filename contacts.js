const express = require("express");
const app = express();
const morgan = require("morgan");
const {body, validationResult} = require("express-validator");
const session = require("express-session");
const store = require("connect-loki");
const LokiStore = store(session);

const contactData = [
  {
    firstName: "Mike",
    lastName: "Jones",
    phoneNumber: "281-330-8004",
  },
  {
    firstName: "Jenny",
    lastName: "Keys",
    phoneNumber: "768-867-5309",
  },
  {
    firstName: "Max",
    lastName: "Entiger",
    phoneNumber: "214-748-3647",
  },
  {
    firstName: "Alicia",
    lastName: "Keys",
    phoneNumber: "515-489-4608",
  },
];

let sortContacts = function(contacts) {
  return contacts.slice().sort((contactA, contactB) => {
    if (contactA.lastName < contactB.lastName) {
      return -1;
    } else if (contactA.lastName > contactB.lastName) {
      return 1;
    } else if (contactA.firstName < contactB.firstName) {
      return -1;
    } else if (contactA.firstName > contactB.firstName) {
      return 1;
    } else {
      return 0;
    }
  });
};

const jsonClone = function(object) {
  return JSON.parse(JSON.stringify(object));
};

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    path: "/",
    secure: false,
  },

  name: "js175-contacts-manager-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(function(req, res, next) {
  if (!("contactData" in req.session)) {
    req.session.contactData = jsonClone(contactData);
  }

  next();
});


app.get("/", function(req, res) {
  res.redirect("/contacts");
});

app.get("/contacts", function(req, res) {
  res.render("contacts", {
    contacts: sortContacts(req.session.contactData),
  });
});

app.get("/contacts/new", function(req, res) {
  res.render("new_contact");
});

app.post("/contacts/new",
  // validation chains
  [
    validateName("firstName", "First"),
    validateName("lastName", "Last"),

    body("phoneNumber")
      .trim()
      .isLength({min: 1})
      .withMessage("Phone number is required.")
      .bail()
      .matches(/^\d\d\d-\d\d\d-\d\d\d\d$/)
      .withMessage("Invalid phone number format. Use format ###-###-####"),
  ],

  // error handling middleware
  function(req, res, next) {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("new_contact", {
        errorMessages: errors.array().map(error => error.msg),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
      });
    } else {
      next();
    }
  },

  // main route callback
  function(req, res, next) {
    req.session.contactData.push({...req.body});
    res.redirect("/contacts");
  }


  /* 
  validate if contact already exists --- removed for simplying the express-validator works
  function(req, res, next) {
    if (res.locals.errorMessages.length === 0) {
      uniqueContactName(req.body.firstName, req.body.lastName, contactData, res.locals.errorMessages);
    }

    next();
  },
  */
);

app.listen(3000, "localhost", function() {
  console.log("listening to port 3000.");
});


function validateName(name, whichName) {
  return body(name)
    .trim()
    .isLength({min: 1})
    .withMessage(`${whichName} name is required.`)
    .bail()
    .isLength({max: 25})
    .withMessage(`${whichName} name is too long. Maximum length of characters is 25.`)
    .isAlpha()
    .withMessage(`${whichName} name contains invalid characters. It can only contain alphabetics.`)
}

/*
function uniqueContactName(firstName, lastName, contactsArr, errorArr) {
  let inputName = (firstName + ' ' + lastName).toLowerCase();
  
  let contactNames = contactsArr.map(contact => {
    return (contact.firstName + ' ' + contact.lastName).toLowerCase();
  });

  if (contactNames.includes(inputName)) {
    errorArr.push("Contact already exisits in the database");
  }
}
*/