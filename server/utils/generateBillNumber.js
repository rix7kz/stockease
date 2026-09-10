const Bill = require("../models/Bill");

// Generates a readable, unique, sequential bill number for the whole
// shop, e.g. ST-2026-000001, ST-2026-000002, ...
// The sequence resets naturally every year because it is scoped by
// the current year's prefix.
async function generateBillNumber() {
  const year = new Date().getFullYear();
  const prefix = `ST-${year}-`;

  const lastBill = await Bill.findOne({ billNumber: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .lean();

  let nextNumber = 1;
  if (lastBill) {
    const lastSeq = parseInt(lastBill.billNumber.split("-")[2], 10);
    if (!Number.isNaN(lastSeq)) nextNumber = lastSeq + 1;
  }

  const padded = String(nextNumber).padStart(6, "0");
  return `${prefix}${padded}`;
}

module.exports = generateBillNumber;
