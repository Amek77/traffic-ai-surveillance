const express = require('express');
const router = express.Router();
const Violation = require('../models/Violation');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/analytics/summary
// @desc    Get counts summary (Total, Today, Severity)
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const total = await Violation.countDocuments();

    // Start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const today = await Violation.countDocuments({ timestamp: { $gte: startOfToday } });
    const high = await Violation.countDocuments({ severity: 'HIGH' });
    const medium = await Violation.countDocuments({ severity: 'MEDIUM' });
    const low = await Violation.countDocuments({ severity: 'LOW' });

    res.json({
      success: true,
      data: {
        total,
        today,
        high,
        medium,
        low
      }
    });
  } catch (error) {
    console.error('Fetch summary analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/by-type
// @desc    Get count by violation type
// @access  Private
router.get('/by-type', protect, async (req, res) => {
  try {
    const helmet = await Violation.countDocuments({ violations: 'NO HELMET' });
    const triple = await Violation.countDocuments({ violations: 'TRIPLE RIDING' });
    const hsrp = await Violation.countDocuments({ violations: 'NON HSRP' });

    res.json({
      success: true,
      data: [
        { name: 'NO HELMET', value: helmet },
        { name: 'TRIPLE RIDING', value: triple },
        { name: 'NON HSRP', value: hsrp }
      ]
    });
  } catch (error) {
    console.error('Fetch type analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/by-severity
// @desc    Get count by severity level
// @access  Private
router.get('/by-severity', protect, async (req, res) => {
  try {
    const low = await Violation.countDocuments({ severity: 'LOW' });
    const medium = await Violation.countDocuments({ severity: 'MEDIUM' });
    const high = await Violation.countDocuments({ severity: 'HIGH' });

    res.json({
      success: true,
      data: [
        { name: 'LOW', value: low },
        { name: 'MEDIUM', value: medium },
        { name: 'HIGH', value: high }
      ]
    });
  } catch (error) {
    console.error('Fetch severity analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/daily-trend
// @desc    Get violation trend for last 7 days
// @access  Private
router.get('/daily-trend', protect, async (req, res) => {
  try {
    // 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const violations = await Violation.find({
      timestamp: { $gte: sevenDaysAgo }
    }).select('timestamp');

    // Initialize map for the last 7 days with 0 counts
    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      trendMap[dateStr] = 0;
    }

    // Populate trend counts
    violations.forEach((v) => {
      const dateStr = v.timestamp.toISOString().slice(0, 10);
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr]++;
      }
    });

    // Convert to sorted array
    const data = Object.keys(trendMap).map((date) => ({
      date: date, // Keep YYYY-MM-DD string format
      count: trendMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Fetch daily trend analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
