import { PdfReader } from "pdfreader";
import moment from "moment";
import fs from "fs";

const NAME = "paytm";
const { PASSWD } = process.env;

const suffix = moment().format("DD_MM_YY_HH:SS");
const OUTPUT_FILE = `data/${NAME}_${suffix}.csv`;

const STARTER_TEXT = ["AMOUNT", "AVAILABLE BALANCE"];
const END_TEXT = ["* Note:"];

function saveCSV(data) {
  const csvContent = data
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  // Write the CSV data to the file
  fs.writeFile(OUTPUT_FILE, csvContent, (err) => {
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

const records = []; // [date, description, To account, "", credit, debit]

let columnIndex = 0;
function parseTable(text) {
  // console.log(text);

  if (columnIndex === 0) {
    const alphabetRegex = /^[a-zA-Z]/g;
    if (alphabetRegex.test(text)) {
      return;
    }

    const date = moment(text, "DD MMM YYYY");

    if (!date.isValid()) {
      return;
    }

    const row = new Array(6).fill("");
    row[0] = date.format("DD/MM/YYYY");
    records.push(row);
    columnIndex++;
    return;
  }

  const row = records[records.length - 1];

  if (columnIndex === 3 && text.split(":")[0] === "Transaction ID ") {
    columnIndex++;
  }

  // Description column
  if (columnIndex === 2 || columnIndex === 3) {
    row[columnIndex - 1] = text;
    columnIndex++;
    return;
  }

  // process amount

  if (columnIndex === 5 || columnIndex === 6) {
    const [sign, , amt] = text.replace(/Rs\.|,/g, "").split(" ");

    const isAmountField = sign === "+" || sign === "-";

    if (!isAmountField) {
      columnIndex++;
      return;
    }

    const amount = parseFloat(amt).toFixed(2);

    // Amount found it must be col num 6,,
    if (amount) {
      columnIndex = 6;
    }

    if (sign === "+") {
      row[4] = amount;
    } else {
      // row.push(0); // Credit amount
      row[5] = amount;
    }

    columnIndex++;
    return;
  }

  if (columnIndex === 8) {
    row[3] = text;
    columnIndex = 0;
    return;
  }

  // skip --
  columnIndex++;
  return;
}

let processing = false;
function processItem(item) {
  if (!item) {
    // end of file

    saveCSV(records);
    // console.warn(records);
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

export default function main() {
  const pdf = `data/${NAME}.pdf`;

  new PdfReader({ password: PASSWD }).parseFileItems(pdf, function (err, item) {
    if (err) console.error(err);
    else processItem(item);
  });
}
