const express = require("express");
const app = express();
const morgan = require("morgan");
const {body, validationResult} = require("express-validator");

let contactData = [
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

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));


app.get("/", function(req, res) {
  res.redirect("/contacts");
});

app.get("/contacts", function(req, res) {
  res.render("contacts", {
    contacts: sortContacts(contactData),
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
    contactData.push({...req.body});
    res.redirect("/contacts");
  }



  /*
  function(req, res, next) {
    res.locals.errorMessages = [];
    next();
  },

  function(req, res, next) {
    if (req.body.firstName.length === 0) {
      res.locals.errorMessages.push("First name is required");
    }

    next();
  },

  function(req, res, next) {
    if (req.body.lastName.length === 0) {
      res.locals.errorMessages.push("Last name is required.");
    }

    next();
  },

  function(req, res, next) {
    if (req.body.phoneNumber.length === 0) {
      res.locals.errorMessages.push("Phone number is required");
    }

    next();
  },

  function(req, res, next) {
    //  trim leading and trailing spaces from all input fields.
    if (res.locals.errorMessages.length === 0) {
      Object.keys(req.body).forEach(field => {
        req.body[field] = req.body[field].trim();
      });
    }

    next();
  },

  function(req, res, next) {
    validateNameInput(req.body.firstName, res.locals.errorMessages);
    validateNameInput(req.body.lastName, res.locals.errorMessages);

    next();
  },

  function(req, res, next) {
    if (req.body.phoneNumber.length > 0) {
      validatePhoneInput(req.body.phoneNumber, res.locals.errorMessages);
    }

    next();
  },

  function(req, res, next) {
    if (res.locals.errorMessages.length === 0) {
      uniqueContactName(req.body.firstName, req.body.lastName, contactData, res.locals.errorMessages);
    }

    next();
  },

  function(req, res, next) {
    if (res.locals.errorMessages.length > 0) {
      res.render("new_contact", {
        errorMessages: res.locals.errorMessages,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
      });
    } else {
      next();
    }
  },

  function(req, res, next) {
    contactData.push({...req.body});

    res.redirect("/contacts");
  }
  */
);

app.listen(3000, "localhost", function() {
  console.log("listening to port 3000.");
});


function validateNameInput(name, errorArr) {
  if (name.length > 0) {

    if (!/^[a-zA-Z]+$/.test(name)) {
      errorArr.push("name must only contains alphabetic characters");
    }

    if (name.length > 25) {
      errorArr.push("Maximum length of characters is 25");
    }

  }
}

function validatePhoneInput(phone, errorArr) {
  if (!/^\d\d\d-\d\d\d-\d\d\d\d$/.test(phone)) {
    errorArr.push("phone number must match the US-style pattern");
  }
}

function uniqueContactName(firstName, lastName, contactsArr, errorArr) {
  let inputName = (firstName + ' ' + lastName).toLowerCase();
  
  let contactNames = contactsArr.map(contact => {
    return (contact.firstName + ' ' + contact.lastName).toLowerCase();
  });

  if (contactNames.includes(inputName)) {
    errorArr.push("Contact already exisits in the database");
  }
}

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