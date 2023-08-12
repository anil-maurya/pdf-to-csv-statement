import inquirer from "inquirer";
import hdfc from "./hdfc.js";
import paytm from "./paytm.js";
import axis from "./axis.js";

inquirer
  .prompt([
    {
      type: "list",
      name: "bank",
      message: "Please select your card :",
      choices: ["HDFC", "Paytm", "Axis Flipkart"],
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

    if (choice === "axis flipkart") {
      axis();
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
