import { PdfReader } from "pdfreader";
import moment from "moment";
import fs from "fs";

const PASSWD = "ANIL0202";
const suffix = moment().format("DD_MM_YY_HH:SS");
const OUTPUT_FILE = `data/hdfc_${suffix}.csv`;

const STARTER_TEXT = ["Amount (in Rs.)", "ANIL KUMAR MAURYA"];
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

const records = []; // [date, description, points, credit, debit]

let columnIndex = 0;
function parseTable(text) {
  if (text === "Cr") {
    const row = records[records.length - 1];
    row[3] = row[4];
    row[4] = 0;
    return;
  }

  // Date column
  if (columnIndex === 0) {
    const alphabetRegex = /^[a-zA-Z]/g;
    if (alphabetRegex.test(text)) {
      return;
    }

    const date = moment(text, "DD/MM/YYYY");

    if (!date.isValid()) {
      return;
    }

    records.push([date.format("DD/MM/YYYY")]);
    columnIndex++;
    return;
  }

  // Description column
  if (columnIndex === 1) {
    records[records.length - 1].push(text);
    columnIndex++;
    return;
  }

  // Could be points/amount columns
  if (columnIndex === 2) {
    const [int, decimals] = text.split(".");
    if (decimals) {
      const row = records[records.length - 1];
      row.push(0); // points
      row.push(0); // Credit amount
      const withoutSeparator = text.replace(/,/g, "");
      const debitAmount = parseFloat(withoutSeparator).toFixed(2);
      row.push(debitAmount);
      columnIndex = 0;
    } else {
      const row = records[records.length - 1];
      const spaceRemoved = text.replace(/\s/g, "");
      const points = parseInt(spaceRemoved);
      row.push(points);
      columnIndex++;
    }
    return;
  }

  if (columnIndex === 3) {
    const row = records[records.length - 1];
    row.push(0); // Credit amount
    const debitAmount = parseFloat(text).toFixed(2);
    row.push(debitAmount);
    columnIndex = 0;
  }
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

export default function processHDFC() {
  new PdfReader({ password: PASSWD }).parseFileItems(
    "data/hdfc.pdf",
    function (err, item) {
      if (err) console.error(err);
      else processItem(item);
    }
  );
}
