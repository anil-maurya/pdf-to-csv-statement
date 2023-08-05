import { PdfReader } from "pdfreader";
import moment from "moment";
import fs from "fs";

const PASSWD = "ANIL0202";
const OUTPUT_FILE = "hdfc.csv";

const STARTER_TEXT = ["Amount (in Rs.)", "ANIL KUMAR MAURYA"];
const END_TEXT = ["* Note:"];

// // Convert the comma-separated string to CSV format
// const lines = csvContent.split("\n");
// const csvData = lines
//   .map((line) =>
//     line
//       .split(",")
//       .map((cell) => `"${cell}"`)
//       .join(",")
//   )
//   .join("\n");

function saveFileToDisk(data) {
  // Write the CSV data to the file
  fs.writeFile(OUTPUT_FILE, data, (err) => {
    if (err) {
      console.error("Error writing CSV file:", err);
    } else {
      console.log("CSV file saved successfully.");
    }
  });
}

let startIndex = 0;
function shouldProcessStart(text) {
  const matchingText = STARTER_TEXT[startIndex];
  if (text === matchingText) {
    if (startIndex !== STARTER_TEXT.length - 1) {
      startIndex++;
      return false;
    }
    return true;
  }
  return false;
}

let endIndex = 0;
function shouldProcessEnd(text) {
  const matchingText = END_TEXT[endIndex];
  if (text === matchingText) {
    if (endIndex !== END_TEXT.length - 1) {
      endIndex++;
      return false;
    }
    return true;
  }
  return false;
}

const records = [];

let pointerEnd = false;
let columnIndex = 0;
function parseTable(text) {
  if (text === "Cr") {
    return;
  }

  let cellData = text;
  if (columnIndex === 0) {
    const alphabetRegex = /^[a-zA-Z]/g;
    if (alphabetRegex.test(text)) {
      debugger;
      return;
    }

    const date = moment(text, "DD/MM/YYYY");

    if (!date.isValid()) {
      return;
    }

    cellData = date.format("DD/MM/YYYY");
    records.push([date.format("DD/MM/YYYY")]);
  }

  if (columnIndex === 2) {
    // debugger
    const [int, decimals] = text.split(".");
    if (decimals) {
      columnIndex = 3;
    } else {
      return;
    }
  }

  if (columnIndex === 3) {
    cellData = parseFloat(text).toFixed(2);
    pointerEnd = true;
  }

  columnIndex++;
  csvData += cellData;
  csvData += ",";

  if (pointerEnd) {
    csvData += "\n";
    pointerEnd = false;
    columnIndex = 0;
  }
}

let processing = false;
function processItem(item) {
  if (!item) {
    // end of file

    saveFileToDisk(csvData);
    console.warn(csvData);
    return;
  }

  const text = item?.text && item.text.trim();

  if (processing && text) {
    parseTable(text);
    processing = !shouldProcessEnd(text);
  } else {
    processing = shouldProcessStart(text);
  }
}

new PdfReader({ password: PASSWD }).parseFileItems(
  "data/hdfc.pdf",
  function (err, item) {
    if (err) console.error(err);
    else processItem(item);
  }
);
