const express = require("express");
const router = express.Router();
const { getBranchReports, getSpecificReport } = require("../Controllers/ReportsController");

// Get comprehensive branch reports
router.get("/branch/:branchId", getBranchReports);

// Get specific report type
router.get("/branch/:branchId/:reportType", getSpecificReport);

module.exports = router;
