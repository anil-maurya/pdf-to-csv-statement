import inquirer from "inquirer";
import hdfc from "./hdfc.js";
import paytm from "./paytm.js";

inquirer
  .prompt([
    {
      type: "list",
      name: "bank",
      message: "Please Select your bank?",
      choices: ["HDFC", "PayTM", "Other"],
    },
  ])
  .then((answers) => {
    const choice = answers.bank.toLowerCase();
    if (choice === "hdfc") {
      hdfc();
      return;
    }
    if (choice === "paytm") {
      paytm();
      return;
    }
    return;
  })
  .catch((error) => {
    if (error.isTtyError) {
      console.log(error);
    } else {
      console.log(error);
    }
  });
