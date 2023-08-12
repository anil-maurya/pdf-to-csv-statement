import { PdfReader } from "pdfreader";
import moment from "moment";
import fs from "fs";

const NAME = "axis";
const { PASSWD } = process.env;

const suffix = moment().format("DD_MM_YY_HH:SS");
const OUTPUT_FILE = `data/${NAME}_${suffix}.csv`;

const STARTER_TEXT = ["440006******7434", "Name", "ANIL KUMAR MAURYA"];
const END_TEXT = ["**** End of Statement ****"];

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

const records = []; // [date, transaction detail, Merchant Category, credit, debit, points]

let columnIndex = 0;
function parseTable(text) {
  // console.log(text);

  if (columnIndex === 0) {
    const alphabetRegex = /^[a-zA-Z]/g;
    if (alphabetRegex.test(text)) {
      return;
    }

    const date = moment(text, "DD/MM/YYYY");

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

  // Description category column
  if (columnIndex === 1) {
    row[columnIndex] = text;
    columnIndex++;
    return;
  }

  // Merchant category may be blank.
  if (columnIndex === 2) {
    const [amt, sign] = text.split(" ");
    const isAmountField = sign === "Cr" || sign === "Dr";
    columnIndex++;

    if (!isAmountField) {
      row[columnIndex] = text;
      return;
    }
  }

  // process amount

  if (columnIndex === 3) {
    const [amt, sign] = text.split(" ");

    const amount = parseFloat(amt).toFixed(2);

    if (sign === "Cr") {
      row[3] = amount;
    } else {
      // row.push(0); // Credit amount
      row[4] = amount;
    }

    columnIndex++;
    return;
  }

  // process points
  if (columnIndex === 4) {
    const [pnts, sign] = text.split(" ");
    const points = parseInt(pnts);

    if (sign === "Dr") {
      row[5] = `-${points}`;
    } else {
      row[5] = points;
    }
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
